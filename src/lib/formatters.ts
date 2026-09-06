/**
 * Canonical Measurement & Telemetry Formatters for AgriTwin
 * Guarantees standard unit symbols (e.g. °C, %, Lux, pH) and eliminates encoding quirks.
 */

export function formatTemperature(val?: number | null, fallback = '--'): string {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return `${Number(val).toFixed(1)}°C`;
}

export function formatMoisture(val?: number | null, fallback = '--'): string {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return `${Number(val).toFixed(1)}%`;
}

export function formatHumidity(val?: number | null, fallback = '--'): string {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return `${Number(val).toFixed(1)}%`;
}

export function formatPh(val?: number | null, fallback = '--'): string {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return `${Number(val).toFixed(2)}`;
}

export function formatLight(val?: number | null, fallback = '--'): string {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return `${Math.round(Number(val)).toLocaleString()} Lux`;
}

export function formatBattery(val?: number | null, fallback = '--'): string {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return `${Math.round(Number(val))}%`;
}
