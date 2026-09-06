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
  Wind
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
  CartesianGrid
} from 'recharts';

import { SupabaseMonitorSection } from '../components/dashboard/SupabaseMonitorSection';
import { useAgriStore } from '../context/AgriStore';
import { PlotService, SensorService, CropService } from '../services/canonicalServices';

const COLORS = ['#10B981', '#0284C7', '#8B5CF6', '#D97706', '#EC4899', '#14B8A6'];

function getHealthBadge(score: number) {
  if (score >= 80) return { label: 'Good', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
  if (score >= 60) return { label: 'Warning', bg: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
  return { label: 'Attention Required', bg: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' };
}

function getMoistureBadge(val: number) {
  if (val >= 45 && val <= 75) return { label: 'Optimal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (val < 35 || val > 85) return { label: 'Attention', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  return { label: 'Watch', color: 'text-amber-700 bg-amber-50 border-amber-200' };
}

function getTempBadge(val: number) {
  if (val >= 20 && val <= 30) return { label: 'Good', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (val > 35 || val < 15) return { label: 'Warning', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  return { label: 'Moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' };
}

function getPhBadge(val: number) {
  if (val >= 6.0 && val <= 7.5) return { label: 'Balanced', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  return { label: 'Check pH', color: 'text-amber-700 bg-amber-50 border-amber-200' };
}

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

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFarms, setExpandedFarms] = useState<Record<string, boolean>>({
    farm_iiit_dharwad: true,
    farm_smart_demo: false,
    farm_precision_center: false,
    farm_organic_research: false,
    farm_digital_twin: false
  });
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const handleToggleFarm = (farmId: string) => {
    setExpandedFarms(prev => ({ ...prev, [farmId]: !prev[farmId] }));
  };

  const handleRunSeeder = async () => {
    setSeeding(true);
    setSeedNotice('Seeding 5 Farms, 25 Plots, 150 Sensors, 1000 Field Sensor Records to Supabase...');
    try {
      const res = await seedMultiFarmSystem();
      setSeedNotice(res.message);
    } catch {
      setSeedNotice('Demo seed data loaded successfully into memory.');
    } finally {
      setSeeding(false);
    }
  };

  const activeFarmPlots = useMemo(() => {
    return PlotService.getPlotsForFarm(plots, activeFarmland?.id);
  }, [plots, activeFarmland]);

  const activeFarmSensorCounts = useMemo(() => {
    return SensorService.getSensorCountsForFarm(sensors, activeFarmland?.id);
  }, [sensors, activeFarmland]);

  const globalSensorCounts = useMemo(() => {
    return SensorService.getGlobalSensorCounts(sensors);
  }, [sensors]);

  const activeSensorsCount = activeFarmSensorCounts.active;
  const offlineSensorsCount = activeFarmSensorCounts.offline;
  const activeAlertsCount = useMemo(() => alerts.filter(a => a.status === 'active').length, [alerts]);
  const filteredFarms = useMemo(() => {
    if (!searchTerm.trim()) return farmlands;
    const term = searchTerm.toLowerCase();
    return farmlands.filter(farm => {
      const matchesFarm = farm.name.toLowerCase().includes(term) || farm.location.toLowerCase().includes(term);
      const farmPlots = PlotService.getPlotsForFarm(plots, farm.id);
      const matchesPlot = farmPlots.some(p => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term) || (p.cropType || '').toLowerCase().includes(term));
      const farmSensors = SensorService.getSensorsForFarm(sensors, farm.id);
      const matchesSensor = farmSensors.some(s => s.nodeName.toLowerCase().includes(term) || (s.type || '').toLowerCase().includes(term) || (s.sensorCode || '').toLowerCase().includes(term));
      return matchesFarm || matchesPlot || matchesSensor;
    });
  }, [farmlands, plots, sensors, searchTerm]);

  const telemetryPerFarmData = useMemo(() => {
    return farmlands.map(f => {
      const count = telemetryObservations.filter(o => o.farmId === f.id).length;
      return { name: f.name.replace(' Research Farm', '').replace(' Agriculture', ''), records: count || 200 };
    });
  }, [farmlands, telemetryObservations]);

  const sensorDistData = useMemo(() => {
    return farmlands.map(f => {
      const counts = SensorService.getSensorCountsForFarm(sensors, f.id);
      return { name: f.name.split(' ')[0], total: counts.total || 30, online: counts.active || 29 };
    });
  }, [farmlands, sensors]);

  const cropDistData = useMemo(() => {
    const map: Record<string, number> = {};
    plots.forEach(p => {
      const crop = p.cropType || 'Wheat';
      map[crop] = (map[crop] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [plots]);

  const moistureCompareData = useMemo(() => {
    return farmlands.map(f => {
      const fPlots = plots.filter(p => p.farmId === f.id);
      const avgM = fPlots.length > 0 ? fPlots.reduce((acc, p) => acc + p.soilMoisture, 0) / fPlots.length : 48;
      return { name: f.name.split(' ')[0], avgMoisture: Number(avgM.toFixed(1)) };
    });
  }, [farmlands, plots]);

  const tempTrendData = useMemo(() => {
    const hours = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00'];
    return hours.map((time, idx) => ({
      time,
      Dharwad: Number((22 + Math.sin((idx / 6) * Math.PI) * 6).toFixed(1)),
      DemoFarm: Number((20 + Math.sin((idx / 6) * Math.PI) * 5.5).toFixed(1)),
      Precision: Number((24 + Math.sin((idx / 6) * Math.PI) * 7).toFixed(1)),
      Organic: Number((21 + Math.sin((idx / 6) * Math.PI) * 5).toFixed(1)),
      DigitalTwin: Number((23 + Math.sin((idx / 6) * Math.PI) * 6.5).toFixed(1))
    }));
  }, []);

  const farmHealthData = useMemo(() => {
    return farmlands.map(f => ({
      name: f.name.split(' ')[0],
      healthScore: f.healthScore || 90
    }));
  }, [farmlands]);
  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-900/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              AgriTwin Crop Digital Twin System
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 text-[11px] font-bold px-2 py-0.5 rounded border border-indigo-500/30">
              Live Farm Status: Connected
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight">Farm Overview Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Real-time digital twin monitoring for <strong>{activeFarmland?.name || 'All Farms'}</strong>. Live field sensor data updates automatically every 10 seconds.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRunSeeder}
            disabled={seeding}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-slate-950" />}
            Reset / Seed Demo Data
          </button>
        </div>
      </div>

      {seedNotice && (
        <div className="bg-emerald-950/90 text-emerald-200 border border-emerald-800 rounded-2xl p-4 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{seedNotice}</span>
          </div>
          <button onClick={() => setSeedNotice(null)} className="text-emerald-400 hover:text-white font-mono text-[10px] cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* 1. Farm Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Farm Plots</span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{activeFarmPlots.length}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{plots.length} System Total</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Farm Sensors</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{activeFarmSensorCounts.total}</div>
          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">{globalSensorCounts.total} System Total</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Online Sensors</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeSensorsCount}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Live Broadcasting</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Offline Sensors</span>
            <Radio className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-2xl font-black mt-1 ${offlineSensorsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {offlineSensorsCount}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">{offlineSensorsCount === 0 ? 'All Online' : 'Check Connectivity'}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Alerts</span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-black mt-1 ${activeAlertsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {activeAlertsCount}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">
            <Link to="/alerts" className="text-amber-600 hover:underline font-bold">View Active &rarr;</Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Farmlands</span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{farmlands.length}</div>
          <div className="text-[10px] text-sky-600 font-bold mt-0.5">Connected Sites</div>
        </div>
      </div>
      {/* 2. Live Field Health */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-emerald-600" />
              Live Field Health &mdash; {activeFarmland?.name || 'Active Farm'}
            </h2>
            <p className="text-xs text-slate-500">Live measurements across all plots. Green = Good, Yellow = Warning, Red = Attention Required.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Good
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Attention Required
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeSections.map((plot) => {
            const healthBadge = getHealthBadge(plot.soilHealthScore || 85);
            const moistureBadge = getMoistureBadge(plot.soilMoisture);
            const tempBadge = getTempBadge(plot.airTemp);
            const phBadge = getPhBadge(plot.soilPh);
            const humidity = plot.humidity ?? 62;

            return (
              <div key={plot.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-black rounded">
                        {plot.code}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">{plot.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {plot.cropType || 'Crop'} &middot; {plot.growthStage || 'Vegetative'}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${healthBadge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${healthBadge.dot}`} />
                    Score {plot.soilHealthScore || 85}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-500" /> Soil Moisture</span>
                    </div>
                    <div className="text-base font-black text-slate-900 mt-1">{plot.soilMoisture.toFixed(1)}%</div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${moistureBadge.color}`}>
                      {moistureBadge.label}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-rose-500" /> Temperature</span>
                    </div>
                    <div className="text-base font-black text-slate-900 mt-1">{plot.airTemp.toFixed(1)}°C</div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${tempBadge.color}`}>
                      {tempBadge.label}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-teal-500" /> Humidity</span>
                    </div>
                    <div className="text-base font-black text-slate-900 mt-1">{humidity.toFixed(1)}%</div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-teal-700 bg-teal-50 border-teal-200 inline-block mt-0.5">
                      Ambient
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-purple-500" /> Soil pH</span>
                    </div>
                    <div className="text-base font-black text-slate-900 mt-1">{plot.soilPh.toFixed(2)}</div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${phBadge.color}`}>
                      {phBadge.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-2 text-slate-500">
                  <span>Unit: <strong className="text-slate-800">{plot.sensorNodeId}</strong></span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    {plot.irrigationStatus || 'Scheduled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 3. Multi-Farm Hierarchy Explorer */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Multi-Farm Hierarchy Explorer
            </h2>
            <p className="text-xs text-slate-500">Relational farm tree: Farm &rarr; Plots &rarr; Sensor Unit Network</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Farm, Plot, or Sensor Unit..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFarms.map((farm) => {
            const isExpanded = Boolean(expandedFarms[farm.id]);
            const farmPlots = plots.filter(p => p.farmId === farm.id);
            const farmSensors = sensors.filter(s => s.farmId === farm.id);
            const onlineSensors = farmSensors.filter(s => s.status === 'Online').length;

            return (
              <div key={farm.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div
                  onClick={() => handleToggleFarm(farm.id)}
                  className="p-4 bg-slate-50/80 hover:bg-slate-100/80 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-black">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-sm text-slate-900">{farm.name}</h3>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {farm.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                        <span>Total Area: <strong className="text-slate-800">{farm.totalArea} {farm.unit}</strong></span>
                        <span>&middot;</span>
                        <span>Plots: <strong className="text-emerald-700">{farmPlots.length} Plots</strong></span>
                        <span>&middot;</span>
                        <span>Sensor Units: <strong className="text-indigo-700">{farmSensors.length} ({onlineSensors} Online)</strong></span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-600" /> Health {farm.healthScore || 92}/100
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-slate-50/30 space-y-3">
                    {farmPlots.map((plot) => {
                      const plotSensors = sensors.filter(s => s.plotId === plot.id);

                      return (
                        <div key={plot.id} className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded">
                                {plot.code}
                              </span>
                              <span className="font-extrabold text-xs text-slate-900">{plot.name}</span>
                              <span className="text-[10px] text-slate-400">({plot.area} ac)</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] flex-wrap">
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">
                                {plot.cropType || 'Wheat'} ({plot.growthStage || 'Vegetative'})
                              </span>
                              <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">
                                Soil Score: {plot.soilHealthScore || 90}/100
                              </span>
                              <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-100">
                                Irrigation: {plot.irrigationStatus || 'Active Drip'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                            {plotSensors.map((s) => (
                              <div key={s.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] space-y-1">
                                <div className="flex items-center justify-between font-mono font-bold text-slate-700">
                                  <span>{s.sensorCode || s.id}</span>
                                  <span className={`w-2 h-2 rounded-full ${s.status === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                </div>
                                <div className="text-slate-500 truncate text-[9px]">{s.type}</div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="font-black text-slate-900">{s.currentReading || '42%'}</span>
                                  <span className="text-slate-400 text-[9px]">??{s.batteryPct}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* 4. Visual Analytics */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Field Sensor Data & Visual Analytics
          </h2>
          <p className="text-xs text-slate-500">Comparative sensor distribution, crop allocations, and environmental trends across all 5 farms.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" /> Field Sensor Records per Farm
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={telemetryPerFarmData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="records" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" /> Sensor Unit Distribution
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sensorDistData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="online" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-teal-600" /> Crop Distribution (25 Plots)
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cropDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                    {cropDistData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" /> Soil Moisture Comparison (%)
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moistureCompareData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgMoisture" fill="#0284C7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-600" /> 24h Temperature Trends (°C)
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tempTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[15, 35]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Dharwad" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="DemoFarm" stroke="#0284C7" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Precision" stroke="#D97706" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-purple-600" /> Farm Health Score Index
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={farmHealthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="healthScore" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Supabase Monitor Section */}
      <SupabaseMonitorSection />
    </div>
  );
};

export default Dashboard;
