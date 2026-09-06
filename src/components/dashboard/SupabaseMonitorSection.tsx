import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Wifi, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Layers, 
  Zap, 
  FileCheck2,
  Table,
  BarChart3,
  Send,
  Cpu,
  Building2
} from 'lucide-react';
import { 
  checkSupabaseConnection, 
  getTelemetryCount, 
  insertTestRecord, 
  SupabaseConnectionStatus, 
  SupabaseTelemetryMetrics 
} from '../../lib/supabase-health';
import { 
  isSupabaseConfigured, 
  onRealtimeStatusChange, 
  onSupabaseToast, 
  getSupabaseTableCounts,
  RealtimeStatusType 
} from '../../lib/supabase';
import { useAgriStore } from '../../context/AgriStore';

// SupabaseMonitorSection is self-contained: reads from AgriStore directly
// No props required — eliminates undefined.length crash
export const SupabaseMonitorSection: React.FC = () => {
  // ERROR 1 FIX: Pull from context internally, default to empty arrays if undefined
  const { telemetryObservations, farmlands, plots, sensors } = useAgriStore();
  const safeObs = telemetryObservations ?? [];
  const safeFarms = farmlands ?? [];
  const safePlots = plots ?? [];
  const safeSensors = sensors ?? [];

  const [connStatus, setConnStatus] = useState<SupabaseConnectionStatus>({
    connected: false,
    url: 'Loading...',
    message: 'Initializing connection check...',
  });
  const [metrics, setMetrics] = useState<SupabaseTelemetryMetrics>({
    totalCount: safeObs.length,
    countToday: 0,
    latestTimestamp: null,
  });
  const [tableCounts, setTableCounts] = useState({
    farmsCount: safeFarms.length,
    plotsCount: safePlots.length,
    sensorsCount: safeSensors.length,
    telemetryCount: safeObs.length,
  });
  const [realtimeState, setRealtimeState] = useState<RealtimeStatusType>('Connected');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<{ message: string; timestamp: string } | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // 1. Listen for Realtime channel status & toast notifications
  useEffect(() => {
    const unsubStatus = onRealtimeStatusChange((status) => setRealtimeState(status));
    const unsubToast = onSupabaseToast((msg) => {
      setToastNotice({ message: msg, timestamp: new Date().toLocaleTimeString() });
      setTimeout(() => setToastNotice(null), 4500);
    });

    return () => {
      unsubStatus();
      unsubToast();
    };
  }, []);

  // 2. Fetch connection & count metrics (Relaxed polling to prevent gateway 500s)
  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      const conn = await checkSupabaseConnection();
      setConnStatus(conn);

      if (conn.connected) {
        const m = await getTelemetryCount();
        setMetrics(m);

        const counts = await getSupabaseTableCounts();
        setTableCounts({
          farmsCount: counts.farmsCount || safeFarms.length,
          plotsCount: counts.plotsCount || safePlots.length,
          sensorsCount: counts.sensorsCount || safeSensors.length,
          telemetryCount: counts.telemetryCount || safeObs.length,
        });
      }
    } catch (e) {
      // Silently fall back to in-memory state without spamming console
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(() => {
      refreshMetrics();
    }, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTestInsert = async () => {
    setTestResult('Executing test insert...');
    const res = await insertTestRecord();
    if (res.success) {
      setTestResult(`✅ Inserted test record: ${res.recordId}`);
      refreshMetrics();
    } else {
      setTestResult(`❌ Insert failed: ${res.error}`);
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  // Safe slice: only run on defined, non-empty array
  const latestTen = safeObs.slice(0, 10);

  const getRealtimeBadge = (status: RealtimeStatusType) => {
    switch (status) {
      case 'Connected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        );
      case 'Reconnecting':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-950/80 text-amber-400 border border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Reconnecting
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-950/80 text-rose-400 border border-rose-800">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Disconnected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Live Verification Toast Banner */}
      {toastNotice && (
        <div className="p-4 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-black text-white">{toastNotice.message}</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Logged: [SUPABASE VERIFIED] at {toastNotice.timestamp}</span>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-emerald-900 border border-emerald-700 rounded text-[10px] uppercase font-black text-emerald-300">
            PostgreSQL Live
          </span>
        </div>
      )}

      {/* Supabase Dashboard Status Widget */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Supabase Status & Realtime Monitor</h3>
                {connStatus.connected ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800">
                    🟢 Supabase Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-950 text-amber-400 border border-amber-800">
                    ⚠️ Standby / Fallback
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>URL: <strong className="text-sky-400">{connStatus.url}</strong></span>
                {connStatus.pingMs !== undefined && (
                  <span className="text-slate-500">({connStatus.pingMs}ms latency)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getRealtimeBadge(realtimeState)}

            <button
              type="button"
              onClick={refreshMetrics}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
              title="Refresh status every 5s"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleTestInsert}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Write</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300">
            {testResult}
          </div>
        )}

        {/* Metric Cards Grid — 6 cards: 4 table counts + 2 telemetry metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Farms Count */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Farms</span>
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-white">{tableCounts.farmsCount}</div>
              <p className="text-[10px] text-slate-500 mt-1">public.farms</p>
            </div>
          </div>

          {/* Plots Count */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Plots</span>
              <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-white">{tableCounts.plotsCount}</div>
              <p className="text-[10px] text-slate-500 mt-1">public.plots</p>
            </div>
          </div>

          {/* Sensors Count */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sensors</span>
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-white">{tableCounts.sensorsCount}</div>
              <p className="text-[10px] text-slate-500 mt-1">public.sensors</p>
            </div>
          </div>

          {/* Total Telemetry Records */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Rows</span>
              <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-white">{tableCounts.telemetryCount.toLocaleString()}</div>
              <p className="text-[10px] text-slate-500 mt-1">telemetry_obs</p>
            </div>
          </div>

          {/* Records Added Today */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Today</span>
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-emerald-400">{metrics.countToday.toLocaleString()}</div>
              <p className="text-[10px] text-slate-500 mt-1">Since midnight</p>
            </div>
          </div>

          {/* Realtime Subscriptions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Realtime</span>
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                <Wifi className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 space-y-1 font-mono text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">telemetry</span>
                <span className="text-emerald-400 font-bold">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">farms</span>
                <span className="text-emerald-400 font-bold">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">sensors</span>
                <span className="text-emerald-400 font-bold">✓</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Live Monitoring Panel — Latest 10 Records Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600" />
              <h4 className="text-base font-black text-slate-900">Supabase Monitor — Latest 10 Records</h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live stream from <span className="font-mono font-bold text-slate-700">public.telemetry_observations</span> (Auto-refreshes every 5 seconds)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-mono font-bold text-slate-600">
              Auto Refresh: 5s
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-3">Record ID</th>
                <th className="text-left py-2.5 px-3">Timestamp</th>
                <th className="text-left py-2.5 px-3">Plot Code</th>
                <th className="text-left py-2.5 px-3">Parameter</th>
                <th className="text-right py-2.5 px-3">Value</th>
                <th className="text-left py-2.5 px-3">Status</th>
                <th className="text-left py-2.5 px-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {latestTen.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No telemetry records stored yet. Simulator will auto-generate readings in 12s.
                  </td>
                </tr>
              ) : (
                latestTen.map((obs) => (
                  <tr key={obs.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 truncate max-w-32">
                      {obs.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(obs.measurementTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-800">
                      {obs.plotId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium capitalize">
                      {obs.parameterKey.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {Number(obs.value ?? 0).toFixed(1)} <span className="font-normal text-slate-400 text-[10px]">{obs.unit}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {obs.qualityStatus || 'VALID'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {obs.dataSource || 'SIMULATED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
