/**
 * Open Source License Framework & Community Integration
 * 
 * Manages open source licensing for community mods
 * Provides attribution tracking and revenue sharing
 * Ensures compliance with various OSS licenses
 */

export interface OSSLicense {
  id: string;
  name: string;
  type: 'permissive' | 'copyleft' | 'weak-copyleft' | 'proprietary';
  url: string;
  requiresAttribution: boolean;
  allowsCommercial: boolean;
  allowsModification: boolean;
  requiresSourceDisclosure: boolean;
  patentGrant: boolean;
}

export interface CommunityModule {
  id: string;
  name: string;
  version: string;
  author: string;
  license: string;
  description: string;
  dependencies: string[];
  downloadUrl: string;
  checksum: string;
  installedAt?: number;
  lastUpdated?: number;
  usageCount: number;
  rating: number; // 0-5
  compatibilityScore: number; // 0-1
  revenueSharePercentage: number; // 0-100
}

export interface AttributionRecord {
  moduleId: string;
  moduleName: string;
  author: string;
  license: string;
  usedInFeatures: string[];
  firstUsed: number;
  lastUsed: number;
  usageCount: number;
}

export interface RevenueShareRecord {
  moduleId: string;
  moduleName: string;
  author: string;
  period: string; // e.g., "2024-01"
  totalRevenue: number;
  sharePercentage: number;
  shareAmount: number;
  paid: boolean;
  paidAt?: number;
}

export const KNOWN_LICENSES: Record<string, OSSLicense> = {
  'MIT': {
    id: 'MIT',
    name: 'MIT License',
    type: 'permissive',
    url: 'https://opensource.org/licenses/MIT',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true,
    requiresSourceDisclosure: false,
    patentGrant: false,
  },
  'Apache-2.0': {
    id: 'Apache-2.0',
    name: 'Apache License 2.0',
    type: 'permissive',
    url: 'https://opensource.org/licenses/Apache-2.0',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true,
    requiresSourceDisclosure: false,
    patentGrant: true,
  },
  'GPL-3.0': {
    id: 'GPL-3.0',
    name: 'GNU General Public License v3.0',
    type: 'copyleft',
    url: 'https://opensource.org/licenses/GPL-3.0',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true,
    requiresSourceDisclosure: true,
    patentGrant: true,
  },
  'LGPL-3.0': {
    id: 'LGPL-3.0',
    name: 'GNU Lesser General Public License v3.0',
    type: 'weak-copyleft',
    url: 'https://opensource.org/licenses/LGPL-3.0',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true,
    requiresSourceDisclosure: false,
    patentGrant: true,
  },
  'BSD-3-Clause': {
    id: 'BSD-3-Clause',
    name: 'BSD 3-Clause License',
    type: 'permissive',
    url: 'https://opensource.org/licenses/BSD-3-Clause',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true,
    requiresSourceDisclosure: false,
    patentGrant: false,
  },
  'ISC': {
    id: 'ISC',
    name: 'ISC License',
    type: 'permissive',
    url: 'https://opensource.org/licenses/ISC',
    requiresAttribution: true,
    allowsCommercial: true,
    allowsModification: true,
    requiresSourceDisclosure: false,
    patentGrant: false,
  },
};

export class OpenSourceFramework {
  private registeredModules: Map<string, CommunityModule>;
  private attributionRecords: Map<string, AttributionRecord>;
  private revenueShares: Map<string, RevenueShareRecord[]>;
  private readonly defaultRevenueShare: number = 10; // 10% default

  constructor() {
    this.registeredModules = new Map();
    this.attributionRecords = new Map();
    this.revenueShares = new Map();
  }

  /**
   * Register a community module with license validation
   */
  public registerModule(module: CommunityModule): { success: boolean; error?: string } {
    // Validate license
    if (!KNOWN_LICENSES[module.license]) {
      return { 
        success: false, 
        error: `Unknown license: ${module.license}. Supported: ${Object.keys(KNOWN_LICENSES).join(', ')}` 
      };
    }

    // Check compatibility with core engine (MIT licensed)
    const license = KNOWN_LICENSES[module.license];
    if (license.type === 'copyleft' && license.requiresSourceDisclosure) {
      // Warn about GPL compatibility issues
      console.warn(`Module ${module.name} uses ${license.name} which may require derivative works to be open source`);
    }

    // Calculate compatibility score
    const compatibilityScore = this.calculateCompatibilityScore(module);

    // Set default revenue share if not specified
    if (module.revenueSharePercentage === undefined || module.revenueSharePercentage < 0) {
      module.revenueSharePercentage = this.defaultRevenueShare;
    }

    this.registeredModules.set(module.id, {
      ...module,
      compatibilityScore,
      installedAt: Date.now(),
    });

    return { success: true };
  }

  /**
   * Track module usage for attribution and revenue sharing
   */
  public trackUsage(moduleId: string, featureName: string): void {
    const module = this.registeredModules.get(moduleId);
    if (!module) {
      console.warn(`Attempted to track usage of unregistered module: ${moduleId}`);
      return;
    }

    module.usageCount++;

    // Update or create attribution record
    if (!this.attributionRecords.has(moduleId)) {
      this.attributionRecords.set(moduleId, {
        moduleId,
        moduleName: module.name,
        author: module.author,
        license: module.license,
        usedInFeatures: [featureName],
        firstUsed: Date.now(),
        lastUsed: Date.now(),
        usageCount: 1,
      });
    } else {
      const record = this.attributionRecords.get(moduleId)!;
      if (!record.usedInFeatures.includes(featureName)) {
        record.usedInFeatures.push(featureName);
      }
      record.lastUsed = Date.now();
      record.usageCount++;
    }
  }

  /**
   * Generate attribution notice for credits screen
   */
  public generateAttributionNotice(): string {
    let notice = '=== OPEN SOURCE ATTRIBUTIONS ===\n\n';
    notice += 'This game includes the following open source components:\n\n';

    for (const [moduleId, record] of this.attributionRecords.entries()) {
      const license = KNOWN_LICENSES[record.license];
      notice += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notice += `📦 ${record.moduleName} v${this.registeredModules.get(moduleId)?.version || 'unknown'}\n`;
      notice += `   by ${record.author}\n`;
      notice += `   License: ${license.name} (${license.url})\n`;
      notice += `   Used in: ${record.usedInFeatures.join(', ')}\n`;
      notice += `   ${license.requiresAttribution ? '✅ Attribution required' : 'ℹ️ No attribution required'}\n`;
      notice += `   ${license.allowsCommercial ? '✅ Commercial use allowed' : '❌ Non-commercial only'}\n`;
      notice += '\n';
    }

    notice += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    notice += '\nFull license texts available in /licenses directory.\n';

    return notice;
  }

  /**
   * Calculate revenue share for a given period
   */
  public calculateRevenueShare(
    moduleId: string,
    totalRevenue: number,
    period: string
  ): RevenueShareRecord {
    const module = this.registeredModules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Calculate share based on usage percentage
    const totalUsage = Array.from(this.registeredModules.values())
      .reduce((sum, m) => sum + m.usageCount, 0);
    
    const usagePercentage = module.usageCount / totalUsage;
    const effectiveShare = Math.min(
      module.revenueSharePercentage / 100,
      usagePercentage * 2 // Cap at 2x usage percentage
    );

    const shareAmount = totalRevenue * effectiveShare;

    const record: RevenueShareRecord = {
      moduleId,
      moduleName: module.name,
      author: module.author,
      period,
      totalRevenue,
      sharePercentage: effectiveShare * 100,
      shareAmount,
      paid: false,
    };

    // Store record
    if (!this.revenueShares.has(moduleId)) {
      this.revenueShares.set(moduleId, []);
    }
    this.revenueShares.get(moduleId)!.push(record);

    return record;
  }

  /**
   * Get all modules compatible with a specific feature
   */
  public getCompatibleModules(featureType: string): CommunityModule[] {
    return Array.from(this.registeredModules.values()).filter(module => {
      // Simple compatibility check - in production this would be more sophisticated
      return module.compatibilityScore > 0.7;
    });
  }

  /**
   * Validate module dependency chain for license conflicts
   */
  public validateDependencyChain(moduleId: string): { valid: boolean; conflicts?: string[] } {
    const module = this.registeredModules.get(moduleId);
    if (!module) {
      return { valid: false, conflicts: ['Module not found'] };
    }

    const conflicts: string[] = [];
    const visited = new Set<string>();

    const checkModule = (id: string): void => {
      if (visited.has(id)) return;
      visited.add(id);

      const mod = this.registeredModules.get(id);
      if (!mod) return;

      const license = KNOWN_LICENSES[mod.license];
      
      // Check for copyleft contamination
      if (license.type === 'copyleft' && license.requiresSourceDisclosure) {
        // Check if any parent modules are permissive
        const parents = Array.from(this.registeredModules.values()).filter(m => 
          m.dependencies.includes(id)
        );
        
        const permissiveParents = parents.filter(p => {
          const pLicense = KNOWN_LICENSES[p.license];
          return pLicense.type === 'permissive';
        });

        if (permissiveParents.length > 0) {
          conflicts.push(
            `License conflict: ${mod.name} (${mod.license}) is copyleft but used by permissive modules: ${permissiveParents.map(p => p.name).join(', ')}`
          );
        }
      }

      // Recursively check dependencies
      mod.dependencies.forEach(depId => checkModule(depId));
    };

    checkModule(moduleId);

    return {
      valid: conflicts.length === 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    };
  }

  /**
   * Export module manifest for distribution
   */
  public exportManifest(): {
    version: string;
    generatedAt: number;
    modules: Array<{
      id: string;
      name: string;
      version: string;
      author: string;
      license: string;
      compatibilityScore: number;
    }>;
    totalModules: number;
    licenseSummary: Record<string, number>;
  } {
    const licenseSummary: Record<string, number> = {};
    
    Array.from(this.registeredModules.values()).forEach(module => {
      licenseSummary[module.license] = (licenseSummary[module.license] || 0) + 1;
    });

    return {
      version: '1.0.0',
      generatedAt: Date.now(),
      modules: Array.from(this.registeredModules.values()).map(m => ({
        id: m.id,
        name: m.name,
        version: m.version,
        author: m.author,
        license: m.license,
        compatibilityScore: m.compatibilityScore,
      })),
      totalModules: this.registeredModules.size,
      licenseSummary,
    };
  }

  private calculateCompatibilityScore(module: CommunityModule): number {
    let score = 1.0;

    // Penalize unknown licenses
    if (!KNOWN_LICENSES[module.license]) {
      score -= 0.3;
    }

    // Penalize copyleft licenses for core engine compatibility
    const license = KNOWN_LICENSES[module.license];
    if (license?.type === 'copyleft') {
      score -= 0.2;
    }

    // Bonus for popular, well-maintained licenses
    if (['MIT', 'Apache-2.0', 'BSD-3-Clause'].includes(module.license)) {
      score += 0.1;
    }

    // Penalize many dependencies (potential conflict surface)
    if (module.dependencies.length > 10) {
      score -= 0.1;
    }

    // Bonus for high rating
    score += (module.rating / 5) * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  public getRegisteredModules(): CommunityModule[] {
    return Array.from(this.registeredModules.values());
  }

  public getAttributionRecords(): AttributionRecord[] {
    return Array.from(this.attributionRecords.values());
  }

  public getRevenueShareRecords(moduleId?: string): RevenueShareRecord[] {
    if (moduleId) {
      return this.revenueShares.get(moduleId) || [];
    }
    return Array.from(this.revenueShares.values()).flat();
  }
}

export default OpenSourceFramework;
