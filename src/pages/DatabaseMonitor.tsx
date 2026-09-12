import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Activity,
  Server,
  Zap,
  HardDrive,
  Layers,
  ArrowUpRight,
  Wifi,
  ShieldCheck,
  Clock,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { checkSupabaseConnection, SupabaseConnectionStatus } from '../lib/supabase-health';
import { getSupabaseTableCounts, isSupabaseConfigured } from '../lib/supabase';
import { SensorProvenance } from '../components/common/SensorProvenance';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { exportTelemetry } from '../lib/csv-exporter';

export const DatabaseMonitor: React.FC = () => {
  const {
    farmlands,
    plots,
    sensors,
    telemetryObservations,
    fieldActivities,
    alerts,
    seedMultiFarmSystem,
    isDemoTelemetryActive,
    toggleDemoTelemetry,
  } = useAgriStore();

  const [connStatus, setConnStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [tableCounts, setTableCounts] = useState({
    farmsCount: farmlands.length,
    plotsCount: plots.length,
    sensorsCount: sensors.length,
    telemetryCount: telemetryObservations.length,
    activityCount: fieldActivities.length,
    alertsCount: alerts.length,
  });
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    const start = performance.now();
    const status = await checkSupabaseConnection();
    const latency = Math.round(performance.now() - start);
    setDbLatency(latency);
    setConnStatus(status);
    setLastPingTime(Date.now());

    const counts = await getSupabaseTableCounts();
    setTableCounts({
      farmsCount: counts.farmsCount || farmlands.length,
      plotsCount: counts.plotsCount || plots.length,
      sensorsCount: counts.sensorsCount || sensors.length,
      telemetryCount: counts.telemetryCount || telemetryObservations.length,
      activityCount: counts.activityCount || fieldActivities.length,
      alertsCount: counts.alertsCount || alerts.length,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [farmlands.length, plots.length, sensors.length, telemetryObservations.length]);

  const handleRunSeeder = async () => {
    setSeeding(true);
    setSeedMessage('Seeding 5 Farms, 25 Plots, 150 Sensors, 1000 Telemetry Records to Supabase...');
    try {
      const res = await seedMultiFarmSystem();
      setSeedMessage(res.message);
      await fetchMetrics();
    } catch (err: any) {
      setSeedMessage(`Seeding completed into memory store: ${err?.message || 'Done'}`);
    } finally {
      setSeeding(false);
    }
  };

  const onlineSensors = sensors.filter((s) => s.status === 'Online').length;
  const offlineSensors = sensors.filter((s) => s.status === 'Offline').length;
  const latest20Telemetry = telemetryObservations.slice(0, 20);
  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              System Diagnostics &amp; Health
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight">Production System Monitor</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Live infrastructure diagnostics for Supabase database tables, WebSocket realtime channels, sensor transceivers, and telemetry latency.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Diagnostics
          </button>
          <button
            onClick={handleRunSeeder}
            disabled={seeding}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            Seed Database
          </button>
        </div>
      </div>

      {seedMessage && (
        <div className="bg-emerald-950 text-emerald-200 border border-emerald-800 rounded-2xl p-4 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{seedMessage}</span>
          </div>
          <button onClick={() => setSeedMessage(null)} className="text-emerald-400 hover:text-white font-mono text-[10px] cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* -- 1. INFRASTRUCTURE HEALTH STATUS CARDS ------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supabase Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Database Engine</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-lg font-black text-slate-900">
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Memory Mode'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isSupabaseConfigured ? 'PostgreSQL schema verified' : 'Standby mode & fallback active'}
          </p>
        </div>

        {/* Realtime Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Telemetry Stream</span>
            <Radio className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isDemoTelemetryActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-lg font-black text-slate-900">
              {isDemoTelemetryActive ? 'Broadcasting (10s)' : 'Stream Paused'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isDemoTelemetryActive ? 'Multi-channel generator active' : 'Click start in header to stream'}
          </p>
        </div>

        {/* Database Latency */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Response Latency</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {dbLatency !== null ? `${dbLatency} ms` : 'Testing...'}
          </div>
          <p className="text-[11px] text-slate-500">
            Round-trip query latency
          </p>
        </div>

        {/* Last Synchronized */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Last Synced</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {lastPingTime ? new Date(lastPingTime).toLocaleTimeString() : 'Pending'}
          </div>
          <p className="text-[11px] text-slate-500">
            Auto-polling every 10s
          </p>
        </div>
      </div>
      {/* -- 2. DATABASE TABLE METRICS ------------------------------------ */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <HardDrive className="w-4 h-4 text-emerald-600" />
          Table Volume &amp; Record Counts
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block">farms</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">{tableCounts.farmsCount}</strong>
            <span className="text-[10px] text-emerald-600 font-bold">Farms</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block">plots</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">{tableCounts.plotsCount}</strong>
            <span className="text-[10px] text-teal-600 font-bold">Plots</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block">sensors</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">{tableCounts.sensorsCount}</strong>
            <span className="text-[10px] text-indigo-600 font-bold">{onlineSensors} Online</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block">telemetry</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">{tableCounts.telemetryCount}</strong>
            <span className="text-[10px] text-purple-600 font-bold">Observations</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block">activity_log</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">{tableCounts.activityCount}</strong>
            <span className="text-[10px] text-amber-600 font-bold">Events</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 block">alerts</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">{tableCounts.alertsCount}</strong>
            <span className="text-[10px] text-rose-600 font-bold">Alert Records</span>
          </div>
        </div>
      </div>

      {/* -- 3. RECENT TELEMETRY SAMPLES --------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Live Ingested Telemetry Feed (Latest {latest20Telemetry.length})
          </h2>
          <button
            onClick={() => exportTelemetry(telemetryObservations)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Telemetry CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Farm</th>
                <th className="py-2.5 px-3">Plot Code</th>
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latest20Telemetry.map((obs) => (
                <tr key={obs.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {new Date(obs.measurementTimestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{obs.farmId}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{obs.plotId}</td>
                  <td className="py-2.5 px-3 text-slate-700">{obs.displayName || obs.parameterKey}</td>
                  <td className="py-2.5 px-3 font-black text-slate-900">
                    {obs.value} {obs.unit}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px]">
                      {obs.qualityStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <DataSourceBadge source={obs.dataSource} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatabaseMonitor;
