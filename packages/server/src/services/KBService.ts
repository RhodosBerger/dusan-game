// packages/server/src/services/KBService.ts

import { CardBase, LocalizedCard, CompiledInstruction, compileCardToInstruction } from '@dusan-game/shared';

export class KnowledgeBaseService {
  private static instance: KnowledgeBaseService;
  private cardRegistry: Map<string, LocalizedCard>;
  private instructionRegistry: Map<string, CompiledInstruction>;

  private constructor() {
    this.cardRegistry = new Map();
    this.instructionRegistry = new Map();
  }

  public static getInstance(): KnowledgeBaseService {
    if (!this.instance) {
      this.instance = new KnowledgeBaseService();
    }
    return this.instance;
  }

  /**
   * Zaregistruje sadu kariet a preloží ich na inštrukcie pre herný engine.
   */
  public loadCards(cards: CardBase[], translations: Record<string, { name: string; description: string }>) {
    cards.forEach(base => {
      const trans = translations[base.id] || { name: base.id, description: '' };
      const localizedCard: LocalizedCard = {
        ...base,
        name: trans.name,
        description: trans.description
      };
      
      this.cardRegistry.set(base.id, localizedCard);
      
      // Kompilácia do HW/fyzikálneho formátu
      const instruction = compileCardToInstruction(localizedCard);
      this.instructionRegistry.set(base.id, instruction);
    });
    
    console.log(`[KnowledgeBase] Successfully registered and compiled ${this.cardRegistry.size} cards.`);
  }

  public getInstruction(cardId: string): CompiledInstruction | undefined {
    return this.instructionRegistry.get(cardId);
  }

  public getCard(cardId: string): LocalizedCard | undefined {
    return this.cardRegistry.get(cardId);
  }
}
