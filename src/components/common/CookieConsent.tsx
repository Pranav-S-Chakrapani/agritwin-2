import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'agritwin_cookie_consent_accepted';

export const CookieConsent: React.FC = () => {
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!accepted) {
        // Small delay before showing so it doesn't pop aggressively
        const timer = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        maxWidth: '520px',
        zIndex: 9999,
        margin: '0 auto',
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        fontFamily: 'Inter, sans-serif',
      }}
      role="region"
      aria-label="Cookie consent banner"
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--color-primary-muted, #dcfce7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary, #16a34a)',
          flexShrink: 0,
        }}
      >
        <ShieldCheck style={{ width: '20px', height: '20px' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary, #475569)', margin: 0, lineHeight: 1.5 }}>
          AgriTwin uses local telemetry storage & analytical cookies to enhance your digital twin monitoring experience.{' '}
          <Link to="/privacy" style={{ color: 'var(--color-primary, #16a34a)', fontWeight: 600, textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleAccept}
          className="at-btn at-btn-primary"
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Accept
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Dismiss cookie notice"
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
