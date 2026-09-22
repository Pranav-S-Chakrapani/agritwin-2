import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Thermometer,
  Droplets,
  Activity,
  Zap,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Building2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  BarChart3,
  HeartPulse,
  Bell,
  Radio,
  Wind,
  ArrowRight,
  Layers,
  Sun,
  CloudRain,
  Plus,
  Minus,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
  Signal,
  SignalZero,
  Cpu,
  FlaskConical,
  Filter,
  Download,
  ChevronUp,
  Crosshair,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  Wifi,
  WifiOff,
  Gauge,
  Leaf,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';

import { SupabaseMonitorSection } from '../components/dashboard/SupabaseMonitorSection';
import { useAgriStore } from '../context/AgriStore';
import { PlotService, SensorService } from '../services/canonicalServices';
import { formatTemperature, formatMoisture, formatHumidity, formatPh } from '../lib/formatters';

const CHART_COLORS = ['#16a34a', '#0284c7', '#d97706', '#8b5cf6', '#0d9488', '#ec4899'];

// Sensor Trends 24-hour Data
const SENSOR_TRENDS_24H = [
  { time: '12 AM', value: 38 },
  { time: '2 AM', value: 42 },
  { time: '4 AM', value: 46 },
  { time: '6 AM', value: 44 },
  { time: '8 AM', value: 48 },
  { time: '10 AM', value: 45 },
  { time: '10:30 AM', value: 21, isDip: true },
  { time: '12 PM', value: 28 },
  { time: '2 PM', value: 32 },
  { time: '4 PM', value: 27 },
  { time: '6 PM', value: 29 },
  { time: '8 PM', value: 31 },
  { time: '10 PM', value: 35 },
];

const SENSOR_TRENDS_7D = [
  { time: 'Mon', value: 42 },
  { time: 'Tue', value: 45 },
  { time: 'Wed', value: 38 },
  { time: 'Thu', value: 30 },
  { time: 'Fri', value: 46 },
  { time: 'Sat', value: 48 },
  { time: 'Sun', value: 44 },
];

const SENSOR_TRENDS_30D = [
  { time: 'Week 1', value: 45 },
  { time: 'Week 2', value: 40 },
  { time: 'Week 3', value: 36 },
  { time: 'Week 4', value: 48 },
];

// Custom tooltip for recharts
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '8px 12px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
    }}>
      {label && <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.color || 'var(--color-primary)', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || 'var(--color-primary)', flexShrink: 0 }} />
          <span>{p.name || 'Value'}: <strong>{p.value}%</strong></span>
        </div>
      ))}
    </div>
  );
};

// ── Reusable KPI Card ──────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  accent?: string;
  id: string;
  trend?: 'up' | 'down' | 'neutral';
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, subtext, accent = 'var(--color-primary)', id, trend }) => (
  <div
    id={id}
    style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: 'var(--shadow-xs)',
      transition: 'box-shadow 0.15s, transform 0.15s',
      cursor: 'default',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 'var(--radius-lg)',
          background: `${accent}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ color: accent }}>{icon}</div>
      </div>
      {trend && (
        <div style={{ color: trend === 'up' ? 'var(--color-success)' : trend === 'down' ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          {trend === 'up' ? <TrendingUp style={{ width: 14, height: 14 }} /> : trend === 'down' ? <TrendingDown style={{ width: 14, height: 14 }} /> : null}
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.3 }}>
        {label}
      </div>
      {subtext && (
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>{subtext}</div>
      )}
    </div>
  </div>
);

// ── Plot Status Color ──────────────────────────────────────────────────────────
function getPlotStatus(plot: any): { label: string; color: string; bg: string; border: string } {
  const moisture = plot.soilMoisture ?? 50;
  const temp = plot.airTemp ?? 25;
  const ph = plot.soilPh ?? 6.5;

  const isCritical = moisture < 25 || moisture > 85 || temp > 38 || ph < 5.0 || ph > 8.5;
  const isWarning = moisture < 35 || moisture > 75 || temp > 34 || ph < 5.5 || ph > 7.8;

  if (isCritical) return { label: 'Critical', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  if (isWarning) return { label: 'Warning', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  return { label: 'Healthy', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
}

// ── Sensor type configuration ──────────────────────────────────────────────────
const SENSOR_TYPE_CONFIG: Record<string, { emoji: string; unit: string; label: string; color: string; accent: string }> = {
  'soil_moisture': { emoji: '💧', unit: '%', label: 'Soil Moisture', color: '#0284c7', accent: '#e0f2fe' },
  'temperature': { emoji: '🌡️', unit: '°C', label: 'Temperature', color: '#d97706', accent: '#fef3c7' },
  'humidity': { emoji: '💨', unit: '%', label: 'Humidity', color: '#0d9488', accent: '#f0fdfa' },
  'ph': { emoji: '🧪', unit: '', label: 'Soil pH', color: '#7c3aed', accent: '#ede9fe' },
  'nutrients': { emoji: '🌱', unit: 'ppm', label: 'Nutrients', color: '#16a34a', accent: '#dcfce7' },
  'default': { emoji: '📡', unit: '', label: 'Sensor', color: '#475569', accent: '#f1f5f9' },
};

function getSensorTypeConfig(sensorType?: string) {
  if (!sensorType) return SENSOR_TYPE_CONFIG.default;
  const key = sensorType.toLowerCase().replace(/\s+/g, '_');
  return SENSOR_TYPE_CONFIG[key] || SENSOR_TYPE_CONFIG.default;
}

// ── Field log CSV export ───────────────────────────────────────────────────────
function exportToCsv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export const Dashboard: React.FC = () => {
  const {
    farmlands,
    plots,
    sensors,
    alerts,
    activeFarmland,
    activeSections,
    fieldActivities,
    telemetryObservations,
    seedMultiFarmSystem,
  } = useAgriStore();

  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);
  const [trendRange, setTrendRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState('Soil Moisture');
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    Terrain: false,
    Crops: true,
    'Soil Moisture': false,
    'Soil pH': false,
    Temperature: false,
    'NDVI (Crop Health)': true,
    Irrigation: false,
    'Erosion Risk': false,
  });
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [logFarmFilter, setLogFarmFilter] = useState('all');
  const [logSensorFilter, setLogSensorFilter] = useState('all');
  const [logDateFilter, setLogDateFilter] = useState('');
  const [expandedPlot, setExpandedPlot] = useState<string | null>(null);

  const handleToggleLayer = (layer: string) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleRunSeeder = async () => {
    setSeeding(true);
    setSeedNotice('Seeding 5 Farms, 25 Plots, 150 Sensors...');
    try {
      const res = await seedMultiFarmSystem();
      setSeedNotice(res.message);
    } catch {
      setSeedNotice('Demo seed data loaded successfully into memory.');
    } finally {
      setSeeding(false);
    }
  };

  const trendData = useMemo(() => {
    if (trendRange === '7d') return SENSOR_TRENDS_7D;
    if (trendRange === '30d') return SENSOR_TRENDS_30D;
    return SENSOR_TRENDS_24H;
  }, [trendRange]);

  // ── Global Counts ──────────────────────────────────────────────────────────
  const globalSensorCounts = useMemo(() => SensorService.getGlobalSensorCounts(sensors), [sensors]);
  const activeAlertsCount = useMemo(() => alerts.filter(a => a.status === 'active').length, [alerts]);
  const criticalAlertsCount = useMemo(() => alerts.filter(a => a.status === 'active' && a.severity === 'critical').length, [alerts]);

  // ── Active Farm Data ───────────────────────────────────────────────────────
  const activeFarmPlots = useMemo(() => PlotService.getPlotsForFarm(plots, activeFarmland?.id), [plots, activeFarmland]);
  const activeFarmSensors = useMemo(() => SensorService.getSensorsForFarm(sensors, activeFarmland?.id), [sensors, activeFarmland]);
  const activeFarmSensorCounts = useMemo(() => SensorService.getSensorCountsForFarm(sensors, activeFarmland?.id), [sensors, activeFarmland]);

  // Irrigation status from plots
  const irrigatingPlots = useMemo(() =>
    activeFarmPlots.filter(p => p.isWatering || p.irrigationStatus === 'Active Drip' || p.irrigationStatus === 'Automated Sprinkler').length,
    [activeFarmPlots]
  );

  // Farm health score (avg soil health)
  const farmHealthScore = useMemo(() => {
    if (!activeFarmPlots.length) return 82;
    const avg = activeFarmPlots.reduce((acc, p) => acc + (p.soilHealthScore || 80), 0) / activeFarmPlots.length;
    return Math.round(avg);
  }, [activeFarmPlots]);

  // Crop types in active farm
  const cropTypes = useMemo(() => {
    const set = new Set(activeFarmPlots.map(p => p.cropType).filter(Boolean));
    return Array.from(set) as string[];
  }, [activeFarmPlots]);

  // ── Field Log Data ─────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    let logs = [...(fieldActivities || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (logFarmFilter !== 'all') logs = logs.filter(l => l.farmId === logFarmFilter);
    if (logSensorFilter !== 'all') logs = logs.filter(l => l.sensorId === logSensorFilter);
    if (logDateFilter) {
      const d = new Date(logDateFilter);
      logs = logs.filter(l => {
        const ld = new Date(l.timestamp);
        return ld.toDateString() === d.toDateString();
      });
    }
    return logs.slice(0, 50);
  }, [fieldActivities, logFarmFilter, logSensorFilter, logDateFilter]);

  const handleCsvExport = () => {
    const rows = filteredLogs.map(l => ({
      Timestamp: new Date(l.timestamp).toLocaleString(),
      Farm: farmlands.find(f => f.id === l.farmId)?.name || l.farmId || '—',
      Plot: l.plotId || '—',
      Sensor: l.sensorId || '—',
      Action: l.eventType,
      Title: l.title,
      Description: l.description,
      Severity: l.severity,
    }));
    exportToCsv(rows, `agritwin-field-log-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const severityColor = (sev: string) => {
    if (sev === 'critical') return '#dc2626';
    if (sev === 'warning') return '#d97706';
    if (sev === 'success') return '#16a34a';
    return '#0284c7';
  };

  // ── Timestamp format ───────────────────────────────────────────────────────
  const fmtTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  const fmtDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PAGE HEADER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Farm Control Center
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 3, margin: 0 }}>
            {activeFarmland
              ? <>Viewing: <strong style={{ color: 'var(--color-primary)' }}>{activeFarmland.name}</strong> — {activeFarmland.location}</>
              : 'Select a farm from the sidebar to begin'
            }
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="at-hide-mobile"
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-text)', fontStyle: 'italic' }}
          >
            "Data Today. Better Harvests Tomorrow."
          </div>
          <button
            onClick={handleRunSeeder}
            disabled={seeding}
            className="at-btn at-btn-primary at-btn-sm"
            id="at-seed-btn"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {seeding
              ? <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
              : <Zap style={{ width: 14, height: 14 }} />
            }
            {seeding ? 'Seeding...' : 'Load Demo Data'}
          </button>
        </div>
      </div>

      {seedNotice && (
        <div className="at-alert success" style={{ alignItems: 'center', padding: '10px 16px' }}>
          <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13 }}>{seedNotice}</span>
          <button onClick={() => setSeedNotice(null)} className="at-btn at-btn-ghost at-btn-sm" style={{ padding: '2px 8px', fontSize: 12 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — TOP KPI BAR (8 Cards)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        id="at-kpi-bar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
        }}
      >
        <KpiCard
          id="kpi-total-farms"
          icon={<Building2 style={{ width: 17, height: 17 }} />}
          label="Total Farms"
          value={farmlands.length}
          subtext={farmlands.length === 0 ? 'Load demo data' : `${farmlands.length} registered`}
          accent="#16a34a"
          trend="neutral"
        />
        <KpiCard
          id="kpi-total-plots"
          icon={<Layers style={{ width: 17, height: 17 }} />}
          label="Total Plots"
          value={plots.length}
          subtext={activeFarmPlots.length > 0 ? `${activeFarmPlots.length} in active farm` : undefined}
          accent="#0284c7"
        />
        <KpiCard
          id="kpi-total-sensors"
          icon={<Radio style={{ width: 17, height: 17 }} />}
          label="Total Sensors"
          value={sensors.length}
          subtext={`${globalSensorCounts.active} online`}
          accent="#7c3aed"
        />
        <KpiCard
          id="kpi-active-alerts"
          icon={<Bell style={{ width: 17, height: 17 }} />}
          label="Active Alerts"
          value={activeAlertsCount}
          subtext={criticalAlertsCount > 0 ? `${criticalAlertsCount} critical` : 'All clear'}
          accent={activeAlertsCount > 0 ? '#dc2626' : '#16a34a'}
          trend={activeAlertsCount > 0 ? 'up' : 'neutral'}
        />
        <KpiCard
          id="kpi-irrigation"
          icon={<Droplets style={{ width: 17, height: 17 }} />}
          label="Irrigation"
          value={irrigatingPlots > 0 ? `${irrigatingPlots} Active` : 'Idle'}
          subtext={`${activeFarmPlots.length} plots`}
          accent="#0d9488"
        />
        <KpiCard
          id="kpi-telemetry"
          icon={<BarChart3 style={{ width: 17, height: 17 }} />}
          label="Telemetry Records"
          value={telemetryObservations.length > 999 ? `${(telemetryObservations.length / 1000).toFixed(1)}k` : telemetryObservations.length}
          subtext="Total observations"
          accent="#d97706"
        />
        <KpiCard
          id="kpi-online-sensors"
          icon={<Wifi style={{ width: 17, height: 17 }} />}
          label="Online Sensors"
          value={globalSensorCounts.active}
          subtext="Transmitting live"
          accent="#16a34a"
          trend="up"
        />
        <KpiCard
          id="kpi-offline-sensors"
          icon={<WifiOff style={{ width: 17, height: 17 }} />}
          label="Offline Sensors"
          value={globalSensorCounts.offline}
          subtext={globalSensorCounts.offline > 0 ? 'Needs attention' : 'All connected'}
          accent={globalSensorCounts.offline > 0 ? '#dc2626' : '#16a34a'}
          trend={globalSensorCounts.offline > 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — FARM OVERVIEW PANEL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeFarmland ? (
        <div
          id="at-farm-overview"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-subtle) 0%, #f0fdfa 100%)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 style={{ width: 18, height: 18, color: 'white' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary-text)', margin: 0, letterSpacing: '-0.02em' }}>
                    {activeFarmland.name}
                  </h2>
                  <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>
                    <MapPin style={{ width: 11, height: 11, display: 'inline', marginRight: 3 }} />
                    {activeFarmland.location}
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Health Score Gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', width: 64, height: 64 }}>
                <svg width="64" height="64" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e2e8f0" strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="var(--color-primary)" strokeWidth="3.2"
                    strokeDasharray={`${farmHealthScore}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary-text)' }}>{farmHealthScore}</span>
                  <span style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>/ 100</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary-text)' }}>Farm Health</div>
                <div style={{ fontSize: 11, color: farmHealthScore >= 80 ? '#16a34a' : farmHealthScore >= 60 ? '#d97706' : '#dc2626', fontWeight: 700 }}>
                  {farmHealthScore >= 80 ? '✓ Good' : farmHealthScore >= 60 ? '⚠ Moderate' : '✕ Critical'}
                </div>
              </div>
            </div>
          </div>

          {/* Farm Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[
              { icon: <MapPin style={{ width: 13, height: 13 }} />, label: 'Area', value: `${activeFarmland.totalArea} ${activeFarmland.unit}` },
              { icon: <Layers style={{ width: 13, height: 13 }} />, label: 'Plots', value: activeFarmPlots.length },
              { icon: <Radio style={{ width: 13, height: 13 }} />, label: 'Sensors', value: activeFarmSensorCounts.total },
              { icon: <Wifi style={{ width: 13, height: 13 }} />, label: 'Online', value: activeFarmSensorCounts.active, color: '#16a34a' },
              { icon: <WifiOff style={{ width: 13, height: 13 }} />, label: 'Offline', value: activeFarmSensorCounts.offline, color: activeFarmSensorCounts.offline > 0 ? '#dc2626' : '#94a3b8' },
              { icon: <Bell style={{ width: 13, height: 13 }} />, label: 'Alerts', value: alerts.filter(a => a.farmId === activeFarmland.id && a.status === 'active').length, color: '#d97706' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,0.9)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 3 }}>
                  <span style={{ color: 'var(--color-primary)' }}>{item.icon}</span>
                  {item.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: (item as any).color || 'var(--color-primary-text)', letterSpacing: '-0.02em' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Crop Types */}
          {cropTypes.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary-text)' }}>
                <Sprout style={{ width: 12, height: 12, display: 'inline', marginRight: 3 }} />
                Crops:
              </span>
              {cropTypes.map(c => (
                <span
                  key={c}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary)',
                    color: 'white',
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '32px 24px', textAlign: 'center' }}>
          <Building2 style={{ width: 36, height: 36, color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-secondary)' }}>No Farm Selected</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Select a farm from the sidebar, or load demo data to get started.
          </div>
          <button onClick={handleRunSeeder} disabled={seeding} className="at-btn at-btn-primary" style={{ marginTop: 16, display: 'inline-flex', gap: 8 }}>
            <Zap style={{ width: 15, height: 15 }} /> Load Demo Data
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — DEDICATED SENSOR OVERVIEW
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div id="at-sensor-overview" className="at-card" style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio style={{ width: 17, height: 17, color: 'var(--color-primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Sensor Overview</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {activeFarmland ? `Live readings — ${activeFarmland.name}` : 'All sensors'}
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'at-pulse 1.5s infinite', display: 'inline-block' }} />
              {activeFarmSensorCounts.active} Online
            </span>
            {activeFarmSensorCounts.offline > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                <WifiOff style={{ width: 11, height: 11 }} />
                {activeFarmSensorCounts.offline} Offline
              </span>
            )}
            <Link to="/sensors" style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-primary-border)', background: 'var(--color-primary-subtle)' }}>
              All Sensors →
            </Link>
          </div>
        </div>

        {/* Sensor cards grid */}
        {activeFarmSensors.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            <Radio style={{ width: 28, height: 28, margin: '0 auto 8px', display: 'block' }} />
            No sensors found. Load demo data to see live sensor readings.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              gap: 12,
            }}
          >
            {activeFarmSensors.slice(0, 12).map((sensor) => {
              const cfg = getSensorTypeConfig(sensor.type || (sensor.sensorTypes?.[0]));
              const isOnline = (sensor.status || '').toLowerCase() === 'online';

              return (
                <div
                  key={sensor.id}
                  style={{
                    background: isOnline ? cfg.accent : 'var(--color-surface-muted)',
                    border: `1.5px solid ${isOnline ? cfg.color + '33' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-xl)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    position: 'relative',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Status indicator */}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isOnline ? '#16a34a' : '#94a3b8',
                        boxShadow: isOnline ? '0 0 0 2px #dcfce7' : 'none',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 22 }}>{cfg.emoji}</div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                      {sensor.nodeName}
                    </div>
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 800, color: isOnline ? cfg.color : 'var(--color-text-muted)', letterSpacing: '-0.02em' }}>
                    {sensor.currentReading || (isOnline ? '—' : 'Offline')}
                    {sensor.currentReading && cfg.unit && (
                      <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 2 }}>{cfg.unit}</span>
                    )}
                  </div>

                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    Updated: {sensor.lastPing ? new Date(sensor.lastPing).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </div>

                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    background: isOnline ? '#dcfce7' : '#f1f5f9',
                    color: isOnline ? '#15803d' : '#64748b',
                  }}>
                    {isOnline ? '● Live' : '○ Offline'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeFarmSensors.length > 12 && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link to="/sensors" className="at-btn at-btn-secondary at-btn-sm">
              View all {activeFarmSensors.length} sensors →
            </Link>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — PLOT MANAGEMENT CARDS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div id="at-plot-management" className="at-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-lg)', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers style={{ width: 17, height: 17, color: '#16a34a' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Plot Management</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {activeFarmPlots.length} plots in {activeFarmland?.name || 'active farm'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Healthy', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
              { label: 'Warning', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
              { label: 'Critical', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            ].map(s => (
              <span key={s.label} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                ● {s.label}
              </span>
            ))}
          </div>
        </div>

        {activeFarmPlots.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            <Layers style={{ width: 28, height: 28, margin: '0 auto 8px', display: 'block' }} />
            No plots found. Load demo data to see plot readings.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {activeFarmPlots.map((plot) => {
              const status = getPlotStatus(plot);
              const isExpanded = expandedPlot === plot.id;
              const plotSensors = SensorService.getSensorsForPlot(sensors, plot.id);

              return (
                <div
                  key={plot.id}
                  style={{
                    borderRadius: 'var(--radius-xl)',
                    border: `1.5px solid ${status.border}`,
                    background: status.bg,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Plot Header */}
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: status.color, color: 'white', fontFamily: 'monospace' }}>
                          {plot.code}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {plot.name}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                        {plot.cropType || 'No crop'} · {plot.area} {plot.areaUnit || 'acres'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 'var(--radius-full)', background: status.color, color: 'white' }}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ padding: '0 14px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[
                      { icon: '💧', label: 'Moisture', value: formatMoisture(plot.soilMoisture) },
                      { icon: '🌡️', label: 'Temp', value: formatTemperature(plot.airTemp) },
                      { icon: '🧪', label: 'pH', value: formatPh(plot.soilPh) },
                    ].map((metric) => (
                      <div key={metric.label} style={{ background: 'rgba(255,255,255,0.7)', padding: '6px 8px', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 13 }}>{metric.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 1 }}>{metric.value}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedPlot(isExpanded ? null : plot.id)}
                    style={{
                      width: '100%',
                      padding: '6px 14px',
                      background: 'rgba(255,255,255,0.5)',
                      border: 'none',
                      borderTop: `1px solid ${status.border}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      fontWeight: 700,
                      color: status.color,
                    }}
                  >
                    <span>{plotSensors.length} sensors attached</span>
                    {isExpanded ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
                  </button>

                  {/* Expanded sensors list */}
                  {isExpanded && (
                    <div style={{ background: 'rgba(255,255,255,0.9)', borderTop: `1px solid ${status.border}`, padding: '10px 14px' }}>
                      {plotSensors.length === 0 ? (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>No sensors assigned to this plot.</div>
                      ) : (
                        plotSensors.map(s => {
                          const cfg = getSensorTypeConfig(s.type);
                          const online = (s.status || '').toLowerCase() === 'online';
                          return (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--color-border-muted)' }}>
                              <span>{cfg.emoji}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.nodeName}</div>
                                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{s.currentReading || '—'}</div>
                              </div>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 'var(--radius-full)', background: online ? '#dcfce7' : '#f1f5f9', color: online ? '#15803d' : '#64748b' }}>
                                {online ? 'Live' : 'Offline'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5 — INTERACTIVE MAP + ALERTS (side by side)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>

        {/* Farm Digital Twin Map */}
        <div className="at-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                <Layers style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                Farm Map View
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Click a plot zone to inspect sensors & telemetry
              </div>
            </div>
            <select
              onChange={(e) => {}}
              className="at-input at-select"
              style={{ height: 32, fontSize: 12, padding: '2px 28px 2px 10px', width: 'auto', fontWeight: 600 }}
            >
              <option>Crop Health</option>
              <option>Soil Moisture</option>
              <option>Irrigation Nodes</option>
              <option>NDVI Scan</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 14 }}>
            {/* Map visual */}
            <div style={{ position: 'relative', height: 280, borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'linear-gradient(135deg, #1b3a24 0%, #294d30 50%, #3a633f 100%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 30% 40%, rgba(74, 222, 128, 0.15) 0%, transparent 45%), radial-gradient(circle at 70% 70%, rgba(251, 191, 36, 0.15) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(248, 113, 113, 0.2) 0%, transparent 35%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`, backgroundSize: '100% 100%, 100% 100%, 100% 100%, 20px 20px, 20px 20px' }} />

              <div style={{ position: 'absolute', inset: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10 }}>
                {activeFarmPlots.slice(0, 4).map((plot, i) => {
                  const status = getPlotStatus(plot);
                  const colors: [string, string, string] = status.label === 'Critical'
                    ? ['rgba(248, 113, 113, 0.95)', 'rgba(239, 68, 68, 0.32)', '#f87171']
                    : status.label === 'Warning'
                    ? ['rgba(251, 191, 36, 0.9)', 'rgba(245, 158, 11, 0.28)', '#fbbf24']
                    : ['rgba(74, 222, 128, 0.9)', 'rgba(34, 197, 94, 0.25)', '#4ade80'];

                  return (
                    <div
                      key={plot.id}
                      onClick={() => setSelectedZone(selectedZone === plot.id ? null : plot.id)}
                      style={{ borderRadius: 'var(--radius-lg)', border: `2px dashed ${colors[0]}`, background: colors[1], backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 8, boxShadow: selectedZone === plot.id ? `0 0 0 3px ${colors[2]}` : 'none', transition: 'all 0.15s' }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{plot.code}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: colors[2], background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: 4, marginTop: 3 }}>{status.label}</span>
                      {plot.cropType && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{plot.cropType}</span>}
                    </div>
                  );
                })}
                {activeFarmPlots.length === 0 && [
                  { zone: 'Zone 1', status: 'Good', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.25)', border: 'rgba(74, 222, 128, 0.9)' },
                  { zone: 'Zone 2', status: 'Attention', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.28)', border: 'rgba(251, 191, 36, 0.9)' },
                  { zone: 'Zone 3', status: 'Critical', color: '#f87171', bg: 'rgba(239, 68, 68, 0.32)', border: 'rgba(248, 113, 113, 0.95)' },
                  { zone: 'Zone 4', status: 'Good', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.25)', border: 'rgba(74, 222, 128, 0.9)' },
                ].map((z, i) => (
                  <div key={i} onClick={() => setSelectedZone(z.zone)} style={{ borderRadius: 'var(--radius-lg)', border: `2px dashed ${z.border}`, background: z.bg, backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{z.zone}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: z.color, background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: 4, marginTop: 3 }}>{z.status}</span>
                  </div>
                ))}
              </div>

              {/* Zoom controls */}
              <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', padding: 4, borderRadius: 6 }}>
                <button className="at-btn-icon" style={{ width: 22, height: 22, border: 'none', color: 'white', background: 'transparent' }}><Plus style={{ width: 12, height: 12 }} /></button>
                <button className="at-btn-icon" style={{ width: 22, height: 22, border: 'none', color: 'white', background: 'transparent' }}><Minus style={{ width: 12, height: 12 }} /></button>
                <button className="at-btn-icon" style={{ width: 22, height: 22, border: 'none', color: 'white', background: 'transparent' }}><Crosshair style={{ width: 12, height: 12 }} /></button>
              </div>
            </div>

            {/* Layer controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              {['Terrain', 'Crops', 'Soil Moisture', 'Soil pH', 'Temperature', 'NDVI (Crop Health)', 'Irrigation', 'Erosion Risk'].map((layer) => {
                const checked = Boolean(activeLayers[layer]);
                return (
                  <label key={layer} onClick={() => handleToggleLayer(layer)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: checked ? 600 : 400, userSelect: 'none' }}>
                    {checked
                      ? <CheckSquare style={{ width: 13, height: 13, color: 'var(--color-primary)', flexShrink: 0 }} />
                      : <Square style={{ width: 13, height: 13, color: 'var(--color-border-strong)', flexShrink: 0 }} />
                    }
                    <span style={{ lineHeight: 1.2 }}>{layer}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Selected zone info */}
          {selectedZone && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--color-primary-subtle)', border: '1px solid var(--color-primary-border)', borderRadius: 'var(--radius-lg)', fontSize: 12, color: 'var(--color-primary-text)' }}>
              <strong>{selectedZone}</strong> selected.{' '}
              <Link to="/analytics" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>View Telemetry →</Link>
              {' | '}
              <Link to="/sensors" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>View Sensors →</Link>
              {' | '}
              <Link to="/history" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>View History →</Link>
            </div>
          )}

          {/* Map legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
            {[['var(--color-success)', 'Healthy'], ['var(--color-warning)', 'Warning'], ['var(--color-danger)', 'Critical']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="at-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              <Bell style={{ width: 17, height: 17, color: activeAlertsCount > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)' }} />
              Alerts & Notifications
              {activeAlertsCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 'var(--radius-full)', background: 'var(--color-danger)', color: 'white' }}>
                  {activeAlertsCount}
                </span>
              )}
            </div>
            <Link to="/alerts" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.filter(a => a.status === 'active').slice(0, 4).map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';
              const bg = isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0f9ff';
              const border = isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#e0f2fe';
              const textColor = isCritical ? '#b91c1c' : isWarning ? '#92400e' : '#075985';

              return (
                <div key={alert.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: bg, border: `1px solid ${border}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle style={{ width: 13, height: 13, color: textColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: textColor }}>{alert.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{alert.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3 }}>
                      {new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}

            {alerts.filter(a => a.status === 'active').length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                <CheckCircle2 style={{ width: 24, height: 24, margin: '0 auto 8px', color: '#16a34a', display: 'block' }} />
                All clear! No active alerts.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6 — REALTIME TELEMETRY CHART
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: 16, alignItems: 'start' }}>
        {/* Sensor Trends */}
        <div className="at-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity style={{ width: 17, height: 17, color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Live Sensor Trends</span>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="at-input at-select"
                style={{ height: 30, fontSize: 12, padding: '2px 24px 2px 8px', width: 'auto', fontWeight: 600 }}
              >
                <option>Soil Moisture</option>
                <option>Temperature</option>
                <option>Humidity</option>
                <option>Soil pH</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface-muted)', padding: 3, borderRadius: 'var(--radius-lg)' }}>
              {[{ id: '24h', label: '24h' }, { id: '7d', label: '7d' }, { id: '30d', label: '30d' }].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setTrendRange(pill.id as any)}
                  style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', background: trendRange === pill.id ? 'var(--color-primary)' : 'transparent', color: trendRange === pill.id ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.15s' }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2.2} fillOpacity={1} fill="url(#colorMoisture)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Auto-refresh notice */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'at-pulse 1.5s infinite', display: 'inline-block', flexShrink: 0 }} />
            Updating every 10–15 seconds · {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Weather + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Weather card */}
          <div className="at-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
              <Sun style={{ width: 16, height: 16, color: '#d97706' }} />
              Current Weather
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sun style={{ width: 24, height: 24, color: '#d97706' }} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.1 }}>27.4°C</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Partly Cloudy</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, borderLeft: '1px solid var(--color-border-muted)', paddingLeft: 12 }}>
                {[['Humidity', '71%'], ['Wind', '6.2 km/h'], ['Rainfall', '0 mm']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="at-card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
              Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'View Sensors', to: '/sensors', icon: <Radio style={{ width: 14, height: 14 }} />, accent: '#7c3aed' },
                { label: 'Field Logs', to: '/history', icon: <FileText style={{ width: 14, height: 14 }} />, accent: '#0284c7' },
                { label: 'Manage Farms', to: '/my-farms', icon: <Building2 style={{ width: 14, height: 14 }} />, accent: '#16a34a' },
                { label: 'AI Advisor', to: '/advisor', icon: <Sparkles style={{ width: 14, height: 14 }} />, accent: '#d97706' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-lg)', textDecoration: 'none', color: 'var(--color-text-secondary)', transition: 'background 0.15s', fontSize: 12, fontWeight: 600 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: `${action.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.accent, flexShrink: 0 }}>
                    {action.icon}
                  </span>
                  {action.label}
                  <ChevronRight style={{ width: 12, height: 12, marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 7 — FIELD ACTIVITY CENTER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div id="at-field-activity" className="at-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-lg)', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList style={{ width: 17, height: 17, color: '#0284c7' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Field Activity Center</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Complete event log — filter, search, and export
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Farm filter */}
            <select
              value={logFarmFilter}
              onChange={(e) => setLogFarmFilter(e.target.value)}
              className="at-input at-select"
              style={{ height: 34, fontSize: 12, padding: '2px 28px 2px 10px', width: 'auto' }}
              aria-label="Filter by farm"
            >
              <option value="all">All Farms</option>
              {farmlands.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>

            {/* Date filter */}
            <input
              type="date"
              value={logDateFilter}
              onChange={(e) => setLogDateFilter(e.target.value)}
              className="at-input"
              style={{ height: 34, fontSize: 12, padding: '2px 8px', width: 140 }}
              aria-label="Filter by date"
            />

            {/* CSV export */}
            <button
              onClick={handleCsvExport}
              className="at-btn at-btn-secondary at-btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34 }}
              id="at-export-csv-btn"
            >
              <Download style={{ width: 13, height: 13 }} />
              Export CSV
            </button>

            <Link to="/activity-log" className="at-btn at-btn-primary at-btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, textDecoration: 'none' }}>
              <FileText style={{ width: 13, height: 13 }} />
              Full Log
            </Link>
          </div>
        </div>

        {/* Log Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
                {['Time', 'Farm', 'Plot', 'Sensor', 'Event', 'Description', 'Severity'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                    <Clock style={{ width: 24, height: 24, margin: '0 auto 8px', display: 'block' }} />
                    No activity found. Load demo data to see field events.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => {
                  const farmName = farmlands.find(f => f.id === log.farmId)?.name;
                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid var(--color-border-muted)', background: i % 2 === 0 ? 'transparent' : 'var(--color-surface-muted)', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--color-surface-muted)'}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{fmtTime(log.timestamp)}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{fmtDate(log.timestamp)}</div>
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: 120 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {farmName || log.farmId || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
                        {log.plotId || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
                        {log.sensorId || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                          {log.eventType?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${severityColor(log.severity)}18`, color: severityColor(log.severity), border: `1px solid ${severityColor(log.severity)}33`, textTransform: 'capitalize' }}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-muted)' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Showing {filteredLogs.length} of {(fieldActivities || []).length} events
            </span>
            <Link to="/activity-log" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
              View complete activity log →
            </Link>
          </div>
        )}
      </div>

      {/* Supabase Live DB Monitor Section */}
      <SupabaseMonitorSection />
    </div>
  );
};

export default Dashboard;
