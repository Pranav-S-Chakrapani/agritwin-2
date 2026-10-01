import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, ArrowRight } from 'lucide-react';

export interface AlertCardProps {
  id: string;
  title: string;
  description: string;
  time: string;
  severity: 'critical' | 'warning' | 'info' | 'attention';
  actionLabel?: string;
  onAction?: (id: string) => void;
  zoneName?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  id,
  title,
  description,
  time,
  severity,
  actionLabel = 'Inspect',
  onAction,
  zoneName,
}) => {
  const severityConfig = {
    critical: {
      border: '#fecaca',
      bg: '#fff5f5',
      badgeBg: '#fee2e2',
      badgeText: '#991b1b',
      icon: AlertTriangle,
      iconColor: '#dc2626',
      btnBg: '#dc2626',
      btnHover: '#b91c1c',
      btnText: '#ffffff',
    },
    warning: {
      border: '#fde68a',
      bg: '#fffdf5',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      icon: AlertCircle,
      iconColor: '#d97706',
      btnBg: '#d97706',
      btnHover: '#b45309',
      btnText: '#ffffff',
    },
    attention: {
      border: '#fed7aa',
      bg: '#fffaf5',
      badgeBg: '#ffedd5',
      badgeText: '#9a3412',
      icon: AlertCircle,
      iconColor: '#ea580c',
      btnBg: '#ea580c',
      btnHover: '#c2410c',
      btnText: '#ffffff',
    },
    info: {
      border: '#e2e8f0',
      bg: '#f8fafc',
      badgeBg: '#f1f5f9',
      badgeText: '#475569',
      icon: Info,
      iconColor: '#64748b',
      btnBg: '#f1f5f9',
      btnHover: '#e2e8f0',
      btnText: '#334155',
    },
  };

  const config = severityConfig[severity] || severityConfig.info;
  const Icon = config.icon;

  return (
    <div
      style={{
        background: 'var(--color-surface, #ffffff)',
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '6px',
              background: config.badgeBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: config.iconColor,
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: 15, height: 15 }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
              {title}
            </div>
            {zoneName && (
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
                {zoneName}
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted, #64748b)', whiteSpace: 'nowrap' }}>
          {time}
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-secondary, #475569)', lineHeight: 1.35, margin: 0 }}>
        {description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          onClick={() => onAction && onAction(id)}
          style={{
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: '6px',
            background: config.btnBg,
            color: config.btnText,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'background 0.15s ease',
          }}
        >
          <span>{actionLabel}</span>
          <ArrowRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
};
