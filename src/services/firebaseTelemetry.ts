import {
  getFirebaseRealtimeDb,
  isFirebaseConfigured,
  ref,
  onValue,
  off,
} from '../lib/firebase-client';
import { TelemetryObservation, IoTSensor } from '../types';
import {
  SensorNode,
  NodeOperationalStatus,
  TelemetryFieldKey,
  getCalibratingNodes,
  setNodeCalibrating,
  getAllNodeFieldProvisionalMap,
  getNodeFieldProvisional,
  setNodeFieldProvisional,
  DEFAULT_FIELD_PROVISIONAL_MAP,
} from '../config/sensorMapping';

export interface RawFirebaseNodeData {
  airTemp?: number;
  temperature?: number;
  temp?: number;
  humidity?: number;
  hum?: number;
  lux?: number;
  light?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  n?: number;
  p?: number;
  k?: number;
  soilEC?: number;
  soil_ec?: number;
  ec?: number;
  soilMoisture?: number;
  soil_moisture?: number;
  moisture?: number;
  soilPH?: number;
  soilPh?: number;
  soil_ph?: number;
  ph?: number;
  soilTemp?: number;
  soil_temp?: number;
  battery?: number;
  timestamp?: number | string;
  [key: string]: unknown;
}

export interface RawFirebaseNodePayload {
  data?: RawFirebaseNodeData;
  last_updated?: number | string;
  status?: string;
  farm_id?: string;
  farmId?: string;
  plot_id?: string;
  plotId?: string;
  [key: string]: unknown;
}

export type LiveConnectionState = 'LIVE' | 'Connected' | 'Connecting...' | 'Disconnected' | 'Error' | 'Not Configured';

export interface EvaluatedNodeStatus {
  isLive: boolean;
  statusMode: NodeOperationalStatus;
  statusText: string;
  badgeColor: 'success' | 'warning' | 'muted' | 'danger' | 'info';
  ageMs: number;
  isCalibrating: boolean;
  relativeTimeText: string;
  sourceClassification: 'physical' | 'simulated' | 'unknown';
  fieldProvisionalFlags: Record<TelemetryFieldKey, boolean>;
}

export type SensorNodesCallback = (
  nodes: Record<string, SensorNode>,
  observations: TelemetryObservation[],
  updatedSensors: IoTSensor[]
) => void;

// 30 Seconds threshold (2x the 15-second reporting interval with network delay allowance)
export const FRESHNESS_THRESHOLD_MS = 30 * 1000;

class FirebaseTelemetryService {
  private activeListeners: Map<string, { ref: any; handler: any }> = new Map();
  private connectionState: LiveConnectionState = isFirebaseConfigured ? 'Connecting...' : 'Not Configured';
  private statusListeners: Set<(status: LiveConnectionState) => void> = new Set();
  private lastUpdateTimestamp: string | null = null;
  private currentSensorNodes: Record<string, SensorNode> = {};
  private calibratingFlags: Record<string, boolean> = getCalibratingNodes();
  private fieldProvisionalFlags: Record<string, Record<TelemetryFieldKey, boolean>> = getAllNodeFieldProvisionalMap();
  private batchTimeout: any = null;
  private pendingObservations: TelemetryObservation[] = [];
  private pendingSensors: IoTSensor[] = [];
  
  // Deduplication cache to prevent re-inserting the same reading twice
  private lastLoggedFirebaseTimestamps: Map<string, string | number> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('agritwin:calibration_change', (e: any) => {
        if (e.detail) {
          this.calibratingFlags = e.detail;
          this.recomputeAllNodeStatuses();
        }
      });
      window.addEventListener('agritwin:field_accuracy_change', (e: any) => {
        if (e.detail) {
          this.fieldProvisionalFlags = e.detail;
          this.recomputeAllNodeStatuses();
        }
      });
    }
  }

  public isConfigured(): boolean {
    return isFirebaseConfigured;
  }

  public getConnectionStatus(): LiveConnectionState {
    return this.connectionState;
  }

  public getLastUpdateTimestamp(): string | null {
    return this.lastUpdateTimestamp;
  }

  public getCurrentSensorNodes(): Record<string, SensorNode> {
    return this.currentSensorNodes;
  }

  public getCalibratingState(nodeId: string): boolean {
    return this.calibratingFlags[nodeId] ?? true;
  }

  public setCalibratingState(nodeId: string, calibrating: boolean) {
    this.calibratingFlags = setNodeCalibrating(nodeId, calibrating);
    this.recomputeAllNodeStatuses();
  }

  public getFieldProvisionalState(nodeId: string, fieldKey: TelemetryFieldKey): boolean {
    return getNodeFieldProvisional(nodeId, fieldKey);
  }

  public setFieldProvisionalState(nodeId: string, fieldKey: TelemetryFieldKey, isProvisional: boolean) {
    this.fieldProvisionalFlags = setNodeFieldProvisional(nodeId, fieldKey, isProvisional);
    this.recomputeAllNodeStatuses();
  }

  public onStatusChange(callback: (status: LiveConnectionState) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.connectionState);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setConnectionState(status: LiveConnectionState) {
    if (this.connectionState !== status) {
      this.connectionState = status;
      this.statusListeners.forEach((cb) => cb(status));
    }
  }

  /**
   * Evaluates true live status using dual signals (status field + last_updated timestamp age)
   * plus calibration state and field-level provisional accuracy flags.
   * Strictly separates live physical, simulated, stale, offline, and unknown.
   */
  public evaluateNodeLiveness(
    nodeId: string,
    rawStatus: string | undefined,
    lastUpdatedIso: string | undefined,
    thresholdMs: number = FRESHNESS_THRESHOLD_MS,
    rawVal?: any
  ): EvaluatedNodeStatus {
    const now = Date.now();
    const updatedTime = lastUpdatedIso ? new Date(lastUpdatedIso).getTime() : 0;
    const hasValidTime = updatedTime > 0 && !isNaN(updatedTime);
    const ageMs = hasValidTime ? Math.max(0, now - updatedTime) : Infinity;

    const normalizedStatus = (rawStatus || '').toLowerCase().trim();
    const isCalibrating = this.calibratingFlags[nodeId] ?? true;
    const nodeFieldFlags = this.fieldProvisionalFlags[nodeId] || { ...DEFAULT_FIELD_PROVISIONAL_MAP };

    // Explicit source classification
    let sourceClassification: 'physical' | 'simulated' | 'unknown' = 'unknown';
    if (rawVal?.source === 'SIMULATED' || rawVal?.isSimulated || rawVal?.data_source === 'SIMULATED') {
      sourceClassification = 'simulated';
    } else if (hasValidTime && ageMs <= thresholdMs) {
      sourceClassification = 'physical';
    } else if (hasValidTime) {
      sourceClassification = 'unknown';
    }

    let relativeTimeText = 'No data recorded';
    if (hasValidTime && ageMs < Infinity) {
      const sec = Math.floor(ageMs / 1000);
      if (sec < 5) relativeTimeText = 'Updated just now';
      else if (sec < 60) relativeTimeText = `Updated ${sec}s ago`;
      else {
        const min = Math.floor(sec / 60);
        if (min < 60) relativeTimeText = `Last seen ${min}m ago`;
        else {
          const hrs = Math.floor(min / 60);
          if (hrs < 24) relativeTimeText = `Last seen ${hrs}h ago`;
          else relativeTimeText = `Last seen ${Math.floor(hrs / 24)}d ago`;
        }
      }
    }

    // 0. No data recorded
    if (!hasValidTime) {
      return {
        isLive: false,
        statusMode: 'NO_DATA',
        statusText: 'No Data',
        badgeColor: 'muted',
        ageMs,
        isCalibrating: false,
        relativeTimeText: 'No data recorded',
        sourceClassification: 'unknown',
        fieldProvisionalFlags: nodeFieldFlags,
      };
    }

    // 1. Explicit offline from device flag
    if (normalizedStatus === 'offline' || normalizedStatus === 'inactive' || normalizedStatus === 'dead') {
      return {
        isLive: false,
        statusMode: 'OFFLINE',
        statusText: 'Offline',
        badgeColor: 'muted',
        ageMs,
        isCalibrating,
        relativeTimeText,
        sourceClassification,
        fieldProvisionalFlags: nodeFieldFlags,
      };
    }

    // 2. Simulated data
    if (sourceClassification === 'simulated') {
      return {
        isLive: ageMs <= thresholdMs,
        statusMode: 'SIMULATED',
        statusText: 'Simulated',
        badgeColor: 'info',
        ageMs,
        isCalibrating: false,
        relativeTimeText,
        sourceClassification: 'simulated',
        fieldProvisionalFlags: nodeFieldFlags,
      };
    }

    // 3. Stale timestamp (> 30 seconds)
    if (ageMs > thresholdMs) {
      const isVeryOld = ageMs > 60 * 60 * 1000;
      return {
        isLive: false,
        statusMode: isVeryOld ? 'OFFLINE' : 'STALE',
        statusText: isVeryOld ? 'Offline · Stale' : 'Stale (>30s)',
        badgeColor: isVeryOld ? 'muted' : 'warning',
        ageMs,
        isCalibrating,
        relativeTimeText,
        sourceClassification: 'unknown',
        fieldProvisionalFlags: nodeFieldFlags,
      };
    }

    // 4. Actively transmitting physical sensor in calibration mode
    if (isCalibrating) {
      return {
        isLive: true,
        statusMode: 'CALIBRATING',
        statusText: 'Calibrating',
        badgeColor: 'warning',
        ageMs,
        isCalibrating: true,
        relativeTimeText,
        sourceClassification: 'physical',
        fieldProvisionalFlags: nodeFieldFlags,
      };
    }

    // 5. Genuinely transmitting physical live sensor
    return {
      isLive: true,
      statusMode: 'LIVE',
      statusText: 'Live',
      badgeColor: 'success',
      ageMs,
      isCalibrating: false,
      relativeTimeText,
      sourceClassification: 'physical',
      fieldProvisionalFlags: nodeFieldFlags,
    };
  }

  private recomputeAllNodeStatuses() {
    Object.keys(this.currentSensorNodes).forEach((nodeId) => {
      const node = this.currentSensorNodes[nodeId];
      if (node) {
        const liveness = this.evaluateNodeLiveness(nodeId, node.raw?.status, node.lastUpdated, FRESHNESS_THRESHOLD_MS, node.raw);
        node.isOnline = liveness.isLive;
        node.statusMode = liveness.statusMode;
        node.freshnessStatus = liveness.statusMode;
        node.sourceClassification = liveness.sourceClassification;
        node.isCalibrating = liveness.isCalibrating;
        node.fieldProvisionalFlags = liveness.fieldProvisionalFlags;
      }
    });
  }

  /**
   * Subscribes to scoped /Node_X paths for mapped sensor nodes.
   * Debounces burst updates from multiple nodes to prevent UI freezing.
   */
  public subscribeToMappedNodes(
    nodeIds: string[],
    callback: SensorNodesCallback,
    farmId: string = 'farm_iiit_dharwad'
  ): () => void {
    const db = getFirebaseRealtimeDb();

    if (!db || !isFirebaseConfigured) {
      this.setConnectionState('Not Configured');
      return () => {};
    }

    this.unsubscribeAll();
    this.setConnectionState('Connecting...');

    const targetNodes = nodeIds.length > 0 ? nodeIds : ['Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7'];

    const dispatchBatch = () => {
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
      const obsToEmit = [...this.pendingObservations];
      const sensorsToEmit = [...this.pendingSensors];
      this.pendingObservations = [];
      this.pendingSensors = [];

      // Determine overall live state
      const hasLiveNode = Object.values(this.currentSensorNodes).some((n) => n.isOnline);
      this.setConnectionState(hasLiveNode ? 'LIVE' : 'Connected');

      callback(this.currentSensorNodes, obsToEmit, sensorsToEmit);
    };

    targetNodes.forEach((nodeId) => {
      const nodePath = `/${nodeId}`;
      const nodeDbRef = ref(db, nodePath);

      const handler = (snapshot: any) => {
        const val = snapshot.val();
        this.lastUpdateTimestamp = new Date().toISOString();

        if (val) {
          const parsed = this.normalizeSingleNode(nodeId, val, farmId);
          this.currentSensorNodes[nodeId] = parsed.sensorNode;
          if (parsed.observations.length > 0) {
            this.pendingObservations.push(...parsed.observations);
          }
          this.pendingSensors.push(parsed.iotSensor);

          // Batch rapid updates within 50ms window
          if (this.batchTimeout) clearTimeout(this.batchTimeout);
          this.batchTimeout = setTimeout(dispatchBatch, 50);
        }
      };

      onValue(nodeDbRef, handler, (error) => {
        console.error(`[Firebase] Error listening to ${nodePath}:`, error);
        this.setConnectionState('Error');
      });

      this.activeListeners.set(nodePath, { ref: nodeDbRef, handler });
    });

    return () => {
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
      this.unsubscribeAll();
    };
  }

  /**
   * Normalize single node entry, producing observations for ALL 10 TELEMETRY FIELDS
   * with strict deduplication based on device timestamp and explicit source classification.
   */
  public normalizeSingleNode(nodeId: string, rawVal: any, farmId: string) {
    const metrics: RawFirebaseNodeData = (rawVal && rawVal.data && typeof rawVal.data === 'object') ? rawVal.data : (rawVal || {});
    const nowIso = new Date().toISOString();

    const airTemp = metrics.airTemp !== undefined ? Number(metrics.airTemp) : (metrics.temperature !== undefined ? Number(metrics.temperature) : undefined);
    const humidity = metrics.humidity !== undefined ? Number(metrics.humidity) : (metrics.hum !== undefined ? Number(metrics.hum) : undefined);
    const lux = metrics.lux !== undefined ? Number(metrics.lux) : (metrics.light !== undefined ? Number(metrics.light) : undefined);
    const soilMoisture = metrics.soilMoisture !== undefined ? Number(metrics.soilMoisture) : (metrics.soil_moisture !== undefined ? Number(metrics.soil_moisture) : undefined);
    const soilPH = metrics.soilPH !== undefined ? Number(metrics.soilPH) : (metrics.soilPh !== undefined ? Number(metrics.soilPh) : undefined);
    const soilEC = metrics.soilEC !== undefined ? Number(metrics.soilEC) : (metrics.soil_ec !== undefined ? Number(metrics.soil_ec) : undefined);
    const nitrogen = metrics.nitrogen !== undefined ? Number(metrics.nitrogen) : (metrics.n !== undefined ? Number(metrics.n) : undefined);
    const phosphorus = metrics.phosphorus !== undefined ? Number(metrics.phosphorus) : (metrics.p !== undefined ? Number(metrics.p) : undefined);
    const potassium = metrics.potassium !== undefined ? Number(metrics.potassium) : (metrics.k !== undefined ? Number(metrics.k) : undefined);
    const soilTemp = metrics.soilTemp !== undefined ? Number(metrics.soilTemp) : (metrics.soil_temp !== undefined ? Number(metrics.soil_temp) : undefined);

    const rawTime = metrics.timestamp || rawVal.last_updated || rawVal.timestamp;
    let lastUpdatedStr = nowIso;
    let timeKey: string | number = nowIso;
    let hasValidTime = false;

    if (typeof rawTime === 'number') {
      const d = new Date(rawTime);
      if (!isNaN(d.getTime())) {
        lastUpdatedStr = d.toISOString();
        timeKey = rawTime;
        hasValidTime = true;
      }
    } else if (typeof rawTime === 'string' && rawTime.length > 5) {
      const d = new Date(rawTime);
      if (!isNaN(d.getTime())) {
        lastUpdatedStr = d.toISOString();
        timeKey = rawTime;
        hasValidTime = true;
      }
    }

    // Dual-signal liveness check with explicit source classification
    const liveness = this.evaluateNodeLiveness(
      nodeId,
      rawVal.status || metrics.status,
      hasValidTime ? lastUpdatedStr : undefined,
      FRESHNESS_THRESHOLD_MS,
      rawVal
    );

    const sensorNode: SensorNode = {
      id: nodeId,
      name: rawVal.name || `Node ${nodeId.replace(/^Node_/i, '')}`,
      airTemp: airTemp !== undefined && !isNaN(airTemp) ? Number(airTemp.toFixed(1)) : undefined,
      humidity: humidity !== undefined && !isNaN(humidity) ? Number(humidity.toFixed(1)) : undefined,
      lux: lux !== undefined && !isNaN(lux) ? Math.round(lux) : undefined,
      nitrogen: nitrogen !== undefined && !isNaN(nitrogen) ? Number(nitrogen.toFixed(1)) : undefined,
      phosphorus: phosphorus !== undefined && !isNaN(phosphorus) ? Number(phosphorus.toFixed(1)) : undefined,
      potassium: potassium !== undefined && !isNaN(potassium) ? Number(potassium.toFixed(1)) : undefined,
      soilEC: soilEC !== undefined && !isNaN(soilEC) ? Number(soilEC.toFixed(1)) : undefined,
      soilMoisture: soilMoisture !== undefined && !isNaN(soilMoisture) ? Number(soilMoisture.toFixed(1)) : undefined,
      soilPH: soilPH !== undefined && !isNaN(soilPH) ? Number(soilPH.toFixed(2)) : undefined,
      soilTemp: soilTemp !== undefined && !isNaN(soilTemp) ? Number(soilTemp.toFixed(1)) : undefined,
      battery: metrics.battery !== undefined ? Number(metrics.battery) : 95,
      isOnline: liveness.isLive,
      statusMode: liveness.statusMode,
      freshnessStatus: liveness.statusMode,
      sourceClassification: liveness.sourceClassification,
      isCalibrating: liveness.isCalibrating,
      fieldProvisionalFlags: liveness.fieldProvisionalFlags,
      lastUpdated: hasValidTime ? lastUpdatedStr : undefined,
      raw: rawVal,
    };

    // Deduplication check: only emit persistent history observations if this timestamp hasn't been logged yet
    const previousLogged = this.lastLoggedFirebaseTimestamps.get(nodeId);
    const isNewReading = previousLogged !== timeKey && hasValidTime;
    const observations: TelemetryObservation[] = [];

    const plotId = rawVal.plot_id || 'plot_dharwad_01';

    if (isNewReading) {
      this.lastLoggedFirebaseTimestamps.set(nodeId, timeKey);

      const timestampEpoch = typeof timeKey === 'number' ? timeKey : new Date(lastUpdatedStr).getTime();

      const fullSnapshot = {
        airTemp: sensorNode.airTemp,
        humidity: sensorNode.humidity,
        lux: sensorNode.lux,
        soilMoisture: sensorNode.soilMoisture,
        soilPH: sensorNode.soilPH,
        soilEC: sensorNode.soilEC,
        nitrogen: sensorNode.nitrogen,
        phosphorus: sensorNode.phosphorus,
        potassium: sensorNode.potassium,
        soilTemp: sensorNode.soilTemp,
        statusMode: liveness.statusMode,
        sourceClassification: liveness.sourceClassification,
        rawTimestamp: timeKey,
      };

      const obsSource = liveness.sourceClassification === 'simulated'
        ? 'SIMULATED'
        : (liveness.isLive ? 'LIVE_SENSOR' : 'SENSOR');

      const createObs = (
        paramKey: string,
        displayName: string,
        value: number,
        unit: string,
        isProvisional: boolean
      ): TelemetryObservation => ({
        id: `obs_fb_${nodeId}_${paramKey}_${timestampEpoch}`,
        farmId,
        plotId,
        deviceId: nodeId,
        sensorId: nodeId,
        parameterKey: paramKey,
        displayName,
        value,
        unit,
        measurementTimestamp: lastUpdatedStr,
        receivedTimestamp: nowIso,
        qualityStatus: isProvisional ? 'PROVISIONAL' : (liveness.isLive ? 'VALID' : 'WARNING'),
        dataSource: obsSource,
        sourceClassification: liveness.sourceClassification,
        metadata: fullSnapshot,
      });

      // 1. Soil Moisture
      if (sensorNode.soilMoisture !== undefined) {
        observations.push(createObs('soil_moisture', 'Soil Moisture', sensorNode.soilMoisture, '%', Boolean(liveness.fieldProvisionalFlags.soilMoisture)));
      }

      // 2. Air Temperature
      if (sensorNode.airTemp !== undefined) {
        observations.push(createObs('air_temperature', 'Air Temperature', sensorNode.airTemp, '°C', Boolean(liveness.fieldProvisionalFlags.airTemp)));
      }

      // 3. Humidity
      if (sensorNode.humidity !== undefined) {
        observations.push(createObs('humidity', 'Humidity', sensorNode.humidity, '%', Boolean(liveness.fieldProvisionalFlags.humidity)));
      }

      // 4. Soil pH
      if (sensorNode.soilPH !== undefined) {
        observations.push(createObs('soil_ph', 'Soil pH', sensorNode.soilPH, 'pH', Boolean(liveness.fieldProvisionalFlags.soilPH)));
      }

      // 5. Ambient Light
      if (sensorNode.lux !== undefined) {
        observations.push(createObs('lux', 'Ambient Light', sensorNode.lux, 'lux', Boolean(liveness.fieldProvisionalFlags.lux)));
      }

      // 6. Soil EC
      if (sensorNode.soilEC !== undefined) {
        observations.push(createObs('soil_ec', 'Soil EC', sensorNode.soilEC, 'µS/cm', Boolean(liveness.fieldProvisionalFlags.soilEC)));
      }

      // 7. Nitrogen
      if (sensorNode.nitrogen !== undefined) {
        observations.push(createObs('nitrogen', 'Nitrogen', sensorNode.nitrogen, 'mg/kg', Boolean(liveness.fieldProvisionalFlags.nitrogen)));
      }

      // 8. Phosphorus
      if (sensorNode.phosphorus !== undefined) {
        observations.push(createObs('phosphorus', 'Phosphorus', sensorNode.phosphorus, 'mg/kg', Boolean(liveness.fieldProvisionalFlags.phosphorus)));
      }

      // 9. Potassium
      if (sensorNode.potassium !== undefined) {
        observations.push(createObs('potassium', 'Potassium', sensorNode.potassium, 'mg/kg', Boolean(liveness.fieldProvisionalFlags.potassium)));
      }

      // 10. Soil Temperature
      if (sensorNode.soilTemp !== undefined) {
        observations.push(createObs('soil_temp', 'Soil Temperature', sensorNode.soilTemp, '°C', Boolean(liveness.fieldProvisionalFlags.soilTemp)));
      }
    }

    const iotSensor: IoTSensor = {
      id: `sensor_${nodeId}`,
      farmId,
      plotId,
      sensorCode: nodeId,
      nodeName: `Sensor ${nodeId}`,
      assignedPlotCode: rawVal.plot_id || 'Plot 1',
      sensorTypes: ['Soil Moisture', 'Air Temperature', 'Humidity', 'Soil pH', 'Soil EC', 'NPK'],
      status: liveness.isLive ? 'Online' : 'Offline',
      batteryPct: sensorNode.battery || 95,
      lastPing: hasValidTime ? lastUpdatedStr : 'No ping recorded',
      currentReading: sensorNode.soilMoisture !== undefined ? `${sensorNode.soilMoisture}%` : 'N/A',
    };

    return { sensorNode, observations, iotSensor };
  }

  /**
   * Subscribe to sensor nodes (alias for subscribeToMappedNodes)
   */
  public subscribeToSensorNodes(callback: SensorNodesCallback, farmId?: string): () => void {
    const storedMappings = localStorage.getItem('agritwin_sensor_node_mappings');
    let mappedNodes: string[] = ['Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7'];
    if (storedMappings) {
      try {
        const parsed = JSON.parse(storedMappings);
        const storedIds = parsed.map((m: any) => m.firebase_node_id);
        if (storedIds.length > 0) {
          const allNodes = new Set([...storedIds, 'Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7']);
          mappedNodes = Array.from(allNodes);
        }
      } catch (e) {
        // fallback
      }
    }
    return this.subscribeToMappedNodes(mappedNodes, callback, farmId || 'farm_iiit_dharwad');
  }

  /**
   * Publish a live reading directly to Firebase RTDB
   */
  public async publishLiveSensorReading(farmId: string, plotId: string, sensorId: string, data: any): Promise<boolean> {
    const db = getFirebaseRealtimeDb();
    if (!db) return false;
    try {
      const nodePath = `/${sensorId}/data`;
      const nodeDbRef = ref(db, nodePath);
      const { set } = await import('firebase/database');
      await set(nodeDbRef, {
        ...data,
        timestamp: Date.now(),
      });
      return true;
    } catch (e) {
      console.error('[Firebase] Error publishing live reading:', e);
      return false;
    }
  }

  /**
   * Cleanly unsubscribe all active Firebase listeners
   */
  public unsubscribeAll() {
    this.activeListeners.forEach(({ ref: dbRef }) => {
      try {
        off(dbRef);
      } catch (e) {
        console.warn('[Firebase] Error unsubscribing listener:', e);
      }
    });
    this.activeListeners.clear();
  }
}

export const firebaseTelemetry = new FirebaseTelemetryService();
export default firebaseTelemetry;
