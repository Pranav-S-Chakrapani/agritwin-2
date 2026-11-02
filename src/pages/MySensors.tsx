import React, { useState, useMemo } from 'react';
import {
  Radio,
  Cpu,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sprout,
  ChevronDown,
  ChevronRight,
  Building2,
  Sliders,
  Filter,
  Clock,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { UnifiedSensorCard } from '../components/sensors/UnifiedSensorCard';
import { SensorDetailModal } from '../components/sensors/SensorDetailModal';
import { useAllSensorsStatus } from '../hooks/useSensorStatus';

export const MySensors: React.FC = () => {
  const { activeSections: plots, activeFarmland, crops } = useAgriStore();
  const { nodesList, totalCount, liveCount, offlineCount, calibratingCount, pendingCount } = useAllSensorsStatus();

  const [filterMode, setFilterMode] = useState<'ALL' | 'ONLINE' | 'CALIBRATING' | 'PENDING' | 'OFFLINE'>('ALL');
  const [inspectNodeId, setInspectNodeId] = useState<string | null>(null);

  const [expandedPlots, setExpandedPlots] = useState<Record<string, boolean>>({
    'plot_dharwad_01': true,
    'plot_dharwad_02': true,
    'plot_dharwad_03': true,
    'plot_dharwad_04': true,
  });

  const togglePlotExpand = (plotId: string) => {
    setExpandedPlots((prev) => ({ ...prev, [plotId]: !prev[plotId] }));
  };

  // Associate mapped plots
  const enrichedNodes = useMemo(() => {
    return nodesList.map((node) => {
      let assignedPlotId = 'unassigned';
      let plotName = 'Unassigned';
      if (node.id === 'Node_2') { assignedPlotId = 'plot_dharwad_02'; plotName = 'PLOT-A02'; }
      else if (node.id === 'Node_3') { assignedPlotId = 'plot_dharwad_03'; plotName = 'PLOT-A03'; }
      else if (node.id === 'Node_4') { assignedPlotId = 'plot_dharwad_04'; plotName = 'PLOT-A04'; }

      return {
        ...node,
        assignedPlotId,
        plotName,
      };
    });
  }, [nodesList]);

  // Apply Filter
  const filteredNodes = useMemo(() => {
    if (filterMode === 'ALL') return enrichedNodes;
    if (filterMode === 'ONLINE') return enrichedNodes.filter((n) => n.statusMode === 'ONLINE' || n.statusMode === 'LIVE');
    return enrichedNodes.filter((n) => n.statusMode === filterMode);
  }, [enrichedNodes, filterMode]);

  const inspectingPlotName = enrichedNodes.find((n) => n.id === inspectNodeId)?.plotName;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#dbeafe', color: '#1d4ed8' }}>
              REAL-TIME TELEMETRY ENGINE
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Freshness Threshold: 25s (10s reporting interval)
            </span>
          </div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-lg)',
              background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Radio style={{ width: 18, height: 18, color: '#6366f1' }} />
            </div>
            Hardware Sensor Nodes (Node_2, Node_3, Node_4)
          </h1>
          <p className="at-page-subtitle">
            Standardized 3-node hardware telemetry stream from Firebase Realtime Database with live freshness tracking & diagnostics.
          </p>
        </div>

        {activeFarmland && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 12,
          }}>
            <Building2 style={{ width: 14, height: 14, color: 'var(--color-primary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{activeFarmland.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)' }}>
                <MapPin style={{ width: 10, height: 10 }} />
                {activeFarmland.location}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Row: Ground-Truth Node Status ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <div className="at-metric-card" onClick={() => setFilterMode('ALL')} style={{ cursor: 'pointer' }}>
          <div className="at-metric-label">
            Total Hardware Nodes
            <div className="at-metric-icon" style={{ background: '#ede9fe' }}><Cpu style={{ width: 16, height: 16, color: '#6366f1' }} /></div>
          </div>
          <div className="at-metric-value">{totalCount}</div>
          <div className="at-metric-sub">Node_2, Node_3, Node_4</div>
        </div>

        <div className="at-metric-card" onClick={() => setFilterMode('ONLINE')} style={{ cursor: 'pointer' }}>
          <div className="at-metric-label">
            Online (Transmitting)
            <div className="at-metric-icon" style={{ background: 'var(--color-success-bg)' }}><CheckCircle2 style={{ width: 16, height: 16, color: 'var(--color-success)' }} /></div>
          </div>
          <div className="at-metric-value" style={{ color: liveCount > 0 ? '#16a34a' : '#64748b' }}>
            {liveCount}
          </div>
          <div className="at-metric-sub">Live physical telemetry</div>
        </div>

        <div className="at-metric-card" onClick={() => setFilterMode('PENDING')} style={{ cursor: 'pointer' }}>
          <div className="at-metric-label">
            Pending Integration
            <div className="at-metric-icon" style={{ background: '#f1f5f9' }}><Clock style={{ width: 16, height: 16, color: '#64748b' }} /></div>
          </div>
          <div className="at-metric-value" style={{ color: '#64748b' }}>{pendingCount}</div>
          <div className="at-metric-sub">Awaiting node telemetry</div>
        </div>

        <div className="at-metric-card" onClick={() => setFilterMode('CALIBRATING')} style={{ cursor: 'pointer' }}>
          <div className="at-metric-label">
            Calibrating
            <div className="at-metric-icon" style={{ background: '#ffedd5' }}><Sliders style={{ width: 16, height: 16, color: '#ea580c' }} /></div>
          </div>
          <div className="at-metric-value" style={{ color: '#ea580c' }}>{calibratingCount}</div>
          <div className="at-metric-sub">Active placement / repositioning</div>
        </div>

        <div className="at-metric-card" onClick={() => setFilterMode('OFFLINE')} style={{ cursor: 'pointer' }}>
          <div className="at-metric-label">
            Offline / Standby
            <div className="at-metric-icon" style={{ background: '#f1f5f9' }}><AlertCircle style={{ width: 16, height: 16, color: '#64748b' }} /></div>
          </div>
          <div className="at-metric-value" style={{ color: '#475569' }}>{offlineCount}</div>
          <div className="at-metric-sub">Awaiting hardware power-on</div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter style={{ width: 14, height: 14 }} />
            Filter Nodes:
          </span>
          {(['ALL', 'ONLINE', 'PENDING', 'CALIBRATING', 'OFFLINE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: filterMode === mode ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: filterMode === mode ? '#0f172a' : '#ffffff',
                color: filterMode === mode ? '#ffffff' : '#475569',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {mode === 'ALL' ? `All (${totalCount})` : mode === 'ONLINE' ? `Online (${liveCount})` : mode === 'PENDING' ? `Pending (${pendingCount})` : mode === 'CALIBRATING' ? `Calibrating (${calibratingCount})` : `Offline (${offlineCount})`}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#64748b' }}>
          Showing <strong>{filteredNodes.length}</strong> of {totalCount} hardware nodes
        </div>
      </div>

      {/* ── Per-Node Grid Grouped by Node ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredNodes.map((node) => {
          const isExpanded = Boolean(expandedPlots[node.id] ?? true);
          const mappedPlot = plots.find((p) => p.id === node.assignedPlotId || p.code === node.plotName);

          return (
            <div
              key={node.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Node Section Header */}
              <div
                onClick={() => setExpandedPlots((prev) => ({ ...prev, [node.id]: !prev[node.id] }))}
                style={{
                  padding: '14px 20px',
                  background: '#f8fafc',
                  borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#ede9fe', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Radio style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
                      {node.id.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 10 }}>
                      Mapped Plot: <strong>{node.plotName || mappedPlot?.code || 'PLOT-A0' + node.id.replace(/\D/g, '')}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isExpanded ? <ChevronDown style={{ width: 16, height: 16, color: '#64748b' }} /> : <ChevronRight style={{ width: 16, height: 16, color: '#64748b' }} />}
                </div>
              </div>

              {/* Node Card Details */}
              {isExpanded && (
                <div style={{ padding: '16px 20px' }}>
                  <UnifiedSensorCard
                    key={node.id}
                    node={node}
                    onOpenDetail={(id) => setInspectNodeId(id)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Deep-Dive Per-Sensor Detail Modal ── */}
      <SensorDetailModal
        nodeId={inspectNodeId}
        plotName={inspectingPlotName}
        onClose={() => setInspectNodeId(null)}
      />
    </div>
  );
};

export default MySensors;
