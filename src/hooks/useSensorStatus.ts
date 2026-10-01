import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAgriStore } from '../context/AgriStore';
import {
  firebaseTelemetry,
  EvaluatedNodeStatus,
  FRESHNESS_THRESHOLD_MS,
} from '../services/firebaseTelemetry';
import {
  SensorNode,
  NodeOperationalStatus,
  TelemetryFieldKey,
  DEFAULT_FIELD_PROVISIONAL_MAP,
} from '../config/sensorMapping';

/**
 * Shared Hook: Evaluates real-time live/offline/calibrating status for a single Firebase node
 * with field-level provisional accuracy controls.
 */
export function useSensorStatus(nodeId: string): EvaluatedNodeStatus & {
  node: SensorNode | undefined;
  toggleCalibrating: () => void;
  toggleFieldProvisional: (fieldKey: TelemetryFieldKey) => void;
} {
  const { sensorNodes } = useAgriStore();
  const [ticker, setTicker] = useState(0);

  // 1-second heartbeat ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => (prev + 1) % 10000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const node = sensorNodes?.[nodeId];

  const evaluated = useMemo(() => {
    const rawStatus = node?.raw?.status;
    const lastUpdated = node?.lastUpdated;
    return firebaseTelemetry.evaluateNodeLiveness(nodeId, rawStatus, lastUpdated, FRESHNESS_THRESHOLD_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, node?.lastUpdated, node?.raw?.status, ticker]);

  const toggleCalibrating = useCallback(() => {
    const currentState = firebaseTelemetry.getCalibratingState(nodeId);
    firebaseTelemetry.setCalibratingState(nodeId, !currentState);
  }, [nodeId]);

  const toggleFieldProvisional = useCallback((fieldKey: TelemetryFieldKey) => {
    const currentState = firebaseTelemetry.getFieldProvisionalState(nodeId, fieldKey);
    firebaseTelemetry.setFieldProvisionalState(nodeId, fieldKey, !currentState);
  }, [nodeId]);

  return {
    ...evaluated,
    node,
    toggleCalibrating,
    toggleFieldProvisional,
  };
}

export interface AllNodesStatusSummary {
  nodesList: Array<SensorNode & { evaluated: EvaluatedNodeStatus }>;
  totalCount: number;
  liveCount: number;
  offlineCount: number;
  calibratingCount: number;
}

/**
 * Shared Hook: Aggregates all 7 Firebase hardware nodes (Node_1 to Node_7)
 * with unified status and field-level provisional flags.
 */
export function useAllSensorsStatus(): AllNodesStatusSummary {
  const { sensorNodes } = useAgriStore();
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => (prev + 1) % 10000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const nodeIds = ['Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7'];
    let liveCount = 0;
    let offlineCount = 0;
    let calibratingCount = 0;

    const nodesList = nodeIds.map((nodeId, idx) => {
      const existing = sensorNodes?.[nodeId];
      const fallbackTime = idx <= 2 ? new Date(1788423829213).toISOString() : new Date(1775812812526).toISOString();

      const node: SensorNode = existing || {
        id: nodeId,
        name: `Sensor ${nodeId}`,
        airTemp: idx === 1 ? 35.5 : idx === 2 ? 35.7 : idx === 3 ? 22.8 : idx === 4 ? 22.9 : idx === 5 ? 24.4 : 25.3,
        humidity: idx === 1 ? 68.8 : idx === 2 ? 65.9 : 52.8,
        soilMoisture: idx === 1 ? 5 : idx === 2 ? 8.3 : 0,
        soilPH: idx === 1 ? 0.5 : idx === 2 ? 0.83 : 0,
        lux: idx === 1 ? 2760 : idx === 2 ? 1348 : 142.5,
        nitrogen: idx === 1 ? 50 : idx === 2 ? 83 : 0,
        phosphorus: idx === 1 ? 50 : idx === 2 ? 83 : 0,
        potassium: idx === 1 ? 50 : idx === 2 ? 83 : 0,
        soilEC: idx === 1 ? 50 : idx === 2 ? 83 : 0,
        soilTemp: idx === 1 ? 5 : idx === 2 ? 8.3 : 0,
        battery: 95,
        isOnline: false,
        lastUpdated: fallbackTime,
      };

      const evaluated = firebaseTelemetry.evaluateNodeLiveness(
        nodeId,
        node.raw?.status,
        node.lastUpdated,
        FRESHNESS_THRESHOLD_MS
      );

      if (evaluated.statusMode === 'CALIBRATING') {
        calibratingCount++;
      } else if (evaluated.statusMode === 'LIVE') {
        liveCount++;
      } else {
        offlineCount++;
      }

      return {
        ...node,
        isOnline: evaluated.isLive,
        statusMode: evaluated.statusMode,
        isCalibrating: evaluated.isCalibrating,
        fieldProvisionalFlags: evaluated.fieldProvisionalFlags,
        evaluated,
      };
    });

    return {
      nodesList,
      totalCount: nodeIds.length,
      liveCount,
      offlineCount,
      calibratingCount,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorNodes, ticker]);
}
