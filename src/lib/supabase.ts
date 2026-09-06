/// <reference types="vite/client" />
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { TelemetryObservation, FieldActivity, FarmAlert } from '../types';

const DEFAULT_SUPABASE_URL = 'https://wuxoulvgscbjpgyngyiw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_blRwFF9JR2iHR_TIVaEL-Q_NpdqyKF5';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
export const SUPABASE_URL = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('xyzcompany') &&
  !SUPABASE_ANON_KEY.includes('placeholder')
);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
function debouncedRefetch(key: string, fn: () => void, delayMs: number = 1500) {
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(fn, delayMs);
}

console.log(
  `%c[SUPABASE CLIENT] Initialized`,
  'color: #3ecf8e; font-weight: bold;',
  isSupabaseConfigured
    ? `Connected: ${SUPABASE_URL}`
    : 'Standby Mode (Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)'
);

// ── Column mapper: TelemetryObservation → Supabase row ──────────────────────
export const mapObsToSupabaseRow = (obs: TelemetryObservation) => ({
  id: obs.id,
  farm_id: obs.farmId,
  plot_id: obs.plotId,
  device_id: obs.deviceId,
  sensor_id: obs.sensorId,
  parameter_key: obs.parameterKey,
  display_name: obs.displayName,
  value: obs.value,
  unit: obs.unit,
  measurement_timestamp: obs.measurementTimestamp,
  received_timestamp: obs.receivedTimestamp || new Date().toISOString(),
  quality_status: obs.qualityStatus || 'VALID',
  data_source: obs.dataSource || 'SIMULATED',
  notes: obs.notes || null,
  metadata: obs.metadata || {},
});

// ── Column mapper: Supabase row → TelemetryObservation ──────────────────────
export const mapSupabaseRowToObs = (row: any): TelemetryObservation => ({
  id: row.id,
  farmId: row.farm_id,
  plotId: row.plot_id,
  deviceId: row.device_id,
  sensorId: row.sensor_id,
  parameterKey: row.parameter_key,
  displayName: row.display_name,
  value: Number(row.value),
  unit: row.unit,
  measurementTimestamp: row.measurement_timestamp,
  receivedTimestamp: row.received_timestamp,
  qualityStatus: row.quality_status as any,
  dataSource: row.data_source as any,
  notes: row.notes || undefined,
  metadata: row.metadata || {},
});

// ── Column mapper: FieldActivity ────────────────────────────────────────────
export const mapActivityToRow = (act: FieldActivity) => ({
  id: act.id,
  timestamp: act.timestamp,
  farm_id: act.farmId || null,
  plot_id: act.plotId || null,
  sensor_id: act.sensorId || null,
  event_type: act.eventType,
  title: act.title,
  description: act.description,
  severity: act.severity,
  created_by: act.createdBy || null,
  metadata: act.metadata || {},
});

export const mapRowToActivity = (row: any): FieldActivity => ({
  id: row.id,
  timestamp: row.timestamp || row.created_at,
  farmId: row.farm_id,
  plotId: row.plot_id,
  sensorId: row.sensor_id,
  eventType: row.event_type,
  title: row.title,
  description: row.description,
  severity: row.severity,
  createdBy: row.created_by,
  metadata: row.metadata || {},
});

// ── Column mapper: FarmAlert ────────────────────────────────────────────────
export const mapAlertToRow = (alert: FarmAlert) => ({
  id: alert.id,
  farm_id: alert.farmId || null,
  plot_id: alert.plotId || null,
  sensor_id: alert.sensorId || null,
  alert_type: alert.alertType,
  title: alert.title,
  message: alert.message,
  severity: alert.severity,
  status: alert.status,
  parameter_key: alert.parameterKey || null,
  value: alert.value ?? null,
  threshold: alert.threshold ?? null,
  created_at: alert.createdAt,
  resolved_at: alert.resolvedAt || null,
  resolved_by: alert.resolvedBy || null,
});

export const mapRowToAlert = (row: any): FarmAlert => ({
  id: row.id,
  farmId: row.farm_id,
  plotId: row.plot_id,
  sensorId: row.sensor_id,
  alertType: row.alert_type,
  title: row.title,
  message: row.message,
  severity: row.severity,
  status: row.status,
  parameterKey: row.parameter_key,
  value: row.value ? Number(row.value) : undefined,
  threshold: row.threshold ? Number(row.threshold) : undefined,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at,
  resolvedBy: row.resolved_by,
});

// ── Toast Event Emitter ──────────────────────────────────────────────────────
type ToastCallback = (message: string, type: 'success' | 'warning' | 'error') => void;
const toastListeners: Set<ToastCallback> = new Set();

export function onSupabaseToast(callback: ToastCallback): () => void {
  toastListeners.add(callback);
  return () => toastListeners.delete(callback);
}

function emitToast(message: string, type: 'success' | 'warning' | 'error') {
  toastListeners.forEach((cb) => cb(message, type));
}

// ── Realtime Status Tracker ──────────────────────────────────────────────────
export type RealtimeStatusType = 'Connected' | 'Disconnected' | 'Reconnecting';
let currentRealtimeStatus: RealtimeStatusType = isSupabaseConfigured
  ? 'Connected'
  : 'Disconnected';
const statusListeners: Set<(status: RealtimeStatusType) => void> = new Set();

export function onRealtimeStatusChange(
  callback: (status: RealtimeStatusType) => void
): () => void {
  statusListeners.add(callback);
  callback(currentRealtimeStatus);
  return () => statusListeners.delete(callback);
}

export function setRealtimeStatus(status: RealtimeStatusType) {
  currentRealtimeStatus = status;
  statusListeners.forEach((cb) => cb(status));
}

// ── 1. Single Observation Insert ─────────────────────────────────────────────
export async function saveTelemetryObservationToSupabase(
  obs: TelemetryObservation
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const row = mapObsToSupabaseRow(obs);
    const { error } = await supabase.from('telemetry_observations').upsert(row);
    if (error) {
      console.error('[SUPABASE WRITE ERROR]', error.message);
    } else {
      emitToast('Telemetry saved to Supabase successfully', 'success');
    }
  } catch (err: any) {
    console.error('[SUPABASE WRITE EXCEPTION]', err?.message);
  }
}

// ── 2. Batch Observation Insert ──────────────────────────────────────────────
export async function saveTelemetryBatchToSupabase(
  observations: TelemetryObservation[]
): Promise<void> {
  if (!isSupabaseConfigured || !observations || observations.length === 0) return;
  try {
    const rows = observations.map(mapObsToSupabaseRow);
    const { error } = await supabase.from('telemetry_observations').upsert(rows);
    if (error) {
      console.error('[SUPABASE BATCH WRITE ERROR]', error.message);
    } else {
      emitToast(`Telemetry saved to Supabase (${observations.length} records)`, 'success');
    }
  } catch (err: any) {
    console.error('[SUPABASE BATCH EXCEPTION]', err?.message);
  }
}

// ── 3. Realtime Multi-Table Subscription ────────────────────────────────────
export function subscribeToSupabaseMultiTable(
  onTelemetry: (obs: TelemetryObservation[]) => void,
  onFarmsUpdate?: (farms: any[]) => void,
  onPlotsUpdate?: (plots: any[]) => void,
  onSensorsUpdate?: (sensors: any[]) => void,
  onActivityUpdate?: (activity: FieldActivity) => void,
  onAlertUpdate?: (alert: FarmAlert) => void
): () => void {
  if (!isSupabaseConfigured) {
    setRealtimeStatus('Disconnected');
    return () => {};
  }

  setRealtimeStatus('Connected');
  const activeChannels: RealtimeChannel[] = [];
  const reconnectTimers: ReturnType<typeof setTimeout>[] = [];
  let destroyed = false;

  // Hydrate telemetry state
  supabase
    .from('telemetry_observations')
    .select('*')
    .order('measurement_timestamp', { ascending: false })
    .limit(100)
    .then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        onTelemetry(data.map(mapSupabaseRowToObs));
      }
    });

  let channelCounter = 0;

  function createChannel(
    baseName: string,
    table: string,
    handler: (payload: any) => void,
    logTag: string
  ): RealtimeChannel {
    const uniqueName = `${baseName}_${++channelCounter}`;
    const ch = supabase
      .channel(uniqueName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        handler
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('Connected');
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          if (destroyed) return;
          setRealtimeStatus('Reconnecting');
          supabase.removeChannel(ch);
          const idx = activeChannels.indexOf(ch);
          if (idx !== -1) activeChannels.splice(idx, 1);

          const timer = setTimeout(() => {
            if (destroyed) return;
            const newCh = createChannel(baseName, table, handler, logTag);
            activeChannels.push(newCh);
          }, 3000);

          reconnectTimers.push(timer);
        }
      });

    return ch;
  }

  activeChannels.push(
    createChannel(
      'telemetry_obs',
      'telemetry_observations',
      (payload) => {
        if (payload.new) {
          onTelemetry([mapSupabaseRowToObs(payload.new)]);
        }
      },
      'TELEMETRY'
    )
  );

  activeChannels.push(
    createChannel(
      'farms',
      'farms',
      () => {
        if (onFarmsUpdate) {
          debouncedRefetch('farms', () => {
            supabase.from('farms').select('*').then(({ data }) => { if (data) onFarmsUpdate(data); });
          });
        }
      },
      'FARMS'
    )
  );

  activeChannels.push(
    createChannel(
      'plots',
      'plots',
      () => {
        if (onPlotsUpdate) {
          debouncedRefetch('plots', () => {
            supabase.from('plots').select('*').then(({ data }) => { if (data) onPlotsUpdate(data); });
          });
        }
      },
      'PLOTS'
    )
  );

  activeChannels.push(
    createChannel(
      'sensors',
      'sensors',
      () => {
        if (onSensorsUpdate) {
          debouncedRefetch('sensors', () => {
            supabase.from('sensors').select('*').then(({ data }) => { if (data) onSensorsUpdate(data); });
          });
        }
      },
      'SENSORS'
    )
  );

  if (onActivityUpdate) {
    activeChannels.push(
      createChannel(
        'activity_log',
        'field_activity_log',
        (payload) => {
          if (payload.new) onActivityUpdate(mapRowToActivity(payload.new));
        },
        'ACTIVITY'
      )
    );
  }

  if (onAlertUpdate) {
    activeChannels.push(
      createChannel(
        'alerts',
        'alerts',
        (payload) => {
          if (payload.new) onAlertUpdate(mapRowToAlert(payload.new));
        },
        'ALERTS'
      )
    );
  }

  return () => {
    destroyed = true;
    reconnectTimers.forEach(clearTimeout);
    activeChannels.forEach((ch) => supabase.removeChannel(ch));
    activeChannels.length = 0;
    setRealtimeStatus('Disconnected');
  };
}

// ── 4. Save Farms to Supabase ────────────────────────────────────────────────
export async function saveFarmsToSupabase(farms: any[]): Promise<void> {
  if (!isSupabaseConfigured || !farms || farms.length === 0) return;
  try {
    const rows = farms.map((f) => ({
      id: f.id,
      name: f.name,
      location: f.location,
      address: f.address || null,
      owner_name: f.ownerName || f.contactPerson || null,
      contact_phone: f.contactPhone || null,
      contact_role: f.contactRole || 'Owner',
      total_area: f.totalArea,
      unit: f.unit || 'acres',
      sections_count: f.sectionsCount || 4,
      sensors_count: f.sensorsCount || 0,
      health_score: f.healthScore || 90,
    }));
    const { error } = await supabase.from('farms').upsert(rows);
    if (!error) {
      console.log(`[SUPABASE] Synced ${farms.length} farm(s) -> public.farms`);
    }
  } catch (err: any) {
    console.warn('[SUPABASE FARMS EXCEPTION]', err?.message);
  }
}

// ── 5. Delete Farm from Supabase ────────────────────────────────────────────
export async function deleteFarmFromSupabase(farmId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('farms').delete().eq('id', farmId);
    await supabase.from('plots').delete().eq('farm_id', farmId);
    await supabase.from('sensors').delete().eq('farm_id', farmId);
  } catch (err: any) {
    console.warn('[SUPABASE DELETE FARM EXCEPTION]', err?.message);
  }
}

// ── 6. Save Plots to Supabase ────────────────────────────────────────────────
export async function savePlotsToSupabase(plots: any[]): Promise<void> {
  if (!isSupabaseConfigured || !plots || plots.length === 0) return;
  try {
    const rows = plots.map((p) => ({
      id: p.id,
      farm_id: p.farmId || null,
      code: p.code,
      name: p.name,
      area: p.area,
      area_unit: p.areaUnit || 'acres',
      crop_id: p.cropId || null,
      crop_type: p.cropType || null,
      growth_stage: p.growthStage || null,
      sensor_node_id: p.sensorNodeId || null,
      irrigation_status: p.irrigationStatus || 'Scheduled',
      soil_health_score: p.soilHealthScore || 88,
      soil_moisture: p.soilMoisture || null,
      air_temp: p.airTemp || null,
      soil_ph: p.soilPh || null,
      humidity: p.humidity || 60,
      days_planted: p.daysPlanted || 0,
    }));
    await supabase.from('plots').upsert(rows);
  } catch (err: any) {
    console.warn('[SUPABASE PLOTS EXCEPTION]', err?.message);
  }
}

// ── 7. Delete Plot from Supabase ────────────────────────────────────────────
export async function deletePlotFromSupabase(plotId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('plots').delete().eq('id', plotId);
  } catch (err: any) {
    console.warn('[SUPABASE DELETE PLOT EXCEPTION]', err?.message);
  }
}

// ── 8. Save Sensors to Supabase ──────────────────────────────────────────────
export async function saveSensorsToSupabase(sensors: any[]): Promise<void> {
  if (!isSupabaseConfigured || !sensors || sensors.length === 0) return;
  try {
    const rows = sensors.map((s) => ({
      id: s.id,
      farm_id: s.farmId || null,
      plot_id: s.plotId || null,
      sensor_code: s.sensorCode || s.id,
      sensor_type: s.type || 'Sensor',
      assigned_plot_code: s.assignedPlotCode || null,
      battery_pct: s.batteryPct ?? 95,
      status: s.status || 'Online',
      last_ping: s.lastPing || new Date().toISOString(),
      current_reading: s.currentReading || null,
    }));
    await supabase.from('sensors').upsert(rows);
  } catch (err: any) {
    console.warn('[SUPABASE SENSORS EXCEPTION]', err?.message);
  }
}

// ── 9. Save Activity to Supabase ────────────────────────────────────────────
export async function saveActivityToSupabase(activity: FieldActivity): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const row = mapActivityToRow(activity);
    await supabase.from('field_activity_log').upsert(row);
  } catch (err: any) {
    console.warn('[SUPABASE ACTIVITY EXCEPTION]', err?.message);
  }
}

// ── 10. Save Alert to Supabase ──────────────────────────────────────────────
export async function saveAlertToSupabase(alert: FarmAlert): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const row = mapAlertToRow(alert);
    await supabase.from('alerts').upsert(row);
  } catch (err: any) {
    console.warn('[SUPABASE ALERT EXCEPTION]', err?.message);
  }
}

// ── 11. Update Sensor Reading ────────────────────────────────────────────────
export async function updateSensorReadingInSupabase(
  sensorId: string,
  newValue: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from('sensors')
      .update({
        current_reading: newValue,
        last_ping: new Date().toISOString(),
      })
      .eq('id', sensorId);
  } catch (err: any) {
    console.warn(`[SUPABASE SENSOR UPDATE EXCEPTION] ${sensorId}:`, err?.message);
  }
}

// ── 12. Get Table Counts ────────────────────────────────────────────────────
export async function getSupabaseTableCounts(): Promise<{
  farmsCount: number;
  plotsCount: number;
  sensorsCount: number;
  telemetryCount: number;
  activityCount: number;
  alertsCount: number;
}> {
  if (!isSupabaseConfigured) {
    return { farmsCount: 0, plotsCount: 0, sensorsCount: 0, telemetryCount: 0, activityCount: 0, alertsCount: 0 };
  }
  try {
    const [farmsRes, plotsRes, sensorsRes, telemetryRes, actRes, alertsRes] = await Promise.all([
      supabase.from('farms').select('*', { count: 'exact', head: true }),
      supabase.from('plots').select('*', { count: 'exact', head: true }),
      supabase.from('sensors').select('*', { count: 'exact', head: true }),
      supabase.from('telemetry_observations').select('*', { count: 'exact', head: true }),
      supabase.from('field_activity_log').select('*', { count: 'exact', head: true }),
      supabase.from('alerts').select('*', { count: 'exact', head: true }),
    ]);

    return {
      farmsCount: farmsRes.count ?? 0,
      plotsCount: plotsRes.count ?? 0,
      sensorsCount: sensorsRes.count ?? 0,
      telemetryCount: telemetryRes.count ?? 0,
      activityCount: actRes.count ?? 0,
      alertsCount: alertsRes.count ?? 0,
    };
  } catch {
    return { farmsCount: 0, plotsCount: 0, sensorsCount: 0, telemetryCount: 0, activityCount: 0, alertsCount: 0 };
  }
}

// ── 13. Clear All Simulated Telemetry from Supabase ─────────────────────────
export async function clearSimulatedTelemetryFromSupabase(): Promise<{ count: number; error: any }> {
  if (!isSupabaseConfigured) {
    return { count: 0, error: null };
  }
  try {
    const { error, count } = await supabase
      .from('telemetry_observations')
      .delete({ count: 'exact' })
      .eq('data_source', 'SIMULATED');
    return { count: count ?? 0, error };
  } catch (err: any) {
    console.warn('[SUPABASE CLEAR SIMULATED EXCEPTION]', err?.message);
    return { count: 0, error: err };
  }
}
