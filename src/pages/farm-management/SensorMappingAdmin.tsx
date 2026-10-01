import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  Search,
  Layers,
  ArrowRight,
  Sparkles,
  Cpu,
  Clock,
  Thermometer,
  Droplets,
  Zap,
  Sliders,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useAgriStore } from '../../context/AgriStore';
import { useAuth } from '../../context/AuthContext';
import { getFirebaseRealtimeDb, ref, onValue } from '../../lib/firebase-client';
import {
  TelemetryFieldKey,
  getCalibratingNodes,
  setNodeCalibrating,
  getAllNodeFieldProvisionalMap,
  setNodeFieldProvisional,
  DEFAULT_FIELD_PROVISIONAL_MAP,
} from '../../config/sensorMapping';
import { firebaseTelemetry } from '../../services/firebaseTelemetry';

export interface SensorNodeMapping {
  id: string;
  firebase_node_id: string; // e.g. "Node_1", "Node_2"
  plot_id: string; // Plot ID
  display_name: string; // e.g. "PLOT-A01 — North Soil Probe"
  created_at: string;
}

const DEFAULT_NODE_MAPPINGS: SensorNodeMapping[] = [
  {
    id: 'map_01',
    firebase_node_id: 'Node_1',
    plot_id: 'plot_dharwad_01',
    display_name: 'Zone 1 — North Wheat Canopy Probe',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map_02',
    firebase_node_id: 'Node_2',
    plot_id: 'plot_dharwad_02',
    display_name: 'Zone 2 — East Rice Basin Probe',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map_03',
    firebase_node_id: 'Node_3',
    plot_id: 'plot_dharwad_03',
    display_name: 'Zone 3 — South Maize Drip Station',
    created_at: new Date().toISOString(),
  },
  {
    id: 'map_04',
    firebase_node_id: 'Node_4',
    plot_id: 'plot_dharwad_04',
    display_name: 'Zone 4 — West Cotton Sensor Array',
    created_at: new Date().toISOString(),
  },
];

export const SensorMappingAdmin: React.FC = () => {
  const { plots, activeFarmland, sensorNodes } = useAgriStore();
  const { isAdmin } = useAuth();

  const [mappings, setMappings] = useState<SensorNodeMapping[]>(() => {
    const stored = localStorage.getItem('agritwin_sensor_node_mappings');
    return stored ? JSON.parse(stored) : DEFAULT_NODE_MAPPINGS;
  });

  const [calibratingMap, setCalibratingMap] = useState<Record<string, boolean>>(() => getCalibratingNodes());
  const [fieldAccuracyMap, setFieldAccuracyMap] = useState<Record<string, Record<TelemetryFieldKey, boolean>>>(() => getAllNodeFieldProvisionalMap());

  const [discoveredNodes, setDiscoveredNodes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPlotId, setEditPlotId] = useState('');

  // Save mappings to localStorage
  const saveMappings = (next: SensorNodeMapping[]) => {
    setMappings(next);
    localStorage.setItem('agritwin_sensor_node_mappings', JSON.stringify(next));
  };

  // Toggle calibration state for a specific node
  const handleToggleCalibration = (nodeId: string) => {
    const currentState = calibratingMap[nodeId] ?? true;
    const nextState = !currentState;
    const updated = setNodeCalibrating(nodeId, nextState);
    setCalibratingMap(updated);
  };

  // Toggle field accuracy state for a specific field within a node
  const handleToggleFieldAccuracy = (nodeId: string, fieldKey: TelemetryFieldKey) => {
    const nodeFlags = fieldAccuracyMap[nodeId] || { ...DEFAULT_FIELD_PROVISIONAL_MAP };
    const current = nodeFlags[fieldKey] ?? false;
    const updated = setNodeFieldProvisional(nodeId, fieldKey, !current);
    setFieldAccuracyMap(updated);
  };

  // Discover all Node_* keys in Firebase RTDB
  useEffect(() => {
    const db = getFirebaseRealtimeDb();
    if (!db) {
      setLoading(false);
      return;
    }

    const rootRef = ref(db, '/');
    const unsub = onValue(
      rootRef,
      (snapshot) => {
        const val = snapshot.val() || {};
        const nodes: Record<string, any> = {};

        // Find all keys matching Node_* or node_*
        Object.keys(val).forEach((key) => {
          if (key.toLowerCase().startsWith('node_') || key.toLowerCase().startsWith('node-')) {
            nodes[key] = val[key];
          }
        });

        // Ensure default Node_1 through Node_7 are tracked
        ['Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7'].forEach((k) => {
          if (!nodes[k]) {
            nodes[k] = val[k] || { data: { airTemp: 28, soilMoisture: 45, humidity: 65, soilPH: 6.8 }, status: 'online' };
          }
        });

        setDiscoveredNodes(nodes);
        setLoading(false);
      },
      (err) => {
        console.error('[SensorMapping] Firebase error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, []);

  // Filtered lists
  const mappedNodeIds = useMemo(() => new Set(mappings.map((m) => m.firebase_node_id)), [mappings]);

  const assignedMappings = useMemo(() => {
    return mappings.filter((m) => {
      if (!searchQuery.trim()) return true;
      return (
        m.firebase_node_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [mappings, searchQuery]);

  const unassignedNodes = useMemo(() => {
    return Object.keys(discoveredNodes).filter((nodeId) => !mappedNodeIds.has(nodeId));
  }, [discoveredNodes, mappedNodeIds]);

  // Actions
  const handleAssignNode = (nodeId: string, plotId: string, customName?: string) => {
    const plot = plots.find((p) => p.id === plotId);
    const newMapping: SensorNodeMapping = {
      id: `map_${Date.now()}`,
      firebase_node_id: nodeId,
      plot_id: plotId,
      display_name: customName || `${plot?.name || 'Plot'} — Probe ${nodeId}`,
      created_at: new Date().toISOString(),
    };
    saveMappings([...mappings.filter((m) => m.firebase_node_id !== nodeId), newMapping]);
  };

  const handleUnassignMapping = (mappingId: string) => {
    saveMappings(mappings.filter((m) => m.id !== mappingId));
  };

  const handleSaveEdit = (mappingId: string) => {
    saveMappings(
      mappings.map((m) => {
        if (m.id === mappingId) {
          return {
            ...m,
            display_name: editDisplayName || m.display_name,
            plot_id: editPlotId || m.plot_id,
          };
        }
        return m;
      })
    );
    setEditingMappingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#dcfce7', color: '#15803d' }}>
              ADMINISTRATION
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Firebase RTDB ➔ Plot Schema Mapper & Field-Level Calibration
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '6px 0 0', letterSpacing: '-0.02em' }}>
            Sensor Node Mapping & Field Accuracy
          </h1>
          <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
            Map incoming Firebase sensor hardware nodes (`Node_1` to `Node_7`) to real farmland plots, toggle node-wide calibration, and configure field-level provisional accuracy.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 220 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search nodes or plots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 32,
                paddingRight: 10,
                height: 36,
                fontSize: 12,
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
              }}
            />
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. ASSIGNED SENSORS TABLE WITH FIELD ACCURACY BADGES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: '#16a34a' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Assigned Sensor Nodes ({assignedMappings.length})
            </h3>
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Active on dashboard, map digital twin, and sensor matrices
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 20px' }}>Firebase Node ID</th>
                <th style={{ padding: '12px 20px' }}>Custom Display Name</th>
                <th style={{ padding: '12px 20px' }}>Assigned Plot</th>
                <th style={{ padding: '12px 20px' }}>Node Mode</th>
                <th style={{ padding: '12px 20px' }}>Field Accuracy (NPK / Soil Probes)</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedMappings.map((mapping) => {
                const isEditing = editingMappingId === mapping.id;
                const plot = plots.find((p) => p.id === mapping.plot_id);
                const nodeData = discoveredNodes[mapping.firebase_node_id]?.data || sensorNodes[mapping.firebase_node_id] || {};
                const isCalibrating = calibratingMap[mapping.firebase_node_id] ?? true;
                const nodeFlags = fieldAccuracyMap[mapping.firebase_node_id] || { ...DEFAULT_FIELD_PROVISIONAL_MAP };

                return (
                  <tr key={mapping.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                    {/* Node ID */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '6px', background: isCalibrating ? '#ffedd5' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCalibrating ? '#ea580c' : '#16a34a' }}>
                          <Radio style={{ width: 14, height: 14 }} />
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{mapping.firebase_node_id}</strong>
                          <div style={{ fontSize: 10, color: isCalibrating ? '#ea580c' : '#16a34a', fontWeight: 600 }}>
                            {isCalibrating ? '● Calibrating' : '● Live Stream'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Display Name */}
                    <td style={{ padding: '14px 20px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #94a3b8',
                            fontSize: 12,
                            width: '100%',
                            maxWidth: 260,
                          }}
                        />
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{mapping.display_name}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>Created {new Date(mapping.created_at).toLocaleDateString()}</div>
                        </div>
                      )}
                    </td>

                    {/* Assigned Plot */}
                    <td style={{ padding: '14px 20px' }}>
                      {isEditing ? (
                        <select
                          value={editPlotId}
                          onChange={(e) => setEditPlotId(e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #94a3b8',
                            fontSize: 12,
                            background: '#ffffff',
                          }}
                        >
                          {plots.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.cropType || 'Crop'})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#334155' }}>
                            {plot?.name || mapping.plot_id}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Calibration Switch */}
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => handleToggleCalibration(mapping.firebase_node_id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: isCalibrating ? '1px solid #fed7aa' : '1px solid #bbf7d0',
                          background: isCalibrating ? '#fff7ed' : '#f0fdf4',
                          color: isCalibrating ? '#c2410c' : '#15803d',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Sliders style={{ width: 12, height: 12 }} />
                        {isCalibrating ? 'Calibrating (ON)' : 'Finalized (OFF)'}
                      </button>
                    </td>

                    {/* Field Accuracy Pill Toggles */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 300 }}>
                        {(['soilMoisture', 'nitrogen', 'soilEC', 'airTemp', 'soilPH'] as TelemetryFieldKey[]).map((fieldKey) => {
                          const isProv = nodeFlags[fieldKey] ?? false;
                          const fieldLabels: Record<string, string> = {
                            soilMoisture: 'Moisture',
                            nitrogen: 'NPK',
                            soilEC: 'EC',
                            airTemp: 'Air Temp',
                            soilPH: 'pH',
                          };
                          return (
                            <button
                              key={fieldKey}
                              onClick={() => handleToggleFieldAccuracy(mapping.firebase_node_id, fieldKey)}
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: isProv ? '1px solid #fed7aa' : '1px solid #cbd5e1',
                                background: isProv ? '#ffedd5' : '#f8fafc',
                                color: isProv ? '#c2410c' : '#334155',
                                cursor: 'pointer',
                              }}
                              title={`Click to flip ${fieldLabels[fieldKey]}: currently ${isProv ? 'Provisional' : 'Trusted'}`}
                            >
                              {fieldLabels[fieldKey]}: {isProv ? 'PROV' : 'TRUSTED'}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => handleSaveEdit(mapping.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#16a34a',
                              color: 'white',
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Save style={{ width: 12, height: 12 }} />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMappingId(null)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: 'none',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => {
                              setEditingMappingId(mapping.id);
                              setEditDisplayName(mapping.display_name);
                              setEditPlotId(mapping.plot_id);
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#475569',
                              cursor: 'pointer',
                            }}
                            title="Edit mapping"
                          >
                            <Edit2 style={{ width: 13, height: 13 }} />
                          </button>
                          <button
                            onClick={() => handleUnassignMapping(mapping.id)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              cursor: 'pointer',
                            }}
                            title="Unassign node"
                          >
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. UNASSIGNED SENSORS SECTION (Standby / Testing Nodes)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle style={{ width: 18, height: 18, color: '#d97706' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Unassigned Sensors ({unassignedNodes.length})
            </h3>
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Discovered from Firebase RTDB · Standby nodes (Node_5, Node_6, Node_7)
          </span>
        </div>

        {unassignedNodes.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 13, background: '#f8fafc', borderRadius: '12px' }}>
            🎉 All discovered Firebase sensor nodes are assigned to active farmland plots.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {unassignedNodes.map((nodeId) => {
              const nodeData = discoveredNodes[nodeId]?.data || {};
              const isCalibrating = calibratingMap[nodeId] ?? true;

              return (
                <div
                  key={nodeId}
                  style={{
                    border: '1px solid #fed7aa',
                    background: '#fffaf5',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Radio style={{ width: 14, height: 14 }} />
                      </div>
                      <div>
                        <strong style={{ fontSize: 13, color: '#0f172a' }}>{nodeId}</strong>
                        <div style={{ fontSize: 10, color: '#c2410c', fontWeight: 600 }}>Unassigned / Testing</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleCalibration(nodeId)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #fed7aa',
                        background: '#ffffff',
                        color: '#c2410c',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isCalibrating ? 'Calibrating ON' : 'Calibrating OFF'}
                    </button>
                  </div>

                  {/* Telemetry snippet */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748b' }}>
                    <span>💧 {nodeData?.soilMoisture ?? '--'}%</span>
                    <span>🌡️ {nodeData?.airTemp ?? '--'}°C</span>
                    <span>🧪 pH {nodeData?.soilPH ?? '--'}</span>
                  </div>

                  {/* Quick Assign Form */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <select
                      id={`select-plot-${nodeId}`}
                      defaultValue={plots[0]?.id || ''}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        background: '#ffffff',
                      }}
                    >
                      {plots.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const select = document.getElementById(`select-plot-${nodeId}`) as HTMLSelectElement;
                        if (select) {
                          handleAssignNode(nodeId, select.value);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Plus style={{ width: 12, height: 12 }} />
                      Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorMappingAdmin;
