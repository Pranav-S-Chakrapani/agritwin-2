import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff, LogIn, AlertCircle, User, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActivityLogger } from '../lib/activity-logger';

const DEMO_CREDS = [
  { email: 'admin@agritwin.com', password: 'admin123', label: 'Admin', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { email: 'farmer@agritwin.com', password: 'farmer123', label: 'Farmer', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
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
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const profile = await login(email, password);
      if (profile) {
        ActivityLogger.userLogin(profile.full_name, profile.email);
      }
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(msg);
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
      if (profile) {
        ActivityLogger.userLogin(profile.full_name, profile.email);
      }
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl shadow-2xl mb-4">
            <Leaf className="w-10 h-10 text-slate-950 fill-current" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">AgriTwin</h1>
          <p className="text-emerald-400 font-medium mt-1">Smart Farm Digital Twin Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-1">Welcome Back ??</h2>
          <p className="text-slate-500 text-sm mb-6">Sign in to monitor your farm</p>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In to My Farm
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">Quick demo access</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {DEMO_CREDS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => handleDemoLogin(cred)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition-all hover:shadow-md cursor-pointer ${cred.color}`}
                >
                  <span>{cred.label} Demo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            New user?{' '}
            <Link to="/signup" className="text-emerald-600 font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          AgriTwin Digital Twin Platform &copy; 2025 &bull; IIIT Dharwad
        </p>
      </div>
    </div>
  );
};

export default Login;
