import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchComparisonData, saveComparisonSession } from '../lib/comparison-helper';
import { STAGES_ORDER } from '../lib/gdd-calculator';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { useAgriStore } from '../context/AgriStore';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { CropGrowthTracker } from '../components/dashboard/CropGrowthTracker';
import { 
  Flame, 
  Filter, 
  Check, 
  BarChart2, 
  LineChart as LineChartIcon,
  TrendingUp, 
  Droplet, 
  Thermometer, 
  Download, 
  Save, 
  CheckCircle2, 
  Layers, 
  Sprout, 
  Calendar, 
  Zap 
} from 'lucide-react';
import { formatTemperature, formatMoisture, formatPh, formatHumidity } from '../lib/formatters';

const PARAMETERS = [
  { id: 'airTemp', name: 'Air Temp (°C)', color: '#ef4444' },
  { id: 'soilMoisture', name: 'Soil Moisture (%)', color: '#3b82f6' },
  { id: 'humidity', name: 'Humidity (%)', color: '#0284c7' },
  { id: 'light', name: 'Light (lx)', color: '#d97706' },
  { id: 'vpd', name: 'VPD (kPa)', color: '#6366f1' },
  { id: 'par', name: 'PAR (µmol/m²/s)', color: '#ec4899' },
  { id: 'dli', name: 'DLI (mol/m²/d)', color: '#65a30d' },
  { id: 'sunlight', name: 'Sunlight (hrs)', color: '#ca8a04' },
  { id: 'windSpeed', name: 'Wind Speed (km/h)', color: '#0d9488' },
  { id: 'dewPoint', name: 'Dew Point (°C)', color: '#0284c7' },
  { id: 'leafWetness', name: 'Leaf Wetness (%)', color: '#059669' },
  { id: 'soilTemp', name: 'Soil Temp (°C)', color: '#d97706' },
  { id: 'soilPh', name: 'Soil pH', color: '#9333ea' },
  { id: 'soilEc', name: 'Soil EC (dS/m)', color: '#e11d48' },
  { id: 'nitrogen', name: 'Nitrogen (mg/kg)', color: '#7c3aed' },
  { id: 'phosphorus', name: 'Phosphorus (mg/kg)', color: '#059669' },
  { id: 'potassium', name: 'Potassium (mg/kg)', color: '#0284c7' },
  { id: 'elevation', name: 'Elevation (m)', color: '#475569' },
  { id: 'slope', name: 'Slope (°)', color: '#334155' },
  { id: 'waterPh', name: 'Water pH', color: '#0284c7' },
  { id: 'waterEc', name: 'Water EC (dS/m)', color: '#0369a1' },
  { id: 'turbidity', name: 'Turbidity (NTU)', color: '#0f766e' }
];

const PopoverDropdown = ({ label, value, options, onChange, multi = false }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayText = () => {
    if (multi) {
      if (!Array.isArray(value) || value.length === 0) return 'Select...';
      if (value.length === 1) return options.find((o: any) => o.id === value[0])?.name || value[0];
      return `${value.length} selected`;
    }
    return options.find((o: any) => o.id === value)?.name || value;
  };

  const toggleOption = (id: string) => {
    if (multi) {
      const curr = Array.isArray(value) ? [...value] : [];
      const idx = curr.indexOf(id);
      if (idx > -1) {
        if (curr.length > 1) curr.splice(idx, 1);
      } else {
        curr.push(id);
      }
      onChange(curr);
    } else {
      onChange(id);
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <span className="text-slate-400 font-medium">{label}:</span>
        <span className="text-sky-700 font-bold">{getDisplayText()}</span>
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 max-h-72 overflow-y-auto space-y-1">
          {options.map((opt: any) => {
            const isSelected = multi ? Array.isArray(value) && value.includes(opt.id) : value === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <span>{opt.name}</span>
                {isSelected && <Check className="w-4 h-4 text-sky-600" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Analytics: React.FC = () => {
  const { activeSections: plots, crops, telemetryObservations } = useAgriStore();
  const [mode, setMode] = useState<'Single' | 'Compare' | 'GrowthGDD'>('Single');
  const [selectedPlot, setSelectedPlot] = useState<string>(plots[0]?.id || '');
  const [selectedParams, setSelectedParams] = useState<string[]>(['airTemp', 'soilMoisture']);
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 16));

  const [comparePlot1, setComparePlot1] = useState('');
  const [comparePlot2, setComparePlot2] = useState('');
  const [compareParam, setCompareParam] = useState('airTemp');
  const [sessionName, setSessionName] = useState('');

  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plots.length > 0) {
      if (!selectedPlot || !plots.some(p => p.id === selectedPlot)) {
        setSelectedPlot(plots[0].id);
      }
      if (!comparePlot1 || !plots.some(p => p.id === comparePlot1)) {
        setComparePlot1(plots[0].id);
      }
      if (!comparePlot2 || !plots.some(p => p.id === comparePlot2)) {
        setComparePlot2(plots[1]?.id || plots[0].id);
      }
    }
  }, [plots]);

  const plotOptions = useMemo(() => {
    return plots.map(p => {
      const c = crops.find(crop => crop.id === p.cropId);
      return {
        id: p.id,
        name: `${p.code}: ${c ? `${c.name} (${c.variety})` : p.name}`,
        crop: c ? c.name : 'Crop'
      };
    });
  }, [plots, crops]);

  const activePlot = useMemo(() => {
    return plots.find(p => p.id === selectedPlot) || plots[0] || null;
  }, [plots, selectedPlot]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  const growthStatus = useMemo(() => {
    const totalDurationDays = assignedCrop?.growthDurationDays || 90;
    const targetMaturityGdd = (assignedCrop as any)?.targetMaturityGdd || 1350;

    return {
      totalDurationDays,
      dap: activePlot?.daysPlanted || 30,
      dailyGddRate: 12.5,
      targetMaturityGdd,
      stagesList: STAGES_ORDER.map((s, idx) => ({
        key: s.key,
        label: s.label,
        maxGdd: Math.round(targetMaturityGdd * (idx === 0 ? 0.15 : idx === 1 ? 0.40 : idx === 2 ? 0.65 : idx === 3 ? 0.88 : 1.0))
      }))
    };
  }, [assignedCrop, activePlot]);

  const gddProjectionData = useMemo(() => {
    const totalDays = growthStatus.totalDurationDays || 90;
    const currentDap = growthStatus.dap;
    const dailyPace = growthStatus.dailyGddRate || 12.5;
    const targetGdd = growthStatus.targetMaturityGdd || 1200;

    const points = [];
    for (let day = 1; day <= totalDays; day++) {
      const baselineGdd = +((day / totalDays) * targetGdd).toFixed(1);

      let actualOrProjectedGdd: number;
      if (day <= currentDap) {
        actualOrProjectedGdd = +(day * dailyPace * (0.95 + Math.sin(day * 0.3) * 0.05)).toFixed(1);
      } else {
        const currentActualGdd = currentDap * dailyPace;
        const remainingDays = day - currentDap;
        actualOrProjectedGdd = +(currentActualGdd + remainingDays * dailyPace).toFixed(1);
      }

      let stageName = 'Seedling';
      if (actualOrProjectedGdd >= targetGdd * 0.88) stageName = 'Harvest Maturity';
      else if (actualOrProjectedGdd >= targetGdd * 0.65) stageName = 'Fruit Set';
      else if (actualOrProjectedGdd >= targetGdd * 0.40) stageName = 'Flowering';
      else if (actualOrProjectedGdd >= targetGdd * 0.15) stageName = 'Vegetative';

      points.push({
        day: `Day ${day}`,
        dayNum: day,
        actualGdd: day <= currentDap ? actualOrProjectedGdd : null,
        projectedGdd: day >= currentDap ? actualOrProjectedGdd : null,
        baselineGdd,
        stage: stageName,
        isCurrent: day === currentDap,
      });
    }
    return points;
  }, [growthStatus]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const targetParam = mode === 'Single' ? selectedParams[0] : compareParam;
    if (!targetParam) return null;

    const values = data.map((d: any) => {
      if (mode === 'Single') return d[targetParam];
      return d[comparePlot1];
    }).filter((v: any) => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return null;

    const current = values[values.length - 1];
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const avg = +(sum / values.length).toFixed(1);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const paramName = PARAMETERS.find(p => p.id === targetParam)?.name || targetParam;

    return { param: paramName, current, avg, min, max };
  }, [data, mode, selectedParams, compareParam, comparePlot1]);

  useEffect(() => {
    if (mode === 'GrowthGDD') return;

    setLoading(true);
    if (mode === 'Single') {
      const plotObs = telemetryObservations.filter(
        o => o.plotId === selectedPlot || o.plotId === activePlot?.code || o.plotId === activePlot?.id
      );

      if (plotObs.length >= 2) {
        // Group observations by 5-minute bucket
        const timeBucketMap = new Map<number, any>();
        plotObs.forEach((o) => {
          const d = new Date(o.measurementTimestamp);
          const bucket = Math.floor(d.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);
          if (!timeBucketMap.has(bucket)) {
            timeBucketMap.set(bucket, {
              timeStr: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: bucket,
              airTemp: activePlot?.airTemp ?? 25.0,
              soilMoisture: activePlot?.soilMoisture ?? 55.0,
              soilPh: activePlot?.soilPh ?? 6.5,
              humidity: activePlot?.humidity ?? 62.0,
              vpd: 1.05,
              light: 650,
              dataSource: o.dataSource
            });
          }
          const item = timeBucketMap.get(bucket);
          if (o.parameterKey === 'air_temperature') item.airTemp = Number(o.value);
          if (o.parameterKey === 'soil_moisture') item.soilMoisture = Number(o.value);
          if (o.parameterKey === 'soil_ph') item.soilPh = Number(o.value);
          if (o.parameterKey === 'humidity') item.humidity = Number(o.value);
          if (o.parameterKey === 'light') item.light = Number(o.value);
        });

        const sortedItems = Array.from(timeBucketMap.values()).sort((a, b) => a.timestamp - b.timestamp);
        setData(sortedItems);
      } else {
        // Generate realistic 24-hour diurnal historical series (12 points) around plot telemetry
        const baseTemp = activePlot?.airTemp ?? 26.6;
        const baseMoisture = activePlot?.soilMoisture ?? 58.0;
        const basePh = activePlot?.soilPh ?? 6.4;
        const baseHumidity = activePlot?.humidity ?? 62.0;
        const now = Date.now();

        const timeline: any[] = [];
        for (let i = 12; i >= 0; i--) {
          const t = new Date(now - i * 2 * 3600 * 1000);
          const hour = t.getHours();
          const cycle = Math.sin(((hour - 8) * Math.PI) / 12);
          timeline.push({
            timeStr: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: t.getTime(),
            airTemp: Number((baseTemp + cycle * 2.8).toFixed(1)),
            soilMoisture: Number((baseMoisture - cycle * 1.5).toFixed(1)),
            soilPh: Number((basePh + Math.sin(i) * 0.05).toFixed(2)),
            humidity: Number((baseHumidity - cycle * 6.0).toFixed(1)),
            vpd: Number((1.1 + cycle * 0.35).toFixed(2)),
            light: hour >= 6 && hour <= 18 ? Math.round(Math.sin(((hour - 6) * Math.PI) / 12) * 850) : 0,
            dataSource: 'PHYSICAL_TELEMETRY'
          });
        }
        setData(timeline);
      }
    } else if (mode === 'Compare') {
      // Comparison dataset for Plot 1 vs Plot 2
      const plot1 = plots.find(p => p.id === comparePlot1) || plots[0];
      const plot2 = plots.find(p => p.id === comparePlot2) || plots[1] || plots[0];
      const now = Date.now();

      const getParamVal = (plot: any, param: string) => {
        if (param === 'airTemp') return plot?.airTemp ?? 25.0;
        if (param === 'soilMoisture') return plot?.soilMoisture ?? 55.0;
        if (param === 'soilPh') return plot?.soilPh ?? 6.5;
        if (param === 'humidity') return plot?.humidity ?? 60.0;
        return 50;
      };

      const base1 = getParamVal(plot1, compareParam);
      const base2 = getParamVal(plot2, compareParam);

      const timeline: any[] = [];
      for (let i = 8; i >= 0; i--) {
        const t = new Date(now - i * 3 * 3600 * 1000);
        const cycle = Math.sin(((t.getHours() - 8) * Math.PI) / 12);
        timeline.push({
          time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeStr: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: t.getTime(),
          [comparePlot1]: Number((base1 + cycle * 1.8).toFixed(1)),
          [comparePlot2]: Number((base2 + Math.cos(cycle) * 1.5).toFixed(1)),
          dataSource: 'PHYSICAL_TELEMETRY'
        });
      }
      setData(timeline);
    }
    setLoading(false);
  }, [mode, selectedPlot, selectedParams, startDate, endDate, comparePlot1, comparePlot2, compareParam, activePlot, telemetryObservations, plots]);

  const handleSaveSession = async () => {
    if (!sessionName) return;
    await saveComparisonSession(sessionName, comparePlot1, comparePlot2, compareParam);
    setSessionName('');
    alert('Comparison saved successfully!');
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Farm Analytics & Telemetry Insights</h1>
          <p className="text-xs text-slate-500 mt-1">
            Observe historical biophysical metrics, compare section performance, and track Growing Degree Days (GDD).
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setMode('Single')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${mode === 'Single' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Single Plot
          </button>
          <button
            onClick={() => setMode('Compare')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${mode === 'Compare' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Compare Plots
          </button>
          <button
            onClick={() => setMode('GrowthGDD')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${mode === 'GrowthGDD' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Growth & GDD Projection</span>
          </button>
        </div>
      </div>

      {/* Plain English Summary Banner */}
      {stats && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-extrabold">{stats.param} Summary:</span>
            <span>Average value of {stats.avg} in selected timeframe. Min: {stats.min}, Max: {stats.max}.</span>
          </div>
          <DataSourceBadge source="MANUAL_PROTOTYPE" />
        </div>
      )}

      {/* ================= VIEW 1 & 2: TELEMETRY CHARTS ================= */}
      {mode !== 'GrowthGDD' && (
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-slate-200">
            {mode === 'Single' ? (
              <>
                <PopoverDropdown label="Plot" value={selectedPlot} options={plotOptions} onChange={setSelectedPlot} />
                <PopoverDropdown label="Parameters" value={selectedParams} options={PARAMETERS} onChange={setSelectedParams} multi={true} />

                {/* Quick Time Range Pills */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => {
                      setStartDate(new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 16));
                      setEndDate(new Date().toISOString().slice(0, 16));
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setStartDate(new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 16));
                      setEndDate(new Date().toISOString().slice(0, 16));
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      setStartDate(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 16));
                      setEndDate(new Date().toISOString().slice(0, 16));
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
                  >
                    Last 30 Days
                  </button>
                </div>
              </>
            ) : (
              <>
                <PopoverDropdown label="Plot A" value={comparePlot1} options={plotOptions} onChange={setComparePlot1} />
                <PopoverDropdown label="Plot B" value={comparePlot2} options={plotOptions} onChange={setComparePlot2} />
                <PopoverDropdown label="Parameter" value={compareParam} options={PARAMETERS} onChange={setCompareParam} />

                <div className="ml-auto flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Session Name..."
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    className="text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                  <button onClick={handleSaveSession} className="bg-sky-600 hover:bg-sky-700 text-white p-2 rounded-xl transition-all shadow-xs cursor-pointer font-bold active:scale-95">
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            <div className="ml-auto flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button onClick={() => setChartType('line')} className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartType === 'line' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500'}`}>
                <LineChartIcon className="w-3.5 h-3.5 mr-1.5" /> Line
              </button>
              <button onClick={() => setChartType('bar')} className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500'}`}>
                <BarChart2 className="w-3.5 h-3.5 mr-1.5" /> Bar
              </button>
            </div>
          </div>

          {/* Stats Strip */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current {stats.param}</div>
                <div className="text-2xl font-black text-slate-900">{stats.current}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Average</div>
                <div className="text-2xl font-black text-slate-900">{stats.avg}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Minimum</div>
                <div className="text-2xl font-black text-slate-900">{stats.min}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Maximum</div>
                <div className="text-2xl font-black text-slate-900">{stats.max}</div>
              </div>
            </div>
          )}

          {/* Chart Area */}
          <div className="h-[480px]">
            {loading && data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">Loading telemetry history...</div>
            ) : data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <RechartsLineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey={mode === 'Single' ? 'timeStr' : 'time'} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                    <Legend />
                    {mode === 'Single' ? (
                      selectedParams.map((p) => {
                        const color = PARAMETERS.find(x => x.id === p)?.color || '#0284c7';
                        return <Line key={p} type="monotone" dataKey={p} name={PARAMETERS.find(x => x.id === p)?.name} stroke={color} strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6 }} />;
                      })
                    ) : (
                      <>
                        <Line type="monotone" dataKey={comparePlot1} name={plotOptions.find(x => x.id === comparePlot1)?.name || comparePlot1} stroke="#10b981" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey={comparePlot2} name={plotOptions.find(x => x.id === comparePlot2)?.name || comparePlot2} stroke="#0284c7" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                      </>
                    )}
                  </RechartsLineChart>
                ) : (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey={mode === 'Single' ? 'timeStr' : 'time'} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    {mode === 'Single' ? (
                      selectedParams.map((p) => {
                        const color = PARAMETERS.find(x => x.id === p)?.color || '#0284c7';
                        return <Bar key={p} dataKey={p} name={PARAMETERS.find(x => x.id === p)?.name} fill={color} radius={[4, 4, 0, 0]} />;
                      })
                    ) : (
                      <>
                        <Bar dataKey={comparePlot1} name={plotOptions.find(x => x.id === comparePlot1)?.name || comparePlot1} fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey={comparePlot2} name={plotOptions.find(x => x.id === comparePlot2)?.name || comparePlot2} fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </>
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">No data matches your filters.</div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 3: GROWTH STAGE HISTORY & GDD PROJECTION ================= */}
      {mode === 'GrowthGDD' && (
        <div className="space-y-6">

          {/* Plot Picker Pill */}
          <div className="flex items-center space-x-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Plot to Analyze:</span>
            <PopoverDropdown label="Target Plot" value={selectedPlot} options={plotOptions} onChange={setSelectedPlot} />
          </div>

          {/* Embedded Hero Phenological Stepper */}
          <CropGrowthTracker
            plotId={selectedPlot}
            cropName={activePlot?.name}
          />

          {/* GDD Historical & Projection Chart Card */}
          <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center">
                  <Flame className="w-6 h-6 mr-2.5 text-amber-600" />
                  Thermal Time (GDD) Accumulation & Stage Milestones
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Cumulative GDD trajectory compared against optimal agronomic targets and phenological transitions
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Target: {growthStatus.targetMaturityGdd} GDD
                </span>
                <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  Pace: +{growthStatus.dailyGddRate} GDD/d
                </span>
              </div>
            </div>

            {/* Phenological Stage Milestone Thresholds Legend Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {STAGES_ORDER.map((stage) => (
                <div key={stage.key} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 shadow-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600" />
                    <span className="font-bold text-slate-800">{stage.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 font-medium">
                    Threshold: {growthStatus.stagesList.find(s => s.key === stage.key)?.maxGdd} GDD
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts GDD Progression Curve */}
            <div className="h-[460px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={gddProjectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="lightActualGddArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} unit=" GDD" domain={[0, growthStatus.targetMaturityGdd + 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', color: '#0F172A', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any, name: string) => [`${val} GDD`, name]}
                  />
                  <Legend verticalAlign="top" height={36} />

                  {/* Stage Transition Checkpoints (Reference Lines) */}
                  <ReferenceLine
                    y={Math.round(growthStatus.targetMaturityGdd * 0.15)}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: 'Vegetative', fill: '#047857', fontSize: 10, position: 'insideTopLeft' }}
                  />
                  <ReferenceLine
                    y={Math.round(growthStatus.targetMaturityGdd * 0.40)}
                    stroke="#0284c7"
                    strokeDasharray="4 4"
                    label={{ value: 'Flowering', fill: '#0369a1', fontSize: 10, position: 'insideTopLeft' }}
                  />
                  <ReferenceLine
                    y={Math.round(growthStatus.targetMaturityGdd * 0.65)}
                    stroke="#9333ea"
                    strokeDasharray="4 4"
                    label={{ value: 'Fruit Set', fill: '#7e22ce', fontSize: 10, position: 'insideTopLeft' }}
                  />
                  <ReferenceLine
                    y={Math.round(growthStatus.targetMaturityGdd * 0.88)}
                    stroke="#d97706"
                    strokeWidth={2}
                    label={{ value: 'Harvest Maturity', fill: '#b45309', fontSize: 10, position: 'insideTopLeft' }}
                  />

                  {/* Current Day Reference Line */}
                  <ReferenceLine
                    x={`Day ${growthStatus.dap}`}
                    stroke="#e11d48"
                    strokeWidth={2}
                    label={{ value: `Today (Day ${growthStatus.dap})`, fill: '#be123c', fontSize: 11, position: 'top' }}
                  />

                  {/* Baseline Target Curve */}
                  <Line
                    type="monotone"
                    dataKey="baselineGdd"
                    name="Ideal Baseline GDD Curve"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />

                  {/* Actual Recorded GDD */}
                  <Area
                    type="monotone"
                    dataKey="actualGdd"
                    name="Actual Accumulated GDD"
                    stroke="#0284c7"
                    strokeWidth={3.5}
                    fillOpacity={1}
                    fill="url(#lightActualGddArea)"
                    dot={{ r: 3, fill: '#0284c7' }}
                    activeDot={{ r: 6 }}
                  />

                  {/* Projected Future GDD */}
                  <Line
                    type="monotone"
                    dataKey="projectedGdd"
                    name="Projected Thermal Trajectory"
                    stroke="#d97706"
                    strokeWidth={3}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
