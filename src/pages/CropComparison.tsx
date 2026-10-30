import React, { useState, useEffect, useMemo } from 'react';
import { fetchComparisonData, saveComparisonSession, getSavedComparisonSessions } from '../lib/comparison-helper';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Save, Layers, CheckSquare, Square, Sprout, Clock } from 'lucide-react';
import { getPlots, getCrops } from '../lib/farm-storage';
import { PlotBed, Crop } from '../types';

const PLOT_COLORS = ['#10B981', '#0284C7', '#D97706', '#E11D48', '#8B5CF6', '#EC4899'];

export const CropComparison: React.FC = () => {
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedPlots, setSelectedPlots] = useState<string[]>([]);
  const [parameter, setParameter] = useState('airTemp');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [savedSessions, setSavedSessions] = useState<any[]>([]);

  const refreshSessions = () => {
    setSavedSessions(getSavedComparisonSessions());
  };

  useEffect(() => {
    const loadedPlots = getPlots();
    const loadedCrops = getCrops();
    setPlots(loadedPlots);
    setCrops(loadedCrops);

    const initialPlotIds = loadedPlots.map(p => p.id);
    setSelectedPlots(initialPlotIds);

    refreshSessions();

    if (initialPlotIds.length > 0) {
      handleCompare(initialPlotIds, 'airTemp');
    }
  }, []);

  const plotConfigList = useMemo(() => {
    return plots.map((p, idx) => {
      const c = crops.find(crop => crop.id === p.cropId);
      return {
        id: p.id,
        code: p.code,
        name: `${p.code}: ${c ? `${c.name} (${c.variety})` : p.name}`,
        color: PLOT_COLORS[idx % PLOT_COLORS.length]
      };
    });
  }, [plots, crops]);

  const togglePlot = (plotId: string) => {
    if (selectedPlots.includes(plotId)) {
      if (selectedPlots.length <= 1) return;
      const updated = selectedPlots.filter(id => id !== plotId);
      setSelectedPlots(updated);
      handleCompare(updated, parameter);
    } else {
      const updated = [...selectedPlots, plotId];
      setSelectedPlots(updated);
      handleCompare(updated, parameter);
    }
  };

  const handleCompare = async (targetPlots = selectedPlots, targetParam = parameter) => {
    setLoading(true);
    const finalData = await fetchComparisonData(targetPlots, targetParam);
    setComparisonData(finalData);
    setLoading(false);
  };

  const handleSaveSession = async () => {
    if (!sessionName.trim() || !selectedPlots.length) return;
    await saveComparisonSession(sessionName.trim(), selectedPlots, parameter);
    setSessionName('');
    refreshSessions();
    alert('Comparison session saved successfully!');
  };

  const loadSession = (session: any) => {
    const targetPlots = session.plots || [session.plot1, session.plot2].filter(Boolean);
    setSelectedPlots(targetPlots);
    setParameter(session.parameter || 'airTemp');
    handleCompare(targetPlots, session.parameter || 'airTemp');
  };

  if (plots.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <Sprout className="w-12 h-12 text-emerald-800 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Plots to Compare</h2>
        <p className="text-sm text-slate-500">Configure plots in Onboarding or Virtual Farm to enable cross-plot analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center">
            <Layers className="mr-3 text-sky-600 w-8 h-8" />
            Cross-Crop Multi-Plot Comparison
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Compare active farm beds side-by-side across real-time biophysical and soil telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Sidebar */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
          {/* Multi-Select Plot Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Select Target Plots</label>
            <div className="space-y-2">
              {plotConfigList.map(p => (
                <div
                  key={p.id}
                  onClick={() => togglePlot(p.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${selectedPlots.includes(p.id)
                    ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span>{p.name}</span>
                  </div>
                  {selectedPlots.includes(p.id) ? (
                    <CheckSquare className="w-4 h-4 text-sky-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metric Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Comparison Parameter</label>
            <select
              value={parameter}
              onChange={(e) => {
                setParameter(e.target.value);
                handleCompare(selectedPlots, e.target.value);
              }}
              className="w-full bg-slate-50 text-slate-800 text-xs font-bold rounded-2xl p-3 border border-slate-200 outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="airTemp">Air Temperature (°C)</option>
              <option value="soilMoisture">Soil Moisture (%)</option>
              <option value="soilPh">Soil pH</option>
            </select>
          </div>

          {/* Save Session */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Save Analytics Session</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Session name..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={handleSaveSession}
                className="bg-emerald-800 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Save Session"
                aria-label="Save Session"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>

            {savedSessions.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Saved Sessions ({savedSessions.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {savedSessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => loadSession(s)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center justify-between border border-slate-100 bg-white"
                    >
                      <span className="truncate">{s.name}</span>
                      <Clock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart View */}
        <div className="lg:col-span-3 bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-extrabold text-slate-900">
              Cross-Bed Telemetry Over Time ({parameter === 'airTemp' ? 'Air Temperature °C' : parameter === 'soilMoisture' ? 'Soil Moisture %' : 'Soil pH'})
            </h3>
            {loading && <span className="text-xs text-sky-600 font-bold animate-pulse">Syncing...</span>}
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontStyle="bold" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Legend />
                {selectedPlots.map((plotId, index) => {
                  const conf = plotConfigList.find(p => p.id === plotId);
                  return (
                    <Line
                      key={plotId}
                      type="monotone"
                      dataKey={plotId}
                      name={conf ? conf.name : plotId}
                      stroke={conf ? conf.color : PLOT_COLORS[index % PLOT_COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropComparison;
