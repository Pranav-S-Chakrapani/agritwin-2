import React, { useState, useMemo } from 'react';
import {
  Radio,
  Thermometer,
  Droplets,
  FlaskConical,
  Clock,
  Building2,
  Cpu,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sprout,
  Zap,
  Activity,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';

function fmtTimestamp(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function getSensorIcon(typeStr: string) {
  const t = (typeStr || '').toLowerCase();
  const style = { width: 15, height: 15 };
  if (t.includes('moisture') || t.includes('sm')) return <Droplets style={{ ...style, color: '#0284c7' }} />;
  if (t.includes('temp') || t.includes('at')) return <Thermometer style={{ ...style, color: '#ef4444' }} />;
  if (t.includes('hum')) return <Droplets style={{ ...style, color: '#0d9488' }} />;
  if (t.includes('ph')) return <FlaskConical style={{ ...style, color: '#8b5cf6' }} />;
  if (t.includes('nitrogen') || t.includes('n_') || t.endsWith('_n')) return <Zap style={{ ...style, color: 'var(--color-primary)' }} />;
  if (t.includes('phosphor') || t.includes('p_') || t.endsWith('_p')) return <Activity style={{ ...style, color: '#d97706' }} />;
  if (t.includes('potass') || t.includes('k_') || t.endsWith('_k')) return <Activity style={{ ...style, color: '#6366f1' }} />;
  return <Cpu style={{ ...style, color: 'var(--color-text-muted)' }} />;
}

export const MySensors: React.FC = () => {
  const { activeSections: plots, activeFarmland, crops, sensors, isDemoTelemetryActive } = useAgriStore();
  const [expandedPlots, setExpandedPlots] = useState<Record<string, boolean>>({});

  const togglePlotExpand = (plotId: string) => {
    setExpandedPlots(prev => ({ ...prev, [plotId]: !prev[plotId] }));
  };

  const hierarchy = useMemo(() => {
    return plots.map(plot => {
      const crop = crops.find(c => c.id === plot.cropId) || null;
      const plotSensors = sensors.filter(s => s.plotId === plot.id || s.assignedPlotCode === plot.code);
      const pings = plotSensors.map(s => s.lastPing ? new Date(s.lastPing).getTime() : 0);
      const maxPing = pings.length > 0 ? Math.max(...pings) : 0;
      const lastUpdated = maxPing > 0 ? new Date(maxPing).toISOString() : null;
      const onlineCount = plotSensors.filter(s => s.status === 'Online').length;
      return { plot, crop, plotSensors, lastUpdated, onlineCount };
    });
  }, [plots, crops, sensors]);

  const totalSensors = sensors.length;
  const onlineSensors = sensors.filter(s => s.status === 'Online').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PrototypeModeBanner />

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-lg)',
              background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Radio style={{ width: 18, height: 18, color: '#6366f1' }} />
            </div>
            Live IoT Sensor Matrix
          </h1>
          <p className="at-page-subtitle">
            Farm &rarr; Plot &rarr; Sensors &rarr; Real-time <code style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--color-surface-muted)', padding: '1px 5px', borderRadius: 4, color: 'var(--color-primary)' }}>sensors.current_reading</code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isDemoTelemetryActive && (
            <div className="at-live">
              <span className="at-live-dot" />
              Real-Time (10s cycle)
            </div>
          )}
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
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Sensors', val: totalSensors, sub: 'All plots', icon: <Cpu style={{ width: 16, height: 16, color: '#6366f1' }} />, iconBg: '#ede9fe' },
          { label: 'Online', val: onlineSensors, sub: 'Live broadcasting', icon: <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--color-success)' }} />, iconBg: 'var(--color-success-bg)' },
          { label: 'Offline', val: totalSensors - onlineSensors, sub: 'Check connectivity', icon: <AlertCircle style={{ width: 16, height: 16, color: 'var(--color-danger)' }} />, iconBg: 'var(--color-danger-bg)' },
          { label: 'Plots Monitored', val: plots.length, sub: 'Active farm', icon: <Sprout style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />, iconBg: 'var(--color-primary-muted)' },
        ].map(m => (
          <div key={m.label} className="at-metric-card">
            <div className="at-metric-label">
              {m.label}
              <div className="at-metric-icon" style={{ background: m.iconBg }}>{m.icon}</div>
            </div>
            <div className="at-metric-value">{m.val}</div>
            <div className="at-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Sensor hierarchy cards ── */}
      {hierarchy.length === 0 ? (
        <div className="at-card">
          <div className="at-empty">
            <div className="at-empty-icon"><Radio style={{ width: 28, height: 28 }} /></div>
            <div className="at-empty-title">No Plots Found</div>
            <div className="at-empty-text">No plots found for the active farm. Add plots in My Farms to see sensor data.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {hierarchy.map(({ plot, crop, plotSensors, lastUpdated, onlineCount }) => {
            const isExpanded = Boolean(expandedPlots[plot.id]);

            return (
              <div
                key={plot.id}
                className="at-card"
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* Plot header */}
                <div
                  onClick={() => togglePlotExpand(plot.id)}
                  style={{
                    padding: '16px 18px',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    borderBottom: '1px solid var(--color-border-muted)',
                    userSelect: 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {activeFarmland?.name || 'Farm'} &rsaquo;
                      </span>
                      <span style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'monospace',
                      }}>
                        {plot.code}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{plot.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sprout style={{ width: 11, height: 11, color: 'var(--color-primary)' }} />
                        {plot.cropType || crop?.name || 'Crop'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Radio style={{ width: 11, height: 11, color: '#6366f1', animation: 'at-pulse 2s infinite' }} />
                        {plotSensors.length} sensors ({onlineCount} online)
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span className={`at-badge ${onlineCount === plotSensors.length && plotSensors.length > 0 ? 'success' : 'warning'}`} style={{ fontSize: 10 }}>
                      <span className="at-badge-dot" />
                      {onlineCount}/{plotSensors.length}
                    </span>
                    {isExpanded
                      ? <ChevronDown style={{ width: 15, height: 15, color: 'var(--color-text-muted)' }} />
                      : <ChevronRight style={{ width: 15, height: 15, color: 'var(--color-text-muted)' }} />
                    }
                  </div>
                </div>

                {/* Collapsed summary */}
                {!isExpanded && (
                  <div style={{
                    padding: '10px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-surface-muted)',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Radio style={{ width: 12, height: 12, color: 'var(--color-primary)', animation: 'at-pulse 2s infinite' }} />
                      {plotSensors.length} nodes — Moisture, Temp, pH, N-P-K
                    </span>
                    <button
                      onClick={() => togglePlotExpand(plot.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, color: 'var(--color-primary)',
                        textDecoration: 'underline', padding: 0,
                      }}
                    >
                      View Telemetry →
                    </button>
                  </div>
                )}

                {/* Expanded sensor list */}
                {isExpanded && (
                  <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                        Active Sensor Readings
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                        public.sensors
                      </span>
                    </div>

                    {plotSensors.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                        No sensors linked to this plot.
                      </div>
                    ) : (
                      plotSensors.map(sensor => (
                        <div
                          key={sensor.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-surface-muted)',
                            border: '1px solid var(--color-border-muted)',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-muted)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: 'var(--radius-lg)',
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              {getSensorIcon(sensor.type || sensor.nodeName)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text-primary)' }}>
                                {sensor.type || sensor.nodeName}
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--color-text-muted)' }}>
                                {sensor.sensorCode || sensor.id}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                                {sensor.currentReading || '—'}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                {fmtTimestamp(sensor.lastPing)}
                              </div>
                            </div>
                            <span className={`at-status-dot ${sensor.status === 'Online' ? 'online pulse' : 'offline'}`} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Card footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 18px',
                  borderTop: '1px solid var(--color-border-muted)',
                  background: 'var(--color-surface-muted)',
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    Last cycle: {lastUpdated ? fmtTimestamp(lastUpdated) : 'Live'}
                  </span>
                  <div className="at-live" style={{ padding: '2px 8px', fontSize: 10 }}>
                    <span className="at-live-dot" />
                    Supabase Feed
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySensors;
