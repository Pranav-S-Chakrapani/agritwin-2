import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Leaf, Eye, EyeOff, AlertCircle, ChevronRight,
  Mail, Lock, User, Phone, Building2, Shield, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgriStore } from '../context/AgriStore';
import { ActivityLogger } from '../lib/activity-logger';
import { UserRole } from '../types';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEP_LABELS = [
  'Email & Password',
  'Email Verification',
  'Your Profile',
  'Phone Verification',
  'Farm Assignment',
  'Terms & Conditions',
  'Account Ready!',
];

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin', desc: 'Full system access' },
  { value: 'farm_manager', label: 'Farm Manager', desc: 'Manage farms & reports' },
  { value: 'worker', label: 'Field Worker', desc: 'View & log field data' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access' },
];

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const SignUp: React.FC = () => {
  const { signup } = useAuth();
  const { farmlands } = useAgriStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Step 2
  const [sentEmailOtp] = useState(generateOtp());
  const [emailOtpInput, setEmailOtpInput] = useState('');

  // Step 3
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [phone, setPhone] = useState('');

  // Step 4
  const [phoneOtp] = useState(generateOtp());
  const [phoneOtpInput, setPhoneOtpInput] = useState('');

  // Step 5
  const [selectedFarmIds, setSelectedFarmIds] = useState<string[]>([]);

  // Step 6
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const nextStep = () => setStep((s) => Math.min(7, s + 1) as Step);
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPass) { setError('Passwords do not match.'); return; }
    nextStep();
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (emailOtpInput !== sentEmailOtp) {
      setError(`Invalid OTP. (Demo hint: ${sentEmailOtp})`);
      return;
    }
    nextStep();
  };

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    nextStep();
  };

  const handleStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (phoneOtpInput !== phoneOtp) {
      setError(`Invalid OTP. (Demo hint: ${phoneOtp})`);
      return;
    }
    nextStep();
  };

  const handleStep5 = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const handleStep6 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!termsAccepted || !privacyAccepted) {
      setError('Please accept both the Terms of Service and Privacy Policy to continue.');
      return;
    }
    nextStep();
  };

  const handleActivate = async () => {
    setLoading(true);
    setError('');
    try {
      await signup(email, password, fullName, role, selectedFarmIds, phone);
      ActivityLogger.userLogin(fullName, email);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Account creation failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleFarm = (farmId: string) => {
    setSelectedFarmIds((prev) =>
      prev.includes(farmId) ? prev.filter((id) => id !== farmId) : [...prev, farmId]
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl shadow-2xl mb-3">
            <Leaf className="w-8 h-8 text-slate-950 fill-current" />
          </div>
          <h1 className="text-3xl font-black text-white">Create Account</h1>
          <p className="text-emerald-400 text-sm mt-1">AgriTwin Smart Farm Platform</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4 px-1">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = (idx + 1) as Step;
            const done = step > stepNum;
            const active = step === stepNum;
            return (
              <div key={stepNum} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-white text-slate-900 ring-2 ring-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {done ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {idx < 6 && <div className={`flex-1 h-0.5 mx-1 w-4 ${ done ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-slate-400 mb-4">
          Step {step} of 7 &bull; {STEP_LABELS[step - 1]}
        </p>

        <div className="bg-white rounded-3xl shadow-2xl p-7">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* STEP 1: Email & Password */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 mb-4">🔐 Email &amp; Password</h2>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" required
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters" required
                    className="w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repeat your password" required
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 mt-2 cursor-pointer">
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 2: Email OTP */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 mb-1">📧 Email Verification</h2>
              <p className="text-slate-500 text-sm mb-4">We sent a 6-digit code to <strong>{email}</strong>.</p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
                ⚡ Demo mode &mdash; your OTP is: <strong className="font-black text-lg tracking-widest">{sentEmailOtp}</strong>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Enter 6-Digit Code</label>
                <input type="text" value={emailOtpInput} onChange={(e) => setEmailOtpInput(e.target.value)}
                  placeholder="000000" maxLength={6} required
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl text-slate-900 text-2xl font-black text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                Verify Email <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 3: Profile */}
          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 mb-4">👤 Your Profile</h2>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name" required
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210" required
                    className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Your Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        role === r.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <div className="font-bold text-sm text-slate-900">{r.label}</div>
                      <div className="text-xs text-slate-500">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 4: Phone OTP */}
          {step === 4 && (
            <form onSubmit={handleStep4} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 mb-1">📱 Phone Verification</h2>
              <p className="text-slate-500 text-sm mb-4">We sent a 6-digit code to <strong>{phone}</strong>.</p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
                ⚡ Demo mode &mdash; your OTP is: <strong className="font-black text-lg tracking-widest">{phoneOtp}</strong>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Enter 6-Digit Code</label>
                <input type="text" value={phoneOtpInput} onChange={(e) => setPhoneOtpInput(e.target.value)}
                  placeholder="000000" maxLength={6} required
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl text-slate-900 text-2xl font-black text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                Verify Phone <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 5: Farm Assignment */}
          {step === 5 && (
            <form onSubmit={handleStep5} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 mb-1">🚜 Farm Assignment</h2>
              <p className="text-slate-500 text-sm mb-4">Select the farms you will be managing.</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {farmlands.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">No farms available yet.</p>
                ) : (
                  farmlands.map((farm) => (
                    <label key={farm.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedFarmIds.includes(farm.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input type="checkbox" checked={selectedFarmIds.includes(farm.id)} onChange={() => toggleFarm(farm.id)}
                        className="w-4 h-4 accent-emerald-600" />
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          {farm.name}
                        </div>
                        <div className="text-xs text-slate-500">{farm.location} &bull; {farm.totalArea} {farm.unit}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 6: Terms */}
          {step === 6 && (
            <form onSubmit={handleStep6} className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 mb-1">📜 Terms &amp; Conditions</h2>
              <p className="text-slate-500 text-sm mb-4">Please review and accept our terms to continue.</p>
              <div className="h-40 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                <strong>AgriTwin Terms of Service</strong><br /><br />
                By using AgriTwin, you agree to use this platform solely for agricultural monitoring and management purposes.
                You are responsible for the accuracy of data you enter. All sensor readings and recommendations are for guidance.
                <br /><br />
                <strong>Privacy Policy</strong><br /><br />
                We collect farm and sensor telemetry to provide you with real-time digital twin analytics.
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-emerald-600" />
                <span className="text-sm text-slate-700 font-medium">I accept the <strong>Terms of Service</strong></span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-emerald-600" />
                <span className="text-sm text-slate-700 font-medium">I accept the <strong>Privacy Policy</strong></span>
              </label>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                <Shield className="w-5 h-5" /> Accept &amp; Continue
              </button>
            </form>
          )}

          {/* STEP 7: Activation */}
          {step === 7 && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 font-black text-3xl">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">You're All Set! 🎉</h2>
              <p className="text-slate-500 text-sm">Your account is verified and ready. Click below to activate and access your farm dashboard.</p>
              <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-bold text-slate-900">{email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-bold text-slate-900 capitalize">{role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Farms:</span>
                  <span className="font-bold text-slate-900">{selectedFarmIds.length || 'Will be assigned'}</span>
                </div>
              </div>
              <button
                onClick={handleActivate}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 cursor-pointer"
              >
                {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : '?? Activate My Account'}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
