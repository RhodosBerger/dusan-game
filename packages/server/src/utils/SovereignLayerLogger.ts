export interface ArchitecturalLayerInfo {
  layerName: string;
  efficiencyRating: 'OPTIMAL' | 'MEDIUM' | 'DEGRADED';
  cpuExecutionTimeMs: number;
  memoryFootprintMb: number;
  operationalStatus: 'ACTIVE' | 'STANDBY' | 'FALLBACK';
  telemetryPayloadBytes: number;
}

export class SovereignLayerLogger {
  private static activeLayers: Map<string, ArchitecturalLayerInfo> = new Map();

  /**
   * Zaregistruje alebo aktualizuje stav architektonickej vrstvy.
   */
  public static logLayerState(info: ArchitecturalLayerInfo): void {
    this.activeLayers.set(info.layerName, info);
    
    const timestamp = new Date().toISOString();
    const statusColor = info.efficiencyRating === 'OPTIMAL' ? '\x1b[32m' : info.efficiencyRating === 'MEDIUM' ? '\x1b[33m' : '\x1b[31m';
    const resetColor = '\x1b[0m';
    
    console.log(
      `[${timestamp}] [LAYER_TELEMETRY] ${info.layerName} - ` +
      `Status: ${info.operationalStatus} | ` +
      `Efficiency: ${statusColor}${info.efficiencyRating}${resetColor} | ` +
      `CPU: ${info.cpuExecutionTimeMs.toFixed(3)}ms | ` +
      `Mem: ${info.memoryFootprintMb.toFixed(1)}MB | ` +
      `Payload: ${info.telemetryPayloadBytes}B`
    );
  }

  /**
   * Vygeneruje kompletný prehľad registrovaných vrstiev a ich metrík.
   */
  public static generatePerformanceReport(): string {
    let report = `=== SOVEREIGN ENGINE LAYER PERFORMANCE REPORT ===\n`;
    report += `Timestamp: ${new Date().toISOString()}\n`;
    report += `-------------------------------------------------\n`;

    let totalCpuTime = 0;
    let totalMem = 0;

    this.activeLayers.forEach((layer) => {
      report += `Layer: ${layer.layerName}\n`;
      report += `  - Operational Status: ${layer.operationalStatus}\n`;
      report += `  - Efficiency Rating: ${layer.efficiencyRating}\n`;
      report += `  - CPU Overhead: ${layer.cpuExecutionTimeMs} ms\n`;
      report += `  - Memory Occupied: ${layer.memoryFootprintMb} MB\n`;
      report += `  - Telemetry Payload: ${layer.telemetryPayloadBytes} Bytes\n`;
      report += `-------------------------------------------------\n`;

      totalCpuTime += layer.cpuExecutionTimeMs;
      totalMem += layer.memoryFootprintMb;
    });

    report += `Summary Metrics:\n`;
    report += `  - Combined CPU Thread Time: ${totalCpuTime.toFixed(3)} ms\n`;
    report += `  - Total Allocated Memory: ${totalMem.toFixed(2)} MB\n`;
    report += `=================================================\n`;

    return report;
  }

  /**
   * Získa informácie o konkrétnej vrstve.
   */
  public static getLayer(layerName: string): ArchitecturalLayerInfo | undefined {
    return this.activeLayers.get(layerName);
  }

  /**
   * Vymaže register vrstiev.
   */
  public static clearRegistry(): void {
    this.activeLayers.clear();
  }
}
