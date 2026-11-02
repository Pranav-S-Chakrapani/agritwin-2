import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  History,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Sliders,
  TrendingUp,
  BarChart2,
  FileSpreadsheet,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  HistoricalSensorReading,
  CollectorExecutionLog,
} from '../types';
import {
  HISTORICAL_PARAMETERS_CONFIG,
  buildHistoricalCsv,
  getLocalHistoricalReadings,
  saveLocalHistoricalReadings,
} from '../lib/historical-collector';
import { fetchHistoricalReadingsFromSupabase, isSupabaseConfigured } from '../lib/supabase';

export const HistoricalAnalytics: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('Node_2');
  const [selectedSensorKey, setSelectedSensorKey] = useState<string>('airTemp');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '6m'>('6m');
  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState<HistoricalSensorReading[]>([]);
  const [collectorStatus, setCollectorStatus] = useState<any>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch server status & readings
  const refreshData = async () => {
    setLoading(true);
    try {
      // 1. Fetch server collector status
      try {
        const statusRes = await fetch('/api/historical/status');
        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          setCollectorStatus(statusJson);
        }
      } catch (e) {
        // server offline fallback
      }

      // 2. Fetch server readings for selected node & sensor
      let loadedReadings: HistoricalSensorReading[] = [];
      try {
        const queryParams = new URLSearchParams({
          nodeId: selectedNode,
          sensorKey: selectedSensorKey,
          limit: '1000',
        });
        const readRes = await fetch(`/api/historical/readings?${queryParams.toString()}`);
        if (readRes.ok) {
          const json = await readRes.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            loadedReadings = json.data;
          }
        }
      } catch (e) {
        // fallback
      }

      // 3. Fallback to Supabase if configured or local storage cache
      if (loadedReadings.length === 0 && isSupabaseConfigured) {
        loadedReadings = await fetchHistoricalReadingsFromSupabase({
          nodeId: selectedNode,
          sensorKey: selectedSensorKey,
          limit: 1000,
        });
      }

      if (loadedReadings.length === 0) {
        // Load fallback from localStorage
        const local = getLocalHistoricalReadings();
        loadedReadings = local.filter(
          (r) => (selectedNode === 'all' || r.node_id === selectedNode) &&
                 (selectedSensorKey === 'all' || r.sensor_key === selectedSensorKey)
        );
      } else {
        saveLocalHistoricalReadings(loadedReadings);
      }

      setReadings(loadedReadings);
    } catch (err) {
      console.warn('[HISTORICAL FETCH ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedNode, selectedSensorKey, timeRange]);

  // Trigger on-demand 5-minute snapshot
  const triggerManualCollector = async () => {
    setIsCollecting(true);
    try {
      const res = await fetch('/api/historical/collect-now', { method: 'POST' });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.warn('[TRIGGER ERROR]', e);
    } finally {
      setIsCollecting(false);
    }
  };

  // Filtered readings based on search and time range
  const filteredReadings = useMemo(() => {
    let list = [...readings];
    const now = Date.now();

    let cutoffMs = 180 * 24 * 60 * 60 * 1000; // 6 months default
    if (timeRange === '24h') cutoffMs = 24 * 60 * 60 * 1000;
    else if (timeRange === '7d') cutoffMs = 7 * 24 * 60 * 60 * 1000;
    else if (timeRange === '30d') cutoffMs = 30 * 24 * 60 * 60 * 1000;

    const minTime = now - cutoffMs;
    list = list.filter((r) => {
      const t = new Date(r.sampled_at).getTime();
      return !isNaN(t) && t >= minTime;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) => r.id.toLowerCase().includes(q) ||
               r.node_id.toLowerCase().includes(q) ||
               r.sensor_name.toLowerCase().includes(q) ||
               String(r.sensor_value).includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.sampled_at).getTime() - new Date(a.sampled_at).getTime());
  }, [readings, timeRange, searchQuery]);

  // Statistical calculations (Avg, Min, Max, Latest)
  const stats = useMemo(() => {
    if (filteredReadings.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, latest: null };
    }
    const vals = filteredReadings.map((r) => r.sensor_value).filter((v) => !isNaN(v));
    if (vals.length === 0) return { avg: 0, min: 0, max: 0, count: 0, latest: null };

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const sum = vals.reduce((acc, v) => acc + v, 0);
    const avg = Number((sum / vals.length).toFixed(2));
    const latest = filteredReadings[0];

    return { avg, min, max, count: vals.length, latest };
  }, [filteredReadings]);

  // Chart timeseries data points
  const chartData = useMemo(() => {
    const sorted = [...filteredReadings].reverse();
    return sorted.map((r) => {
      const d = new Date(r.sampled_at);
      const timeLabel = isNaN(d.getTime())
        ? r.sampled_at
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        time: timeLabel,
        value: r.sensor_value,
        deviceTime: r.device_timestamp,
        unit: r.unit,
      };
    });
  }, [filteredReadings]);

  // Export handlers
  const handleExportCsv = () => {
    const csvContent = buildHistoricalCsv(filteredReadings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agritwin_historical_${selectedNode}_${selectedSensorKey}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentParamDef = HISTORICAL_PARAMETERS_CONFIG.find((p) => p.key === selectedSensorKey) || {
    name: selectedSensorKey,
    unit: '',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>

      {/* ── Policy Banner ── */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database style={{ width: 16, height: 16 }} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: '#0f172a' }}>
              Confirmed Retention Policy: Exactly 6 Months (180 Days) &bull; 5-Minute Periodic Snapshot
            </strong>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Scheduled server collector queries Firebase every 5 minutes and persists validated snapshots to Supabase PostgreSQL without user interaction.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={triggerManualCollector}
            disabled={isCollecting}
            className="at-btn at-btn-secondary"
            style={{ fontSize: 11, padding: '5px 10px', height: 32 }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: isCollecting ? 'spin 1s linear infinite' : 'none' }} />
            {isCollecting ? 'Sampling...' : 'Capture Snapshot Now'}
          </button>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#dcfce7', color: '#166534' }}>
              5-MIN HISTORICAL LEDGER
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Independent of Live Real-time Stream
            </span>
          </div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-lg)',
              background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <History style={{ width: 18, height: 18, color: '#16a34a' }} />
            </div>
            Historical Sensor Telemetry Analytics
          </h1>
          <p className="at-page-subtitle">
            Long-term historical trend analysis, individual sensor investigation, and automated 6-month retention management.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleExportCsv} className="at-btn at-btn-primary" style={{ height: 36 }}>
            <Download style={{ width: 15, height: 15 }} />
            Export CSV ({filteredReadings.length})
          </button>
        </div>
      </div>

      {/* ── Selection Control Bar ── */}
      <div className="at-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {/* Node Selector */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Select Hardware Node</label>
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="at-input at-select"
            style={{ height: 38, fontSize: 13 }}
          >
            <option value="Node_2">Node_2 (Hardware Telemetry)</option>
            <option value="Node_3">Node_3 (Hardware Telemetry)</option>
            <option value="Node_4">Node_4 (Hardware Telemetry)</option>
          </select>
        </div>

        {/* Individual Sensor Selector */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Select Sensor Parameter</label>
          <select
            value={selectedSensorKey}
            onChange={(e) => setSelectedSensorKey(e.target.value)}
            className="at-input at-select"
            style={{ height: 38, fontSize: 13 }}
          >
            {HISTORICAL_PARAMETERS_CONFIG.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Range Toggle */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Historical Range</label>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: 2, height: 38 }}>
            {(['24h', '7d', '30d', '6m'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: timeRange === r ? '#ffffff' : 'transparent',
                  color: timeRange === r ? '#16a34a' : '#64748b',
                  boxShadow: timeRange === r ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Filter Ledger</label>
          <div className="at-search">
            <Search className="at-search-icon" style={{ width: 14, height: 14 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search timestamp, status..."
              className="at-input"
              style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {/* ── Summary Statistics Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="at-metric-card">
          <div className="at-metric-label">
            Latest Sampled Value
            <div className="at-metric-icon" style={{ background: '#dcfce7' }}>
              <TrendingUp style={{ width: 16, height: 16, color: '#16a34a' }} />
            </div>
          </div>
          <div className="at-metric-value" style={{ color: '#0f172a' }}>
            {stats.latest ? `${stats.latest.sensor_value} ${stats.latest.unit}` : 'N/A'}
          </div>
          <div className="at-metric-sub">
            {stats.latest ? `Sampled: ${new Date(stats.latest.sampled_at).toLocaleTimeString()}` : 'Awaiting data'}
          </div>
        </div>

        <div className="at-metric-card">
          <div className="at-metric-label">
            Average ({timeRange.toUpperCase()})
            <div className="at-metric-icon" style={{ background: '#e0f2fe' }}>
              <BarChart2 style={{ width: 16, height: 16, color: '#0284c7' }} />
            </div>
          </div>
          <div className="at-metric-value" style={{ color: '#0284c7' }}>
            {stats.avg} {currentParamDef.unit}
          </div>
          <div className="at-metric-sub">Mean calculated across interval</div>
        </div>

        <div className="at-metric-card">
          <div className="at-metric-label">
            Minimum Recorded
            <div className="at-metric-icon" style={{ background: '#fef3c7' }}>
              <ArrowDownRight style={{ width: 16, height: 16, color: '#d97706' }} />
            </div>
          </div>
          <div className="at-metric-value" style={{ color: '#d97706' }}>
            {stats.min} {currentParamDef.unit}
          </div>
          <div className="at-metric-sub">Lowest value in range</div>
        </div>

        <div className="at-metric-card">
          <div className="at-metric-label">
            Maximum Recorded
            <div className="at-metric-icon" style={{ background: '#fee2e2' }}>
              <ArrowUpRight style={{ width: 16, height: 16, color: '#dc2626' }} />
            </div>
          </div>
          <div className="at-metric-value" style={{ color: '#dc2626' }}>
            {stats.max} {currentParamDef.unit}
          </div>
          <div className="at-metric-sub">Peak value in range</div>
        </div>
      </div>

      {/* ── Historical Trend Timeseries Chart ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {currentParamDef.name} — 5-Minute Historical Progression
            </h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Showing {selectedNode} &bull; {timeRange.toUpperCase()} view &bull; {chartData.length} snapshot points
            </span>
          </div>
        </div>

        <div style={{ height: 280, width: '100%' }}>
          {chartData.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
              No historical readings found for this timeframe on {selectedNode}.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="histAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} ${currentParamDef.unit}`, currentParamDef.name]}
                  labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#histAreaGrad)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Authoritative Historical Ledger Table ── */}
      <div className="at-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Historical Snapshots Ledger ({filteredReadings.length})
            </h4>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Individual sensor readings recorded at strict 5-minute intervals in UTC
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Retention: 6 Months (180 Days)
          </span>
        </div>

        <div className="at-table-wrap">
          <table className="at-table">
            <thead>
              <tr>
                <th>Sampled Bucket (5-Min UTC)</th>
                <th>Device Timestamp</th>
                <th>Node ID</th>
                <th>Parameter</th>
                <th>Recorded Value</th>
                <th>Quality Status</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No historical records found matching current query for {selectedNode}.
                  </td>
                </tr>
              ) : (
                filteredReadings.slice(0, 100).map((r) => {
                  const sampleDate = new Date(r.sampled_at);
                  const sampleStr = isNaN(sampleDate.getTime()) ? r.sampled_at : sampleDate.toUTCString().replace('GMT', 'UTC');
                  const devDate = r.device_timestamp ? new Date(r.device_timestamp) : null;
                  const devStr = devDate && !isNaN(devDate.getTime()) ? devDate.toUTCString().replace('GMT', 'UTC') : 'N/A';

                  return (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#0f172a', fontWeight: 600 }}>
                        {sampleStr}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
                        {devStr}
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          {r.node_id}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#334155' }}>
                        {r.sensor_name}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                          {r.sensor_value}
                        </span>{' '}
                        <span style={{ fontSize: 11, color: '#64748b' }}>{r.unit}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: r.quality_status === 'VALID' ? '#dcfce7' : '#ffedd5',
                            color: r.quality_status === 'VALID' ? '#166534' : '#c2410c',
                          }}
                        >
                          {r.quality_status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 10, color: '#64748b' }}>
                          {r.data_source || 'PHYSICAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default HistoricalAnalytics;

