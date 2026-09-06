import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  Trash2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Database,
  CheckCircle2,
  ShieldAlert,
  Info,
  Layers,
  Clock,
  Activity,
  Zap
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';

export const DeveloperTools: React.FC = () => {
  const {
    isDemoTelemetryActive,
    toggleDemoTelemetry,
    triggerTelemetrySimulationNow,
    clearSimulatedTelemetry,
    seedMultiFarmSystem,
    telemetryObservations,
    sensors,
    activeFarmland,
  } = useAgriStore();

  const [isSimulating, setIsSimulating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const handleRunSeeder = async () => {
    setSeeding(true);
    setStatusMessage({ text: 'Seeding 5 Farms, 25 Plots, 150 Sensors, 1000 Field Sensor Records...', type: 'warning' });
    try {
      const res = await seedMultiFarmSystem();
      setStatusMessage({ text: res.message || 'System reseeded successfully.', type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: `Seeding error: ${e?.message || 'Failed'}`, type: 'error' });
    } finally {
      setSeeding(false);
    }
  };

  const simulatedRecordsCount = telemetryObservations.filter(o => o.dataSource === 'SIMULATED').length;
  const liveValidRecordsCount = telemetryObservations.filter(o => o.dataSource !== 'SIMULATED' && o.qualityStatus !== 'SUSPECT').length;
  const suspectRecordsCount = telemetryObservations.filter(o => o.qualityStatus === 'SUSPECT').length;

  const handleManualSimulate = async () => {
    setIsSimulating(true);
    setStatusMessage({ text: 'Triggering instantaneous synthetic telemetry cycle...', type: 'warning' });
    try {
      await triggerTelemetrySimulationNow();
      setStatusMessage({ text: 'Generated and persisted synthetic batch to database.', type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: `Simulation error: ${e?.message || 'Failed'}`, type: 'error' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleToggleFeed = () => {
    if (!isDemoTelemetryActive) {
      // Opening confirmation modal
      setShowEnableModal(true);
    } else {
      toggleDemoTelemetry(false);
      setStatusMessage({ text: 'Demo synthetic telemetry feed paused.', type: 'warning' });
    }
  };

  const confirmEnableFeed = () => {
    setShowEnableModal(false);
    toggleDemoTelemetry(true);
    setStatusMessage({ text: 'Synthetic 10s telemetry generator active.', type: 'success' });
  };

  const executePurge = async () => {
    setPurgeLoading(true);
    try {
      const res = await clearSimulatedTelemetry();
      setShowPurgeModal(false);
      setStatusMessage({ text: res.message, type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: `Purge failed: ${e?.message || 'Error'}`, type: 'error' });
    } finally {
      setPurgeLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-purple-500/30 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              ADMINISTRATION &bull; DEVELOPER ENVIRONMENT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">Telemetry Simulator &amp; Developer Tools</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Isolated diagnostic testbench for simulating synthetic multi-node mesh broadcasts, physiological threshold clamping, and database purge utilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border text-xs font-black flex items-center gap-2 ${
            isDemoTelemetryActive 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isDemoTelemetryActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Feed: {isDemoTelemetryActive ? 'LIVE 10s STREAMING' : 'PAUSED'}</span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm animate-fadeIn ${
          statusMessage.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          statusMessage.type === 'warning' ? 'bg-amber-950 text-amber-200 border-amber-800' :
          'bg-rose-950 text-rose-200 border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-amber-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="font-mono text-[10px] text-slate-400 hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Data Health & Provenance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulated Records</span>
            <div className="text-2xl font-black text-purple-700 mt-1">{simulatedRecordsCount}</div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tagged with dataSource='SIMULATED'</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live Genuine / Seeded</span>
            <div className="text-2xl font-black text-emerald-950 mt-1">{liveValidRecordsCount}</div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Physical & Verified Valid Readings</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Suspect Quality Flags</span>
            <div className={`text-2xl font-black mt-1 ${suspectRecordsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {suspectRecordsCount}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Ingestion Bounds Violations (Filtered)</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel 1: Simulation Controls */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              Synthetic Telemetry Generator
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Controls automated background telemetry bursts to Supabase table <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">telemetry_observations</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">10-Second Recurring Feed:</span>
              <span className={`font-black ${isDemoTelemetryActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isDemoTelemetryActive ? 'ENABLED (RUNNING)' : 'DISABLED (STANDBY)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">Targeted Sensors:</span>
              <span className="font-bold text-slate-900">{sensors.length} Nodes</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">Physical Clamps Active:</span>
              <span className="text-emerald-700 font-black">pH [3.5-9.0], Temp [15-42°C], Moisture [0-100%]</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleToggleFeed}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                isDemoTelemetryActive
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isDemoTelemetryActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isDemoTelemetryActive ? 'PAUSE 10s STREAM' : 'START 10s STREAM'}</span>
            </button>

            <button
              onClick={handleManualSimulate}
              disabled={isSimulating}
              className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Generating...' : 'TRIGGER 1 CYCLE'}</span>
            </button>
          </div>
        </div>

        {/* Panel 2: Reset & Database Purge */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Reset &amp; Purge Synthetic Data
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Restore the database to a completely clean, authentic baseline before conducting investor demos or real IoT field rollouts.
            </p>
          </div>

          <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 text-xs text-rose-900 space-y-2">
            <div className="font-extrabold flex items-center gap-1.5 text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Pre-Demo Clean Slate Protocol
            </div>
            <p className="text-rose-800/80 leading-relaxed text-[11px]">
              Purging deletes all records tagged with <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">data_source = 'SIMULATED'</code> across both the local reactive session and Supabase Cloud. Genuine sensor hardware broadcasts are preserved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRunSeeder}
              disabled={seeding}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{seeding ? 'Seeding 5 Farms & 150 Sensors...' : 'RE-SEED 5 FARMS & FIXTURES'}</span>
            </button>

            <button
              onClick={() => setShowPurgeModal(true)}
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Trash2 className="w-4 h-4" />
              <span>PURGE SIMULATED ({simulatedRecordsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL: ENABLE SIMULATOR */}
      {showEnableModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900">Enable Synthetic Stream?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This writes synthetic data tagged <strong>SIMULATED</strong> to the live database for testing. <strong>Do not enable in a real demo or during real IoT field deployments.</strong>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEnableModal(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEnableFeed}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 transition-all"
              >
                I Understand, Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: PURGE SIMULATED RECORDS */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900">Purge {simulatedRecordsCount} Simulated Records?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will permanently remove all synthetic telemetry records from Supabase and local memory. Any plots without active hardware sensors will transition to a clean state.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                disabled={purgeLoading}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executePurge}
                disabled={purgeLoading}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                {purgeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{purgeLoading ? 'Purging...' : 'Purge All Records'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperTools;
