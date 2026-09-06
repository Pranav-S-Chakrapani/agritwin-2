import { PlotBed, Crop, IoTSensor, TelemetryObservation } from '../types';
import { getParameterDefinition } from '../lib/parameters';
import { saveTelemetryBatchToSupabase, updateSensorReadingInSupabase, supabase, isSupabaseConfigured } from '../lib/supabase';

// ─── SIMULATION INTERVAL (10 Seconds) ───────────────────────────────────────
export const DEMO_TELEMETRY_INTERVAL_MS = 10000;

class TelemetrySimulatorService {
  private timerId: any = null;
  private intervalMs: number = DEMO_TELEMETRY_INTERVAL_MS;
  private isRunning: boolean = false;
  private simulationSessionId: string = `sim_session_${Date.now()}`;
  private getPlotsFn: (() => PlotBed[]) | null = null;
  private getCropsFn: (() => Crop[]) | null = null;
  private getSensorsFn: (() => IoTSensor[]) | null = null;
  private onGeneratedFn: ((observations: TelemetryObservation[], updatedSensors?: IoTSensor[]) => void) | null = null;
  private lastCycleTime: number | null = null;

  public getSessionId(): string {
    return this.simulationSessionId;
  }

  public isSimulating(): boolean {
    return this.isRunning;
  }

  public getLastCycleTime(): number | null {
    return this.lastCycleTime;
  }

  public getIntervalMs(): number {
    return this.intervalMs;
  }

  public setIntervalMs(ms: number) {
    this.intervalMs = Math.max(5000, ms);
    if (this.isRunning) {
      this.stop();
    }
  }

  public start(
    getPlots: () => PlotBed[],
    getCrops: () => Crop[],
    getSensors?: () => IoTSensor[],
    onGenerated?: (observations: TelemetryObservation[], updatedSensors?: IoTSensor[]) => void
  ) {
    this.getPlotsFn = getPlots;
    this.getCropsFn = getCrops;
    this.getSensorsFn = getSensors || null;
    this.onGeneratedFn = onGenerated || null;

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.simulationSessionId = `sim_session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    console.log(`TelemetrySimulator STARTED [Session: ${this.simulationSessionId}, Interval: ${this.intervalMs}ms]`);

    // Run first generation cycle immediately after 1 second delay
    setTimeout(() => {
      if (this.isRunning) {
        this.generateAndPersistCycle(this.onGeneratedFn || undefined);
      }
    }, 1000);

    // Set 10-second recurring timer
    this.timerId = setInterval(() => {
      if (this.isRunning) {
        this.generateAndPersistCycle(this.onGeneratedFn || undefined);
      }
    }, this.intervalMs);
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.isRunning) {
      this.isRunning = false;
      console.log('TelemetrySimulator STOPPED cleanly.');
    }
  }

  public async triggerCycle(onGenerated?: (observations: TelemetryObservation[], updatedSensors?: IoTSensor[]) => void) {
    return this.generateAndPersistCycle(onGenerated || this.onGeneratedFn || undefined);
  }

  private async generateAndPersistCycle(
    onGenerated?: (observations: TelemetryObservation[], updatedSensors?: IoTSensor[]) => void
  ) {
    let sensorsToProcess: IoTSensor[] = [];

    // 1. Prioritize in-memory sensors from store
    if (this.getSensorsFn) {
      sensorsToProcess = this.getSensorsFn() || [];
    }

    // Fallback: Fetch sensors from public.sensors if memory is empty and Supabase is configured
    if (sensorsToProcess.length === 0 && isSupabaseConfigured) {
      try {
        const { data: dbSensors, error } = await supabase.from('sensors').select('*');
        if (!error && dbSensors && dbSensors.length > 0) {
          sensorsToProcess = dbSensors.map((row: any) => ({
            id: row.id,
            farmId: row.farm_id,
            plotId: row.plot_id,
            sensorCode: row.sensor_code,
            nodeName: `${row.sensor_type || 'Sensor'} [${row.sensor_code || row.id}]`,
            assignedPlotCode: row.assigned_plot_code || '',
            type: row.sensor_type,
            sensorTypes: [row.sensor_type],
            batteryPct: row.battery_pct ?? 95,
            status: row.status || 'Online',
            lastPing: row.last_ping || new Date().toISOString(),
            currentReading: row.current_reading || ''
          }));
        }
      } catch (e) {
        console.warn('TelemetrySimulator: Could not fetch public.sensors directly, using fallback.');
      }
    }

    if (!sensorsToProcess || sensorsToProcess.length === 0) {
      console.log('TelemetrySimulator: No active sensors found to simulate.');
      return;
    }

    const plots = this.getPlotsFn ? this.getPlotsFn() : [];
    const generatedObs: TelemetryObservation[] = [];
    const updatedSensors: IoTSensor[] = [];
    const nowIso = new Date().toISOString();
    this.lastCycleTime = Date.now();

    // 2. Process each sensor and generate new realistic value based on sensor type
    for (const sensor of sensorsToProcess) {
      const typeLower = (sensor.type || sensor.nodeName || '').toLowerCase();
      const oldValue = sensor.currentReading || '0';
      // Robust extraction of positive numeric reading (preventing delta sign bleed)
      const numMatch = oldValue.match(/[0-9]+\.?[0-9]*/);
      let currVal = numMatch ? parseFloat(numMatch[0]) : 50;

      let newValueNum = currVal;
      let newValueStr = '';
      let paramKey = 'soil_moisture';
      let unit = '%';
      let displayName = 'Sensor Reading';

      // ── TYPE-BASED SENSOR VALUE GENERATION ────────────────────────────────────
      // soil_moisture: current ± random(-3, +3), bounded [15, 95]%
      // temperature: current ± random(-1, +1), bounded [15, 45]°C
      // humidity: current ± random(-2, +2), bounded [30, 98]%
      // soil_ph: current ± random(-0.15, +0.15), bounded [5.5, 8.5] pH
      // nitrogen: current ± random(-5, +5), bounded [20, 250] mg/kg
      // phosphorus: current ± random(-3, +3), bounded [10, 120] mg/kg
      // potassium: current ± random(-4, +4), bounded [20, 220] mg/kg

      if (typeLower.includes('moisture') || typeLower.includes('sm')) {
        paramKey = 'soil_moisture';
        unit = '%';
        displayName = 'Soil Moisture';
        if (currVal < 10 || currVal > 100) currVal = 55.0;
        const delta = (Math.random() * 4) - 2;
        newValueNum = Math.max(15, Math.min(95, currVal + delta));
        newValueStr = `${newValueNum.toFixed(1)}%`;
      } else if (typeLower.includes('temp') || typeLower.includes('at')) {
        paramKey = 'air_temperature';
        unit = '°C';
        displayName = 'Air Temperature';
        if (currVal < 5 || currVal > 55) currVal = 26.5;
        const delta = (Math.random() * 1.6) - 0.8;
        newValueNum = Math.max(15, Math.min(42, currVal + delta));
        newValueStr = `${newValueNum.toFixed(1)}°C`;
      } else if (typeLower.includes('hum')) {
        paramKey = 'humidity';
        unit = '%';
        displayName = 'Atmospheric Humidity';
        if (currVal < 10 || currVal > 100) currVal = 65.0;
        const delta = (Math.random() * 3) - 1.5;
        newValueNum = Math.max(30, Math.min(95, currVal + delta));
        newValueStr = `${newValueNum.toFixed(1)}%`;
      } else if (typeLower.includes('ph')) {
        paramKey = 'soil_ph';
        unit = 'pH';
        displayName = 'Soil pH';
        if (currVal < 4.0 || currVal > 10.0) currVal = 6.8;
        const delta = (Math.random() * 0.2) - 0.1;
        newValueNum = Math.max(5.5, Math.min(8.2, currVal + delta));
        newValueStr = `${newValueNum.toFixed(2)} pH`;
      } else if (typeLower.includes('nitrogen') || typeLower.includes('n_') || typeLower.endsWith('_n')) {
        paramKey = 'nitrogen';
        unit = 'mg/kg';
        displayName = 'Nitrogen';
        if (currVal < 5 || currVal > 400) currVal = 85;
        const delta = (Math.random() * 8) - 4;
        newValueNum = Math.max(20, Math.min(250, currVal + delta));
        newValueStr = `${Math.round(newValueNum)} mg/kg`;
      } else if (typeLower.includes('phosphor') || typeLower.includes('p_') || typeLower.endsWith('_p')) {
        paramKey = 'phosphorus';
        unit = 'mg/kg';
        displayName = 'Phosphorus';
        if (currVal < 5 || currVal > 200) currVal = 42;
        const delta = (Math.random() * 4) - 2;
        newValueNum = Math.max(10, Math.min(120, currVal + delta));
        newValueStr = `${Math.round(newValueNum)} mg/kg`;
      } else if (typeLower.includes('potass') || typeLower.includes('k_') || typeLower.endsWith('_k')) {
        paramKey = 'potassium';
        unit = 'mg/kg';
        displayName = 'Potassium';
        if (currVal < 5 || currVal > 350) currVal = 110;
        const delta = (Math.random() * 6) - 3;
        newValueNum = Math.max(20, Math.min(220, currVal + delta));
        newValueStr = `${Math.round(newValueNum)} mg/kg`;
      } else {
        // Fallback
        paramKey = 'sensor_reading';
        unit = '';
        displayName = sensor.nodeName || 'Sensor';
        const delta = (Math.random() * 2) - 1;
        newValueNum = Math.max(0, Number((currVal + delta).toFixed(1)));
        newValueStr = `${newValueNum}`;
      }

      // Track updated sensor locally
      updatedSensors.push({
        ...sensor,
        currentReading: newValueStr,
        lastPing: nowIso
      });

      // 4. Insert matching telemetry record
      const plot = plots.find(p => p.id === sensor.plotId || p.code === sensor.assignedPlotCode);
      const farmId = sensor.farmId || plot?.farmId || 'farm_iiit_dharwad';
      const plotId = sensor.plotId || plot?.id || 'plot_dharwad_01';

      generatedObs.push({
        id: `obs_${Date.now()}_${sensor.id}_${Math.random().toString(36).substring(2, 6)}`,
        farmId,
        plotId,
        deviceId: sensor.sensorCode || sensor.id,
        sensorId: sensor.id,
        parameterKey: paramKey,
        displayName,
        value: Number(newValueNum.toFixed(2)),
        unit,
        measurementTimestamp: nowIso,
        receivedTimestamp: nowIso,
        qualityStatus: 'VALID',
        dataSource: 'SIMULATED',
        notes: `Simulated update for ${sensor.id}`
      });
    }

    // Persist batch of telemetry records to public.telemetry_observations
    if (generatedObs.length > 0) {
      try {
        await saveTelemetryBatchToSupabase(generatedObs);
      } catch (err: any) {
        console.warn('TelemetrySimulator: Telemetry batch write notice:', err?.message);
      }
    }

    // Persist updated sensors in a single batch upsert
    if (isSupabaseConfigured && updatedSensors.length > 0) {
      const sensorDbRows = updatedSensors.map((s) => ({
  id: s.id,
  farm_id: s.farmId ?? null,
  plot_id: s.plotId ?? null,
  sensor_code: s.sensorCode ?? s.id,
  sensor_type: s.type ?? 'unknown',
  assigned_plot_code: s.assignedPlotCode ?? null,
  current_reading: s.currentReading ?? null,
  last_ping: s.lastPing ?? new Date().toISOString(),
}));
      Promise.resolve(supabase.from('sensors').upsert(sensorDbRows))
        .then(() => {})
        .catch((err: any) => console.warn('TelemetrySimulator: Sensors batch update notice:', err?.message));
    }

    if (onGenerated) {
      onGenerated(generatedObs, updatedSensors);
    }
  }
}

export const telemetrySimulator = new TelemetrySimulatorService();
export default telemetrySimulator;
