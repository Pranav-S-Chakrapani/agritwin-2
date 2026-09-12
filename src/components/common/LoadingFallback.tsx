import React from 'react';
import { Sprout } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  subMessage?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading farm telemetry & digital twin...',
  subMessage = 'Synchronizing with Supabase real-time cloud',
}) => {
  return (
    <div style={{
      minHeight: '320px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      gap: '16px',
    }}>
      <div style={{
        position: 'relative',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid var(--color-primary-border, #bbf7d0)',
          borderTopColor: 'var(--color-primary, #16a34a)',
          animation: 'spin 1s linear infinite',
        }} />
        <Sprout style={{ width: '28px', height: '28px', color: 'var(--color-primary, #16a34a)' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--color-text-primary, #0f172a)',
          marginBottom: '4px',
        }}>
          {message}
        </h3>
        <p style={{
          fontSize: '12px',
          color: 'var(--color-text-muted, #94a3b8)',
        }}>
          {subMessage}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingFallback;
