export interface ThreadState {
  id: string;
  name: string;
  type: 'PLAYER' | 'NPC';
  health: number;
  armor: number;
  position: { meta: number; hex: number } | null;
  currentBuffer: any[];
  handLimit: number;
  materials?: Record<string, number>;
}

export interface ActionNode {
  id: string;
  instruction: any;
  sourceId: string;
  targetId: string;
  reactions: ActionNode[];
}

export interface GameState {
  state: string;
  activePlayerId: string | null;
  systemEnergy: number;
  globalEntropy: number;
  threads: ThreadState[];
  actionNetwork?: ActionNode[];
}

/**
 * Rozhranie pre sieťový transport (Socket.io alebo natívne WebSockety).
 * Oddeľuje runtime od konkrétnych sieťových knižníc.
 */
export interface INetworkSocket {
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback?: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  connected: boolean;
  connect?(): void;
  disconnect?(): void;
}

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SANDBOX_FALLBACK';

export interface TelemetryEvent {
  timestamp: string;
  source: 'CLIENT' | 'SERVER' | 'SANDBOX';
  type: 'INFO' | 'ACTION' | 'ERROR' | 'PHYSICS';
  message: string;
}

/**
 * Sovereign Connection Engine
 * Riadi operácie, načítanie závislostí a synchronizáciu stavu medzi frontendom a backendom.
 */
export class ConnectionEngine {
  private socket: INetworkSocket | null = null;
  private state: ConnectionState = 'DISCONNECTED';
  private gameState: GameState | null = null;
  private logs: TelemetryEvent[] = [];
  private cachedMapChunks: any = null;
  
  // Cache pre závislosti (karty, obrázky)
  private assetCache: Map<string, any> = new Map();
  
  // Odberatelia (Subscribers)
  private stateSubscribers: Set<(state: GameState) => void> = new Set();
  private logSubscribers: Set<(log: TelemetryEvent) => void> = new Set();
  private connectionSubscribers: Set<(connState: ConnectionState) => void> = new Set();

  constructor(private readonly fallbackEnabled: boolean = true) {
    this.log('INFO', 'Connection Engine inicializovaný. Pripravený na mapovanie sieťových závislostí.');
  }

  /**
   * Pripojenie sieťového transportu a zahájenie synchronizácie
   */
  public bindSocket(socket: INetworkSocket): void {
    // Odhlásenie starých odberateľov pre zamedzenie únikov pamäte (Senior-level Architecture)
    if (this.socket) {
      this.socket.off('initial_map');
      this.socket.off('state_resolved');
      this.socket.off('instruction_compiling');
      this.socket.off('connect_error');
      this.socket.off('disconnect');
      this.socket.off('card_played_effect');
    }
    
    this.socket = socket;
    this.setConnectionState('CONNECTING');
    this.log('INFO', 'Pripájanie k Sovereign Serveru...');

    this.socket.on('initial_map', (mapChunks: any) => {
      this.cachedMapChunks = mapChunks;
      if (this.gameState) {
        this.gameState = {
          ...this.gameState,
          map: mapChunks
        } as any;
        this.notifyState();
      }
      this.log('INFO', 'Statická mapa prijatá zo servera a uložená do cache.', 'SERVER');
    });

    this.socket.on('state_resolved', (serverState: GameState) => {
      this.setConnectionState('CONNECTED');
      this.gameState = {
        ...serverState,
        map: (serverState as any).map || this.cachedMapChunks || (this.gameState ? (this.gameState as any).map : null)
      } as any;
      this.notifyState();
      this.log('INFO', `Stav hry synchronizovaný zo servera. Aktívny hráč: ${serverState.activePlayerId}`, 'SERVER');
    });

    this.socket.on('state_delta', (delta: Partial<GameState>) => {
      this.setConnectionState('CONNECTED');
      if (this.gameState) {
        this.gameState = this.applyStateDelta(this.gameState, delta);
        this.notifyState();
        this.log('INFO', 'Stav hry synchronizovaný cez WS delta kompresiu (šetrenie šírky pásma AWS).', 'SERVER');
      } else {
        this.socket?.emit('request_full_sync');
      }
    });

    this.socket.on('instruction_compiling', (data: { node: ActionNode; timeLeft: number }) => {
      this.log('PHYSICS', `Akcia ${data.node.id} je v kompilácii. Okno na reakciu: ${(data.timeLeft / 1000).toFixed(1)}s.`);
    });

    this.socket.on('connect_error', () => {
      this.handleConnectionFailure();
    });

    this.socket.on('disconnect', () => {
      this.handleConnectionFailure();
    });

    this.socket.on('card_played_effect', (data: { targetHex: { meta: number; hex: number } }) => {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('card_played_effect', { detail: data });
        window.dispatchEvent(event);
      }
    });
  }

  /**
   * Zahrá kartu targeting konkrétny hexagón na aréne
   */
  public playCard(cardId: string, metaId: number, hexId: number): void {
    if (this.state === 'CONNECTED' && this.socket) {
      this.socket.emit('playCard', { cardId, targetHex: { meta: metaId, hex: hexId } });
      this.log('ACTION', `Zahraná karta "${cardId}" targeting chunk:${metaId} hex:${hexId}.`);
    } else if (this.fallbackEnabled) {
      this.executeLocalSandbox({
        sourceId: this.gameState?.activePlayerId || 'thread_king_ai',
        targetId: 'thread_hacker_root',
        instructionId: cardId
      });
    }
  }

  /**
   * Spustenie inštrukcie (odoslanie akcie na server alebo lokálnu simuláciu)
   */
  public executeInstruction(payload: {
    sourceId: string;
    targetId: string;
    instructionId: string;
    targetNodeId?: string;
  }): void {
    if (this.state === 'CONNECTED' && this.socket) {
      this.socket.emit('execute_instruction', payload);
      this.log('ACTION', `Odoslaná inštrukcia "${payload.instructionId}" na server pre terč ${payload.targetId}`);
    } else if (this.fallbackEnabled) {
      this.executeLocalSandbox(payload);
    } else {
      this.log('ERROR', 'Odoslanie zlyhalo: Sieť je odpojená a lokálny Sandbox je vypnutý.');
    }
  }

  /**
   * Ukončenie ťahu
   */
  public endTurn(): void {
    if (this.state === 'CONNECTED' && this.socket) {
      this.socket.emit('end_turn');
      this.log('ACTION', 'Odoslaná požiadavka na ukončenie ťahu na server.');
    } else if (this.state === 'SANDBOX_FALLBACK') {
      this.endTurnLocalSandbox();
    }
  }

  /**
   * Načítanie závislostí kariet a ich kešovanie (Fetch Dependencies)
   */
  public async fetchCardDependencies(heroId: string): Promise<any> {
    const cacheKey = `cards_${heroId}`;
    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey);
    }

    try {
      this.log('INFO', `Sťahovanie dátových závislostí pre hrdinu: ${heroId}`);
      // Asynchrónny fetch z CDN / API
      const response = await fetch(`/api/cards/${heroId}`);
      if (!response.ok) throw new Error(`HTTP chyba: ${response.status}`);
      
      const data = await response.json();
      this.assetCache.set(cacheKey, data);
      return data;
    } catch (e: any) {
      this.log('ERROR', `Zlyhalo načítanie závislostí pre ${heroId}: ${e.message}. Používam lokálnu knižnicu.`);
      // Návrat mock dát v prípade výpadku
      return null;
    }
  }

  /**
   * Vráti aktuálny stav hry (ak existuje)
   */
  public getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * Prepíše lokálny stav hry v Sandbox režime a upozorní odberateľov
   */
  public setLocalGameState(nextState: GameState): void {
    if (this.state === 'SANDBOX_FALLBACK') {
      this.gameState = nextState;
      this.notifyState();
      this.log('INFO', 'Lokálny stav hry bol aktualizovaný externým volaním.');
    }
  }

  /**
   * Resetuje lokálnu sandbox simuláciu
   */
  public resetSandbox(): void {
    if (this.state === 'SANDBOX_FALLBACK') {
      this.initializeSandboxState();
      this.log('INFO', 'Sandbox simulácia bola reštartovaná.');
    }
  }

  // --- ODBERATELIA (OBSERVER PATTERN) ---
  
  public subscribeToState(callback: (state: GameState) => void): () => void {
    this.stateSubscribers.add(callback);
    if (this.gameState) callback(this.gameState);
    return () => this.stateSubscribers.delete(callback);
  }

  public subscribeToLogs(callback: (log: TelemetryEvent) => void): () => void {
    this.logSubscribers.add(callback);
    return () => this.logSubscribers.delete(callback);
  }

  public subscribeToConnection(callback: (connState: ConnectionState) => void): () => void {
    this.connectionSubscribers.add(callback);
    callback(this.state);
    return () => this.connectionSubscribers.delete(callback);
  }

  // --- LOKÁLNY OFFLINE SANDBOX ENGINE (FALLBACK) ---

  private handleConnectionFailure(): void {
    if (this.state !== 'SANDBOX_FALLBACK') {
      this.setConnectionState('SANDBOX_FALLBACK');
      this.log('ERROR', 'Spojenie so serverom zlyhalo. Automatický prechod do OFFLINE SANDBOX režimu.');
      this.initializeSandboxState();
    }
  }

  private initializeSandboxState(): void {
    this.gameState = {
      state: 'PLAYER_TURN',
      activePlayerId: 'thread_king_ai',
      systemEnergy: 0,
      globalEntropy: 0.4,
      threads: [
        {
          id: 'thread_king_ai',
          name: 'King AI',
          type: 'PLAYER',
          health: 15,
          armor: 2,
          position: { meta: 0, hex: 0 },
          currentBuffer: [
            { id: "snowball", heroId: "crystal", isUltimate: false, cardCategorization: "attack", effect: "slow" },
            { id: "iceMeteor", heroId: "crystal", isUltimate: false, cardCategorization: "attack", specifications: ["aoe"] },
            { id: "iceShards", heroId: "crystal", isUltimate: true, cardCategorization: "attack", specifications: ["aoe", "unit"] },
            { id: "iceCrystal", heroId: "crystal", isUltimate: false, cardCategorization: "magic", specifications: ["unit", "block"] }
          ],
          handLimit: 4,
          materials: { CrystalShard: 5, Spores: 0 }
        },
        {
          id: 'thread_hacker_root',
          name: 'Hacker Root',
          type: 'PLAYER',
          health: 12,
          armor: 1,
          position: { meta: 8, hex: 6 },
          currentBuffer: [
            { id: "snakePit", heroId: "toxic", isUltimate: true, cardCategorization: "attack", specifications: ["yourPosition"] },
            { id: "snakeAttack", heroId: "toxic", isUltimate: false, cardCategorization: "attack", specifications: ["unit"] },
            { id: "disarm", heroId: "toxic", isUltimate: false, cardCategorization: "magic", effect: "disarm" },
            { id: "block", heroId: "toxic", isUltimate: true, cardCategorization: "magic", specifications: ["heal", "block"] }
          ],
          handLimit: 4,
          materials: { CrystalShard: 0, Spores: 5 }
        }
      ]
    };
    this.notifyState();
  }

  private executeLocalSandbox(payload: {
    sourceId: string;
    targetId: string;
    instructionId: string;
  }): void {
    if (!this.gameState) return;

    // Kópia stavu pre čistú transformáciu
    const nextState = JSON.parse(JSON.stringify(this.gameState)) as GameState;
    const target = nextState.threads.find((t: ThreadState) => t.id === payload.targetId);
    
    if (target) {
      // RPG Súbojová simulácia: Poškodenie vs Brnenie
      const isUlt = payload.instructionId.toLowerCase().includes('ultimate') || 
                    payload.instructionId === 'iceShards' || 
                    payload.instructionId === 'snakePit';
      const dmg = isUlt ? 6 : 3;
      const arm = target.armor;
      const netDamage = Math.max(1, dmg - arm);

      target.health = Math.max(0, target.health - netDamage);
      nextState.systemEnergy = Math.min(100, nextState.systemEnergy + 10);
      
      this.log('ACTION', `[Súboj] Hráč zahral ${payload.instructionId}. Cieľ ${target.name} (Armor: ${arm}) dostal -${netDamage} HP poškodenia.`, 'SANDBOX');
    }

    this.gameState = nextState;
    this.notifyState();
  }

  private endTurnLocalSandbox(): void {
    if (!this.gameState) return;
    const nextActive = this.gameState.activePlayerId === 'thread_king_ai' ? 'thread_hacker_root' : 'thread_king_ai';
    this.gameState.activePlayerId = nextActive;
    this.notifyState();
    this.log('ACTION', `Miestny ťah ukončený. Na rade je: ${nextActive}`, 'SANDBOX');
  }

  // --- POMOCNÉ FUNKCIE ---

  private setConnectionState(newState: ConnectionState): void {
    this.state = newState;
    this.connectionSubscribers.forEach(cb => cb(newState));
  }

  private notifyState(): void {
    if (this.gameState) {
      this.stateSubscribers.forEach(cb => cb(this.gameState!));
    }
  }

  private log(type: TelemetryEvent['type'], message: string, sourceOverride?: TelemetryEvent['source']): void {
    const event: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      source: sourceOverride || (this.state === 'SANDBOX_FALLBACK' ? 'SANDBOX' : 'CLIENT'),
      type,
      message
    };
    this.logs.push(event);
    this.logSubscribers.forEach(cb => cb(event));
    console.log(`[${event.source}][${event.type}] ${event.message}`);
  }

  /**
   * Aplikuje sieťovú deltu na lokálny stav hry za účelom šetrenia prenosu dát (AWS WS bandwidth optimization)
   */
  private applyStateDelta(current: any, delta: any): any {
    if (!current) return delta;
    if (!delta) return current;
    
    if (Array.isArray(current)) {
      if (Array.isArray(delta)) {
        return delta;
      }
      const result = [ ...current ];
      for (const key of Object.keys(delta)) {
        const idx = parseInt(key, 10);
        if (!isNaN(idx)) {
          result[idx] = this.applyStateDelta(current[idx], delta[key]);
        }
      }
      return result;
    }
    
    const result = { ...current };
    for (const key of Object.keys(delta)) {
      if (delta[key] && typeof delta[key] === 'object' && !Array.isArray(delta[key])) {
        result[key] = this.applyStateDelta(current[key], delta[key]);
      } else {
        result[key] = delta[key];
      }
    }
    return result;
  }
}
