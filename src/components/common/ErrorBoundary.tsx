import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[AgriTwin ErrorBoundary] Caught error in ${this.props.moduleName || 'App'}:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-danger-border, #fecaca)',
            borderRadius: 'var(--radius-2xl, 20px)',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-danger-bg, #fef2f2)',
              color: 'var(--color-danger, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertTriangle style={{ width: '28px', height: '28px' }} />
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--color-text-primary, #0f172a)',
              marginBottom: '8px',
            }}>
              Temporary System Pause
            </h2>

            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary, #475569)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              {this.props.moduleName
                ? `An issue occurred while loading the ${this.props.moduleName} module. Your farm data and live sensor records remain safely stored.`
                : 'A display error occurred. Your farm telemetry and records are safe in Supabase cloud.'}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '20px',
            }}>
              <button
                onClick={this.handleReset}
                className="at-btn at-btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Refresh Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="at-btn at-btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Home style={{ width: '16px', height: '16px' }} />
                Return to Dashboard
              </button>
            </div>

            {this.state.error && (
              <details style={{
                textAlign: 'left',
                marginTop: '16px',
                padding: '12px',
                background: 'var(--color-surface-muted, #f8fafc)',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'var(--color-text-muted, #94a3b8)',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-text-secondary, #64748b)' }}>
                  Technical Details
                </summary>
                <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap', color: '#dc2626' }}>
                  {this.state.error.toString()}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
