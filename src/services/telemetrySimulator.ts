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

  // Momentum cache to ensure smooth physical drift rather than erratic noise jumps
  private sensorMomentum: Map<string, number> = new Map();

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

    // Diurnal atmospheric baseline calculation
    const nowDate = new Date();
    const hourFloat = nowDate.getHours() + nowDate.getMinutes() / 60;
    const diurnalFactor = Math.sin(((hourFloat - 8) / 24) * 2 * Math.PI); // Peak at 14:00, lowest at 02:00
    const targetDiurnalTemp = 28.0 + 8.0 * diurnalFactor; // 20.0°C to 36.0°C
    const targetDiurnalHum = 62.0 - 22.0 * diurnalFactor; // 40.0% to 84.0%

    // 2. Process each sensor with continuous inertia physics
    for (const sensor of sensorsToProcess) {
      const typeLower = (sensor.type || sensor.nodeName || '').toLowerCase();
      const oldValue = sensor.currentReading || '0';
      const numMatch = oldValue.match(/[0-9]+\.?[0-9]*/);
      let currVal = numMatch ? parseFloat(numMatch[0]) : 50;

      // Retrieve or initialize inertia momentum
      const prevMomentum = this.sensorMomentum.get(sensor.id) || 0;
      let newMomentum = prevMomentum * 0.7 + (Math.random() * 2 - 1) * 0.3; // 70% momentum retention

      let newValueNum = currVal;
      let newValueStr = '';
      let paramKey = 'soil_moisture';
      let unit = '%';
      let displayName = 'Sensor Reading';

      // ── PHYSIOLOGICALLY BOUNDED & SMOOTH DRIFT GENERATOR ─────────────────────
      if (typeLower.includes('moisture') || typeLower.includes('sm')) {
        paramKey = 'soil_moisture';
        unit = '%';
        displayName = 'Soil Moisture';
        if (currVal < 15 || currVal > 70) currVal = 48.0;
        
        // Smooth random walk: step size ±0.35%
        const delta = newMomentum * 0.35;
        // Mild mean-reverting pull toward 48%
        const pull = (48.0 - currVal) * 0.02;
        newValueNum = Math.max(15.0, Math.min(70.0, currVal + delta + pull));
        newValueStr = `${newValueNum.toFixed(1)}%`;
      } else if (typeLower.includes('temp') || typeLower.includes('at')) {
        paramKey = 'air_temperature';
        unit = '°C';
        displayName = 'Air Temperature';
        if (currVal < 18 || currVal > 38) currVal = targetDiurnalTemp;

        // Step size ±0.25°C, smoothly tracking diurnal solar curve
        const delta = newMomentum * 0.25;
        const pull = (targetDiurnalTemp - currVal) * 0.05;
        newValueNum = Math.max(18.0, Math.min(38.0, currVal + delta + pull));
        newValueStr = `${newValueNum.toFixed(1)}°C`;
      } else if (typeLower.includes('hum')) {
        paramKey = 'humidity';
        unit = '%';
        displayName = 'Atmospheric Humidity';
        if (currVal < 30 || currVal > 90) currVal = targetDiurnalHum;

        const delta = newMomentum * 0.45;
        const pull = (targetDiurnalHum - currVal) * 0.05;
        newValueNum = Math.max(30.0, Math.min(90.0, currVal + delta + pull));
        newValueStr = `${newValueNum.toFixed(1)}%`;
      } else if (typeLower.includes('ph')) {
        paramKey = 'soil_ph';
        unit = 'pH';
        displayName = 'Soil pH';
        if (currVal < 5.5 || currVal > 7.8) currVal = 6.6;

        // pH changes very slowly in soil: step ±0.02
        const delta = newMomentum * 0.02;
        const pull = (6.6 - currVal) * 0.01;
        newValueNum = Math.max(5.50, Math.min(7.80, currVal + delta + pull));
        newValueStr = `${newValueNum.toFixed(2)} pH`;
      } else if (typeLower.includes('nitrogen') || typeLower.includes('n_') || typeLower.endsWith('_n')) {
        paramKey = 'nitrogen';
        unit = 'mg/kg';
        displayName = 'Nitrogen';
        if (currVal < 30 || currVal > 220) currVal = 85;
        const delta = newMomentum * 1.5;
        newValueNum = Math.max(30, Math.min(220, currVal + delta));
        newValueStr = `${Math.round(newValueNum)} mg/kg`;
      } else if (typeLower.includes('phosphor') || typeLower.includes('p_') || typeLower.endsWith('_p')) {
        paramKey = 'phosphorus';
        unit = 'mg/kg';
        displayName = 'Phosphorus';
        if (currVal < 15 || currVal > 110) currVal = 42;
        const delta = newMomentum * 0.8;
        newValueNum = Math.max(15, Math.min(110, currVal + delta));
        newValueStr = `${Math.round(newValueNum)} mg/kg`;
      } else if (typeLower.includes('potass') || typeLower.includes('k_') || typeLower.endsWith('_k')) {
        paramKey = 'potassium';
        unit = 'mg/kg';
        displayName = 'Potassium';
        if (currVal < 30 || currVal > 200) currVal = 110;
        const delta = newMomentum * 1.2;
        newValueNum = Math.max(30, Math.min(200, currVal + delta));
        newValueStr = `${Math.round(newValueNum)} mg/kg`;
      } else {
        paramKey = 'sensor_reading';
        unit = '';
        displayName = sensor.nodeName || 'Sensor';
        const delta = newMomentum * 0.5;
        newValueNum = Math.max(0, Number((currVal + delta).toFixed(1)));
        newValueStr = `${newValueNum}`;
      }

      this.sensorMomentum.set(sensor.id, newMomentum);

      // Track updated sensor locally
      updatedSensors.push({
        ...sensor,
        currentReading: newValueStr,
        lastPing: nowIso
      });

      // Map to proper relational IDs
      const plot = plots.find(p => p.id === sensor.plotId || p.code === sensor.assignedPlotCode);
      const farmId = sensor.farmId || plot?.farmId || 'farm_iiit_dharwad';
      const plotId = sensor.plotId || plot?.id || 'plot_dharwad_01';
      const mqttTopic = `farm/${farmId}/plot/${plotId}/sensor/${sensor.id}/reading`;

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
        notes: `Simulated update via ${mqttTopic}`,
        metadata: {
          mqttTopic,
          source: 'SIMULATED',
          ingestPath: mqttTopic
        }
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
