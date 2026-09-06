import { FarmAlert, AlertType, AlertSeverity, PlotBed, IoTSensor } from '../types';

export interface AlertRule {
  alertType: AlertType;
  parameterKey: string;
  condition: (value: number) => boolean;
  severity: AlertSeverity;
  title: (plotName: string, value: number, unit: string) => string;
  message: (plotName: string, value: number, unit: string, threshold: string) => string;
  threshold: number;
}

export const ALERT_RULES: AlertRule[] = [
  {
    alertType: 'low_soil_moisture',
    parameterKey: 'soil_moisture',
    condition: (v) => v < 25,
    severity: 'critical',
    title: (plot) => `🚨 Critical: Low Soil Moisture — ${plot}`,
    message: (plot, v) => `Soil moisture on ${plot} dropped to ${v.toFixed(1)}% (below critical 25%). Urgent irrigation required.`,
    threshold: 25,
  },
  {
    alertType: 'low_soil_moisture',
    parameterKey: 'soil_moisture',
    condition: (v) => v >= 25 && v < 35,
    severity: 'warning',
    title: (plot) => `⚠️ Warning: Low Soil Moisture — ${plot}`,
    message: (plot, v) => `Soil moisture on ${plot} is at ${v.toFixed(1)}%. Schedule irrigation soon.`,
    threshold: 35,
  },
  {
    alertType: 'high_temperature',
    parameterKey: 'air_temperature',
    condition: (v) => v > 40,
    severity: 'critical',
    title: (plot) => `🌡️ Critical: Extreme Heat Stress — ${plot}`,
    message: (plot, v) => `Temperature on ${plot} reached ${v.toFixed(1)}°C (above critical 40°C threshold). Heat damage imminent.`,
    threshold: 40,
  },
  {
    alertType: 'high_temperature',
    parameterKey: 'air_temperature',
    condition: (v) => v > 35 && v <= 40,
    severity: 'warning',
    title: (plot) => `🌡️ Warning: High Temperature — ${plot}`,
    message: (plot, v) => `Temperature on ${plot} is at ${v.toFixed(1)}°C. Monitor ventilation and soil drying.`,
    threshold: 35,
  },
  {
    alertType: 'low_humidity',
    parameterKey: 'humidity',
    condition: (v) => v < 25,
    severity: 'warning',
    title: (plot) => `💧 Warning: Low Humidity — ${plot}`,
    message: (plot, v) => `Atmospheric humidity on ${plot} is ${v.toFixed(1)}% (below recommended 25%).`,
    threshold: 25,
  },
  {
    alertType: 'abnormal_ph',
    parameterKey: 'soil_ph',
    condition: (v) => v < 5.5,
    severity: 'warning',
    title: (plot) => `🧪 Warning: Acidic Soil — ${plot}`,
    message: (plot, v) => `Soil pH on ${plot} is ${v.toFixed(2)} — acidic (below 5.5). Lime conditioning suggested.`,
    threshold: 5.5,
  },
  {
    alertType: 'abnormal_ph',
    parameterKey: 'soil_ph',
    condition: (v) => v > 8.0,
    severity: 'warning',
    title: (plot) => `🧪 Warning: Alkaline Soil — ${plot}`,
    message: (plot, v) => `Soil pH on ${plot} is ${v.toFixed(2)} — alkaline (above 8.0). Soil treatment recommended.`,
    threshold: 8.0,
  },
];

const SENSOR_OFFLINE_THRESHOLD_MS = 10 * 60 * 1000;

export function evaluatePlotAlerts(
  plot: PlotBed,
  existingAlerts: FarmAlert[]
): FarmAlert[] {
  const newAlerts: FarmAlert[] = [];
  const now = new Date().toISOString();

  const readings: Record<string, number> = {
    soil_moisture: plot.soilMoisture,
    air_temperature: plot.airTemp,
    soil_ph: plot.soilPh,
  };
  if (plot.humidity !== undefined) {
    readings['humidity'] = plot.humidity;
  }

  for (const rule of ALERT_RULES) {
    const value = readings[rule.parameterKey];
    if (value === undefined || value === null) continue;

    if (rule.condition(value)) {
      const duplicate = existingAlerts.find(
        (a) =>
          a.status === 'active' &&
          a.alertType === rule.alertType &&
          a.plotId === plot.id &&
          a.parameterKey === rule.parameterKey
      );
      if (duplicate) continue;

      const unitMap: Record<string, string> = {
        soil_moisture: '%',
        air_temperature: '°C',
        humidity: '%',
        soil_ph: ' pH',
      };

      const unit = unitMap[rule.parameterKey] || '';

      newAlerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        farmId: plot.farmId,
        plotId: plot.id,
        alertType: rule.alertType,
        title: rule.title(plot.name || plot.code, value, unit),
        message: rule.message(plot.name || plot.code, value, unit, rule.threshold.toString()),
        severity: rule.severity,
        status: 'active',
        parameterKey: rule.parameterKey,
        value,
        threshold: rule.threshold,
        createdAt: now,
      });
    }
  }

  return newAlerts;
}

export function evaluateSensorAlerts(
  sensor: IoTSensor,
  existingAlerts: FarmAlert[]
): FarmAlert[] {
  const newAlerts: FarmAlert[] = [];

  if (sensor.status === 'Offline') {
    const duplicate = existingAlerts.find(
      (a) =>
        a.status === 'active' &&
        a.alertType === 'sensor_offline' &&
        a.sensorId === sensor.id
    );
    if (!duplicate) {
      const displayName = sensor.nodeName || sensor.name || sensor.sensorType || sensor.id;
      newAlerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        farmId: sensor.farmId,
        plotId: sensor.plotId,
        sensorId: sensor.id,
        alertType: 'sensor_offline',
        title: `📡 Sensor Offline: ${displayName}`,
        message: `Sensor unit ${sensor.id} (${displayName}) is offline. Check battery and wireless transceiver.`,
        severity: 'warning',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
  }

  const lastPingMs = sensor.lastPing ? new Date(sensor.lastPing).getTime() : 0;
  if (lastPingMs > 0 && Date.now() - lastPingMs > SENSOR_OFFLINE_THRESHOLD_MS) {
    const duplicate = existingAlerts.find(
      (a) =>
        a.status === 'active' &&
        a.alertType === 'data_missing' &&
        a.sensorId === sensor.id
    );
    if (!duplicate) {
      const displayName = sensor.nodeName || sensor.name || sensor.sensorType || sensor.id;
      newAlerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        farmId: sensor.farmId,
        plotId: sensor.plotId,
        sensorId: sensor.id,
        alertType: 'data_missing',
        title: `📡 No Data Broadcast: ${displayName}`,
        message: `No telemetry from sensor ${sensor.id} (${displayName}) for > 10 minutes.`,
        severity: 'warning',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return newAlerts;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getSeverityDot(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500';
    case 'warning': return 'bg-amber-500';
    case 'info': return 'bg-blue-500';
    default: return 'bg-slate-400';
  }
}
