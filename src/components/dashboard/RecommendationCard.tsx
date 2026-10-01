import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

export interface RecommendationCardProps {
  id: string;
  title: string;
  description: string;
  priority?: 'High' | 'Medium' | 'Low';
  icon: LucideIcon;
  onClick?: (id: string) => void;
  zoneTag?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  id,
  title,
  description,
  priority = 'Medium',
  icon: Icon,
  onClick,
  zoneTag,
}) => {
  const priorityMap = {
    High: { badgeBg: '#fee2e2', text: '#b91c1c', iconBg: '#fef2f2', iconColor: '#dc2626' },
    Medium: { badgeBg: '#fef3c7', text: '#b45309', iconBg: '#fffbeb', iconColor: '#d97706' },
    Low: { badgeBg: '#f0fdf4', text: '#15803d', iconBg: '#ecfdf5', iconColor: '#16a34a' },
  };

  const theme = priorityMap[priority] || priorityMap.Medium;

  return (
    <div
      onClick={() => onClick && onClick(id)}
      style={{
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-xl, 16px)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        flex: 1,
        minWidth: 240,
      }}
      className="recommendation-card-hover"
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-lg, 10px)',
          background: theme.iconBg,
          color: theme.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: 20, height: 20 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }} className="at-truncate">
            {title}
          </span>
          {zoneTag && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '4px',
                background: '#f1f5f9',
                color: '#475569',
              }}
            >
              {zoneTag}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-secondary, #475569)',
            margin: 0,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {description}
        </p>
      </div>

      <ChevronRight style={{ width: 16, height: 16, color: 'var(--color-text-muted, #94a3b8)', flexShrink: 0 }} />
    </div>
  );
};
