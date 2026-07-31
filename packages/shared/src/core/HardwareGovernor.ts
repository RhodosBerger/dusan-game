export type HardwareProfileTier = 'LEGACY' | 'LOW_END' | 'NOMINAL' | 'HIGH_END';

export interface PerformanceLimits {
  kclIterations: number;         // Počet cyklov pre Gauss-Seidel solver
  uniformThrottleHz: number;      // Frekvencia zápisov do GPU registrov
  maxInstancedProps: number;      // Limit pre inštancované props na gride
  enableVolumetricFog: boolean;   // Stav post-processingu pre BabylonJS / R3F
  legacyFallback?: boolean;       // Indikátor legacy fallbacku
}

export class HardwareGovernor {
  private static frameTimes: number[] = [];
  public static currentTier: HardwareProfileTier = 'HIGH_END';
  private static isLowPowerDetected: boolean = false;

  /**
   * Zmeria delta čas snímku a prepočíta profil záťaže
   */
  public static updateProfile(deltaMs: number, isLowPowerGPU?: boolean): PerformanceLimits {
    if (isLowPowerGPU !== undefined) {
      this.isLowPowerDetected = isLowPowerGPU;
    }

    this.frameTimes.push(deltaMs);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    let limits: PerformanceLimits;

    // SCENÁR A: Legacy/Slabé GPU (Nízky výkon GPU zistený alebo frame rate padá pod 30 FPS / Delta > 33.3ms)
    if (this.isLowPowerDetected || avgFrameTime > 33.3) {
      this.currentTier = 'LEGACY';
      limits = {
        kclIterations: 8,
        uniformThrottleHz: 2,
        maxInstancedProps: 5,
        enableVolumetricFog: false,
        legacyFallback: true
      };
    }
    // SCENÁR B: Slabý hardvér (Drop pod 60 FPS / Delta > 16.6ms)
    else if (avgFrameTime > 16.6) {
      this.currentTier = 'LOW_END';
      limits = {
        kclIterations: 16,         // Zníženie výpočtovej réžie solvera pre slabé CPU
        uniformThrottleHz: 5,      // Striktný throttling zápisu uniformov na 5Hz
        maxInstancedProps: 20,     // Agresívny culling biómových prvkov
        enableVolumetricFog: false // Vypnutie post-processing hmly pre odľahčenie GPU
      };
    }
    // SCENÁR C: Výkonný hardvér (Stabilný beh nad 120 FPS / Delta < 8.3ms)
    else if (avgFrameTime < 8.3) {
      this.currentTier = 'HIGH_END';
      limits = {
        kclIterations: 40,         // Maximálna presnosť a konvergencia sieci (KCL Matrix)
        uniformThrottleHz: 30,     // Plynulý real-time update uniformov (30Hz)
        maxInstancedProps: 100,    // Plná hustota voxelových časticových systémov
        enableVolumetricFog: true  // Aktivácia high-fidelity volumetrického oparu
      };
    }
    // SCENÁR D: Nominálny stav (Štandardný profil)
    else {
      this.currentTier = 'NOMINAL';
      limits = {
        kclIterations: 24,
        uniformThrottleHz: 10,       // Zhoda s tvojou Master Špecifikáciou
        maxInstancedProps: 50,
        enableVolumetricFog: true
      };
    }

    return this.validateProfile(limits, this.currentTier);
  }

  /**
   * Skontroluje a koriguje limity pre danú výkonnostnú triedu
   */
  public static validateProfile(limits: PerformanceLimits, tier: HardwareProfileTier): PerformanceLimits {
    const validated = { ...limits };
    if (tier === 'LEGACY') {
      validated.kclIterations = Math.min(8, validated.kclIterations);
      validated.uniformThrottleHz = Math.min(2, validated.uniformThrottleHz);
      validated.maxInstancedProps = Math.min(5, validated.maxInstancedProps);
      validated.enableVolumetricFog = false;
      validated.legacyFallback = true;
    } else if (tier === 'LOW_END') {
      validated.kclIterations = Math.min(16, validated.kclIterations);
      validated.uniformThrottleHz = Math.min(5, validated.uniformThrottleHz);
      validated.maxInstancedProps = Math.min(20, validated.maxInstancedProps);
      validated.enableVolumetricFog = false;
      validated.legacyFallback = false;
    } else if (tier === 'NOMINAL') {
      validated.kclIterations = Math.max(16, Math.min(24, validated.kclIterations));
      validated.uniformThrottleHz = Math.max(5, Math.min(10, validated.uniformThrottleHz));
      validated.maxInstancedProps = Math.min(50, validated.maxInstancedProps);
    } else if (tier === 'HIGH_END') {
      validated.kclIterations = Math.max(24, Math.min(40, validated.kclIterations));
      validated.uniformThrottleHz = Math.max(10, Math.min(30, validated.uniformThrottleHz));
      validated.maxInstancedProps = Math.min(100, validated.maxInstancedProps);
    }
    return validated;
  }

  /**
   * Resetuje namerané časy (užitočné pre testovacie prostredie)
   */
  public static reset(): void {
    this.frameTimes = [];
    this.currentTier = 'HIGH_END';
    this.isLowPowerDetected = false;
  }
}
