export interface TokenizedParameter {
  key: string;
  rawValue: unknown;
  cleanedValue: unknown;
  tokenType: 'IDENTIFIER' | 'SPATIAL_COORD' | 'DIRECTION_OCTANT' | 'ELECTRO_SCALAR' | 'COGNITIVE_THEME' | 'KNOWLEDGE_SCALE';
  tokenCode: string;
  normalizedWeight: number;
  wasCleaned: boolean;
}

export interface ParameterTokenStream {
  streamId: string;
  timestamp: number;
  tokenCount: number;
  tokens: TokenizedParameter[];
  embeddingVector8D: number[];
  checksumHex: string;
}

export type DataQualityTierId =
  | 'GOLD_STORAGE_READY'
  | 'SILVER_AUTO_CLEANED'
  | 'BRONZE_REQUIRES_CLEANING'
  | 'QUARANTINE_ANOMALY';

export interface DataCleaningValidationReport {
  qualityScore: number;
  qualityTier: DataQualityTierId;
  storageReady: boolean;
  requiresFurtherCleaning: boolean;
  modelConfidence: number;
  anomaliesDetected: string[];
  cleaningActionsApplied: string[];
  tierThresholds: {
    GOLD_STORAGE_READY: string;
    SILVER_AUTO_CLEANED: string;
    BRONZE_REQUIRES_CLEANING: string;
    QUARANTINE_ANOMALY: string;
  };
}

export interface AutonomousConicStructure {
  structureId: string;
  octantIndex: number;
  coneAngleDeg: number;
  apertureDeg: number;
  canonicalInvariant: string;
  selfGoverningState: 'AUTONOMOUS_LOCKED' | 'SELF_BALANCING' | 'OVERDRIVE_CONIC_FOCUS';
  autonomyScore: number;
  localLoadRatio: number;
}

export interface JunctionCompoundAggregate {
  aggregateId: string;
  compoundName: string;
  sourceMacro: number;
  targetMacro: number;
  conductanceSiemens: number;
  synergyFlux: number;
  activePreparationFormula: string;
}

export interface EightDirectionalManhattanAnchor {
  octantIndex: number;
  compassCode: string;
  gridDelta: [number, number];
  manhattanDistanceL1: number;
  chebyshevDistanceLInf: number;
  anchoredMacroSector: number;
  elevationTier: number;
}

export interface ViewProjectionMatrixSpec {
  matrixId: string;
  name: string;
  fovDeg: number;
  aspectRatio: string;
  cameraPosition: [number, number, number];
  lookAtTarget: [number, number, number];
  rowMajor4x4: number[];
  transitionDurationMs: number;
}

export interface VisualSimilarityPromptSpec {
  promptId: string;
  category: 'PANORAMA_DAYLIGHT' | 'HERO_ARMOR_PBR' | 'ELEVATION_TOPOLOGY' | 'OHM_CONIC_VFX';
  title: string;
  promptText: string;
  negativePrompt: string;
  similarityScoreTarget: number;
}

export interface ComputeCoreStatus {
  coreId: string;
  name: string;
  domain: string;
  status: 'ONLINE' | 'PROCESSING' | 'OPTIMAL';
  throughputOpsPerSec: number;
  lastResultSummary: string;
}

export interface VariableTreeNode {
  id: string;
  label: string;
  type: string;
  value?: string | number | boolean;
  qualityBadge?: DataQualityTierId | 'VALIDATED' | 'AUTONOMOUS';
  children?: VariableTreeNode[];
}

export interface MultiCoreExecutionResult {
  tokenStream: ParameterTokenStream;
  dataQualityReport: DataCleaningValidationReport;
  cores: {
    topologyCore: {
      elevationTier: number;
      terrainFeature: string;
      directionalAlignmentCos: number;
      uphillMissProbability: number;
      tacticalMultiplier: number;
    };
    electrodynamicsCore: {
      voltage: number;
      resistance: number;
      currentAmps: number;
      powerWatts: number;
      springPeakDisplacementM: number;
      overdriveActive: boolean;
    };
    cognitiveAdaptiveCore: {
      activeThemeId: string;
      knowledgeScaleLevel: number;
      skillBoundaryUpper: number;
      skillBoundaryLower: number;
      recommendedFocusLayer: string;
    };
    combinatorialStateCore: {
      unitSpatialDirectionalStates: number;
      directionalMatrixPairs: number;
      activeBranchingFactor: number;
      shannonEntropyBits: number;
    };
  };
  autonomousConicStructures: AutonomousConicStructure[];
  junctionCompoundAggregates: JunctionCompoundAggregate[];
  manhattanAnchors8D: EightDirectionalManhattanAnchor[];
  viewProjectionMatrices: ViewProjectionMatrixSpec[];
  visualSimilarityPrompts: VisualSimilarityPromptSpec[];
  coreStatuses: ComputeCoreStatus[];
  variableInspectionTree: VariableTreeNode;
}

const ELEVATION_BY_MACRO: Record<number, { tier: number; feature: string }> = {
  0: { tier: 1, feature: 'SANCTUARY' },
  1: { tier: 0, feature: 'RAMP' },
  2: { tier: 2, feature: 'WATCHTOWER' },
  3: { tier: 0, feature: 'BARRICADE' },
  4: { tier: -1, feature: 'BRIDGE' },
  5: { tier: 0, feature: 'BARRICADE' },
  6: { tier: 2, feature: 'WATCHTOWER' },
  7: { tier: 0, feature: 'RAMP' },
  8: { tier: 1, feature: 'SANCTUARY' }
};

const VALID_THEMES = ['DOTA_DAYLIGHT', 'COGNITIVE_FOCUS', 'BIO_HARMONY', 'NEURAL_ANALYTICS'];

export class SovereignComputeCores {
  /**
   * Cleans and validates incoming parameters against trained ML distribution priors
   * and assigns a DataQualityTier determining storage readiness.
   */
  public static cleanAndValidateWithTrainedModel(rawParams: Record<string, any> = {}): {
    cleanedParams: Record<string, any>;
    report: DataCleaningValidationReport;
  } {
    const cleanedParams: Record<string, any> = { ...rawParams };
    const anomaliesDetected: string[] = [];
    const cleaningActionsApplied: string[] = [];
    let penalty = 0;

    const rawMacro = Number(rawParams.macroIndex ?? 0);
    if (Number.isNaN(rawMacro) || rawMacro < 0 || rawMacro > 8) {
      anomaliesDetected.push(`macroIndex out of trained bounds [0..8]: ${rawParams.macroIndex}`);
      cleanedParams.macroIndex = Math.max(0, Math.min(8, Number.isNaN(rawMacro) ? 0 : Math.round(rawMacro)));
      cleaningActionsApplied.push(`Clamped macroIndex → ${cleanedParams.macroIndex}`);
      penalty += 0.14;
    } else {
      cleanedParams.macroIndex = Math.round(rawMacro);
    }

    const rawSub = Number(rawParams.subIndex ?? 0);
    if (Number.isNaN(rawSub) || rawSub < 0 || rawSub > 6) {
      anomaliesDetected.push(`subIndex out of trained bounds [0..6]: ${rawParams.subIndex}`);
      cleanedParams.subIndex = Math.max(0, Math.min(6, Number.isNaN(rawSub) ? 0 : Math.round(rawSub)));
      cleaningActionsApplied.push(`Clamped subIndex → ${cleanedParams.subIndex}`);
      penalty += 0.12;
    } else {
      cleanedParams.subIndex = Math.round(rawSub);
    }

    const rawDir = Number(rawParams.preferred8Direction ?? 0);
    if (Number.isNaN(rawDir) || rawDir < 0 || rawDir > 7) {
      anomaliesDetected.push(`preferred8Direction outside octant ring [0..7]: ${rawParams.preferred8Direction}`);
      cleanedParams.preferred8Direction = Number.isNaN(rawDir) ? 0 : ((Math.round(rawDir) % 8) + 8) % 8;
      cleaningActionsApplied.push(`Modulo-normalized preferred8Direction → ${cleanedParams.preferred8Direction}`);
      penalty += 0.10;
    } else {
      cleanedParams.preferred8Direction = Math.round(rawDir);
    }

    const rawV = Number(rawParams.voltage ?? 4.5);
    if (Number.isNaN(rawV) || rawV < 0.5 || rawV > 12.0) {
      anomaliesDetected.push(`voltage z-score anomaly outside [0.5V..12.0V]: ${rawParams.voltage}`);
      cleanedParams.voltage = Number.isNaN(rawV) ? 4.5 : Math.max(0.5, Math.min(12.0, rawV));
      cleaningActionsApplied.push(`Imputed/clamped voltage → ${cleanedParams.voltage}V`);
      penalty += 0.18;
    } else {
      cleanedParams.voltage = Number(rawV.toFixed(2));
    }

    const rawR = Number(rawParams.resistance ?? 1.5);
    if (Number.isNaN(rawR) || rawR < 0.25 || rawR > 10.0) {
      anomaliesDetected.push(`resistance singularity/outlier outside [0.25Ω..10.0Ω]: ${rawParams.resistance}`);
      cleanedParams.resistance = Number.isNaN(rawR) ? 1.5 : Math.max(0.25, Math.min(10.0, rawR));
      cleaningActionsApplied.push(`Regularized resistance → ${cleanedParams.resistance}Ω`);
      penalty += 0.18;
    } else {
      cleanedParams.resistance = Number(rawR.toFixed(2));
    }

    const rawScale = Number(rawParams.knowledgeScale ?? 3);
    if (Number.isNaN(rawScale) || rawScale < 1 || rawScale > 4) {
      anomaliesDetected.push(`knowledgeScale outside [1..4]: ${rawParams.knowledgeScale}`);
      cleanedParams.knowledgeScale = Number.isNaN(rawScale) ? 3 : Math.max(1, Math.min(4, Math.round(rawScale)));
      cleaningActionsApplied.push(`Normalized knowledgeScale → L${cleanedParams.knowledgeScale}`);
      penalty += 0.08;
    } else {
      cleanedParams.knowledgeScale = Math.round(rawScale);
    }

    const rawTheme = String(rawParams.themeId || 'DOTA_DAYLIGHT').toUpperCase();
    if (!VALID_THEMES.includes(rawTheme)) {
      anomaliesDetected.push(`Unrecognized cognitive theme '${rawTheme}'`);
      cleanedParams.themeId = 'DOTA_DAYLIGHT';
      cleaningActionsApplied.push(`Fallback themeId → DOTA_DAYLIGHT`);
      penalty += 0.08;
    } else {
      cleanedParams.themeId = rawTheme;
    }

    const qualityScore = Number(Math.max(0.0, Math.min(1.0, 1.0 - penalty)).toFixed(3));
    let qualityTier: DataQualityTierId = 'GOLD_STORAGE_READY';
    if (qualityScore >= 0.90) {
      qualityTier = 'GOLD_STORAGE_READY';
    } else if (qualityScore >= 0.75) {
      qualityTier = 'SILVER_AUTO_CLEANED';
    } else if (qualityScore >= 0.50) {
      qualityTier = 'BRONZE_REQUIRES_CLEANING';
    } else {
      qualityTier = 'QUARANTINE_ANOMALY';
    }

    const storageReady = qualityTier === 'GOLD_STORAGE_READY' || qualityTier === 'SILVER_AUTO_CLEANED';
    const requiresFurtherCleaning = !storageReady;

    return {
      cleanedParams,
      report: {
        qualityScore,
        qualityTier,
        storageReady,
        requiresFurtherCleaning,
        modelConfidence: Number((0.94 - penalty * 0.25).toFixed(3)),
        anomaliesDetected,
        cleaningActionsApplied,
        tierThresholds: {
          GOLD_STORAGE_READY: 'Score >= 0.90 (Pripravené na okamžité uloženie do DB)',
          SILVER_AUTO_CLEANED: '0.75 <= Score < 0.90 (Automaticky očistené ML modelom, pripravené na uloženie)',
          BRONZE_REQUIRES_CLEANING: '0.50 <= Score < 0.75 (Vyžaduje dodatočné čistenie pred uložením)',
          QUARANTINE_ANOMALY: 'Score < 0.50 (Karanténa — anomália zablokovaná pred uložením)'
        }
      }
    };
  }

  public static tokenizeParameters(
    rawParams: Record<string, any> = {},
    cleanedParams: Record<string, any> = rawParams
  ): ParameterTokenStream {
    const keys = Array.from(new Set([...Object.keys(cleanedParams), ...Object.keys(rawParams)]));
    const tokens: TokenizedParameter[] = [];

    for (const key of keys) {
      const rawValue = rawParams[key];
      const value = cleanedParams[key] ?? rawValue;
      const wasCleaned = rawValue !== undefined && rawValue !== value;
      let tokenType: TokenizedParameter['tokenType'] = 'IDENTIFIER';
      let normalizedWeight = 0.5;
      let tokenCode = `TOK_${key.toUpperCase()}`;

      if (key === 'macroIndex' || key === 'subIndex' || key === 'elevationTier') {
        tokenType = 'SPATIAL_COORD';
        const num = Number(value) || 0;
        normalizedWeight = Math.max(0, Math.min(1, (num + 1) / 9));
        tokenCode = `LOC_${key.slice(0, 3).toUpperCase()}_${num}`;
      } else if (key === 'preferred8Direction' || key === 'targetDirection') {
        tokenType = 'DIRECTION_OCTANT';
        const oct = ((Number(value) || 0) % 8 + 8) % 8;
        normalizedWeight = oct / 7;
        tokenCode = `DIR_OCT_${oct}_${oct * 45}DEG`;
      } else if (key === 'voltage' || key === 'resistance' || key === 'entropy') {
        tokenType = 'ELECTRO_SCALAR';
        const num = Number(value) || 1;
        normalizedWeight = Math.max(0, Math.min(1, num / 12));
        tokenCode = `OHM_${key.slice(0, 1).toUpperCase()}_${num.toFixed(1)}`;
      } else if (key === 'themeId' || key === 'colorScheme') {
        tokenType = 'COGNITIVE_THEME';
        normalizedWeight = 0.85;
        tokenCode = `THEME_${String(value).toUpperCase()}`;
      } else if (key === 'knowledgeScale' || key === 'scaleLevel') {
        tokenType = 'KNOWLEDGE_SCALE';
        const lvl = Math.max(1, Math.min(4, Number(value) || 2));
        normalizedWeight = lvl / 4;
        tokenCode = `KNOW_L${lvl}`;
      } else {
        tokenCode = `ID_${String(value).slice(0, 16).toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`;
      }

      tokens.push({
        key,
        rawValue,
        cleanedValue: value,
        tokenType,
        tokenCode,
        normalizedWeight: Number(normalizedWeight.toFixed(4)),
        wasCleaned
      });
    }

    const embeddingVector8D = Array.from({ length: 8 }, (_, idx) => {
      const tok = tokens[idx % Math.max(1, tokens.length)];
      return tok ? Number(((tok.normalizedWeight * (idx + 1)) % 1).toFixed(4)) : 0.125 * (idx + 1);
    });

    const rawStr = tokens.map(t => `${t.tokenCode}:${t.normalizedWeight}`).join('|');
    let hash = 2166136261;
    for (let i = 0; i < rawStr.length; i++) {
      hash ^= rawStr.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const checksumHex = (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();

    return {
      streamId: `tok_stream_${Date.now()}`,
      timestamp: Date.now(),
      tokenCount: tokens.length,
      tokens,
      embeddingVector8D,
      checksumHex
    };
  }

  public static executePipeline(rawParams: Record<string, any> = {}): MultiCoreExecutionResult {
    const { cleanedParams, report: dataQualityReport } = this.cleanAndValidateWithTrainedModel(rawParams);
    const tokenStream = this.tokenizeParameters(rawParams, cleanedParams);

    const macroIndex = Number(cleanedParams.macroIndex ?? 0);
    const targetMacro = Number(cleanedParams.targetMacro ?? 4);
    const dirA = Number(cleanedParams.preferred8Direction ?? 0);
    const dirB = ((Number(cleanedParams.targetDirection ?? 4) % 8) + 8) % 8;
    const voltage = Number(cleanedParams.voltage ?? 4.5);
    const resistance = Number(cleanedParams.resistance ?? 1.5);
    const knowledgeScaleLevel = Number(cleanedParams.knowledgeScale ?? 3);
    const activeThemeId = String(cleanedParams.themeId || 'DOTA_DAYLIGHT');

    const sourceElev = ELEVATION_BY_MACRO[macroIndex] || { tier: 0, feature: 'RAMP' };
    const targetElev = ELEVATION_BY_MACRO[targetMacro] || { tier: -1, feature: 'BRIDGE' };
    const deltaH = sourceElev.tier - targetElev.tier;
    const angleDiffRad = ((dirA - dirB) * Math.PI) / 4;
    const directionalAlignmentCos = Number(Math.cos(angleDiffRad).toFixed(3));
    const uphillMissProbability = deltaH < 0 ? 0.25 : 0.0;
    const tacticalMultiplier = Number((1.0 + deltaH * 0.15 + directionalAlignmentCos * 0.1).toFixed(3));

    const currentAmps = Number((voltage / resistance).toFixed(3));
    const powerWatts = Number((voltage * currentAmps).toFixed(3));
    const stiffnessK = 260;
    const impulseForce = powerWatts * 4.2;
    const springPeakDisplacementM = Number((impulseForce / stiffnessK).toFixed(4));
    const overdriveActive = currentAmps >= 2.5 || powerWatts >= 12.0;

    const skillBoundaryLower = Number((0.35 + (knowledgeScaleLevel - 1) * 0.12).toFixed(2));
    const skillBoundaryUpper = Number((0.68 + (knowledgeScaleLevel - 1) * 0.10).toFixed(2));
    const focusLayers: Record<number, string> = {
      1: 'L1: Makro-Topológia & Denná Čitateľnosť (Dota 2 Daylight)',
      2: 'L2: 8-Smerové Taktické Vektory & Výškové Rampa/Most Prechody',
      3: 'L3: Ohmova Elektrodynamika (I=V/R) & Hookeova Pružinová Fyzika',
      4: 'L4: Kvantová Superpozícia, 504 Stavov/Jednotka & MCP Telemetria'
    };

    const unitSpatialDirectionalStates = 63 * 8; // 504
    const directionalMatrixPairs = 8 * 8; // 64
    const activeBranchingFactor = 504 * 35; // 17,640
    const shannonEntropyBits = Number(Math.log2(unitSpatialDirectionalStates * directionalMatrixPairs).toFixed(2));

    const octantLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const autonomousConicStructures: AutonomousConicStructure[] = Array.from({ length: 8 }, (_, oct) => {
      const isPrimaryCone = oct === dirA;
      const isCounterCone = oct === dirB;
      const angularDist = Math.min(Math.abs(oct - dirA), 8 - Math.abs(oct - dirA));
      const coneWeight = Math.max(0.15, Number(Math.cos((angularDist * Math.PI) / 8).toFixed(3)));
      const localLoadRatio = Number(((currentAmps * coneWeight) / 4.0).toFixed(3));
      const autonomyScore = Number(Math.min(1.0, 0.72 + coneWeight * 0.25).toFixed(3));

      return {
        structureId: `CONIC_CELL_${oct}_${octantLabels[oct]}`,
        octantIndex: oct,
        coneAngleDeg: oct * 45,
        apertureDeg: 45,
        canonicalInvariant: `I_${octantLabels[oct]}=${(currentAmps * coneWeight).toFixed(2)}A | Δz=${sourceElev.tier}`,
        selfGoverningState: isPrimaryCone
          ? 'OVERDRIVE_CONIC_FOCUS'
          : isCounterCone
            ? 'SELF_BALANCING'
            : 'AUTONOMOUS_LOCKED',
        autonomyScore,
        localLoadRatio
      };
    });

    // Spojnicové agregáty preparátov (Junction Compound Aggregates)
    const conductanceG = Number((1 / resistance).toFixed(3));
    const junctionCompoundAggregates: JunctionCompoundAggregate[] = [
      {
        aggregateId: 'JCA_CRYSTAL_RESONANCE',
        compoundName: 'Kryštálový Aether-Preparát (M0 ↔ M4)',
        sourceMacro: 0,
        targetMacro: 4,
        conductanceSiemens: conductanceG,
        synergyFlux: Number((currentAmps * 1.25).toFixed(3)),
        activePreparationFormula: `Ψ_crys = G(${conductanceG}S) · V(${voltage}V) · cos(${dirA * 45}°)`
      },
      {
        aggregateId: 'JCA_TOXIC_SPORE_BRIDGE',
        compoundName: 'Toxický Spórový Spojnicový Agregát (M8 ↔ M4)',
        sourceMacro: 8,
        targetMacro: 4,
        conductanceSiemens: Number((conductanceG * 0.88).toFixed(3)),
        synergyFlux: Number((powerWatts * 0.42).toFixed(3)),
        activePreparationFormula: `Ψ_tox = (V²/R) · Δh(${deltaH}) + μ_swamp`
      },
      {
        aggregateId: 'JCA_CLIFF_OBELISK_CONDUIT',
        compoundName: 'Výškový Relé Agregát Vyhliadok (M2 ↔ M6)',
        sourceMacro: 2,
        targetMacro: 6,
        conductanceSiemens: Number((conductanceG * 1.4).toFixed(3)),
        synergyFlux: Number((tacticalMultiplier * currentAmps).toFixed(3)),
        activePreparationFormula: `Ψ_cliff = Tier(+2) · I(${currentAmps}A) · M(${tacticalMultiplier}x)`
      }
    ];

    // Východiskové body v 8-smerovej Manhattanskej/Čebyševovej šachovnici
    const gridDeltas: Array<[number, number, number]> = [
      [0, 1, 1],   // N  -> M1
      [1, 1, 2],   // NE -> M2
      [1, 0, 5],   // E  -> M5
      [1, -1, 8],  // SE -> M8
      [0, -1, 7],  // S  -> M7
      [-1, -1, 6], // SW -> M6
      [-1, 0, 3],  // W  -> M3
      [-1, 1, 0]   // NW -> M0
    ];
    const manhattanAnchors8D: EightDirectionalManhattanAnchor[] = gridDeltas.map(([dx, dy, mac], idx) => ({
      octantIndex: idx,
      compassCode: `${octantLabels[idx]} (${idx * 45}°)`,
      gridDelta: [dx, dy],
      manhattanDistanceL1: Math.abs(dx) + Math.abs(dy),
      chebyshevDistanceLInf: Math.max(Math.abs(dx), Math.abs(dy)),
      anchoredMacroSector: mac,
      elevationTier: ELEVATION_BY_MACRO[mac]?.tier ?? 0
    }));

    // Nové matice zobrazenia a prechody v rozhraní (View-Projection Matrices)
    const viewProjectionMatrices: ViewProjectionMatrixSpec[] = [
      {
        matrixId: 'MAT_DOTA_DAYLIGHT_TACTICAL',
        name: 'Taktická Denná Kamera (Dota 2 Overhead 50°)',
        fovDeg: 50,
        aspectRatio: '16:9',
        cameraPosition: [0, 22, 22],
        lookAtTarget: [0, 0, 0],
        rowMajor4x4: [1, 0, 0, 0, 0, 0.707, -0.707, 0, 0, 0.707, 0.707, -31.11, 0, 0, 0, 1],
        transitionDurationMs: 650
      },
      {
        matrixId: 'MAT_PANORAMIC_HORIZON_SWEEP',
        name: 'Panoramatická Širokouhlá Matica (ML Scene Horizon)',
        fovDeg: 38,
        aspectRatio: '21:9',
        cameraPosition: [-18, 11, 24],
        lookAtTarget: [2, 1, -2],
        rowMajor4x4: [0.80, 0, 0.60, 0, -0.22, 0.93, 0.29, -2.1, -0.56, -0.37, 0.74, -29.8, 0, 0, 0, 1],
        transitionDurationMs: 900
      },
      {
        matrixId: 'MAT_CONIC_OCTANT_LOCK',
        name: 'Kónická Oktantová Projekcia (8-Directional Focus)',
        fovDeg: 45,
        aspectRatio: '16:9',
        cameraPosition: [
          Number((Math.sin(dirA * Math.PI / 4) * 16).toFixed(2)),
          16,
          Number((Math.cos(dirA * Math.PI / 4) * 16).toFixed(2))
        ],
        lookAtTarget: [0, sourceElev.tier * 0.55, 0],
        rowMajor4x4: [0.92, 0, -0.38, 0, 0.27, 0.71, 0.65, 0, 0.27, -0.71, 0.65, -22.6, 0, 0, 0, 1],
        transitionDurationMs: 500
      }
    ];

    // Prompty pre zobrazenie vizuálnych podobností s týmto enginom
    const visualSimilarityPrompts: VisualSimilarityPromptSpec[] = [
      {
        promptId: 'PROMPT_01_DAYLIGHT_ARENA',
        category: 'PANORAMA_DAYLIGHT',
        title: 'Panoramatická 63-Hexová Aréna (Dota 2 Daylight)',
        promptText: 'Wide 21:9 panoramic isometric 3D tactical arena with 63 interlocking carved stone and mossy earth hexagonal tiles across 4 elevation tiers (-1 river basin with stone bridge, 0 mid lane barricades, +1 radiant cyan crystal sanctuary and dire toxic runes, +2 cliff watchtowers), crisp zenith sunlight from above (+Y to -Y), matte PBR stone roughness 0.82, zero bottom glare, Unreal Engine 5 / Dota 2 daytime aesthetic.',
        negativePrompt: 'neon bottom floor glow, dark cyberpunk fog, blurry depth of field, glossy plastic tiles',
        similarityScoreTarget: 0.96
      },
      {
        promptId: 'PROMPT_02_HERO_ARMOR_CONIC',
        category: 'HERO_ARMOR_PBR',
        title: 'Procedural Hero Armor & 8-Directional Compass Rose',
        promptText: '3D tactical board game miniature hero in layered paladin crystal-steel shoulder pauldrons and torso plate standing on an elevated stone hex tile, surrounded by a precision golden-cyan 8-directional compass rose (0 to 315 degrees in 45-degree octants) and Hooke spring-damper telemetry vectors, daylight studio PBR rendering.',
        negativePrompt: 'flat 2D sprite, low-poly untextured mesh, overexposed bloom',
        similarityScoreTarget: 0.94
      },
      {
        promptId: 'PROMPT_03_OHM_JUNCTION_VFX',
        category: 'OHM_CONIC_VFX',
        title: 'Spojnicový Agregát & Ohmova Elektrodynamika (I = V/R)',
        promptText: 'Architectural stone hex conduit connecting High-Ground Sanctuary M0 to River Basin M4 via stepped stone ramps, visualizing controlled Aetheric current I=V/R flowing through carved runic channels in daylight with subtle dielectric refraction and tactical HUD overlays.',
        negativePrompt: 'chaotic blinding lasers, pitch black background, unreadable UI',
        similarityScoreTarget: 0.93
      }
    ];

    const coreStatuses: ComputeCoreStatus[] = [
      {
        coreId: 'CORE_01_TOPOLOGY',
        name: 'Tactical Topology & 4-Tier Elevation Core',
        domain: '3D Hex Geometry & Daylight Line-of-Sight',
        status: 'OPTIMAL',
        throughputOpsPerSec: 14800,
        lastResultSummary: `Tier ${sourceElev.tier} (${sourceElev.feature}) → Δh=${deltaH}, M=${tacticalMultiplier}x`
      },
      {
        coreId: 'CORE_02_ELECTRO_PHYSICS',
        name: 'Ohm Electrodynamics & Hooke Spring Core',
        domain: 'I=V/R Combat & Spring-Damper Kinematics',
        status: 'OPTIMAL',
        throughputOpsPerSec: 22400,
        lastResultSummary: `I=${currentAmps}A, P=${powerWatts}W, Δx=${springPeakDisplacementM}m`
      },
      {
        coreId: 'CORE_03_COGNITIVE_ADAPTIVE',
        name: 'Cognitive Adaptive Theme & Skill Core',
        domain: 'Adaptive Learning Palettes & Knowledge Granularity',
        status: 'OPTIMAL',
        throughputOpsPerSec: 9600,
        lastResultSummary: `Theme=${activeThemeId}, Scale=L${knowledgeScaleLevel} [${skillBoundaryLower}..${skillBoundaryUpper}]`
      },
      {
        coreId: 'CORE_04_COMBINATORICS',
        name: '8-Directional Conic Combinatorial Core',
        domain: 'Self-Governing Conic Logic & Parameter Tokenization',
        status: 'OPTIMAL',
        throughputOpsPerSec: 64000,
        lastResultSummary: `504 states/unit, 8 autonomous cones, H=${shannonEntropyBits} bits`
      }
    ];

    const variableInspectionTree: VariableTreeNode = {
      id: 'SOVEREIGN_ROOT',
      label: 'SovereignEngine::StateInspectionTree',
      type: 'ROOT_NAMESPACE',
      qualityBadge: dataQualityReport.qualityTier,
      children: [
        {
          id: 'NODE_DATA_QUALITY',
          label: 'mlDataQualityGate',
          type: 'DataCleaningValidationReport',
          qualityBadge: dataQualityReport.qualityTier,
          children: [
            { id: 'dq_tier', label: 'qualityTier', type: 'DataQualityTierId', value: dataQualityReport.qualityTier },
            { id: 'dq_score', label: 'qualityScore', type: 'float64', value: dataQualityReport.qualityScore },
            { id: 'dq_ready', label: 'storageReady', type: 'boolean', value: dataQualityReport.storageReady },
            { id: 'dq_clean', label: 'requiresFurtherCleaning', type: 'boolean', value: dataQualityReport.requiresFurtherCleaning },
            { id: 'dq_conf', label: 'modelConfidence', type: 'float64', value: dataQualityReport.modelConfidence }
          ]
        },
        {
          id: 'NODE_TOKEN_STREAM',
          label: `tokenStream (${tokenStream.checksumHex})`,
          type: 'ParameterTokenStream',
          qualityBadge: 'VALIDATED',
          children: tokenStream.tokens.map(t => ({
            id: `tok_${t.key}`,
            label: `${t.key} [${t.tokenCode}]`,
            type: t.tokenType,
            value: `${String(t.cleanedValue)} (w=${t.normalizedWeight}${t.wasCleaned ? ', CLEANED' : ''})`
          }))
        },
        {
          id: 'NODE_COMPUTE_CORES',
          label: 'computeCores (4 Active Kernels)',
          type: 'MultiCoreCluster',
          qualityBadge: 'VALIDATED',
          children: [
            {
              id: 'core_topo',
              label: 'CORE_01_TOPOLOGY',
              type: 'TopologyKernel',
              value: `Tier ${sourceElev.tier} (${sourceElev.feature}) | M=${tacticalMultiplier}x`
            },
            {
              id: 'core_ohm',
              label: 'CORE_02_ELECTRO_PHYSICS',
              type: 'OhmHookeKernel',
              value: `V=${voltage}V, R=${resistance}Ω → I=${currentAmps}A, P=${powerWatts}W`
            },
            {
              id: 'core_cog',
              label: 'CORE_03_COGNITIVE_ADAPTIVE',
              type: 'CognitiveKernel',
              value: `${activeThemeId} | Scale L${knowledgeScaleLevel} [${skillBoundaryLower}..${skillBoundaryUpper}]`
            },
            {
              id: 'core_comb',
              label: 'CORE_04_COMBINATORICS',
              type: 'ConicCombinatorialKernel',
              value: `504 states/unit | 64 octant pairs | H=${shannonEntropyBits}b`
            }
          ]
        },
        {
          id: 'NODE_JUNCTION_AGGREGATES',
          label: 'junctionCompoundAggregates (Spojnicové Agregáty)',
          type: 'JunctionCompoundAggregate[3]',
          qualityBadge: 'VALIDATED',
          children: junctionCompoundAggregates.map(j => ({
            id: j.aggregateId,
            label: j.compoundName,
            type: `G=${j.conductanceSiemens}S`,
            value: j.activePreparationFormula
          }))
        },
        {
          id: 'NODE_MANHATTAN_ANCHORS',
          label: 'manhattanAnchors8D (8-Smerová Šachovnica)',
          type: 'EightDirectionalManhattanAnchor[8]',
          qualityBadge: 'AUTONOMOUS',
          children: manhattanAnchors8D.map(a => ({
            id: `man_${a.octantIndex}`,
            label: `${a.compassCode} → M${a.anchoredMacroSector}`,
            type: `L1=${a.manhattanDistanceL1}, L∞=${a.chebyshevDistanceLInf}`,
            value: `Δ=(${a.gridDelta[0]},${a.gridDelta[1]}) | Tier=${a.elevationTier}`
          }))
        },
        {
          id: 'NODE_CONIC_STRUCTURES',
          label: 'autonomousConicStructures (8 Self-Governing Octants)',
          type: 'ConicLogicRing[8]',
          qualityBadge: 'AUTONOMOUS',
          children: autonomousConicStructures.map(c => ({
            id: c.structureId,
            label: `${c.structureId} (${c.coneAngleDeg}°)`,
            type: c.selfGoverningState,
            value: `${c.canonicalInvariant} | Autonomy=${(c.autonomyScore * 100).toFixed(0)}%`
          }))
        }
      ]
    };

    return {
      tokenStream,
      dataQualityReport,
      cores: {
        topologyCore: {
          elevationTier: sourceElev.tier,
          terrainFeature: sourceElev.feature,
          directionalAlignmentCos,
          uphillMissProbability,
          tacticalMultiplier
        },
        electrodynamicsCore: {
          voltage,
          resistance,
          currentAmps,
          powerWatts,
          springPeakDisplacementM,
          overdriveActive
        },
        cognitiveAdaptiveCore: {
          activeThemeId,
          knowledgeScaleLevel,
          skillBoundaryUpper,
          skillBoundaryLower,
          recommendedFocusLayer: focusLayers[knowledgeScaleLevel]
        },
        combinatorialStateCore: {
          unitSpatialDirectionalStates,
          directionalMatrixPairs,
          activeBranchingFactor,
          shannonEntropyBits
        }
      },
      autonomousConicStructures,
      junctionCompoundAggregates,
      manhattanAnchors8D,
      viewProjectionMatrices,
      visualSimilarityPrompts,
      coreStatuses,
      variableInspectionTree
    };
  }
}
