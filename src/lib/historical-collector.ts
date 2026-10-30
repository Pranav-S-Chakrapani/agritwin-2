import { HistoricalSensorReading, CollectorExecutionLog } from '../types';

export const HISTORICAL_STORAGE_KEY = 'agritwin_historical_sensor_readings';
export const COLLECTOR_LOGS_KEY = 'agritwin_collector_execution_logs';

// 6 months retention = 180 days in milliseconds
export const RETENTION_PERIOD_MS = 180 * 24 * 60 * 60 * 1000;

export const HISTORICAL_PARAMETERS_CONFIG = [
  { key: 'airTemp', name: 'Air Temperature', unit: '°C' },
  { key: 'humidity', name: 'Relative Humidity', unit: '%' },
  { key: 'lux', name: 'Ambient Light', unit: 'lux' },
  { key: 'soilMoisture', name: 'Soil Moisture', unit: '%' },
  { key: 'soilPH', name: 'Soil pH', unit: 'pH' },
  { key: 'soilEC', name: 'Soil EC', unit: 'µS/cm' },
  { key: 'nitrogen', name: 'Nitrogen (N)', unit: 'mg/kg' },
  { key: 'phosphorus', name: 'Phosphorus (P)', unit: 'mg/kg' },
  { key: 'potassium', name: 'Potassium (K)', unit: 'mg/kg' },
  { key: 'soilTemp', name: 'Soil Temperature', unit: '°C' },
];

/**
 * Align any timestamp to the nearest lower 5-minute bucket in UTC ISO string
 */
export function getFiveMinuteBucket(date: Date = new Date()): string {
  const d = new Date(date);
  const minutes = d.getUTCMinutes();
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  d.setUTCMinutes(roundedMinutes, 0, 0);
  return d.toISOString();
}

/**
 * Load local fallback historical records from localStorage
 */
export function getLocalHistoricalReadings(): HistoricalSensorReading[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORICAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save records locally with 6-month retention enforcement
 */
export function saveLocalHistoricalReadings(readings: HistoricalSensorReading[]): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalHistoricalReadings();
    const map = new Map<string, HistoricalSensorReading>();

    // Index existing
    existing.forEach((r) => map.set(r.id, r));
    // Upsert new
    readings.forEach((r) => map.set(r.id, r));

    // Automated 6-month retention cleanup
    const cutoff = Date.now() - RETENTION_PERIOD_MS;
    const filtered = Array.from(map.values()).filter((r) => {
      const time = new Date(r.sampled_at).getTime();
      return !isNaN(time) && time >= cutoff;
    });

    localStorage.setItem(HISTORICAL_STORAGE_KEY, JSON.stringify(filtered.slice(-5000)));
  } catch (e) {
    console.warn('[HISTORICAL STORAGE EXCEPTION]', e);
  }
}

/**
 * Format CSV content for historical sensor readings
 */
export function buildHistoricalCsv(readings: HistoricalSensorReading[]): string {
  const headers = [
    'Reading ID',
    'Node ID',
    'Sensor Parameter',
    'Parameter Key',
    'Value',
    'Unit',
    'Sampled At (5-Min UTC)',
    'Device Timestamp (UTC)',
    'Received At (UTC)',
    'Quality Status',
  ];

  const escape = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = readings.map((r) => [
    escape(r.id),
    escape(r.node_id),
    escape(r.sensor_name),
    escape(r.sensor_key),
    escape(r.sensor_value),
    escape(r.unit),
    escape(r.sampled_at),
    escape(r.device_timestamp || ''),
    escape(r.received_at),
    escape(r.quality_status),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
