import * as fs from 'fs';
import * as path from 'path';

export interface RAGNarrativeEntry {
  biome: string;
  gameMode: string;
  cardCombo: string[];
  hexCoords: string[];
  narrativeFlow: string;
}

/**
 * RAG Narrative Machine Learning and Telemetry Alignment Service
 */
export class CognitiveNarrativeRAGService {
  private static readonly DATASET_PATH = '/home/rhoddos_berger/.gemini/antigravity-ide/brain/6d7b80d4-47da-439a-99b2-bb6b38bf0acc/scratch/narrative_rag_dataset.jsonl';
  private static instance: CognitiveNarrativeRAGService;
  private database: RAGNarrativeEntry[] = [];

  private constructor() {
    this.database = [
      {
        biome: "GLACIER",
        gameMode: "ACTION",
        cardCombo: ["Glacier Strike", "Aetheric Dice"],
        hexCoords: ["0x0", "0x1"],
        narrativeFlow: "Indukcia: V chladnom prostredí Glacier hrdina aktivuje kryštálovú rezonanciu, čím spúšťa energetický skok na susedné políčka."
      },
      {
        biome: "TOXIC_SWAMP",
        gameMode: "COMBAT",
        cardCombo: ["Toxic Spray", "Stealth Blink"],
        hexCoords: ["0x2", "0x3"],
        narrativeFlow: "Dedukcia: Toxic Swamp znižuje regeneráciu; stealth útoky z blízkych políčok vyvolávajú okamžitý kolaps toxicity."
      },
      {
        biome: "BARRENS",
        gameMode: "MULLIGAN",
        cardCombo: ["Desert Burn", "Void Erosion"],
        hexCoords: ["0x4", "0x5"],
        narrativeFlow: "Kombinatorika: Vyprahnutá pustatina Barrens zvyšuje entropiu; odhodenie prebytočných kariet uvoľňuje energetické napätie."
      }
    ];
  }

  public static getInstance(): CognitiveNarrativeRAGService {
    if (!this.instance) {
      this.instance = new CognitiveNarrativeRAGService();
    }
    return this.instance;
  }

  /**
   * Retrieves matching narrative context based on current gameplay parameters
   */
  public retrieveNarrativeContext(
    biome: string,
    gameMode: string,
    hexCoords: string[]
  ): RAGNarrativeEntry | null {
    const match = this.database.find(entry => entry.biome === biome && entry.gameMode === gameMode);
    return match || this.database[0];
  }

  /**
   * Generates a fine-tuning prompt-completion JSON-L dataset for training the LLM
   */
  public generateFineTuningDataset(): string {
    try {
      const lines: string[] = [];
      this.database.forEach(entry => {
        const prompt = `System RAG parameters: biome=${entry.biome}, mode=${entry.gameMode}, hexes=${entry.hexCoords.join(',')}, cards=${entry.cardCombo.join(',')}. Task: Generate gameplay story narrative using induction/deduction/combinatorics.`;
        const completion = `Narrative outcome: ${entry.narrativeFlow}`;
        lines.push(JSON.stringify({ prompt, completion }));
      });

      const dir = path.dirname(CognitiveNarrativeRAGService.DATASET_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(CognitiveNarrativeRAGService.DATASET_PATH, lines.join('\n') + '\n', 'utf-8');
      console.log(`[RAG_SERVICE] Dataset compiled successfully to ${CognitiveNarrativeRAGService.DATASET_PATH}`);
      return CognitiveNarrativeRAGService.DATASET_PATH;
    } catch (e) {
      console.error('[RAG_SERVICE] Failed to compile dataset:', e);
      return '';
    }
  }
}
