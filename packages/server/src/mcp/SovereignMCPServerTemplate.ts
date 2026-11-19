import * as readline from 'readline';
import { Request, Response } from 'express';
import { SovereignEngine } from '../models/SovereignEngine';
import { SovereignStatisticsReporter } from '../models/SovereignStatisticsReporter';
import { TacticalGenerativeCoordinator } from '../models/TacticalGenerativeCoordinator';
import { SovereignComputeCores } from '../models/SovereignComputeCores';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, any>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * SovereignMCPServerTemplate — Produkčná šablóna MCP servera (Model Context Protocol 2025-03-26)
 * Podporuje:
 *  1. Streamable HTTP transport (Express POST /mcp endpoint pre produkčné nasadenie)
 *  2. STDIO transport (JSON-RPC 2.0 cez stdin/stdout pre lokálnych AI agentov)
 */
export class SovereignMCPServerTemplate {
  private readonly serverInfo = {
    name: 'sovereign-engine-mcp',
    version: '1.0.0',
  };

  private readonly protocolVersion = '2025-03-26';
  private engine: SovereignEngine;

  constructor(engineInstance?: SovereignEngine) {
    this.engine = engineInstance || new SovereignEngine();
  }

  /**
   * Zoznam produkčných MCP nástrojov (Tools)
   */
  public getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'sovereign_get_arena_state',
        description: 'Vráti aktuálny stav 63-hexovej arény, entropiu, energiu systému a pozície hrdinov.',
        inputSchema: {
          type: 'object',
          properties: {
            includeTraceLog: {
              type: 'boolean',
              description: 'Či zahrnúť posledných 50 záznamov z trace logu.',
            },
          },
        },
      },
      {
        name: 'sovereign_evaluate_ohm_combat',
        description: 'Vypočíta Ohmov zákon (I = V/R, P = V*I) a očakávaný dopad akcie na cieľovom hexe.',
        inputSchema: {
          type: 'object',
          properties: {
            voltage: { type: 'number', description: 'Napätie karty (V)' },
            resistance: { type: 'number', description: 'Odpor cieľového terénu/brnenia (R)' },
            direction8: { type: 'number', description: '8-smerový vektor hrdinu (0..7, po 45°)' },
          },
          required: ['voltage', 'resistance'],
        },
      },
      {
        name: 'sovereign_generate_tactical_spawn',
        description: 'Vygeneruje taktickú entitu alebo prekážku pomocou ML/heuristického koordinátora.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Taktický zámer (napr. aggression, stealth_ambush, fortress)' },
            entropy: { type: 'number', description: 'Aktuálna entropia arény (0.0 až 1.0)' },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'sovereign_get_combinatorics_report',
        description: 'Vygeneruje štatistický report kombinatorického stavového priestoru (63 hexov, 8 smerov, karty).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'sovereign_modulate_compute_cores',
        description: 'Tokenizuje odoslané parametre, vykoná ML čistenie/validáciu s priradením kvalitatívnej úrovne (GOLD/SILVER/BRONZE/QUARANTINE), spustí 4 výpočtové jadrá, 8 autonómnych kónických štruktúr a vráti kontrolný strom premenných.',
        inputSchema: {
          type: 'object',
          properties: {
            macroIndex: { type: 'number', description: 'Cieľový makro-sektor (0..8)' },
            subIndex: { type: 'number', description: 'Sub-hex v rámci sektora (0..6)' },
            preferred8Direction: { type: 'number', description: '8-smerový oktant (0..7)' },
            voltage: { type: 'number', description: 'Napätie karty V (0.5..12.0)' },
            resistance: { type: 'number', description: 'Odpor cieľa R (0.25..10.0)' },
            knowledgeScale: { type: 'number', description: 'Úroveň škály poznania (1..4)' },
            themeId: { type: 'string', description: 'Adaptívna farebná schéma (DOTA_DAYLIGHT, COGNITIVE_FOCUS, BIO_HARMONY, NEURAL_ANALYTICS)' }
          }
        }
      },
    ];
  }

  /**
   * Zoznam produkčných MCP zdrojov (Resources)
   */
  public getResources() {
    return [
      {
        uri: 'sovereign://specs/combinatorics-report',
        name: 'Sovereign Engine Combinatorics Report',
        description: 'Kompletná matematická špecifikácia 8-smerového a 63-hexového stavového priestoru.',
        mimeType: 'text/markdown',
      },
      {
        uri: 'sovereign://arena/live-state',
        name: 'Live Arena State Snapshot',
        description: 'JSON snímka aktuálneho stavu arény, vlákien a metapozícií.',
        mimeType: 'application/json',
      },
    ];
  }

  /**
   * Spracovanie ľubovoľnej JSON-RPC 2.0 požiadavky
   */
  public async handleRpcRequest(req: JsonRpcRequest): Promise<JsonRpcResponse | null> {
    const id = req.id ?? null;

    try {
      switch (req.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: this.protocolVersion,
              capabilities: {
                tools: { listChanged: false },
                resources: { subscribe: false, listChanged: false },
                prompts: { listChanged: false },
              },
              serverInfo: this.serverInfo,
            },
          };

        case 'notifications/initialized':
          return null; // Notifikácie v JSON-RPC 2.0 nevracajú odpoveď

        case 'ping':
          return { jsonrpc: '2.0', id, result: {} };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: { tools: this.getTools() },
          };

        case 'tools/call': {
          const toolName = req.params?.name;
          const args = req.params?.arguments || {};
          const toolOutput = await this.executeTool(toolName, args);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput, null, 2),
                },
              ],
              isError: false,
            },
          };
        }

        case 'resources/list':
          return {
            jsonrpc: '2.0',
            id,
            result: { resources: this.getResources() },
          };

        case 'resources/read': {
          const uri = req.params?.uri;
          if (uri === 'sovereign://specs/combinatorics-report') {
            const stats = SovereignStatisticsReporter.generateStatisticsReport();
            const md = SovereignStatisticsReporter.compileMarkdownReport(stats);
            return {
              jsonrpc: '2.0',
              id,
              result: {
                contents: [{ uri, mimeType: 'text/markdown', text: md }],
              },
            };
          }
          if (uri === 'sovereign://arena/live-state') {
            return {
              jsonrpc: '2.0',
              id,
              result: {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(this.engine.getState(), null, 2),
                  },
                ],
              },
            };
          }
          throw new Error(`Resource not found: ${uri}`);
        }

        case 'prompts/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              prompts: [
                {
                  name: 'tactical-arena-audit',
                  description: 'Vykoná hĺbkový audit rovnováhy arény a odporučí taktické ťahy.',
                },
              ],
            },
          };

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${req.method}`,
            },
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: err?.message || 'Internal MCP server error',
        },
      };
    }
  }

  private async executeTool(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      case 'sovereign_get_arena_state': {
        const state = this.engine.getState();
        if (!args.includeTraceLog) {
          const { traceLog, ...rest } = state;
          return rest;
        }
        return state;
      }

      case 'sovereign_evaluate_ohm_combat': {
        const v = Number(args.voltage ?? 3.0);
        const r = Math.max(0.1, Number(args.resistance ?? 1.0));
        const dir = Number(args.direction8 ?? 0) % 8;
        const currentI = v / r;
        const powerP = v * currentI;
        return {
          voltage: v,
          resistance: r,
          currentAmps: Number(currentI.toFixed(3)),
          powerWatts: Number(powerP.toFixed(3)),
          overcomesResistance: currentI >= 1.0,
          directionIndex: dir,
          directionAngleDeg: dir * 45,
          combinatorialDirectionalPairs: 64,
        };
      }

      case 'sovereign_generate_tactical_spawn': {
        const prompt = String(args.prompt || 'aggression');
        return await TacticalGenerativeCoordinator.generateTacticalInstance(this.engine, 'thread_king_ai', prompt);
      }

      case 'sovereign_get_combinatorics_report': {
        return SovereignStatisticsReporter.generateStatisticsReport();
      }

      case 'sovereign_modulate_compute_cores': {
        return SovereignComputeCores.executePipeline(args);
      }

      default:
        throw new Error(`Unknown MCP tool: ${name}`);
    }
  }

  /**
   * Produkčný Express HTTP handler pre Streamable HTTP transport (POST /mcp)
   */
  public expressHandler() {
    return async (req: Request, res: Response) => {
      const configuredKey = process.env.MCP_API_KEY;
      if (configuredKey) {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token !== configuredKey) {
          res.status(401).json({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32001, message: 'Unauthorized: Invalid MCP_API_KEY' },
          });
          return;
        }
      }

      const payload = req.body as JsonRpcRequest;
      if (!payload || payload.jsonrpc !== '2.0' || !payload.method) {
        res.status(400).json({
          jsonrpc: '2.0',
          id: payload?.id ?? null,
          error: { code: -32600, message: 'Invalid JSON-RPC 2.0 Request' },
        });
        return;
      }

      const response = await this.handleRpcRequest(payload);
      if (response === null) {
        res.status(202).end();
        return;
      }
      res.status(200).json(response);
    };
  }

  /**
   * Spustenie v STDIO režime (pre lokálne pripojenie z mcp_config.json)
   */
  public startStdio(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on('line', async (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const req = JSON.parse(trimmed) as JsonRpcRequest;
        const res = await this.handleRpcRequest(req);
        if (res !== null) {
          process.stdout.write(JSON.stringify(res) + '\n');
        }
      } catch (e: any) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' },
          }) + '\n'
        );
      }
    });
  }
}

// Ak je súbor spustený priamo cez CLI (`npx ts-node packages/server/src/mcp/SovereignMCPServerTemplate.ts --stdio`)
if (require.main === module) {
  const mcpServer = new SovereignMCPServerTemplate();
  mcpServer.startStdio();
}
