import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Clock,
  Droplets,
  Thermometer,
  Activity,
  FlaskConical,
  Sun,
  Zap,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useSensorStatus } from '../../hooks/useSensorStatus';
import { SensorNode, TelemetryFieldKey } from '../../config/sensorMapping';

export interface SensorDetailModalProps {
  nodeId: string | null;
  onClose: () => void;
  plotName?: string;
}

interface TelemetryHistoryEntry {
  timestamp: string;
  soilMoisture?: number;
  airTemp?: number;
  humidity?: number;
  soilPH?: number;
  lux?: number;
}

export const SensorDetailModal: React.FC<SensorDetailModalProps> = ({
  nodeId,
  onClose,
  plotName,
}) => {
  const statusInfo = useSensorStatus(nodeId || 'Node_1');
  const node = statusInfo.node;
  const isOnline = statusInfo.isLive;
  const isCalibrating = statusInfo.statusMode === 'CALIBRATING';
  const fieldFlags = statusInfo.fieldProvisionalFlags;

  // Track session history for honest sparkline/table
  const [sessionHistory, setSessionHistory] = useState<TelemetryHistoryEntry[]>([]);

  useEffect(() => {
    if (node?.lastUpdated && isOnline) {
      setSessionHistory((prev) => {
        if (prev.some((p) => p.timestamp === node.lastUpdated)) return prev;
        const entry: TelemetryHistoryEntry = {
          timestamp: node.lastUpdated || new Date().toISOString(),
          soilMoisture: node.soilMoisture,
          airTemp: node.airTemp,
          humidity: node.humidity,
          soilPH: node.soilPH,
          lux: node.lux,
        };
        return [entry, ...prev].slice(0, 15);
      });
    }
  }, [node?.lastUpdated, node?.soilMoisture, node?.airTemp, isOnline]);

  if (!nodeId) return null;

  const renderFieldAccuracyToggle = (fieldKey: TelemetryFieldKey, label: string) => {
    const isProvisional = fieldFlags?.[fieldKey] ?? false;
    return (
      <button
        onClick={() => statusInfo.toggleFieldProvisional(fieldKey)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 7px',
          borderRadius: '6px',
          border: isProvisional ? '1px solid #fed7aa' : '1px solid #bbf7d0',
          background: isProvisional ? '#fff7ed' : '#f0fdf4',
          color: isProvisional ? '#c2410c' : '#15803d',
          fontSize: 10,
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: 4,
        }}
        title={`Click to switch between Provisional and Trusted for ${label}`}
      >
        {isProvisional ? (
          <>
            <HelpCircle style={{ width: 10, height: 10 }} />
            Provisional (Shared Formula)
          </>
        ) : (
          <>
            <ShieldCheck style={{ width: 10, height: 10 }} />
            Calibrated / Trusted
          </>
        )}
      </button>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '760px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isCalibrating ? '#fffbeb' : '#f8fafc',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: isCalibrating ? '#ffedd5' : (isOnline ? '#dcfce7' : '#f1f5f9'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCalibrating ? '#ea580c' : (isOnline ? '#16a34a' : '#64748b'),
              }}
            >
              <Radio style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {nodeId} Telemetry Inspector
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    background: isCalibrating ? '#ffedd5' : (isOnline ? '#dcfce7' : '#f1f5f9'),
                    color: isCalibrating ? '#c2410c' : (isOnline ? '#15803d' : '#475569'),
                    border: isCalibrating ? '1px solid #fed7aa' : (isOnline ? '1px solid #bbf7d0' : '1px solid #cbd5e1'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isCalibrating ? '#f97316' : (isOnline ? '#16a34a' : '#94a3b8'),
                    }}
                  />
                  {statusInfo.statusMode}
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                Mapped Plot: <strong>{plotName || 'IIIT Dharwad Research Plot'}</strong> · Path: <code>/{nodeId}</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* ── Modal Content ── */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Calibrating Notice with Shared-Formula Warning */}
          <div
            style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <Sliders style={{ width: 18, height: 18, color: '#ea580c', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ fontSize: 13, color: '#9a3412', display: 'block' }}>
                Field-Level Accuracy & Calibration Controls
              </strong>
              <p style={{ fontSize: 12, color: '#c2410c', margin: '4px 0 0', lineHeight: 1.4 }}>
                <strong>Hardware Note:</strong> NPK, Soil EC, and Soil Moisture currently compute from a single shared value (soilMoisture = N/10, N=P=K=EC) while probe calibration is in progress. You can toggle each individual field below from <strong>Provisional</strong> to <strong>Trusted</strong> once its physical probe is confirmed wired and independent.
              </p>
            </div>
          </div>

          {/* Freshness Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: 12,
              color: '#475569',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock style={{ width: 16, height: 16, color: isOnline ? '#16a34a' : '#64748b' }} />
              <span>
                <strong>Freshness Status:</strong> {statusInfo.relativeTimeText} (Threshold: 25s window)
              </span>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>
              Ping: {node?.lastUpdated || 'None'}
            </span>
          </div>

          {/* 10-Parameter Telemetry Grid with Field Toggles */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Comprehensive Telemetry Matrix (All 10 Parameters)
              </h3>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Click badge to flip field provisional state
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              
              {/* 1. Air Temp */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, marginBottom: 4 }}>
                  <Thermometer style={{ width: 14, height: 14, color: '#ea580c' }} />
                  Air Temperature
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.airTemp !== undefined ? `${node.airTemp} °C` : '--'}
                </div>
                {renderFieldAccuracyToggle('airTemp', 'Air Temp')}
              </div>

              {/* 2. Humidity */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, marginBottom: 4 }}>
                  <Activity style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                  Relative Humidity
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.humidity !== undefined ? `${node.humidity} %` : '--'}
                </div>
                {renderFieldAccuracyToggle('humidity', 'Humidity')}
              </div>

              {/* 3. Ambient Light */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, marginBottom: 4 }}>
                  <Sun style={{ width: 14, height: 14, color: '#ca8a04' }} />
                  Ambient Light
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.lux !== undefined ? `${Math.round(node.lux)} lux` : '--'}
                </div>
                {renderFieldAccuracyToggle('lux', 'Ambient Light')}
              </div>

              {/* 4. Soil Moisture */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, marginBottom: 4 }}>
                  <Droplets style={{ width: 14, height: 14, color: '#0284c7' }} />
                  Soil Moisture
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.soilMoisture !== undefined ? `${node.soilMoisture} %` : '--'}
                </div>
                {renderFieldAccuracyToggle('soilMoisture', 'Soil Moisture')}
              </div>

              {/* 5. Soil pH */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, marginBottom: 4 }}>
                  <FlaskConical style={{ width: 14, height: 14, color: '#16a34a' }} />
                  Soil pH
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.soilPH !== undefined ? `${node.soilPH}` : '--'}
                </div>
                {renderFieldAccuracyToggle('soilPH', 'Soil pH')}
              </div>

              {/* 6. Soil EC */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, marginBottom: 4 }}>
                  <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />
                  Soil EC
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.soilEC !== undefined ? `${node.soilEC} µS/cm` : '--'}
                </div>
                {renderFieldAccuracyToggle('soilEC', 'Soil EC')}
              </div>

              {/* 7. Nitrogen */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Nitrogen (N)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.nitrogen !== undefined ? `${node.nitrogen} mg/kg` : '--'}
                </div>
                {renderFieldAccuracyToggle('nitrogen', 'Nitrogen')}
              </div>

              {/* 8. Phosphorus */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Phosphorus (P)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.phosphorus !== undefined ? `${node.phosphorus} mg/kg` : '--'}
                </div>
                {renderFieldAccuracyToggle('phosphorus', 'Phosphorus')}
              </div>

              {/* 9. Potassium */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Potassium (K)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.potassium !== undefined ? `${node.potassium} mg/kg` : '--'}
                </div>
                {renderFieldAccuracyToggle('potassium', 'Potassium')}
              </div>

              {/* 10. Soil Temp */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Soil Temperature</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {node?.soilTemp !== undefined ? `${node.soilTemp} °C` : '--'}
                </div>
                {renderFieldAccuracyToggle('soilTemp', 'Soil Temp')}
              </div>
            </div>
          </div>

          {/* Honest Session History */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Live Stream Buffer (Active Session)
              </h4>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {sessionHistory.length > 0 ? `${sessionHistory.length} readings received this session` : 'Awaiting incoming push events'}
              </span>
            </div>

            {sessionHistory.length === 0 ? (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                ℹ️ Firebase RTDB currently stores the latest node snapshot. Real-time updates pushed during this browser session will accumulate here.
              </div>
            ) : (
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <tr>
                      <th style={{ padding: '8px 12px' }}>Time</th>
                      <th style={{ padding: '8px 12px' }}>Moisture</th>
                      <th style={{ padding: '8px 12px' }}>Air Temp</th>
                      <th style={{ padding: '8px 12px' }}>Humidity</th>
                      <th style={{ padding: '8px 12px' }}>pH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionHistory.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 12px', fontFamily: 'monospace' }}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0284c7' }}>{item.soilMoisture}%</td>
                        <td style={{ padding: '6px 12px', fontWeight: 600, color: '#ea580c' }}>{item.airTemp}°C</td>
                        <td style={{ padding: '6px 12px', fontWeight: 600, color: '#8b5cf6' }}>{item.humidity}%</td>
                        <td style={{ padding: '6px 12px', fontWeight: 600, color: '#16a34a' }}>{item.soilPH}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
          }}
        >
          <button
            onClick={statusInfo.toggleCalibrating}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sliders style={{ width: 14, height: 14 }} />
            Node-Wide Placement Mode ({isCalibrating ? 'Turn OFF' : 'Turn ON'})
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};

export default SensorDetailModal;
