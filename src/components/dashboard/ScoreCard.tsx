import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FarmHealthGaugeProps {
  score: number;
  maxScore?: number;
  statusText?: string;
  description?: string;
  statusType?: 'Good' | 'Attention' | 'Critical' | 'Offline';
  isLive?: boolean;
  lastSeenText?: string;
}

export const FarmHealthGauge: React.FC<FarmHealthGaugeProps> = ({
  score = 82,
  maxScore = 100,
  statusText = 'Good',
  description = 'Overall farm operations are stable with automated fertigation.',
  statusType = 'Good',
  isLive = true,
  lastSeenText,
}) => {
  const radius = 56;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / maxScore) * circumference;

  const colorMap = {
    Good: { stroke: '#16a34a', bg: '#dcfce7', text: '#15803d' },
    Attention: { stroke: '#d97706', bg: '#fef3c7', text: '#b45309' },
    Critical: { stroke: '#dc2626', bg: '#fee2e2', text: '#b91c1c' },
    Offline: { stroke: '#94a3b8', bg: '#f1f5f9', text: '#64748b' },
  };

  const theme = colorMap[statusType] || colorMap.Good;

  return (
    <div
      style={{
        background: isLive ? '#ffffff' : '#f8fafc',
        border: `1px solid ${isLive ? '#e2e8f0' : '#cbd5e1'}`,
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        opacity: isLive ? 1 : 0.85,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Farm Health Score
        </h3>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: theme.bg,
            color: theme.text,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.stroke, display: 'inline-block' }} />}
          {statusText}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '8px 0' }}>
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <svg height="120" width="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              stroke="#e2e8f0"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx="60"
              cy="60"
            />
            <circle
              stroke={theme.stroke}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx="60"
              cy="60"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, color: isLive ? '#0f172a' : '#64748b', lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
              /{maxScore}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            Status: <span style={{ color: theme.text }}>{statusText}</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, margin: 0 }}>
            {description}
          </p>
          {lastSeenText && (
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
              {lastSeenText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface SubScoreCardProps {
  title: string;
  score: number;
  status: string;
  description: string;
  icon: LucideIcon;
  statusType?: 'Good' | 'Attention' | 'Critical' | 'Offline';
  isLive?: boolean;
  lastSeenText?: string;
}

export const SubScoreCard: React.FC<SubScoreCardProps> = ({
  title,
  score,
  status,
  description,
  icon: Icon,
  statusType = 'Good',
  isLive = true,
  lastSeenText,
}) => {
  const colorMap = {
    Good: { accent: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    Attention: { accent: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
    Critical: { accent: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
    Offline: { accent: '#64748b', bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
  };

  const theme = colorMap[statusType] || colorMap.Good;

  return (
    <div
      style={{
        background: isLive ? '#ffffff' : '#f8fafc',
        border: `1px solid ${isLive ? '#e2e8f0' : '#e2e8f0'}`,
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.15s ease',
        opacity: isLive ? 1 : 0.82,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '10px',
              background: theme.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.accent,
            }}
          >
            <Icon style={{ width: 18, height: 18 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: isLive ? '#0f172a' : '#64748b' }}>
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: isLive ? '#0f172a' : '#64748b' }}>
            {score}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>/100</span>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '6px',
              background: theme.bg,
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isLive ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent }} /> : null}
            {status}
          </span>
          {lastSeenText && (
            <span style={{ fontSize: 9, color: '#94a3b8' }}>
              {lastSeenText}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#64748b',
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};
