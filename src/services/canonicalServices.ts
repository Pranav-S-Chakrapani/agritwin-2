import { PlotBed, IoTSensor, Crop } from '../types';

/**
 * ─── CANONICAL PLOT SERVICE ──────────────────────────────────────────────────
 * Single Source of Truth for plot querying and aggregation across all views.
 */
export class PlotService {
  /**
   * Returns all plot beds partitioned for a specific farmland.
   */
  static getPlotsForFarm(plots: PlotBed[], farmId?: string | null): PlotBed[] {
    if (!farmId) return plots;
    return plots.filter((p) => p.farmId === farmId);
  }

  /**
   * Returns a specific plot bed by ID or code.
   */
  static getPlotById(plots: PlotBed[], plotIdOrCode: string): PlotBed | undefined {
    return plots.find((p) => p.id === plotIdOrCode || p.code === plotIdOrCode);
  }

  /**
   * Computes total allocated acreage for a specific farm.
   */
  static getTotalAllocatedArea(plots: PlotBed[], farmId?: string | null): number {
    const farmPlots = this.getPlotsForFarm(plots, farmId);
    return Number(farmPlots.reduce((sum, p) => sum + (Number(p.area) || 0), 0).toFixed(2));
  }
}

/**
 * ─── CANONICAL SENSOR SERVICE ────────────────────────────────────────────────
 * Single Source of Truth for live sensor counts and status querying.
 * Performs live calculations without relying on un-synced cached counters.
 */
export class SensorService {
  /**
   * Returns all sensors deployed to a specific farmland.
   */
  static getSensorsForFarm(sensors: IoTSensor[], farmId?: string | null): IoTSensor[] {
    if (!farmId) return sensors;
    return sensors.filter((s) => s.farmId === farmId);
  }

  /**
   * Returns all sensors assigned to a specific plot.
   */
  static getSensorsForPlot(sensors: IoTSensor[], plotId: string): IoTSensor[] {
    return sensors.filter((s) => s.plotId === plotId || s.assignedPlotCode === plotId);
  }

  /**
   * Calculates live sensor counts (Total, Active, Offline) for a specific farm.
   */
  static getSensorCountsForFarm(sensors: IoTSensor[], farmId?: string | null): { total: number; active: number; offline: number } {
    const farmSensors = this.getSensorsForFarm(sensors, farmId);
    const active = farmSensors.filter((s) => (s.status || '').toLowerCase() === 'online').length;
    const offline = farmSensors.filter((s) => (s.status || '').toLowerCase() === 'offline').length;
    return {
      total: farmSensors.length,
      active,
      offline: offline || Math.max(0, farmSensors.length - active),
    };
  }

  /**
   * Calculates global sensor counts across all farms.
   */
  static getGlobalSensorCounts(sensors: IoTSensor[]): { total: number; active: number; offline: number } {
    const active = sensors.filter((s) => (s.status || '').toLowerCase() === 'online').length;
    const offline = sensors.filter((s) => (s.status || '').toLowerCase() === 'offline').length;
    return {
      total: sensors.length,
      active,
      offline: offline || Math.max(0, sensors.length - active),
    };
  }
}

/**
 * ─── CANONICAL CROP SERVICE ──────────────────────────────────────────────────
 * Single Source of Truth for growth stages and phenological determinations.
 */
export class CropService {
  /**
   * Resolves the canonical growth stage for a plot.
   * If a static growthStage is explicitly defined on the plot, it is used;
   * otherwise, calculates based on biophysical growth elapsed percentage.
   */
  static getCurrentStageForPlot(plot?: PlotBed | null, crop?: Crop | null): string {
    if (!plot) return 'Vegetative';
    
    // Explicit growth stage takes priority
    if (plot.growthStage && plot.growthStage.trim().length > 0) {
      return plot.growthStage.trim();
    }

    // Biophysical fallback
    const days = plot.daysPlanted || 30;
    const maxDays = crop?.growthDurationDays || 100;
    const pct = Math.min(100, Math.round((days / maxDays) * 100));

    if (pct < 20) return 'Germination';
    if (pct < 45) return 'Vegetative';
    if (pct < 70) return 'Flowering';
    if (pct < 90) return 'Fruiting';
    return 'Harvest Ready';
  }

  /**
   * Maps any stage string to a standardized SVG canopy state.
   */
  static getCanopyStage(stageStr: string): 'vegetative' | 'flowering' | 'fruiting' | 'harvest' {
    const lower = (stageStr || '').toLowerCase();
    if (lower.includes('flower') || lower.includes('silking') || lower.includes('tassel')) {
      return 'flowering';
    }
    if (lower.includes('fruit') || lower.includes('pod') || lower.includes('ear')) {
      return 'fruiting';
    }
    if (lower.includes('harvest') || lower.includes('matur') || lower.includes('ripen')) {
      return 'harvest';
    }
    return 'vegetative';
  }
}
