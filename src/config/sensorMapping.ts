/**
 * Configurable Sensor and Zone Mapping
 * IIIT Dharwad Agricultural Research Farm
 */

export type NodeOperationalStatus = 'LIVE' | 'OFFLINE' | 'CALIBRATING';

export type TelemetryFieldKey =
  | 'airTemp'
  | 'humidity'
  | 'lux'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium'
  | 'soilEC'
  | 'soilMoisture'
  | 'soilPH'
  | 'soilTemp';

export interface FieldAccuracyConfig {
  isProvisional: boolean;
  provisionalReason?: string;
}

export interface SensorNode {
  id: string; // e.g. "Node_1", "Node_2", "Node_3"
  name?: string;
  airTemp?: number;
  humidity?: number;
  lux?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  soilEC?: number;
  soilMoisture?: number;
  soilPH?: number;
  soilTemp?: number;
  battery?: number;
  isOnline: boolean;
  statusMode?: NodeOperationalStatus; // 'LIVE' | 'OFFLINE' | 'CALIBRATING'
  isCalibrating?: boolean;
  fieldProvisionalFlags?: Record<TelemetryFieldKey, boolean>;
  lastUpdated?: string;
  raw?: Record<string, any>;
}

export type ZoneHealthStatus = 'Normal' | 'Attention' | 'Critical';

/**
 * Initial Zone to Sensor Node Mapping.
 */
export const DEFAULT_ZONE_SENSOR_MAPPING: Record<string, string[]> = {
  'zone-1': ['Node_1'],
  'zone-2': ['Node_2'],
  'zone-3': ['Node_3'],
  'zone-4': ['Node_4'],
};

/**
 * Default node-level calibration flag (Defaults to true while client repositions)
 */
export const DEFAULT_CALIBRATING_NODES: Record<string, boolean> = {
  'Node_1': true,
  'Node_2': true,
  'Node_3': true,
  'Node_4': true,
  'Node_5': true,
  'Node_6': true,
  'Node_7': true,
};

/**
 * Default Field-Level Granular Calibration & Accuracy Config:
 * The 5 fields (nitrogen, phosphorus, potassium, soilEC, soilMoisture) derive from
 * a single placeholder formula (soilMoisture = nitrogen/10, N=P=K=soilEC),
 * so they default to PROVISIONAL=true.
 * The other 5 fields (airTemp, humidity, lux, soilPH, soilTemp) default to TRUSTED=false.
 */
export const DEFAULT_FIELD_PROVISIONAL_MAP: Record<TelemetryFieldKey, boolean> = {
  nitrogen: true,
  phosphorus: true,
  potassium: true,
  soilEC: true,
  soilMoisture: true,
  airTemp: false,
  humidity: false,
  lux: false,
  soilPH: false,
  soilTemp: false,
};

export const CALIBRATION_STORAGE_KEY = 'agritwin_node_calibration_flags';
export const FIELD_ACCURACY_STORAGE_KEY = 'agritwin_node_field_accuracy_flags';

export function getCalibratingNodes(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CALIBRATING_NODES, ...JSON.parse(stored) };
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_CALIBRATING_NODES;
}

export function setNodeCalibrating(nodeId: string, calibrating: boolean): Record<string, boolean> {
  const current = getCalibratingNodes();
  const updated = { ...current, [nodeId]: calibrating };
  try {
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('agritwin:calibration_change', { detail: updated }));
  } catch (e) {
    // ignore
  }
  return updated;
}

/**
 * Get field-level provisional status mapping for all nodes
 */
export function getAllNodeFieldProvisionalMap(): Record<string, Record<TelemetryFieldKey, boolean>> {
  try {
    const stored = localStorage.getItem(FIELD_ACCURACY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (e) {
    // fallback
  }

  // Initialize all 7 nodes with default field accuracy config
  const initial: Record<string, Record<TelemetryFieldKey, boolean>> = {};
  ['Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7'].forEach((nodeId) => {
    initial[nodeId] = { ...DEFAULT_FIELD_PROVISIONAL_MAP };
  });
  return initial;
}

/**
 * Get field-level provisional status for a specific node and field
 */
export function getNodeFieldProvisional(nodeId: string, fieldKey: TelemetryFieldKey): boolean {
  const all = getAllNodeFieldProvisionalMap();
  if (all[nodeId] && all[nodeId][fieldKey] !== undefined) {
    return all[nodeId][fieldKey];
  }
  return DEFAULT_FIELD_PROVISIONAL_MAP[fieldKey] ?? false;
}

/**
 * Toggle or set field-level provisional status for a specific node
 */
export function setNodeFieldProvisional(
  nodeId: string,
  fieldKey: TelemetryFieldKey,
  isProvisional: boolean
): Record<string, Record<TelemetryFieldKey, boolean>> {
  const all = getAllNodeFieldProvisionalMap();
  const currentForNode = all[nodeId] || { ...DEFAULT_FIELD_PROVISIONAL_MAP };
  const updatedForNode = { ...currentForNode, [fieldKey]: isProvisional };
  const updatedAll = { ...all, [nodeId]: updatedForNode };

  try {
    localStorage.setItem(FIELD_ACCURACY_STORAGE_KEY, JSON.stringify(updatedAll));
    window.dispatchEvent(new CustomEvent('agritwin:field_accuracy_change', { detail: updatedAll }));
  } catch (e) {
    // ignore
  }
  return updatedAll;
}

/**
 * Configurable Agronomic Thresholds for Zone Health Calculation
 */
export interface MetricThreshold {
  criticalLow?: number;
  warningLow?: number;
  normalMin?: number;
  normalMax?: number;
  warningHigh?: number;
  criticalHigh?: number;
}

export interface SensorThresholdsConfig {
  soilMoisture: MetricThreshold;
  airTemp: MetricThreshold;
  humidity: MetricThreshold;
  soilEC: MetricThreshold;
  nitrogen: MetricThreshold;
  phosphorus: MetricThreshold;
  potassium: MetricThreshold;
  lux: MetricThreshold;
}

export const DEFAULT_SENSOR_THRESHOLDS: SensorThresholdsConfig = {
  soilMoisture: {
    criticalLow: 15,
    warningLow: 25,
    normalMin: 35,
    normalMax: 65,
    warningHigh: 75,
    criticalHigh: 85,
  },
  airTemp: {
    criticalLow: 10,
    warningLow: 18,
    normalMin: 22,
    normalMax: 32,
    warningHigh: 36,
    criticalHigh: 42,
  },
  humidity: {
    criticalLow: 20,
    warningLow: 40,
    normalMin: 50,
    normalMax: 80,
    warningHigh: 88,
    criticalHigh: 95,
  },
  soilEC: {
    warningLow: 10,
    normalMin: 20,
    normalMax: 120,
    warningHigh: 150,
    criticalHigh: 200,
  },
  nitrogen: {
    criticalLow: 15,
    warningLow: 30,
    normalMin: 40,
    normalMax: 120,
  },
  phosphorus: {
    criticalLow: 15,
    warningLow: 30,
    normalMin: 40,
    normalMax: 120,
  },
  potassium: {
    criticalLow: 15,
    warningLow: 30,
    normalMin: 40,
    normalMax: 120,
  },
  lux: {
    warningLow: 500,
    normalMin: 1500,
    normalMax: 50000,
    warningHigh: 80000,
  },
};

/**
 * Dynamically evaluate zone health from real sensor readings based on thresholds
 */
export function calculateZoneHealth(
  sensor: Partial<SensorNode> | undefined,
  thresholds: SensorThresholdsConfig = DEFAULT_SENSOR_THRESHOLDS
): {
  status: ZoneHealthStatus;
  reasons: string[];
} {
  if (!sensor) {
    return { status: 'Normal', reasons: [] };
  }

  const reasons: string[] = [];
  let isCritical = false;
  let isAttention = false;

  // 1. Soil Moisture Evaluation
  if (sensor.soilMoisture !== undefined && sensor.soilMoisture !== null) {
    const sm = sensor.soilMoisture;
    const t = thresholds.soilMoisture;
    if (t.criticalLow !== undefined && sm <= t.criticalLow) {
      isCritical = true;
      reasons.push(`Critically low soil moisture (${sm}%)`);
    } else if (t.criticalHigh !== undefined && sm >= t.criticalHigh) {
      isCritical = true;
      reasons.push(`Excessive waterlogging detected (${sm}%)`);
    } else if (t.warningLow !== undefined && sm <= t.warningLow) {
      isAttention = true;
      reasons.push(`Soil moisture below optimal (${sm}%)`);
    } else if (t.warningHigh !== undefined && sm >= t.warningHigh) {
      isAttention = true;
      reasons.push(`High soil moisture (${sm}%)`);
    }
  }

  // 2. Air Temperature Evaluation
  if (sensor.airTemp !== undefined && sensor.airTemp !== null) {
    const temp = sensor.airTemp;
    const t = thresholds.airTemp;
    if (t.criticalHigh !== undefined && temp >= t.criticalHigh) {
      isCritical = true;
      reasons.push(`Heat stress alert (${temp}°C)`);
    } else if (t.criticalLow !== undefined && temp <= t.criticalLow) {
      isCritical = true;
      reasons.push(`Frost / low temperature danger (${temp}°C)`);
    } else if (t.warningHigh !== undefined && temp >= t.warningHigh) {
      isAttention = true;
      reasons.push(`High air temperature (${temp}°C)`);
    } else if (t.warningLow !== undefined && temp <= t.warningLow) {
      isAttention = true;
      reasons.push(`Low air temperature (${temp}°C)`);
    }
  }

  // 3. Humidity Evaluation
  if (sensor.humidity !== undefined && sensor.humidity !== null) {
    const hum = sensor.humidity;
    const t = thresholds.humidity;
    if (t.criticalHigh !== undefined && hum >= t.criticalHigh) {
      isCritical = true;
      reasons.push(`Extreme humidity, fungal hazard (${hum}%)`);
    } else if (t.warningHigh !== undefined && hum >= t.warningHigh) {
      isAttention = true;
      reasons.push(`Elevated humidity (${hum}%)`);
    }
  }

  if (isCritical) return { status: 'Critical', reasons };
  if (isAttention) return { status: 'Attention', reasons };
  return { status: 'Normal', reasons };
}
