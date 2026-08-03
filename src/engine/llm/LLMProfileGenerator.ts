/**
 * LLM Profile Generator
 * 
 * Generuje profily pre neznáme entity pomocou LLM (Large Language Model).
 * Keď systém stretne niečo, čo nie je v databáze, požiada LLM o vygenerovanie profilu.
 */

export interface LLMProfile {
  name: string;
  description: string;
  visualStyle: {
    primaryColor: string;
    secondaryColor: string;
    textureHints: string[];
    shapeArchetype: 'ORGANIC' | 'GEOMETRIC' | 'ABSTRACT' | 'HYBRID';
  };
  behavior: {
    movementPattern: string;
    interactionStyle: string;
    soundProfile: string;
  };
  stats: {
    rarity: number; // 0.0 - 1.0
    complexity: number; // 1 - 10
    renderCost: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  generatedAt: number;
  sourcePrompt: string;
}

export interface LLMConfig {
  apiKey?: string;
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class LLMProfileGenerator {
  private config: LLMConfig;
  private cache: Map<string, LLMProfile> = new Map();

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Vygeneruje profil pre neznámu entitu
   */
  async generateProfile(
    entityName: string,
    context: {
      axiomSource: string;
      biomeType: string;
      playerKarma?: number;
      nearbyEntities: string[];
    }
  ): Promise<LLMProfile> {
    // Kontrola cache
    const cacheKey = `${entityName}_${context.axiomSource}_${context.biomeType}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Zostavenie promptu
    const prompt = this.buildPrompt(entityName, context);

    try {
      // Volanie LLM API (simulované - v produkcii by bolo reálne API volanie)
      const response = await this.callLLMAPI(prompt);
      
      // Parsovanie odpovede
      const profile = this.parseLLMResponse(response, entityName, context);
      
      // Uloženie do cache
      this.cache.set(cacheKey, profile);
      
      return profile;
    } catch (error) {
      console.error(`LLM generation failed for ${entityName}:`, error);
      // Fallback na defaultný profil
      return this.createFallbackProfile(entityName, context);
    }
  }

  private buildPrompt(entityName: string, context: any): string {
    return `
Generate a game entity profile for: "${entityName}"

Context:
- Axiom Source: ${context.axiomSource}
- Biome Type: ${context.biomeType}
- Player Karma: ${context.playerKarma || 0}
- Nearby Entities: ${context.nearbyEntities.join(', ')}

Requirements:
1. Name should be unique and fitting the fantasy/sci-fi theme
2. Visual style should match the biome and axiom
3. Behavior should be interesting but balanced
4. Stats should reflect rarity and complexity

Return JSON format:
{
  "name": "...",
  "description": "...",
  "visualStyle": {
    "primaryColor": "#...",
    "secondaryColor": "#...",
    "textureHints": ["...", "..."],
    "shapeArchetype": "ORGANIC|GEOMETRIC|ABSTRACT|HYBRID"
  },
  "behavior": {
    "movementPattern": "...",
    "interactionStyle": "...",
    "soundProfile": "..."
  },
  "stats": {
    "rarity": 0.0-1.0,
    "complexity": 1-10,
    "renderCost": "LOW|MEDIUM|HIGH"
  }
}
`.trim();
  }

  private async callLLMAPI(prompt: string): Promise<any> {
    // Simulácia LLM odpovede (v produkcii by bolo fetch/api volanie)
    // Príklad reálnej implementácie:
    /*
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })
    });
    return await response.json();
    */

    // Simulovaný delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulovaná odpoveď
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            name: `Aetheric ${Math.random().toString(36).substring(7).toUpperCase()}`,
            description: `Mystical entity born from ${prompt.split('Axiom Source: ')[1]?.split('\n')[0] || 'the void'}`,
            visualStyle: {
              primaryColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
              secondaryColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
              textureHints: ['crystalline', 'ethereal', 'glowing'],
              shapeArchetype: 'HYBRID'
            },
            behavior: {
              movementPattern: 'floating_drift',
              interactionStyle: 'passive_observer',
              soundProfile: 'ambient_chimes'
            },
            stats: {
              rarity: Math.random(),
              complexity: Math.floor(Math.random() * 10) + 1,
              renderCost: 'MEDIUM'
            }
          })
        }
      }]
    };
  }

  private parseLLMResponse(response: any, entityName: string, context: any): LLMProfile {
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid LLM response');
    }

    const parsed = JSON.parse(content);
    
    return {
      ...parsed,
      generatedAt: Date.now(),
      sourcePrompt: this.buildPrompt(entityName, context)
    };
  }

  private createFallbackProfile(entityName: string, context: any): LLMProfile {
    // Fallback keď LLM zlyhá
    return {
      name: entityName,
      description: `Generated fallback profile for ${entityName}`,
      visualStyle: {
        primaryColor: '#808080',
        secondaryColor: '#C0C0C0',
        textureHints: ['basic', 'simple'],
        shapeArchetype: 'GEOMETRIC'
      },
      behavior: {
        movementPattern: 'static',
        interactionStyle: 'neutral',
        soundProfile: 'silent'
      },
      stats: {
        rarity: 0.5,
        complexity: 3,
        renderCost: 'LOW'
      },
      generatedAt: Date.now(),
      sourcePrompt: this.buildPrompt(entityName, context)
    };
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  clearCache() {
    this.cache.clear();
  }
}
