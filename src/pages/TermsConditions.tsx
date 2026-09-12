import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const TermsConditions: React.FC = () => {
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
            <FileText style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
              AgriTwin Terms of Service
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)' }}>
              Standard SaaS Service Level Agreement &bull; September 2026
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--color-text-secondary, #475569)', lineHeight: 1.7, fontSize: '14px' }}>
          <section>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', marginBottom: '8px' }}>
              1. Platform Usage & Scope
            </h2>
            <p>
              AgriTwin provides precision IoT telemetry visualization, biophysical digital twin simulations, Gemini AI agronomic diagnosis, and automated irrigation management for registered farm properties and plots.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', marginBottom: '8px' }}>
              2. Sensor Data Integrity & Actuation
            </h2>
            <p>
              Automated actuator controls (drip solenoids, canopy fans, fertigation injectors) are assisted advisory systems. Operators retain final responsibility for on-field physical valve safety and compliance with local water regulations.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', marginBottom: '8px' }}>
              3. Service Level & Support
            </h2>
            <p>
              For enterprise deployments, technical support is available 24/7 via <a href="mailto:support@agritwin.com" style={{ color: 'var(--color-primary, #16a34a)', fontWeight: 600 }}>support@agritwin.com</a> or phone <a href="tel:+918362255000" style={{ color: 'var(--color-primary, #16a34a)', fontWeight: 600 }}>+91 836 225 5000</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
