import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff, LogIn, AlertCircle, User, Lock, ChevronRight, Sprout, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActivityLogger } from '../lib/activity-logger';

const DEMO_CREDS = [
  { email: 'admin@agritwin.com', password: 'admin123', label: 'Administrator', role: 'Full access', color: '#6366f1', bg: '#ede9fe' },
  { email: 'farmer@agritwin.com', password: 'farmer123', label: 'Farm Operator', role: 'Field access', color: '#16a34a', bg: '#f0fdf4' },
];

const FEATURES = [
  { icon: <BarChart3 style={{ width: 18, height: 18 }} />, text: 'Real-time sensor analytics' },
  { icon: <Sprout style={{ width: 18, height: 18 }} />, text: 'AI-powered crop health insights' },
  { icon: <Shield style={{ width: 18, height: 18 }} />, text: 'Multi-farm digital twin system' },
];

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const profile = await login(email, password);
      if (profile) ActivityLogger.userLogin(profile.full_name, profile.email);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (cred: typeof DEMO_CREDS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setLoading(true);
    setError('');
    try {
      const profile = await login(cred.email, cred.password);
      if (profile) ActivityLogger.userLogin(profile.full_name, profile.email);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'Inter, sans-serif',
      background: 'var(--color-bg)',
    }}>
      {/* Left hero panel */}
      <div style={{
        flex: 1,
        display: 'none',
        background: 'linear-gradient(160deg, #052e16 0%, #14532d 45%, #0d9488 100%)',
        padding: '60px 48px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }} id="at-login-hero">
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle at 20% 80%, #22c55e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0d9488 0%, transparent 50%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{
              width: 42,
              height: 42,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <Leaf style={{ width: 22, height: 22, color: '#86efac' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>AgriTwin</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Digital Twin Platform</div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
              Data Today.<br />Better Harvests<br />Tomorrow.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 340 }}>
              Monitor your farms in real-time with AI-powered insights, precision sensors, and digital twin technology.
            </p>
          </div>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.85)' }}>
                <div style={{
                  width: 36, height: 36,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#86efac',
                  flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            AgriTwin Digital Twin Platform &copy; 2025 &bull; IIIT Dharwad
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        background: 'var(--color-surface)',
        boxShadow: '-1px 0 0 var(--color-border)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Logo for mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-green)',
            }}>
              <Leaf style={{ width: 20, height: 20, color: 'white' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>AgriTwin</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Digital Twin Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 32 }}>
            Sign in to monitor your farm
          </p>

          {error && (
            <div className="at-alert danger" style={{ marginBottom: 20 }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label className="at-label" htmlFor="at-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <User style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: 'var(--color-text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="at-email"
                  className="at-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  style={{ paddingLeft: 38, height: 44 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="at-label" htmlFor="at-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: 'var(--color-text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="at-password"
                  className="at-input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ paddingLeft: 38, paddingRight: 42, height: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', padding: 0, display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            <button
              id="at-login-btn"
              type="submit"
              disabled={loading}
              className="at-btn at-btn-primary at-btn-lg"
              style={{ width: '100%', height: 46, marginTop: 4, justifyContent: 'center', fontSize: 15, fontWeight: 700 }}
            >
              {loading
                ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <><LogIn style={{ width: 17, height: 17 }} /> Sign In to Dashboard</>
              }
            </button>
          </form>

          {/* Demo access */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Quick demo access
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_CREDS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => handleDemoLogin(cred)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-muted)'; e.currentTarget.style.borderColor = cred.color; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: cred.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <User style={{ width: 15, height: 15, color: cred.color }} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{cred.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{cred.role}</div>
                    </div>
                  </div>
                  <ChevronRight style={{ width: 15, height: 15, color: 'var(--color-text-muted)' }} />
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 28 }}>
            New user?{' '}
            <Link
              to="/signup"
              style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          #at-login-hero { display: flex !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;
