import React from 'react';
import { Check, Clock, AlertTriangle, Play } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming' | 'alert';
  detail?: string;
}

interface FarmTimelineProps {
  events?: TimelineEvent[];
}

export const FarmTimeline: React.FC<FarmTimelineProps> = ({
  events = [
    { id: '1', time: '06:00 AM', title: 'Drip Irrigation', status: 'completed', detail: 'Zone 1 & 2 completed' },
    { id: '2', time: '09:30 AM', title: 'Telemetry Sync', status: 'completed', detail: 'All 8 nodes connected' },
    { id: '3', time: '12:15 PM', title: 'Thermal Scan', status: 'completed', detail: 'Canopy temperature normal' },
    { id: '4', time: '03:45 PM', title: 'Moisture Alert', status: 'alert', detail: 'Zone 3 dropped below 22%' },
    { id: '5', time: '06:00 PM', title: 'Scheduled Flush', status: 'upcoming', detail: 'Fertigation cycle 2' },
  ],
}) => {
  return (
    <div
      style={{
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-xl, 16px)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock style={{ width: 16, height: 16, color: '#16a34a' }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', margin: 0 }}>
            Farm Timeline
          </h3>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
          Today's Field Activity
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          overflowX: 'auto',
          paddingBottom: 8,
          gap: 12,
        }}
      >
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const statusColors = {
            completed: { bg: '#dcfce7', text: '#15803d', line: '#16a34a', icon: Check },
            current: { bg: '#e0f2fe', text: '#0369a1', line: '#0284c7', icon: Play },
            alert: { bg: '#fee2e2', text: '#b91c1c', line: '#dc2626', icon: AlertTriangle },
            upcoming: { bg: '#f1f5f9', text: '#64748b', line: '#cbd5e1', icon: Clock },
          };

          const color = statusColors[event.status] || statusColors.upcoming;
          const Icon = color.icon;

          return (
            <div
              key={event.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 110,
                position: 'relative',
                flex: 1,
              }}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    position: 'absolute',
                    top: 13,
                    left: '50%',
                    width: '100%',
                    height: 2,
                    background: event.status === 'completed' ? '#16a34a' : '#e2e8f0',
                    zIndex: 1,
                  }}
                />
              )}

              {/* Node Icon */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: color.bg,
                  color: color.text,
                  border: `2px solid ${color.text}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  marginBottom: 6,
                }}
              >
                <Icon style={{ width: 12, height: 12 }} />
              </div>

              {/* Time */}
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>
                {event.time}
              </span>

              {/* Event Name */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #0f172a)',
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {event.title}
              </span>

              {/* Detail */}
              {event.detail && (
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--color-text-secondary, #475569)',
                    textAlign: 'center',
                    marginTop: 2,
                    lineHeight: 1.2,
                  }}
                >
                  {event.detail}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
