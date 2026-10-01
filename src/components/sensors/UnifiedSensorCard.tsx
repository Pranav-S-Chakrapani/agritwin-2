import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Thermometer,
  Droplets,
  FlaskConical,
  Sun,
  Activity,
  Zap,
  Clock,
  Battery,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  SensorNode,
  NodeOperationalStatus,
  TelemetryFieldKey,
  DEFAULT_FIELD_PROVISIONAL_MAP,
} from '../../config/sensorMapping';
import { EvaluatedNodeStatus, firebaseTelemetry } from '../../services/firebaseTelemetry';

export interface UnifiedSensorCardProps {
  node: SensorNode & {
    assignedPlotId?: string;
    plotName?: string;
    displayName?: string;
    evaluated?: EvaluatedNodeStatus;
  };
  compact?: boolean;
  onOpenDetail?: (nodeId: string) => void;
}

export const UnifiedSensorCard: React.FC<UnifiedSensorCardProps> = ({
  node,
  compact = false,
  onOpenDetail,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const prevValuesRef = useRef<Record<string, any>>({});

  const evaluated = node.evaluated || firebaseTelemetry.evaluateNodeLiveness(
    node.id,
    node.raw?.status,
    node.lastUpdated
  );

  const statusMode: NodeOperationalStatus = evaluated.statusMode;
  const isOnline = evaluated.isLive;
  const isCalibrating = statusMode === 'CALIBRATING';
  const fieldFlags = evaluated.fieldProvisionalFlags || DEFAULT_FIELD_PROVISIONAL_MAP;

  // Detect live value changes and trigger subtle visual flash
  useEffect(() => {
    const currentValues = {
      airTemp: node.airTemp,
      humidity: node.humidity,
      lux: node.lux,
      soilMoisture: node.soilMoisture,
      soilPH: node.soilPH,
      soilEC: node.soilEC,
      nitrogen: node.nitrogen,
    };

    const prev = prevValuesRef.current;
    if (Object.keys(prev).length > 0 && isOnline) {
      for (const [key, val] of Object.entries(currentValues)) {
        if (prev[key] !== undefined && prev[key] !== val) {
          setHighlightKey(key);
          const timer = setTimeout(() => setHighlightKey(null), 1400);
          prevValuesRef.current = currentValues;
          return () => clearTimeout(timer);
        }
      }
    }
    prevValuesRef.current = currentValues;
  }, [node, isOnline]);

  // Card theme styling
  let cardBg = '#ffffff';
  let cardBorder = '#e2e8f0';
  let badgeBg = '#f1f5f9';
  let badgeColor = '#475569';
  let badgeDot = '#94a3b8';
  let badgeText = 'OFFLINE';

  if (statusMode === 'CALIBRATING') {
    cardBg = '#fffdfa';
    cardBorder = '#fed7aa';
    badgeBg = '#ffedd5';
    badgeColor = '#c2410c';
    badgeDot = '#f97316';
    badgeText = 'CALIBRATING';
  } else if (statusMode === 'LIVE') {
    cardBg = '#ffffff';
    cardBorder = '#bbf7d0';
    badgeBg = '#dcfce7';
    badgeColor = '#15803d';
    badgeDot = '#16a34a';
    badgeText = 'LIVE';
  }

  const renderProvisionalBadge = (fieldKey: TelemetryFieldKey) => {
    const isProvisional = fieldFlags[fieldKey];
    if (!isProvisional) return null;
    return (
      <span
        title="Provisional: Formula/placeholder derived (uncalibrated probe)"
        style={{
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: '4px',
          background: '#ffedd5',
          color: '#c2410c',
          border: '1px solid #fed7aa',
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        PROV
      </span>
    );
  };

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '14px',
        padding: compact ? '12px 14px' : '16px 18px',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: isOnline ? '0 4px 12px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.02)',
        position: 'relative',
      }}
    >
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: isCalibrating ? '#ffedd5' : (isOnline ? '#dcfce7' : '#f1f5f9'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isCalibrating ? '#ea580c' : (isOnline ? '#16a34a' : '#64748b'),
            }}
          >
            <Radio style={{ width: 16, height: 16 }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                {node.id}
              </span>
              {node.displayName && (
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  ({node.displayName})
                </span>
              )}
            </div>
            {node.plotName && (
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Mapped: <strong>{node.plotName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Status Badge & Inspector Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: '9999px',
              background: badgeBg,
              color: badgeColor,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: badgeDot,
                boxShadow: isOnline ? `0 0 6px ${badgeDot}` : 'none',
              }}
            />
            {badgeText}
          </span>

          {onOpenDetail && (
            <button
              onClick={() => onOpenDetail(node.id)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Open full telemetry breakdown, field accuracy toggles, and session sparkline"
            >
              Inspect
            </button>
          )}
        </div>
      </div>

      {/* ── Calibration Notice Banner (When in Calibrating Mode) ── */}
      {isCalibrating && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #ffedd5',
            borderRadius: '8px',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: '#c2410c',
          }}
        >
          <Sliders style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>
            <strong>Calibrating:</strong> Sensor placement active. Probes with <span style={{ color: '#c2410c', fontWeight: 700 }}>[PROV]</span> indicate provisional shared-formula values.
          </span>
        </div>
      )}

      {/* ── Primary Metric Grid: 6 Essential Telemetry Fields ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: 8,
          fontSize: 11,
        }}
      >
        {/* Soil Moisture */}
        <div
          style={{
            background: highlightKey === 'soilMoisture' ? '#dcfce7' : '#ffffff',
            padding: '8px 10px',
            borderRadius: '8px',
            border: fieldFlags.soilMoisture ? '1px solid #fed7aa' : '1px solid #e2e8f0',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: 10, marginBottom: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Droplets style={{ width: 11, height: 11, color: '#0284c7' }} />
              Soil Moisture
            </span>
            {renderProvisionalBadge('soilMoisture')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {node.soilMoisture !== undefined ? `${node.soilMoisture}%` : '--'}
          </div>
        </div>

        {/* Air Temp */}
        <div
          style={{
            background: highlightKey === 'airTemp' ? '#dcfce7' : '#ffffff',
            padding: '8px 10px',
            borderRadius: '8px',
            border: fieldFlags.airTemp ? '1px solid #fed7aa' : '1px solid #e2e8f0',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: 10, marginBottom: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Thermometer style={{ width: 11, height: 11, color: '#ea580c' }} />
              Air Temp
            </span>
            {renderProvisionalBadge('airTemp')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {node.airTemp !== undefined ? `${node.airTemp}°C` : '--'}
          </div>
        </div>

        {/* Humidity */}
        <div
          style={{
            background: highlightKey === 'humidity' ? '#dcfce7' : '#ffffff',
            padding: '8px 10px',
            borderRadius: '8px',
            border: fieldFlags.humidity ? '1px solid #fed7aa' : '1px solid #e2e8f0',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: 10, marginBottom: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity style={{ width: 11, height: 11, color: '#8b5cf6' }} />
              Humidity
            </span>
            {renderProvisionalBadge('humidity')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {node.humidity !== undefined ? `${node.humidity}%` : '--'}
          </div>
        </div>

        {/* Soil pH */}
        <div
          style={{
            background: highlightKey === 'soilPH' ? '#dcfce7' : '#ffffff',
            padding: '8px 10px',
            borderRadius: '8px',
            border: fieldFlags.soilPH ? '1px solid #fed7aa' : '1px solid #e2e8f0',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: 10, marginBottom: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FlaskConical style={{ width: 11, height: 11, color: '#16a34a' }} />
              Soil pH
            </span>
            {renderProvisionalBadge('soilPH')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {node.soilPH !== undefined ? node.soilPH : '--'}
          </div>
        </div>

        {/* Solar Lux */}
        <div
          style={{
            background: highlightKey === 'lux' ? '#dcfce7' : '#ffffff',
            padding: '8px 10px',
            borderRadius: '8px',
            border: fieldFlags.lux ? '1px solid #fed7aa' : '1px solid #e2e8f0',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: 10, marginBottom: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sun style={{ width: 11, height: 11, color: '#ca8a04' }} />
              Ambient Light
            </span>
            {renderProvisionalBadge('lux')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {node.lux !== undefined ? `${Math.round(node.lux)} lx` : '--'}
          </div>
        </div>

        {/* Soil EC */}
        <div
          style={{
            background: highlightKey === 'soilEC' ? '#dcfce7' : '#ffffff',
            padding: '8px 10px',
            borderRadius: '8px',
            border: fieldFlags.soilEC ? '1px solid #fed7aa' : '1px solid #e2e8f0',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: 10, marginBottom: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap style={{ width: 11, height: 11, color: '#f59e0b' }} />
              Soil EC
            </span>
            {renderProvisionalBadge('soilEC')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {node.soilEC !== undefined ? `${node.soilEC} µS/cm` : '--'}
          </div>
        </div>
      </div>

      {/* ── Expanded All 10 Fields (NPK, Soil Temp, Battery) ── */}
      {!compact && (
        <>
          {isExpanded && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Nitrogen (N)</span>
                  {renderProvisionalBadge('nitrogen')}
                </div>
                <strong style={{ color: '#0f172a', fontSize: 12 }}>
                  {node.nitrogen !== undefined ? `${node.nitrogen} mg/kg` : '--'}
                </strong>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Phosphorus (P)</span>
                  {renderProvisionalBadge('phosphorus')}
                </div>
                <strong style={{ color: '#0f172a', fontSize: 12 }}>
                  {node.phosphorus !== undefined ? `${node.phosphorus} mg/kg` : '--'}
                </strong>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Potassium (K)</span>
                  {renderProvisionalBadge('potassium')}
                </div>
                <strong style={{ color: '#0f172a', fontSize: 12 }}>
                  {node.potassium !== undefined ? `${node.potassium} mg/kg` : '--'}
                </strong>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Soil Temp</span>
                  {renderProvisionalBadge('soilTemp')}
                </div>
                <strong style={{ color: '#0f172a', fontSize: 12 }}>
                  {node.soilTemp !== undefined ? `${node.soilTemp}°C` : '--'}
                </strong>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: '2px 0',
            }}
          >
            {isExpanded ? (
              <>Show fewer fields <ChevronUp style={{ width: 13, height: 13 }} /></>
            ) : (
              <>Show full 10-field telemetry (NPK, Soil Temp) <ChevronDown style={{ width: 13, height: 13 }} /></>
            )}
          </button>
        </>
      )}

      {/* ── Footer: Unified Recency Clock & Raw ISO ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 6,
          borderTop: '1px solid #f1f5f9',
          fontSize: 11,
          color: '#64748b',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock style={{ width: 12, height: 12, color: isOnline ? '#16a34a' : '#94a3b8' }} />
          <span>{evaluated.relativeTimeText}</span>
        </span>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>
          {node.lastUpdated ? new Date(node.lastUpdated).toLocaleTimeString() : 'No ping'}
        </span>
      </div>
    </div>
  );
};

export default UnifiedSensorCard;
