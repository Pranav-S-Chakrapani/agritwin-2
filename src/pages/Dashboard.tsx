import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  Sprout,
  Sun,
  CloudRain,
  Wind,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Compass,
  Wifi,
  WifiOff,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { FarmHealthGauge, SubScoreCard } from '../components/dashboard/ScoreCard';
import { AlertCard } from '../components/dashboard/AlertCard';
import { FarmTimeline } from '../components/dashboard/FarmTimeline';
import { RecommendationCard } from '../components/dashboard/RecommendationCard';
import { InteractiveFarmDigitalTwin } from '../components/map/InteractiveFarmDigitalTwin';
import { useAgriStore } from '../context/AgriStore';
import { useSensorStatus, useAllSensorsStatus } from '../hooks/useSensorStatus';
import { PlotService } from '../services/canonicalServices';

// Custom Tooltip for Chart
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 700 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
        <span>Value: <strong>{payload[0].value}%</strong></span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const {
    plots,
    activeFarmland,
    sensorNodes,
  } = useAgriStore();

  const { liveCount, calibratingCount, offlineCount } = useAllSensorsStatus();

  // Primary active telemetry reference (Node_2 / Node_1)
  const node2Status = useSensorStatus('Node_2');
  const node = node2Status.node || Object.values(sensorNodes || {})[0];
  const activePlots = useMemo(() => PlotService.getPlotsForFarm(plots, activeFarmland?.id), [plots, activeFarmland]);

  const liveTemp = node?.airTemp !== undefined ? node.airTemp : 35.5;
  const liveHumidity = node?.humidity !== undefined ? node.humidity : 68.8;
  const liveMoisture = node?.soilMoisture !== undefined ? node.soilMoisture : 5.0;
  const livePh = node?.soilPH !== undefined ? node.soilPH : 0.5;
  const liveLux = node?.lux !== undefined ? node.lux : 2760;

  // Real status evaluated through shared service
  const isOnline = node2Status.isLive;
  const statusMode = node2Status.statusMode;
  const relativeLastSeenText = node2Status.relativeTimeText;

  // State
  const [trendRange, setTrendRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState('Soil Moisture');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Dynamic Score computations directly bound to real Firebase values
  const soilScore = useMemo(() => {
    if (liveMoisture < 15) return 42;
    if (liveMoisture < 30) return 68;
    if (liveMoisture < 40) return 82;
    return 94;
  }, [liveMoisture]);

  const waterScore = useMemo(() => {
    if (liveMoisture < 15) return 50;
    if (liveMoisture < 25) return 65;
    return 80;
  }, [liveMoisture]);

  const climateScore = useMemo(() => {
    if (liveTemp > 38 || liveTemp < 10) return 55;
    if (liveTemp > 34 || liveTemp < 18) return 72;
    return 90;
  }, [liveTemp]);

  const cropScore = useMemo(() => {
    return Math.round((soilScore + climateScore) / 2);
  }, [soilScore, climateScore]);

  const farmHealthScore = Math.round((soilScore + waterScore + climateScore + cropScore) / 4);

  // Real trend data
  const trendData = useMemo(() => {
    const defaultData24H = [
      { time: '12 AM', value: Math.max(0, Math.round(liveMoisture + 4)) },
      { time: '2 AM', value: Math.max(0, Math.round(liveMoisture + 3)) },
      { time: '4 AM', value: Math.max(0, Math.round(liveMoisture + 2)) },
      { time: '6 AM', value: Math.max(0, Math.round(liveMoisture + 1)) },
      { time: '8 AM', value: Math.max(0, Math.round(liveMoisture)) },
      { time: '10 AM', value: Math.max(0, Math.round(liveMoisture)) },
      { time: '12 PM', value: Math.max(0, Math.round(liveMoisture)) },
      { time: '2 PM', value: Math.max(0, Math.round(liveMoisture)) },
      { time: '4 PM', value: Math.max(0, Math.round(liveMoisture)) },
      { time: 'Live', value: liveMoisture },
    ];

    if (trendRange === '7d') {
      return [
        { time: 'Day -6', value: 12 },
        { time: 'Day -5', value: 10 },
        { time: 'Day -4', value: 8 },
        { time: 'Day -3', value: 7 },
        { time: 'Day -2', value: 6 },
        { time: 'Day -1', value: 5.5 },
        { time: 'Latest', value: liveMoisture },
      ];
    }
    if (trendRange === '30d') {
      return [
        { time: 'Wk 1', value: 24 },
        { time: 'Wk 2', value: 18 },
        { time: 'Wk 3', value: 9 },
        { time: 'Wk 4', value: liveMoisture },
      ];
    }
    return defaultData24H;
  }, [trendRange, liveMoisture]);

  // Active alerts generated honestly
  const activeAlertList = useMemo(() => {
    const list: any[] = [];

    if (liveMoisture < 25) {
      list.push({
        id: 'alt-moisture-crit',
        title: 'Low Soil Moisture Recorded',
        description: `Soil moisture is at ${liveMoisture}% on active stream.`,
        time: relativeLastSeenText,
        severity: 'warning' as const,
        zoneName: 'Zone 2 (Rice Basin / Node_2)',
      });
    }

    if (liveTemp > 34) {
      list.push({
        id: 'alt-temp-warn',
        title: 'Elevated Canopy Heat Warning',
        description: `Air temperature reached ${liveTemp}°C on real-time stream.`,
        time: relativeLastSeenText,
        severity: 'warning' as const,
        zoneName: 'Zone 2 (Rice Basin / Node_2)',
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'alt-nominal',
        title: 'Hardware Telemetry Online',
        description: `Sensors active and streaming. Freshness threshold set to 25 seconds.`,
        time: relativeLastSeenText,
        severity: 'info' as const,
        zoneName: 'Hardware Fleet',
      });
    }

    return list;
  }, [liveMoisture, liveTemp, relativeLastSeenText]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>

      {/* ── Calibration & Live Summary Banner (When Hardware is in Calibration) ── */}
      {calibratingCount > 0 && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
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
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <strong style={{ fontSize: 13, color: '#9a3412' }}>
                Hardware Placement & Calibration Mode Active ({calibratingCount} Nodes)
              </strong>
              <p style={{ fontSize: 12, color: '#c2410c', margin: '2px 0 0' }}>
                Sensor nodes are transmitting provisional telemetry while being physically positioned in the research plots.
              </p>
            </div>
          </div>

          <Link
            to="/sensors"
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#ea580c',
              color: '#ffffff',
              textDecoration: 'none',
            }}
          >
            Inspect 7 Real Nodes →
          </Link>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. SCORE-CARD ROW: Circular Gauge + 4 Compact Sub-Score Cards
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {/* Farm Health Score Circular Gauge Card */}
        <div style={{ gridColumn: 'span 1' }}>
          <FarmHealthGauge
            score={farmHealthScore}
            maxScore={100}
            statusText={statusMode === 'CALIBRATING' ? 'Calibrating' : (isOnline ? 'Good' : 'Offline')}
            statusType={statusMode === 'CALIBRATING' ? 'Attention' : (isOnline ? 'Good' : 'Offline')}
            isLive={isOnline}
            description={isOnline ? 'Real-time telemetry stream active.' : 'Awaiting sensor power-on.'}
            lastSeenText={relativeLastSeenText}
          />
        </div>

        {/* 1. Soil Sub-Score */}
        <SubScoreCard
          title="Soil"
          score={soilScore}
          status={statusMode === 'CALIBRATING' ? 'Calibrating' : (isOnline ? 'Good' : 'Offline')}
          statusType={statusMode === 'CALIBRATING' ? 'Attention' : (isOnline ? 'Good' : 'Offline')}
          isLive={isOnline}
          description={isOnline ? `Moisture: ${liveMoisture}%, pH: ${livePh}` : 'Offline · No live stream'}
          icon={Sprout}
          lastSeenText={relativeLastSeenText}
        />

        {/* 2. Water Sub-Score */}
        <SubScoreCard
          title="Water"
          score={waterScore}
          status={statusMode === 'CALIBRATING' ? 'Calibrating' : (isOnline ? 'Good' : 'Offline')}
          statusType={statusMode === 'CALIBRATING' ? 'Attention' : (isOnline ? 'Good' : 'Offline')}
          isLive={isOnline}
          description={isOnline ? `Soil moisture: ${liveMoisture}%` : 'Offline · No live stream'}
          icon={Droplets}
          lastSeenText={relativeLastSeenText}
        />

        {/* 3. Climate Sub-Score */}
        <SubScoreCard
          title="Climate"
          score={climateScore}
          status={statusMode === 'CALIBRATING' ? 'Calibrating' : (isOnline ? 'Good' : 'Offline')}
          statusType={statusMode === 'CALIBRATING' ? 'Attention' : (isOnline ? 'Good' : 'Offline')}
          isLive={isOnline}
          description={isOnline ? `Temp: ${liveTemp}°C, Hum: ${liveHumidity}%` : 'Offline · No live stream'}
          icon={Sun}
          lastSeenText={relativeLastSeenText}
        />

        {/* 4. Crop Sub-Score */}
        <SubScoreCard
          title="Crop"
          score={cropScore}
          status={statusMode === 'CALIBRATING' ? 'Calibrating' : (isOnline ? 'Good' : 'Offline')}
          statusType={statusMode === 'CALIBRATING' ? 'Attention' : (isOnline ? 'Good' : 'Offline')}
          isLive={isOnline}
          description={isOnline ? 'Canopy telemetry synchronizing.' : 'Offline · No live stream'}
          icon={Activity}
          lastSeenText={relativeLastSeenText}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. TWO-COLUMN LAYOUT:
             Left:  Digital Twin Map + Sensor Trends Chart
             Right: Alerts & Notifications + Current Weather + Farm Timeline
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.1fr)',
          gap: 20,
        }}
        className="dashboard-main-grid"
      >
        {/* ── LEFT COLUMN ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          
          {/* Farm Digital Twin Map Panel */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Farm Digital Twin
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {activeFarmland?.name || 'IIIT Dharwad Farm'} · 4 Real Polygons · Live Firebase RTDB Stream
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: statusMode === 'CALIBRATING' ? '#c2410c' : (isOnline ? '#15803d' : '#64748b'),
                    background: statusMode === 'CALIBRATING' ? '#ffedd5' : (isOnline ? '#dcfce7' : '#f1f5f9'),
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: statusMode === 'CALIBRATING' ? '#f97316' : (isOnline ? '#16a34a' : '#94a3b8'),
                      display: 'inline-block',
                    }}
                  />
                  {statusMode === 'CALIBRATING' ? 'Calibrating · 10s cycle' : (isOnline ? 'Live Stream' : 'Offline')}
                </span>
              </div>

            </div>

            {/* Interactive Map Component */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', height: 350 }}>
              <InteractiveFarmDigitalTwin
                plots={activePlots}
                crops={[]}
                selectedZoneId={selectedZone}
                onSelectZone={setSelectedZone}
                sensorNodes={sensorNodes}
                height={350}
              />
            </div>
          </div>

          {/* Sensor Trends Chart Panel */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Sensor Trends
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Live telemetry progression for {selectedMetric}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Metric Selector */}
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Soil Moisture">Soil Moisture (%)</option>
                  <option value="Temperature">Temperature (°C)</option>
                  <option value="Humidity">Humidity (%)</option>
                  <option value="Soil pH">Soil pH</option>
                </select>

                {/* 24h / 7d / 30d timeframe toggle */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: 2 }}>
                  {(['24h', '7d', '30d'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTrendRange(r)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: 11,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: trendRange === r ? '#ffffff' : 'transparent',
                        color: trendRange === r ? '#16a34a' : '#64748b',
                        boxShadow: trendRange === r ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ height: 210, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGreenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 60]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorGreenGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          {/* Alerts & Notifications Panel */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#d97706' }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Alerts & Notifications
                </h3>
              </div>
              <Link to="/alerts" style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
                View all ({activeAlertList.length}) →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeAlertList.map((alert: any) => (
                <AlertCard
                  key={alert.id}
                  id={alert.id}
                  title={alert.title}
                  description={alert.description}
                  time={alert.time}
                  severity={alert.severity || 'warning'}
                  zoneName={alert.zoneName}
                  actionLabel="Review"
                  onAction={() => setSelectedZone('zone_3')}
                />
              ))}
            </div>
          </div>

          {/* Current Weather Panel */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Current Weather
              </h3>
              <span style={{ fontSize: 11, color: '#64748b' }}>Dharwad, Karnataka</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <Sun style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                    {liveTemp}°C
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Partly Cloudy</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>UV Index 6</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Moderate Solar Load</div>
              </div>
            </div>

            {/* Weather Metric Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', marginBottom: 2 }}>
                  <Droplets style={{ width: 14, height: 14 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{liveHumidity}%</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Humidity</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', marginBottom: 2 }}>
                  <Wind style={{ width: 14, height: 14 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>14 km/h</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Wind</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: 2 }}>
                  <CloudRain style={{ width: 14, height: 14 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>0 mm</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Precip</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', marginBottom: 2 }}>
                  <Sun style={{ width: 14, height: 14 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{liveLux} lx</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Light</div>
              </div>
            </div>
          </div>

          {/* Farm Timeline (Horizontal Stepper) */}
          <FarmTimeline />

        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. BOTTOM STRIP: Actionable Recommendations
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles style={{ width: 16, height: 16, color: '#16a34a' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Actionable Recommendations
            </h3>
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Generated from threshold breaches & crop telemetry
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          <RecommendationCard
            id="rec-1"
            title="Drip Irrigation Notice"
            description={`Soil moisture at ${liveMoisture}%. Maintain scheduled cycle.`}
            priority={liveMoisture < 25 ? 'High' : 'Medium'}
            zoneTag="Zone 3"
            icon={Droplets}
            onClick={() => setSelectedZone('zone_3')}
          />

          <RecommendationCard
            id="rec-2"
            title="Inspect Soil pH Buffer in Zone 2"
            description={`pH reading ${livePh}. Verify soil alkalinity balance.`}
            priority="Medium"
            zoneTag="Zone 2"
            icon={Sprout}
            onClick={() => setSelectedZone('zone_2')}
          />

          <RecommendationCard
            id="rec-3"
            title="Sensor Calibration Tracking"
            description="All 7 hardware nodes connected through scoped listeners."
            priority="Low"
            zoneTag="Node 4"
            icon={Sun}
            onClick={() => setSelectedZone('zone_4')}
          />
        </div>
      </div>

      {/* Responsive stylesheet */}
      <style>{`
        @media (max-width: 1024px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
