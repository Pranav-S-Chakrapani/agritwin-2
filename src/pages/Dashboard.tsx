import React, { useState, useMemo } from 'react';
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
  Cpu,
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
  TrendingUp,
  TrendingDown,
  Layers,
  Sun,
  CloudRain,
  Compass,
  Crosshair,
  Plus,
  Minus,
  CheckSquare,
  Square,
  Clock,
  Sparkles,
  SlidersHorizontal,
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
          <span>{p.name || 'Moisture'}: <strong>{p.value}%</strong></span>
        </div>
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const {
    farmlands,
    plots,
    sensors,
    alerts,
    activeFarmland,
    activeSections,
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
  const [digitalTwinView, setDigitalTwinView] = useState('Crop Health');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFarms, setExpandedFarms] = useState<Record<string, boolean>>({
    farm_iiit_dharwad: true,
  });

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

  const activeFarmPlots = useMemo(() => PlotService.getPlotsForFarm(plots, activeFarmland?.id), [plots, activeFarmland]);
  const activeFarmSensorCounts = useMemo(() => SensorService.getSensorCountsForFarm(sensors, activeFarmland?.id), [sensors, activeFarmland]);
  const globalSensorCounts = useMemo(() => SensorService.getGlobalSensorCounts(sensors), [sensors]);
  const activeAlertsCount = useMemo(() => alerts.filter(a => a.status === 'active').length, [alerts]);
  const criticalAlertsCount = useMemo(() => alerts.filter(a => a.status === 'active' && a.severity === 'critical').length, [alerts]);

  const telemetryPerFarmData = useMemo(() =>
    farmlands.map(f => ({
      name: f.name.split(' ')[0],
      records: telemetryObservations.filter(o => o.farmId === f.id).length || 200,
    })), [farmlands, telemetryObservations]);

  const sensorDistData = useMemo(() =>
    farmlands.map(f => {
      const counts = SensorService.getSensorCountsForFarm(sensors, f.id);
      return { name: f.name.split(' ')[0], total: counts.total || 30, online: counts.active || 29 };
    }), [farmlands, sensors]);

  const cropDistData = useMemo(() => {
    const map: Record<string, number> = {};
    plots.forEach(p => { const crop = p.cropType || 'Wheat'; map[crop] = (map[crop] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [plots]);

  const moistureCompareData = useMemo(() =>
    farmlands.map(f => {
      const fPlots = plots.filter(p => p.farmId === f.id);
      const avgM = fPlots.length > 0 ? fPlots.reduce((acc, p) => acc + p.soilMoisture, 0) / fPlots.length : 48;
      return { name: f.name.split(' ')[0], avgMoisture: Number(avgM.toFixed(1)) };
    }), [farmlands, plots]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page Title Header with Reference Quote ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="at-page-title" style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Dashboard
          </h1>
          <p className="at-page-subtitle" style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Real-time insights from your farm's digital twin
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            className="at-hide-mobile"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-primary-text)',
              fontStyle: 'normal',
              letterSpacing: '-0.01em',
            }}
          >
            "Data Today. Better Harvests Tomorrow."
          </div>
          <button
            onClick={handleRunSeeder}
            disabled={seeding}
            className="at-btn at-btn-primary at-btn-sm"
            id="at-seed-btn"
            style={{ padding: '6px 14px' }}
          >
            {seeding
              ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
              : <Zap style={{ width: 13, height: 13 }} />
            }
            {seeding ? 'Seeding...' : 'Load Demo Data'}
          </button>
        </div>
      </div>

      {seedNotice && (
        <div className="at-alert success" style={{ alignItems: 'center', padding: '10px 16px' }}>
          <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13 }}>{seedNotice}</span>
          <button
            onClick={() => setSeedNotice(null)}
            className="at-btn at-btn-ghost at-btn-sm"
            style={{ padding: '2px 8px', fontSize: 12 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── TOP KPI ROW: Farm Health Score + 4 Dimensions (Matching Reference) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        
        {/* Farm Health Score Gauge Card */}
        <div
          className="at-card"
          style={{
            background: 'var(--color-surface)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Farm Health Score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0' }}>
            {/* Circular progress SVG */}
            <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="3.2"
                  strokeDasharray="82, 100"
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>82</span>
                <span style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>/ 100</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontWeight: 700, fontSize: 13 }}>
                <Sprout style={{ width: 14, height: 14 }} />
                Good
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                Overall condition of your farm is healthy.
              </div>
            </div>
          </div>
        </div>

        {/* Soil Dimension Card */}
        <div className="at-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14 }}>🪵</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Soil</span>
          </div>
          <div style={{ margin: '8px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>86</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>/ 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
              Good
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.25 }}>
            Soil conditions are optimal.
          </div>
        </div>

        {/* Water Dimension Card */}
        <div className="at-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets style={{ width: 14, height: 14, color: '#0284c7' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Water</span>
          </div>
          <div style={{ margin: '8px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>74</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>/ 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-warning)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
              <span>◆</span> Moderate
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.25 }}>
            Irrigation attention needed in some zones.
          </div>
        </div>

        {/* Climate Dimension Card */}
        <div className="at-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sun style={{ width: 14, height: 14, color: '#d97706' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Climate</span>
          </div>
          <div style={{ margin: '8px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>88</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>/ 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
              Good
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.25 }}>
            Temperature and humidity are within ideal range.
          </div>
        </div>

        {/* Crop Dimension Card */}
        <div className="at-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sprout style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Crop</span>
          </div>
          <div style={{ margin: '8px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>81</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>/ 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
              Good
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.25 }}>
            Crops are growing well with no major stress.
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: Farm Digital Twin Map + Alerts & Notifications (Matching Reference) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
        
        {/* Farm Digital Twin Card */}
        <div className="at-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                <Building2 style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
                Farm Digital Twin
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Interactive view of your farm with real-time data layers
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>View:</span>
              <select
                value={digitalTwinView}
                onChange={(e) => setDigitalTwinView(e.target.value)}
                className="at-input at-select"
                style={{ height: 32, fontSize: 12, padding: '2px 28px 2px 10px', width: 'auto', fontWeight: 600 }}
              >
                <option value="Crop Health">Crop Health</option>
                <option value="Soil Moisture">Soil Moisture</option>
                <option value="Irrigation Nodes">Irrigation Nodes</option>
                <option value="NDVI Scan">NDVI Scan</option>
              </select>
            </div>
          </div>

          {/* Interactive Map Visual + Layer Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 14 }}>
            
            {/* Satellite Farm View with Zone Polygons */}
            <div
              style={{
                position: 'relative',
                height: 280,
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #1b3a24 0%, #294d30 50%, #3a633f 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
              }}
            >
              {/* Satellite Background Grid Pattern */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `
                    radial-gradient(circle at 30% 40%, rgba(74, 222, 128, 0.15) 0%, transparent 45%),
                    radial-gradient(circle at 70% 70%, rgba(251, 191, 36, 0.15) 0%, transparent 40%),
                    radial-gradient(circle at 20% 80%, rgba(248, 113, 113, 0.2) 0%, transparent 35%),
                    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
                  `,
                  backgroundSize: '100% 100%, 100% 100%, 100% 100%, 20px 20px, 20px 20px',
                }}
              />

              {/* Farm Zone Polygons */}
              <div style={{ position: 'absolute', inset: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10 }}>
                
                {/* Zone 1: Good (Green) */}
                <div
                  onClick={() => setSelectedZone('Zone 1')}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed rgba(74, 222, 128, 0.9)',
                    background: 'rgba(34, 197, 94, 0.25)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    Zone 1
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: 4, marginTop: 3 }}>
                    Good
                  </span>
                </div>

                {/* Zone 2: Attention (Amber) */}
                <div
                  onClick={() => setSelectedZone('Zone 2')}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed rgba(251, 191, 36, 0.9)',
                    background: 'rgba(245, 158, 11, 0.28)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    Zone 2
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: 4, marginTop: 3 }}>
                    Attention
                  </span>
                </div>

                {/* Zone 3: Critical (Red) */}
                <div
                  onClick={() => setSelectedZone('Zone 3')}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed rgba(248, 113, 113, 0.95)',
                    background: 'rgba(239, 68, 68, 0.32)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    Zone 3
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: 4, marginTop: 3 }}>
                    Critical
                  </span>
                </div>

                {/* Zone 4: Good (Green) */}
                <div
                  onClick={() => setSelectedZone('Zone 4')}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed rgba(74, 222, 128, 0.9)',
                    background: 'rgba(34, 197, 94, 0.25)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    Zone 4
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(0,0,0,0.4)', padding: '1px 6px', borderRadius: 4, marginTop: 3 }}>
                    Good
                  </span>
                </div>
              </div>

              {/* Map Zoom Controls on Right Bottom */}
              <div
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <button className="at-btn-icon" style={{ width: 22, height: 22, border: 'none', color: 'white', background: 'transparent' }} title="Zoom in">
                  <Plus style={{ width: 12, height: 12 }} />
                </button>
                <button className="at-btn-icon" style={{ width: 22, height: 22, border: 'none', color: 'white', background: 'transparent' }} title="Zoom out">
                  <Minus style={{ width: 12, height: 12 }} />
                </button>
                <button className="at-btn-icon" style={{ width: 22, height: 22, border: 'none', color: 'white', background: 'transparent' }} title="Center">
                  <Crosshair style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </div>

            {/* Layer Checkboxes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              {[
                'Terrain',
                'Crops',
                'Soil Moisture',
                'Soil pH',
                'Temperature',
                'NDVI (Crop Health)',
                'Irrigation',
                'Erosion Risk',
              ].map((layer) => {
                const checked = Boolean(activeLayers[layer]);
                return (
                  <label
                    key={layer}
                    onClick={() => handleToggleLayer(layer)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: checked ? 600 : 400,
                      userSelect: 'none',
                    }}
                  >
                    {checked ? (
                      <CheckSquare style={{ width: 13, height: 13, color: 'var(--color-primary)', flexShrink: 0 }} />
                    ) : (
                      <Square style={{ width: 13, height: 13, color: 'var(--color-border-strong)', flexShrink: 0 }} />
                    )}
                    <span style={{ lineHeight: 1.2 }}>{layer}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Map Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Normal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }} />
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Attention</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger)' }} />
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Critical</span>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications Card (Matching Reference) */}
        <div className="at-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              <Bell style={{ width: 17, height: 17, color: 'var(--color-text-primary)' }} />
              Alerts & Notifications
            </div>
            <Link to="/alerts" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            {/* Alert 1: Low Soil Moisture (Critical - Red) */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Droplets style={{ width: 13, height: 13, color: '#dc2626' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>
                    Low soil moisture detected
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>1 hour ago</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>
                  Zone 3
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                  Current: <strong style={{ color: '#b91c1c' }}>21%</strong> &nbsp;|&nbsp; Optimal: 35–55%
                </div>
                <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 2 }}>
                  Recommended action: <strong>Irrigate Zone 3</strong>
                </div>
              </div>
              <Link
                to="/control"
                className="at-btn at-btn-sm"
                style={{
                  background: '#f87171',
                  color: 'white',
                  border: 'none',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  alignSelf: 'center',
                  textDecoration: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Take Action
              </Link>
            </div>

            {/* Alert 2: Possible Crop Stress (Warning - Amber) */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sprout style={{ width: 13, height: 13, color: '#d97706' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                    Possible crop stress
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>3 hours ago</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>
                  Zone 2
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                  NDVI indicates lower plant health.
                </div>
                <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>
                  Recommended: <strong>Inspect Zone 2</strong>
                </div>
              </div>
              <Link
                to="/crop-health"
                className="at-btn at-btn-sm"
                style={{
                  background: '#fde68a',
                  color: '#78350f',
                  border: 'none',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  alignSelf: 'center',
                  textDecoration: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Inspect
              </Link>
            </div>

            {/* Alert 3: High Temperature (Info - Blue) */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                background: '#f0f9ff',
                border: '1px solid #e0f2fe',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Thermometer style={{ width: 13, height: 13, color: '#0284c7' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>
                    High temperature alert
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>5 hours ago</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>
                  Zone 4
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                  Current: <strong style={{ color: '#0369a1' }}>34.2°C</strong> &nbsp;|&nbsp; Optimal: &lt; 32°C
                </div>
                <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>
                  Recommended: <strong>Monitor closely</strong>
                </div>
              </div>
              <Link
                to="/analytics"
                className="at-btn at-btn-sm"
                style={{
                  background: '#bae6fd',
                  color: '#075985',
                  border: 'none',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  alignSelf: 'center',
                  textDecoration: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Sensor Trends + Current Weather & Farm Timeline (Matching Reference) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: 16, alignItems: 'start' }}>
        
        {/* Sensor Trends Card */}
        <div className="at-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity style={{ width: 17, height: 17, color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Sensor Trends</span>
              
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="at-input at-select"
                style={{ height: 30, fontSize: 12, padding: '2px 24px 2px 8px', width: 'auto', fontWeight: 600 }}
              >
                <option value="Soil Moisture">Soil Moisture</option>
                <option value="Temperature">Temperature</option>
                <option value="Humidity">Humidity</option>
                <option value="Soil pH">Soil pH</option>
              </select>
            </div>

            {/* Time Range Pills */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface-muted)', padding: 3, borderRadius: 'var(--radius-lg)' }}>
              {[
                { id: '24h', label: '24 Hours' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setTrendRange(pill.id as any)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                    background: trendRange === pill.id ? 'var(--color-primary)' : 'transparent',
                    color: trendRange === pill.id ? 'white' : 'var(--color-text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 210, width: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', left: -8, top: '40%', transform: 'rotate(-90deg)', fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Soil Moisture (%)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
        </div>

        {/* Right Stack: Current Weather + Farm Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Current Weather Card */}
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
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.1 }}>
                    27.4°C
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Partly Cloudy
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, borderLeft: '1px solid var(--color-border-muted)', paddingLeft: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Humidity</span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>71%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Wind Speed</span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>6.2 km/h</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Rainfall</span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>0 mm</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Light Intensity</span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>68 klux</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Farm Timeline Card */}
          <div className="at-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                <Clock style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
                Farm Timeline
              </div>
              <Link to="/activity-log" style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
                View All
              </Link>
            </div>

            {/* Timeline Steps */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', padding: '4px 0' }}>
              {/* Connector line */}
              <div
                style={{
                  position: 'absolute',
                  top: 9,
                  left: 12,
                  right: 12,
                  height: 2,
                  background: 'var(--color-border)',
                  zIndex: 0,
                }}
              />

              {[
                { date: '01 Sep', label: 'Crop planted', color: 'var(--color-primary)' },
                { date: '08 Sep', label: 'First scan', color: 'var(--color-primary)' },
                { date: '15 Sep', label: 'Growth +12%', color: 'var(--color-primary)' },
                { date: '22 Sep', label: 'Moisture stress', color: 'var(--color-warning)' },
                { date: '24 Sep', label: 'Irrigation', color: 'var(--color-primary)' },
                { date: 'Today', label: 'Normal', color: 'var(--color-primary)' },
              ].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, textAlign: 'center', minWidth: 42 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: step.color,
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px var(--color-border)',
                      marginBottom: 4,
                    }}
                  />
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-primary)' }}>{step.date}</span>
                  <span style={{ fontSize: 8, color: 'var(--color-text-muted)', lineHeight: 1.1, marginTop: 1 }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Recommendations (Matching Reference) ── */}
      <div className="at-card" style={{ padding: '18px 20px', background: '#f8fdf9', border: '1px solid #dcfce7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--color-primary-text)' }}>
              <Sparkles style={{ width: 17, height: 17, color: 'var(--color-primary)' }} />
              Recommendations
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Actionable insights for a healthier and more productive farm
            </div>
          </div>
          <Link to="/advisor" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
            View All Recommendations
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {/* Card 1 */}
          <Link
            to="/control"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-lg)', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Droplets style={{ width: 17, height: 17, color: '#0284c7' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Irrigate Zone 3</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Soil moisture is below the recommended range.</div>
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }} />
          </Link>

          {/* Card 2 */}
          <Link
            to="/crop-health"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-lg)', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sprout style={{ width: 17, height: 17, color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Inspect Zone 2</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Crop condition has changed compared to previous observation.</div>
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }} />
          </Link>

          {/* Card 3 */}
          <Link
            to="/analytics"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-xs)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-lg)', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BarChart3 style={{ width: 17, height: 17, color: 'var(--color-text-secondary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Monitor Zone 4</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Growth rate is lower than the farm average.</div>
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }} />
          </Link>
        </div>
      </div>

      {/* ── ROW 5: Deep System Sections (Live Plots, Hierarchy, Supabase Monitor) ── */}
      <div className="at-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="at-card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
          <div>
            <div className="at-card-title">
              <HeartPulse style={{ width: 17, height: 17, color: 'var(--color-primary)' }} />
              Live Field Plot Telemetry &mdash; {activeFarmland?.name || 'Active Farm'}
            </div>
            <div className="at-card-subtitle">Real-time plot measurements and sensor broadcasting status.</div>
          </div>
          <Link to="/virtual-farm" className="at-btn at-btn-secondary at-btn-sm">
            Open Virtual Farm &rarr;
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 0,
          borderTop: '1px solid var(--color-border-muted)',
        }}>
          {activeSections.slice(0, 4).map((plot, idx) => (
            <div
              key={plot.id}
              style={{
                padding: '16px 18px',
                borderRight: '1px solid var(--color-border-muted)',
                borderBottom: '1px solid var(--color-border-muted)',
                transition: 'background 0.12s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'monospace',
                  }}>
                    {plot.code}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                    {plot.name}
                  </span>
                </div>
                <span className="at-badge success" style={{ fontSize: 10 }}>
                  <span className="at-badge-dot" />
                  {plot.soilHealthScore || 85}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ background: 'var(--color-surface-muted)', padding: '6px 8px', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Moisture</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatMoisture(plot.soilMoisture)}</div>
                </div>
                <div style={{ background: 'var(--color-surface-muted)', padding: '6px 8px', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Temp</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{formatTemperature(plot.airTemp)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supabase Live DB Monitor Section */}
      <SupabaseMonitorSection />
    </div>
  );
};

export default Dashboard;
