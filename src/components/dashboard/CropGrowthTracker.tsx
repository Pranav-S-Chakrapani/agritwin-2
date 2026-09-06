import React, { useState, useMemo } from 'react';
import { 
  Sprout, 
  Flame, 
  Clock, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  Sparkles,
  Info,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  computeGrowthStatus, 
  STAGES_ORDER, 
  PhenologicalStageKey 
} from '../../lib/gdd-calculator';
import { useAgriStore } from '../../context/AgriStore';
import { CropService } from '../../services/canonicalServices';
import PlantCanopySvg from '../common/PlantCanopySvg';

interface CropGrowthTrackerProps {
  plotId?: string;
  currentTemp?: number;
  cropName?: string;
  plantedDate?: string;
  compact?: boolean;
  onStageSelect?: (stageKey: PhenologicalStageKey) => void;
}

export const CropGrowthTracker: React.FC<CropGrowthTrackerProps> = ({
  plotId,
  currentTemp = 24.5,
  cropName,
  compact = false,
  onStageSelect,
}) => {
  const [selectedStageKey, setSelectedStageKey] = useState<PhenologicalStageKey | null>(null);
  const [showMathModal, setShowMathModal] = useState(false);

  const { plots, crops } = useAgriStore();
  const activePlot = (plotId ? plots.find(p => p.id === plotId || p.code === plotId) : plots[0]) || plots[0];
  const activeCrop = activePlot && activePlot.cropId ? crops.find(c => c.id === activePlot.cropId) : crops[0];

  const canonicalStage = CropService.getCurrentStageForPlot(activePlot, activeCrop);
  const canonicalStageKey = CropService.getCanopyStage(canonicalStage) as PhenologicalStageKey;

  const resolvedCropName = cropName || (activeCrop ? `${activeCrop.name} (${activeCrop.variety})` : (activePlot ? activePlot.name : 'Crop Cultivar'));
  const resolvedPlotCode = activePlot ? activePlot.code : 'PLOT';

  const growth = useMemo(() => {
    const raw = computeGrowthStatus(activePlot?.id, currentTemp);
    const matched = raw.stagesList.find(s => s.key === canonicalStageKey) || raw.currentStage;
    return {
      ...raw,
      currentStage: {
        ...matched,
        name: canonicalStage
      }
    };
  }, [activePlot?.id, currentTemp, canonicalStage, canonicalStageKey]);

  const activeStageKey = selectedStageKey || canonicalStageKey;
  const activeStageObj = growth.stagesList.find(s => s.key === activeStageKey) || growth.currentStage;

  // Circular GDD Gauge calculations
  const gddPct = Math.min(100, (growth.accumulatedGdd / (growth.targetMaturityGdd || 1000)) * 100);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gddPct / 100) * circumference;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 relative overflow-hidden transition-all text-slate-800">
      
      {/* Background ambient decorative shapes */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Crop Phenology Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 shadow-xs">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {resolvedCropName}
              </h3>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {resolvedPlotCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
              <span>{activeCrop?.variety || 'Digital Twin Crop'}</span>
              <span>&bull;</span>
              <span>Duration: <strong className="text-slate-700">{growth.totalDurationDays} Days</strong></span>
            </p>
          </div>
        </div>

        {/* Status Badges Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Health Index Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-sm shadow-xs"
            style={{ 
              backgroundColor: `${growth.stageHealthColor}10`, 
              borderColor: `${growth.stageHealthColor}30`,
              color: growth.stageHealthColor === '#06b6d4' ? '#0284c7' : growth.stageHealthColor 
            }}
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>{growth.stageHealthIndex}</span>
          </div>

          {/* GDD Math Formula trigger */}
          <button
            onClick={() => setShowMathModal(!showMathModal)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer active:scale-95 shadow-xs"
            title="View GDD Thermal Equation"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>GDD Thermal Time</span>
            <Info className="w-3 h-3 ml-0.5 opacity-60" />
          </button>
        </div>
      </div>

      {/* Main Stepper & GDD Meter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        
        {/* Left Side: 2D SVG Canopy Visual Twin + Circular GDD Meter (4 cols) */}
        <div className="lg:col-span-4 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 flex flex-col sm:flex-row lg:flex-col items-center justify-between gap-4">
          
          {/* Morphing SVG Visual Twin */}
          <div className="relative flex flex-col items-center justify-center">
            <PlantCanopySvg
              stage={activeStageKey}
              cropType={activeCrop?.name || 'Crop'}
              size={135}
              className="drop-shadow-xs"
            />
            <div className="mt-1 text-center">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Stage {growth.stageIndex + 1}: {growth.currentStage.label}
              </span>
            </div>
          </div>

          {/* High-Density Circular GDD Thermal Gauge */}
          <div className="flex items-center space-x-4 bg-white rounded-2xl p-3 border border-slate-200/80 w-full justify-center shadow-xs">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#F1F5F9"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="url(#lightGddGrad)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="lightGddGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-black text-slate-900">
                  {growth.accumulatedGdd}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  GDD
                </span>
              </div>
            </div>

            <div className="space-y-1 text-left text-xs">
              <div className="text-[11px] text-slate-500 font-semibold">Accumulated Thermal Time</div>
              <div className="font-extrabold text-slate-900">
                {growth.accumulatedGdd} / <span className="text-amber-600">{growth.targetMaturityGdd} GDD</span>
              </div>
              <div className="text-[10px] text-slate-600 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3 text-sky-600" />
                <span>+{(growth.dailyGddRate).toFixed(1)} GDD / day</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-700">
                {gddPct.toFixed(0)}% to Total Harvest
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Horizontal Phenological Stage Stepper & Detailed Sub-Badges (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Horizontal Phenological Stage Stepper */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold uppercase tracking-wider">Phenological Progression</span>
              <span className="text-sky-700 font-mono font-extrabold">
                {growth.stageCompletionPct}% through {growth.currentStage.label}
              </span>
            </div>

            {/* Stepper Nodes */}
            <div className="grid grid-cols-5 gap-2 relative">
              {/* Connected Background Track */}
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0 pointer-events-none" />
              
              {/* Connected Progress Fill */}
              <div 
                className="absolute top-1/2 left-4 -translate-y-1/2 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500 rounded-full z-0 transition-all duration-700"
                style={{ 
                  width: `calc(${((growth.stageIndex + (growth.stageCompletionPct / 100)) / (STAGES_ORDER.length - 1)) * 100}% - 16px)` 
                }}
              />

              {STAGES_ORDER.map((stage, idx) => {
                const isCurrent = idx === growth.stageIndex;
                const isCompleted = idx < growth.stageIndex;
                const isSelected = stage.key === activeStageKey;

                return (
                  <button
                    key={stage.key}
                    onClick={() => {
                      setSelectedStageKey(stage.key);
                      onStageSelect?.(stage.key);
                    }}
                    className={`relative z-10 flex flex-col items-center text-center group cursor-pointer focus:outline-none transition-all ${
                      isSelected ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    {/* Node Circle */}
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 font-extrabold text-xs shadow-xs ${
                        isCurrent
                          ? 'bg-gradient-to-br from-emerald-500 to-sky-600 text-white ring-4 ring-sky-500/20 ring-offset-2 ring-offset-white'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Node Label */}
                    <div className="mt-2 space-y-0.5">
                      <div className={`text-[11px] font-extrabold transition-colors leading-tight ${
                        isCurrent 
                          ? 'text-sky-700' 
                          : isCompleted 
                          ? 'text-slate-800' 
                          : 'text-slate-400'
                      }`}>
                        {stage.label}
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium hidden sm:block">
                        {growth.stagesList.find(s => s.key === stage.key)?.maxGdd} GDD
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Current Stage Progress Track Bar */}
            <div className="pt-2">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${growth.stageCompletionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Metric Sub-Badges Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sub-badge 1: DAP */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0 border border-sky-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">DAP (Days After Planting)</div>
                <div className="text-sm font-black text-slate-900">
                  Day {growth.dap} <span className="text-xs text-slate-500 font-medium">of {growth.totalDurationDays}</span>
                </div>
              </div>
            </div>

            {/* Sub-badge 2: Days to Next Stage */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0 border border-amber-100">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Days to Next Stage</div>
                <div className="text-sm font-black text-slate-900">
                  {growth.daysToNextStage > 0 ? (
                    `~${growth.daysToNextStage} days`
                  ) : (
                    'Stage Complete'
                  )}
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    {growth.stageIndex < 4 ? `until ${STAGES_ORDER[growth.stageIndex + 1]?.label}` : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-badge 3: Stage Health Index */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 border border-emerald-100">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Growth Pace Index</div>
                <div className="text-sm font-black" style={{ color: growth.stageHealthColor === '#06b6d4' ? '#0284c7' : growth.stageHealthColor }}>
                  {growth.stageHealthIndex}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Stage Detail Rationale */}
          {selectedStageKey && (
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-medium">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  <strong className="font-bold text-sky-950">{activeStageObj.label}:</strong> {activeStageObj.description} &bull; Thermal threshold: {activeStageObj.minGdd} &ndash; {activeStageObj.maxGdd} GDD
                </span>
              </div>
              <button 
                onClick={() => setSelectedStageKey(null)}
                className="text-[10px] font-bold text-sky-700 hover:text-sky-800 underline cursor-pointer shrink-0 ml-2"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GDD Math & Thermal Science Explainer Modal / Dropdown */}
      {showMathModal && (
        <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center">
              <Flame className="w-4 h-4 mr-2 text-amber-600" />
              Agronomic Principle: Growing Degree Days (GDD)
            </h4>
            <button 
              onClick={() => setShowMathModal(false)}
              className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-600 leading-relaxed font-medium">
            Crop phenology is physiologically governed by accumulated thermal heat units (thermal time) rather than Gregorian calendar days.
          </p>

          <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-sky-700 text-center font-bold shadow-xs">
            GDD = max( 0, ( (T_max + T_min) / 2 ) - T_base )
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block font-bold">Base Temp (T_base)</strong>
              {activeCrop?.idealTempMin ? Math.max(5, activeCrop.idealTempMin - 10) : 10}°C (Threshold below which growth halts)
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block font-bold">Upper Ceiling (T_upper)</strong>
              {activeCrop?.idealTempMax ? activeCrop.idealTempMax + 5 : 33}°C (Cutoff for thermal stress)
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <strong className="text-slate-900 block font-bold">Target Maturity</strong>
              {growth.targetMaturityGdd} GDD (Full cycle harvest point)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropGrowthTracker;
