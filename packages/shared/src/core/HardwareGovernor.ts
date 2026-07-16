export type HardwareProfileTier = 'LOW_END' | 'NOMINAL' | 'HIGH_END';

export interface PerformanceLimits {
  kclIterations: number;         // Počet cyklov pre Gauss-Seidel solver
  uniformThrottleHz: number;      // Frekvencia zápisov do GPU registrov
  maxInstancedProps: number;      // Limit pre inštancované props na gride
  enableVolumetricFog: boolean;   // Stav post-processingu pre BabylonJS / R3F
}

export class HardwareGovernor {
  private static frameTimes: number[] = [];
  public static currentTier: HardwareProfileTier = 'HIGH_END';

  /**
   * Zmeria delta čas snímku a prepočíta profil záťaže
   */
  public static updateProfile(deltaMs: number): PerformanceLimits {
    this.frameTimes.push(deltaMs);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    // SCENÁR A: Slabý hardvér (Drop pod 60 FPS / Delta > 16.6ms)
    if (avgFrameTime > 16.6) {
      this.currentTier = 'LOW_END';
      return {
        kclIterations: 16,         // Zníženie výpočtovej réžie solvera pre slabé CPU
        uniformThrottleHz: 5,      // Striktný throttling zápisu uniformov na 5Hz
        maxInstancedProps: 20,     // Agresívny culling biómových prvkov
        enableVolumetricFog: false // Vypnutie post-processing hmly pre odľahčenie GPU
      };
    }

    // SCENÁR B: Výkonný hardvér (Stabilný beh nad 120 FPS / Delta < 8.3ms)
    if (avgFrameTime < 8.3) {
      this.currentTier = 'HIGH_END';
      return {
        kclIterations: 40,         // Maximálna presnosť a konvergencia siete (KCL Matrix)
        uniformThrottleHz: 30,     // Plynulý real-time update uniformov (30Hz)
        maxInstancedProps: 100,    // Plná hustota voxelových časticových systémov
        enableVolumetricFog: true  // Aktivácia high-fidelity volumetrického oparu
      };
    }

    // SCENÁR C: Nominálny stav (Štandardný profil)
    this.currentTier = 'NOMINAL';
    return {
      kclIterations: 24,
      uniformThrottleHz: 10,       // Zhoda s tvojou Master Špecifikáciou
      maxInstancedProps: 50,
      enableVolumetricFog: true
    };
  }

  /**
   * Resetuje namerané časy (užitočné pre testovacie prostredie)
   */
  public static reset(): void {
    this.frameTimes = [];
    this.currentTier = 'HIGH_END';
  }
}
