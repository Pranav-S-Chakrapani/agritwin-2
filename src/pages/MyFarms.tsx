import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Sprout,
  Droplets,
  Thermometer,
  Activity,
  CheckCircle2,
  AlertCircle,
  MapPin,
  HeartPulse,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Phone,
  User,
  Radio,
  X,
  Save,
  Check,
  Wheat,
  Leaf,
  Flower2,
  Flame,
  Sun
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { Farmland, PlotBed } from '../types';
import { PlotService, SensorService, CropService } from '../services/canonicalServices';
import { formatTemperature, formatMoisture, formatPh } from '../lib/formatters';

interface CropMetaConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

const CROP_META: Record<string, CropMetaConfig> = {
  'Wheat':       { icon: Wheat,   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'Rice':        { icon: Sprout,  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Maize':       { icon: Wheat,   color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  'Sugarcane':   { icon: Leaf,    color: 'text-lime-700',    bg: 'bg-lime-50',    border: 'border-lime-200' },
  'Cotton':      { icon: Flower2, color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  'Lettuce':     { icon: Leaf,    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Bell Pepper': { icon: Flame,   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  'Tomato':      { icon: Sun,     color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  'Strawberry':  { icon: Flame,   color: 'text-pink-700',    bg: 'bg-pink-50',    border: 'border-pink-200' },
  'Cucumber':    { icon: Leaf,    color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  'Soybean':     { icon: Sprout,  color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200' },
  'Chilli':      { icon: Flame,   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  'Brinjal':     { icon: Sprout,  color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  'Okra':        { icon: Leaf,    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Groundnut':   { icon: Sprout,  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'Mustard':     { icon: Flower2, color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  'Pulses':      { icon: Sprout,  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'Turmeric':    { icon: Sun,     color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
};

function getCropMeta(crop?: string): CropMetaConfig {
  if (!crop) return { icon: Sprout, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  return CROP_META[crop] || { icon: Sprout, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
}
export const MyFarms: React.FC = () => {
  const {
    farmlands,
    plots,
    sensors,
    addFarmland,
    updateFarmland,
    deleteFarmland,
    addPlot,
    updatePlot,
    deletePlot,
    seedMultiFarmSystem,
    selectFarmland,
    activeFarmland,
    crops,
  } = useAgriStore();

  const [expandedFarm, setExpandedFarm] = useState<string | null>(farmlands[0]?.id || null);
  const [seeding, setSeeding] = useState(false);

  // Edit Farm Modal State
  const [editingFarm, setEditingFarm] = useState<Farmland | null>(null);
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');
  const [newFarmArea, setNewFarmArea] = useState('20');
  const [newFarmOwner, setNewFarmOwner] = useState('');
  const [newFarmPhone, setNewFarmPhone] = useState('');

  // Plot Modal State
  const [editingPlot, setEditingPlot] = useState<PlotBed | null>(null);
  const [isAddPlotOpen, setIsAddPlotOpen] = useState<string | null>(null); // farmId
  const [newPlotName, setNewPlotName] = useState('');
  const [newPlotCode, setNewPlotCode] = useState('');
  const [newPlotArea, setNewPlotArea] = useState('5');
  const [newPlotCrop, setNewPlotCrop] = useState('Tomato');
  const [newPlotStage, setNewPlotStage] = useState<'Germination' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Maturation' | 'Harvesting'>('Vegetative');

  const handleSeed = async () => {
    setSeeding(true);
    await seedMultiFarmSystem();
    setSeeding(false);
  };

  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim() || !newFarmLocation.trim()) return;

    addFarmland({
      name: newFarmName.trim(),
      location: newFarmLocation.trim(),
      totalArea: parseFloat(newFarmArea) || 10,
      unit: 'acres',
      sectionsCount: 0,
      sensorsCount: 0,
      healthScore: 90,
      ownerName: newFarmOwner.trim() || 'Farm Owner',
      contactPhone: newFarmPhone.trim() || '+91 98765 00000',
      contactRole: 'Owner',
    });

    setNewFarmName('');
    setNewFarmLocation('');
    setNewFarmArea('20');
    setNewFarmOwner('');
    setNewFarmPhone('');
    setIsAddFarmOpen(false);
  };

  const handleSaveFarmEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;
    updateFarmland(editingFarm);
    setEditingFarm(null);
  };

  const handleCreatePlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddPlotOpen || !newPlotName.trim() || !newPlotCode.trim()) return;

    const matchedCrop = crops.find(c => c.name.toLowerCase() === newPlotCrop.toLowerCase());

    addPlot({
      farmId: isAddPlotOpen,
      code: newPlotCode.trim().toUpperCase(),
      name: newPlotName.trim(),
      area: parseFloat(newPlotArea) || 5,
      areaUnit: 'acres',
      cropId: matchedCrop ? matchedCrop.id : null,
      cropType: newPlotCrop,
      growthStage: newPlotStage,
      sensorNodeId: `NODE-${isAddPlotOpen.slice(-4)}-${newPlotCode.trim().toUpperCase()}`,
      sensorId: `NODE-${isAddPlotOpen.slice(-4)}-${newPlotCode.trim().toUpperCase()}`,
      soilMoisture: 60,
      airTemp: 25,
      soilPh: 6.5,
      humidity: 65,
      daysPlanted: 30,
      soilHealthScore: 88,
      irrigationStatus: 'Scheduled',
    });

    setNewPlotName('');
    setNewPlotCode('');
    setNewPlotArea('5');
    setIsAddPlotOpen(null);
  };

  const handleSavePlotEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlot) return;
    updatePlot(editingPlot);
    setEditingPlot(null);
  };
  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Multi-Farm Management
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight">My Farms &amp; Field Plots</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Create, manage, and configure your farms, crop plots, and assigned IoT sensors. All updates synchronize instantly across dashboards and Supabase.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => setIsAddFarmOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Farm
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Reset Demo System
          </button>
        </div>
      </div>

      {/* Farms List */}
      <div className="space-y-4">
        {farmlands.map((farm) => {
          const isExpanded = expandedFarm === farm.id;
          const farmPlots = PlotService.getPlotsForFarm(plots, farm.id);
          const sensorCounts = SensorService.getSensorCountsForFarm(sensors, farm.id);
          const isSelected = activeFarmland?.id === farm.id;

          return (
            <div key={farm.id} className={`bg-white rounded-3xl border transition-all shadow-xs ${
              isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
            }`}>
              {/* Farm Header Card */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                <div
                  onClick={() => setExpandedFarm(isExpanded ? null : farm.id)}
                  className="flex items-start gap-4 cursor-pointer flex-1"
                >
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 mt-1">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-slate-900">{farm.name}</h2>
                      {isSelected && (
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Active Dashboard Farm
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {farm.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1">
                      <span>Area: <strong className="text-slate-900">{farm.totalArea} {farm.unit}</strong></span>
                      <span>&bull;</span>
                      <span>Owner: <strong className="text-slate-900">{farm.ownerName || farm.contactPerson || 'Farm Owner'}</strong></span>
                      <span>&bull;</span>
                      <span>Contact: <strong className="text-slate-900">{farm.contactPhone || '+91 98765 00000'}</strong></span>
                      <span>&bull;</span>
                      <span>Plots: <strong className="text-emerald-700">{farmPlots.length} Plots</strong></span>
                      <span>&bull;</span>
                      <span>Sensors: <strong className="text-indigo-700">{sensorCounts.total} Units ({sensorCounts.active} Online)</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => selectFarmland(farm.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Set as Active'}
                  </button>

                  <button
                    onClick={() => setEditingFarm(farm)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 cursor-pointer"
                    title="Edit Farm Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${farm.name}"? This will also remove its ${farmPlots.length} plots.`)) {
                        deleteFarmland(farm.id);
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-200 cursor-pointer"
                    title="Delete Farm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setExpandedFarm(isExpanded ? null : farm.id)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {/* Plots Section */}
              {isExpanded && (
                <div className="p-5 bg-slate-50/50 space-y-4 rounded-b-3xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-600" />
                      Field Plots ({farmPlots.length})
                    </h3>
                    <button
                      onClick={() => setIsAddPlotOpen(farm.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Plot to {farm.name}
                    </button>
                  </div>

                  {farmPlots.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-300">
                      No plots registered in this farm yet. Click "Add Plot" above to get started.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {farmPlots.map((plot) => {
                        const cropMeta = getCropMeta(plot.cropType);
                        const plotSensors = SensorService.getSensorsForPlot(sensors, plot.id);
                        const assignedCrop = crops.find((c) => c.id === plot.cropId || c.name.toLowerCase() === (plot.cropType || '').toLowerCase());
                        const resolvedStage = CropService.getCurrentStageForPlot(plot, assignedCrop);

                        return (
                          <div key={plot.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-black rounded">
                                  {plot.code}
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-900">{plot.name}</h4>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingPlot(plot)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="Edit Plot"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete plot "${plot.name}" (${plot.code})?`)) {
                                      deletePlot(plot.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Delete Plot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {(() => {
                                const CropIcon = cropMeta.icon;
                                return (
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${cropMeta.bg} ${cropMeta.color} ${cropMeta.border}`}>
                                    <CropIcon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{plot.cropType || 'Crop'}</span>
                                  </span>
                                );
                              })()}
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                {resolvedStage}
                              </span>
                              <span className="text-[11px] text-slate-500 ml-auto font-medium">
                                {plot.area} {plot.areaUnit || 'acres'}
                              </span>
                            </div>

                            {/* Live Metrics */}
                            <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">Moisture</span>
                                <strong className="text-blue-700 font-black">{formatMoisture(plot.soilMoisture)}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">Temp</span>
                                <strong className="text-rose-700 font-black">{formatTemperature(plot.airTemp)}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">Soil pH</span>
                                <strong className="text-purple-700 font-black">{formatPh(plot.soilPh)}</strong>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                              <span>Sensors: <strong className="text-slate-800">{plotSensors.length} Nodes</strong></span>
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                {plot.irrigationStatus || 'Active Drip'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* -- MODAL: ADD FARM ---------------------------------------------- */}
      {isAddFarmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Add New Farmland</h3>
              <button onClick={() => setIsAddFarmOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Farm Name *</label>
                <input
                  type="text"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  placeholder="e.g. Green Valley Precision Farm"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
                <input
                  type="text"
                  value={newFarmLocation}
                  onChange={(e) => setNewFarmLocation(e.target.value)}
                  placeholder="e.g. Belagavi, Karnataka"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Area (Acres)</label>
                  <input
                    type="number"
                    value={newFarmArea}
                    onChange={(e) => setNewFarmArea(e.target.value)}
                    min="1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={newFarmOwner}
                    onChange={(e) => setNewFarmOwner(e.target.value)}
                    placeholder="Owner name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={newFarmPhone}
                  onChange={(e) => setNewFarmPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFarmOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Save Farm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -- MODAL: EDIT FARM --------------------------------------------- */}
      {editingFarm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Edit Farm: {editingFarm.name}</h3>
              <button onClick={() => setEditingFarm(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFarmEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  value={editingFarm.name}
                  onChange={(e) => setEditingFarm({ ...editingFarm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editingFarm.location}
                  onChange={(e) => setEditingFarm({ ...editingFarm, location: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area ({editingFarm.unit})</label>
                  <input
                    type="number"
                    value={editingFarm.totalArea}
                    onChange={(e) => setEditingFarm({ ...editingFarm, totalArea: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editingFarm.ownerName || editingFarm.contactPerson || ''}
                    onChange={(e) => setEditingFarm({ ...editingFarm, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={editingFarm.contactPhone || ''}
                  onChange={(e) => setEditingFarm({ ...editingFarm, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFarm(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -- MODAL: ADD PLOT ---------------------------------------------- */}
      {isAddPlotOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Add Plot to Farm</h3>
              <button onClick={() => setIsAddPlotOpen(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlot} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Plot Code *</label>
                  <input
                    type="text"
                    value={newPlotCode}
                    onChange={(e) => setNewPlotCode(e.target.value)}
                    placeholder="e.g. SEC-E"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area (Acres)</label>
                  <input
                    type="number"
                    value={newPlotArea}
                    onChange={(e) => setNewPlotArea(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plot Name *</label>
                <input
                  type="text"
                  value={newPlotName}
                  onChange={(e) => setNewPlotName(e.target.value)}
                  placeholder="e.g. Section E - Precision Soybean"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crop Cultivar</label>
                  <select
                    value={newPlotCrop}
                    onChange={(e) => setNewPlotCrop(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {['Tomato', 'Chilli', 'Cotton', 'Maize', 'Groundnut', 'Wheat', 'Rice', 'Soybean', 'Sugarcane', 'Bell Pepper'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Growth Stage</label>
                  <select
                    value={newPlotStage}
                    onChange={(e) => setNewPlotStage(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {['Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Maturation', 'Harvesting'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPlotOpen(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Create Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -- MODAL: EDIT PLOT --------------------------------------------- */}
      {editingPlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Edit Plot: {editingPlot.name}</h3>
              <button onClick={() => setEditingPlot(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlotEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plot Name</label>
                <input
                  type="text"
                  value={editingPlot.name}
                  onChange={(e) => setEditingPlot({ ...editingPlot, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crop</label>
                  <select
                    value={editingPlot.cropType || 'Tomato'}
                    onChange={(e) => setEditingPlot({ ...editingPlot, cropType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {['Tomato', 'Chilli', 'Cotton', 'Maize', 'Groundnut', 'Wheat', 'Rice', 'Soybean', 'Sugarcane', 'Bell Pepper'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Growth Stage</label>
                  <select
                    value={editingPlot.growthStage || 'Vegetative'}
                    onChange={(e) => setEditingPlot({ ...editingPlot, growthStage: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {['Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Maturation', 'Harvesting'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Moisture %</label>
                  <input
                    type="number"
                    value={editingPlot.soilMoisture}
                    onChange={(e) => setEditingPlot({ ...editingPlot, soilMoisture: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Temp °C</label>
                  <input
                    type="number"
                    value={editingPlot.airTemp}
                    onChange={(e) => setEditingPlot({ ...editingPlot, airTemp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Soil pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPlot.soilPh}
                    onChange={(e) => setEditingPlot({ ...editingPlot, soilPh: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlot(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Save Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFarms;
