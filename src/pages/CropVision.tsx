import React, { useState, useRef } from 'react';
import { 
  Sprout, 
  Ruler, 
  Activity, 
  Leaf, 
  Grape, 
  AreaChart, 
  Bug, 
  Upload, 
  Scan, 
  Crosshair,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import CropGrowthTracker from '../components/dashboard/CropGrowthTracker';
import PlantCanopySvg from '../components/common/PlantCanopySvg';
import { useAgriStore } from '../context/AgriStore';
import { CropService } from '../services/canonicalServices';

export const CropVision = () => {
  const { activeSections, crops } = useAgriStore();
  const [selectedPlotId, setSelectedPlotId] = useState<string>(activeSections[0]?.id || '');
  const [filterMode, setFilterMode] = useState<'rgb' | 'ndvi' | 'thermal'>('rgb');
  const [hudActive, setHudActive] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePlot = activeSections.find(p => p.id === selectedPlotId) || activeSections[0] || null;
  const assignedCrop = activePlot && activePlot.cropId ? crops.find(c => c.id === activePlot.cropId) : crops[0] || null;

  // Deterministic Biophysical Phenology Metrics (Zero-Hang)
  const days = activePlot?.daysPlanted || 30;
  const maxDays = assignedCrop?.growthDurationDays || 100;
  const pct = Math.min(100, Math.round((days / maxDays) * 100));

  const plantHeight = Math.round(18 + days * 1.1);
  const canopyCoverage = Math.min(95, Math.round(25 + days * 1.4));
  const fruitRipeness = pct;
  const yieldEstimate = Number((3.2 + (days / maxDays) * 2.8).toFixed(1));
  const diseaseRisk = activePlot?.soilMoisture > 85 ? 18 : 2;

  // Single Source of Truth Phenological Stage from Canonical CropService
  const growthStageLabel = CropService.getCurrentStageForPlot(activePlot, assignedCrop);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setSelectedImage(base64);
        setAnalyzing(true);
        setTimeout(() => {
          setAnalyzing(false);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunScan = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
    }, 800);
  };

  const ripenessPct = fruitRipeness;
  const redPct = Math.min(100, Math.round(ripenessPct * 0.6));
  const breakerPct = Math.min(100 - redPct, Math.round(ripenessPct * 0.8));
  const greenPct = Math.max(0, 100 - redPct - breakerPct);

  return (
    <div className="space-y-8 font-sans text-slate-800 pb-10">
      {/* Top Header & Plot Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center">
            <Sprout className="mr-3 text-emerald-600 w-7 h-7" />
            Vision AI Phenology & Multi-Spectral Scan
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">Computer vision canopy segmentation, RGB/NDVI/Thermal analysis & ripeness distribution</p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Bed:</span>
          <select 
            value={selectedPlotId} 
            onChange={(e) => {
              setSelectedPlotId(e.target.value);
              setSelectedImage(null);
            }}
            className="bg-white text-slate-900 text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-200 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            {activeSections.map(p => {
              const c = crops.find(crop => crop.id === p.cropId);
              return (
                <option key={p.id} value={p.id}>
                  {p.code}: {c ? `${c.name} (${c.variety})` : p.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Phenological Stage Stepper & GDD Meter Component */}
      {activePlot && (
        <CropGrowthTracker
          plotId={activePlot.id}
          cropName={assignedCrop ? `${assignedCrop.name} (${assignedCrop.variety})` : activePlot.name}
        />
      )}

      {/* Interactive Vision AI Camera Frame with Multi-Spectral Toggles & Bounding Boxes */}
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center">
                AI Vision Phenology HUD Scanner
              </h3>
              <p className="text-xs text-slate-500 font-medium">Computer Vision segmentation & biophysical feature extraction</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-Spectral Filter Toggles */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
              {(['rgb', 'ndvi', 'thermal'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    filterMode === mode
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode === 'rgb' ? 'RGB' : mode === 'ndvi' ? 'NDVI Index' : 'Thermal'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setHudActive(!hudActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                hudActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              HUD: {hudActive ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showBoundingBoxes ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              AI Bboxes: {showBoundingBoxes ? 'ON' : 'OFF'}
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload Photo</span>
            </button>

            <button
              onClick={handleRunScan}
              disabled={analyzing}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>{analyzing ? 'Scanning...' : 'Run Diagnostic Scan'}</span>
            </button>
          </div>
        </div>

        {/* Viewport Frame with HUD & Spectral Filters */}
        <div className="relative w-full h-[420px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none shadow-2xl">
          
          {/* Background Image / SVG Simulation */}
          <div className={`w-full h-full relative flex items-center justify-center transition-all duration-300 ${
            filterMode === 'ndvi' ? 'hue-rotate-90 saturate-200 contrast-125' : filterMode === 'thermal' ? 'hue-rotate-180 invert contrast-150' : ''
          }`}>
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt="Crop Camera Feed" 
                className="w-full h-full object-cover filter brightness-90"
              />
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                <div 
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: `radial-gradient(#10b981 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                  }}
                />
                <PlantCanopySvg
                  stage={CropService.getCanopyStage(growthStageLabel)}
                  cropType={assignedCrop?.name || 'Crop'}
                  size={280}
                />
              </div>
            )}
          </div>

          {/* AI Bounding Box Overlays */}
          {showBoundingBoxes && (
            <>
              {/* Bounding Box 1: Ripe Fruit */}
              <div className="absolute top-[35%] left-[42%] w-24 h-24 border-2 border-emerald-400 bg-emerald-500/10 rounded-lg pointer-events-none animate-pulse">
                <span className="absolute -top-6 left-0 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-md">
                  Ripe Fruit 98%
                </span>
              </div>
              {/* Bounding Box 2: Healthy Leaf Canopy */}
              <div className="absolute top-[20%] left-[25%] w-32 h-28 border-2 border-sky-400 bg-sky-500/10 rounded-lg pointer-events-none">
                <span className="absolute -top-6 left-0 bg-sky-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-md">
                  Leaf Canopy 99%
                </span>
              </div>
            </>
          )}

          {/* HUD OVERLAY ELEMENTS */}
          {hudActive && (
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
              {/* Reticle Brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400" />

              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <Crosshair className="w-24 h-24 text-emerald-400" />
              </div>

              {/* Top HUD Badges */}
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-white">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Detected Phenological Stage</div>
                  <div className="text-sm font-black flex items-center gap-1.5">
                    <span>{growthStageLabel}</span>
                    <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">96% Match</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-right text-white">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Mode: {filterMode.toUpperCase()} Filter</div>
                  <div className="text-xs font-bold text-slate-300">
                    Height: <strong className="text-white">{plantHeight} cm</strong> | Canopy: <strong className="text-white">{canopyCoverage}%</strong>
                  </div>
                </div>
              </div>

              {/* Bottom HUD Bar */}
              <div className="bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 relative z-10 space-y-1.5 max-w-xl text-white">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-400">Ripeness Distribution ({assignedCrop?.name || 'Crop'})</span>
                  <span className="text-slate-300">{fruitRipeness}% Overall Ripeness</span>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div style={{ width: `${redPct}%` }} className="bg-rose-500 h-full" title={`Red Ripe: ${redPct}%`} />
                  <div style={{ width: `${breakerPct}%` }} className="bg-amber-500 h-full" title={`Breaker: ${breakerPct}%`} />
                  <div style={{ width: `${greenPct}%` }} className="bg-emerald-500 h-full" title={`Green: ${greenPct}%`} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6 Main Digital Twin Parameter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Plant Height', value: `${plantHeight} cm`, icon: Ruler, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Canopy Coverage', value: `${canopyCoverage}%`, icon: AreaChart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Growth Stage', value: growthStageLabel.split(' ')[0], icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Ripeness Index', value: `${fruitRipeness}%`, icon: Grape, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Yield Projection', value: `${yieldEstimate} kg/m²`, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Disease Risk', value: `${diseaseRisk}%`, icon: Bug, color: 'text-rose-600', bg: 'bg-rose-50' }
        ].map((p, i) => {
          const Icon = p.icon;
          return (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{p.label}</span>
                <div className={`p-2 rounded-xl ${p.bg} ${p.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-slate-900 truncate">{p.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CropVision;
