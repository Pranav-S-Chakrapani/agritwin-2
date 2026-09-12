import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Sprout, ArrowRight } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center',
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-2xl, 20px)',
        padding: '48px 32px',
        boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.08))',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--color-primary-muted, #dcfce7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--color-primary, #16a34a)',
        }}>
          <Compass style={{ width: '36px', height: '36px' }} />
        </div>

        <span style={{
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '1px',
          color: 'var(--color-primary, #16a34a)',
          textTransform: 'uppercase',
        }}>
          404 &bull; Page Not Found
        </span>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 900,
          color: 'var(--color-text-primary, #0f172a)',
          marginTop: '8px',
          marginBottom: '12px',
        }}>
          Field Sector Uncharted
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary, #475569)',
          lineHeight: 1.6,
          marginBottom: '28px',
        }}>
          The page or plot telemetry route you requested does not exist or has been relocated to another sector.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'var(--color-primary, #16a34a)',
              color: '#ffffff',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
            }}
          >
            <Home style={{ width: '16px', height: '16px' }} />
            Back to Dashboard
          </Link>

          <Link
            to="/my-farms"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--color-surface-muted, #f1f5f9)',
              color: 'var(--color-text-primary, #0f172a)',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              border: '1px solid var(--color-border, #cbd5e1)',
            }}
          >
            <Sprout style={{ width: '16px', height: '16px', color: 'var(--color-primary, #16a34a)' }} />
            View My Farms
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
