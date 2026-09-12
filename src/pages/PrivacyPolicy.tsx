import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, Eye, Database, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{
      maxWidth: '840px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <Link to="/" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--color-primary, #16a34a)',
        fontWeight: 600,
        fontSize: '13px',
        textDecoration: 'none',
        marginBottom: '24px',
      }}>
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        Back to Dashboard
      </Link>

      <div style={{
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-2xl, 20px)',
        padding: '36px',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--color-primary-muted, #dcfce7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary, #16a34a)',
          }}>
            <Shield style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
              AgriTwin Privacy Policy
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)' }}>
              Last updated: September 2026 &bull; Production Enterprise Standard
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--color-text-secondary, #475569)', lineHeight: 1.7, fontSize: '14px' }}>
          <section>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', marginBottom: '8px' }}>
              1. Commitment to Agricultural Data Privacy
            </h2>
            <p>
              AgriTwin respects farmer data sovereignty. All microclimate telemetry, soil parameters, satellite vegetative indexes, and crop yield estimations generated on your farmland belong exclusively to your farming enterprise.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', marginBottom: '8px' }}>
              2. Data Collected & Telemetry Ingestion
            </h2>
            <p>
              We collect soil moisture, air temperature, relative humidity, soil pH, N-P-K nutrient values, camera diagnostic photographs, and field management log events to construct your biophysical digital twin.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', marginBottom: '8px' }}>
              3. Database Security & Supabase Cloud
            </h2>
            <p>
              Data is encrypted in transit (TLS 1.3/HTTPS) and at rest within Supabase PostgreSQL multi-tenant infrastructure protected by Row Level Security (RLS) policies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', marginBottom: '8px' }}>
              4. Contact Privacy Officer
            </h2>
            <p>
              For inquiries regarding telemetry export, record deletion, or data protection audits, contact our precision agriculture security team at <a href="mailto:privacy@agritwin.com" style={{ color: 'var(--color-primary, #16a34a)', fontWeight: 600 }}>privacy@agritwin.com</a> or phone <a href="tel:+918362255000" style={{ color: 'var(--color-primary, #16a34a)', fontWeight: 600 }}>+91 836 225 5000</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
