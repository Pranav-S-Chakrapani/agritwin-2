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

  // 5-second heartbeat ticker to evaluate freshness transitions without freezing UI
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => (prev + 1) % 10000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const node = sensorNodes?.[nodeId];

  const evaluated = useMemo(() => {
    const rawStatus = node?.raw?.status;
    const lastUpdated = node?.lastUpdated;
    return firebaseTelemetry.evaluateNodeLiveness(
      nodeId,
      rawStatus,
      lastUpdated,
      FRESHNESS_THRESHOLD_MS,
      node?.raw
    );
  }, [nodeId, node?.lastUpdated, node?.raw?.status, node?.raw, ticker]);

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

  // 5-second heartbeat ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => (prev + 1) % 10000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const nodeIds = ['Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7'];
    let liveCount = 0;
    let offlineCount = 0;
    let calibratingCount = 0;

    const nodesList = nodeIds.map((nodeId) => {
      const existing = sensorNodes?.[nodeId];

      // Strictly preserve existing data; if not yet received, mark with honest NO_DATA state
      const node: SensorNode = existing || {
        id: nodeId,
        name: `Sensor ${nodeId}`,
        isOnline: false,
        statusMode: 'NO_DATA',
        freshnessStatus: 'NO_DATA',
        sourceClassification: 'unknown',
      };

      const evaluated = firebaseTelemetry.evaluateNodeLiveness(
        nodeId,
        node.raw?.status,
        node.lastUpdated,
        FRESHNESS_THRESHOLD_MS,
        node.raw
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
        freshnessStatus: evaluated.statusMode,
        sourceClassification: evaluated.sourceClassification,
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
  }, [sensorNodes, ticker]);
}
