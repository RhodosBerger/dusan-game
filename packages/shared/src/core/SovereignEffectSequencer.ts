import catalogData from '../data/assetCatalog.json';

export interface RenderedFrameOutput {
  assetId: string;
  filterId: string;
  resolvedColor: string; // RGB/Hex representation
  finalOpacity: number;
  effectMagnitude: number;
}

/**
 * Procedurally simulates graphics composition filters (blend modes, opacity, and bloom) on vector/raster shapes.
 */
export class SovereignEffectSequencer {
  /**
   * Processes a vector or raster asset through a specified filter configuration.
   */
  public static processFrame(assetId: string, filterId: string, baseIntensity: number): RenderedFrameOutput {
    const vector = catalogData.vectors.find(v => v.id === assetId);
    const raster = catalogData.rasters.find(r => r.id === assetId);
    const filter = catalogData.filters.find(f => f.id === filterId);

    if ((!vector && !raster) || !filter) {
      return {
        assetId,
        filterId,
        resolvedColor: "#ffffff",
        finalOpacity: 1.0,
        effectMagnitude: 0.0
      };
    }

    let resolvedColor = "#ffffff";
    let finalOpacity = 1.0;
    let effectMagnitude = 0.0;

    const baseColor = vector ? vector.strokeColor : "#888888";

    if (filter.type === 'bloom') {
      // Additive bloom increases brightness/intensity
      effectMagnitude = (filter.intensity ?? 1.0) * baseIntensity;
      resolvedColor = baseColor; // Retain neon colors
      finalOpacity = Math.min(1.0, baseIntensity * 1.5);
    } else if (filter.type === 'tint' && filter.colorMultiplier) {
      // Multiply overlay darkens and colors the base shape (e.g. charcoal scorched dirt)
      effectMagnitude = (filter.opacity ?? 1.0) * baseIntensity;
      const r = Math.round(255 * (filter.colorMultiplier[0] ?? 1.0) * baseIntensity);
      const g = Math.round(255 * (filter.colorMultiplier[1] ?? 1.0) * baseIntensity);
      const b = Math.round(255 * (filter.colorMultiplier[2] ?? 1.0) * baseIntensity);
      resolvedColor = `rgb(${r},${g},${b})`;
      finalOpacity = filter.opacity ?? 1.0;
    }

    return {
      assetId,
      filterId,
      resolvedColor,
      finalOpacity,
      effectMagnitude
    };
  }
}
