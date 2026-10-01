import React from 'react';
import { Info, ArrowRight, Radio, Power, Zap, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgriStore } from '../../context/AgriStore';

export const PrototypeModeBanner: React.FC = () => {
  const { 
    isAdmin, 
    isDemoTelemetryActive, 
    toggleDemoTelemetry, 
    telemetryMode, 
    setTelemetryMode,
    isFirebaseLive,
    lastFirebasePing
  } = useAgriStore();

  const isLive = telemetryMode === 'LIVE';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3 rounded-2xl border border-indigo-900/60 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl border shrink-0 ${
          isLive 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
            : isDemoTelemetryActive 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        }`}>
          {isLive ? <Activity className="w-4 h-4 text-emerald-400" /> : isDemoTelemetryActive ? <Radio className="w-4 h-4 text-cyan-400" /> : <Info className="w-4 h-4 text-indigo-400" />}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
              isLive
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : isDemoTelemetryActive 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800' 
                  : 'bg-indigo-900/80 text-indigo-300 border-indigo-700'
            }`}>
              {isLive ? 'LIVE FIREBASE STREAM ACTIVE' : (isDemoTelemetryActive ? 'SIMULATED STREAM ACTIVE' : 'PROTOTYPE MODE ACTIVE')}
            </span>
            <span className="text-xs font-bold text-slate-300">
              {isLive 
                ? (isFirebaseLive ? 'Live sensor telemetry streaming from Firebase Realtime Database.' : 'Listening to Firebase Node_2/data (asia-southeast1)...')
                : (isDemoTelemetryActive ? 'Real-time background demo telemetry generating to Supabase.' : 'Physical IoT hardware pending gateway connection.')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isLive ? (
              <span>FIREBASE RTDB STREAM — Live readings from Node_2 (Temp, Humidity, Lux, NPK, Soil EC/Moisture) persisted to Supabase (<code className="text-emerald-300 font-mono text-[10px]">public.telemetry_observations</code>).</span>
            ) : isDemoTelemetryActive ? (
              <span>DEMO TELEMETRY ACTIVE — Values are generated for prototype testing and persisted to Supabase (<code className="text-cyan-300 font-mono text-[10px]">dataSource = "SIMULATED"</code>).</span>
            ) : (
              <span>System is executing on authoritative manually entered observations (<code className="text-indigo-300 font-mono text-[10px]">dataSource = "MANUAL_PROTOTYPE"</code>).</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0 flex-wrap">
        {/* Dual Mode Switcher */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-indigo-900/60 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setTelemetryMode('DEMO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
              telemetryMode === 'DEMO'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Demo Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setTelemetryMode('LIVE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
              telemetryMode === 'LIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Live Firebase</span>
          </button>
        </div>

        {isAdmin && telemetryMode === 'DEMO' && (
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-indigo-900/60 text-xs font-bold">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Sim:</span>
            <button
              type="button"
              onClick={() => toggleDemoTelemetry(!isDemoTelemetryActive)}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-1 cursor-pointer ${
                isDemoTelemetryActive
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{isDemoTelemetryActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        )}

        {isAdmin && (
          <Link
            to="/manual-telemetry"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
          >
            <span>Manual Entry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default PrototypeModeBanner;

