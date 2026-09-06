import React, { useState, useMemo } from 'react';
import { 
  Sprout, 
  Droplet, 
  Thermometer, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Activity, 
  Radio, 
  Sparkles, 
  Flame, 
  Zap, 
  FileSpreadsheet,
  X,
  Clock,
  ChevronRight,
  BarChart2,
  Info
} from 'lucide-react';
import { useAgriStore } from '../../context/AgriStore';
import { DataSourceBadge } from '../common/DataSourceBadge';
import PlantCanopySvg from '../common/PlantCanopySvg';
import { Plant3DCanvas } from '../3d/Plant3DCanvas';
import { PlotBed, Crop, TelemetryObservation } from '../../types';
import { PlotService, CropService } from '../../services/canonicalServices';
import { formatTemperature, formatMoisture, formatPh } from '../../lib/formatters';

export const VirtualFarmView: React.FC = () => {
  const { 
    activeFarmland, 
    activeSections, 
    crops, 
    triggerActuator, 
    assignCropToSection, 
    exportFarmlandCsv,
    telemetryObservations
  } = useAgriStore();

  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [display3D, setDisplay3D] = useState(true);

  const unit = activeFarmland?.unit || 'acres';
  const totalFarmLand = activeFarmland?.totalArea ?? 20;

  // Allocated Cultivation: sum of all plot areas
  const totalAllocatedArea = useMemo(() => {
    return Number(activeSections.reduce((sum, p) => sum + (Number(p.area) || 0), 0).toFixed(2));
  }, [activeSections]);

  const allocatedCultivatedArea = useMemo(() => {
    return Number(activeSections.reduce((sum, p) => sum + (p.cropId ? (Number(p.area) || 0) : 0), 0).toFixed(2));
  }, [activeSections]);

  const remainingUnallocated = useMemo(() => {
    return Math.max(0, Number((totalFarmLand - totalAllocatedArea).toFixed(2)));
  }, [totalFarmLand, totalAllocatedArea]);

  const cultivationPct = useMemo(() => {
    if (totalFarmLand <= 0) return 0;
    return Math.min(100, Math.round((totalAllocatedArea / totalFarmLand) * 100));
  }, [totalFarmLand, totalAllocatedArea]);

  // Unique active crops count
  const activeCropCount = useMemo(() => {
    const cropIds = new Set(activeSections.filter(s => s.cropId).map(s => s.cropId));
    return cropIds.size;
  }, [activeSections]);

  // Count observations recorded today
  const observationsTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return telemetryObservations.filter(o => o.measurementTimestamp && o.measurementTimestamp.startsWith(todayStr)).length;
  }, [telemetryObservations]);

  // Helper to find latest observation for a plot
  const getLatestObservations = (plotId: string, plotCode: string) => {
    const plotObs = telemetryObservations.filter(o => o.plotId === plotId || o.plotId === plotCode);
    if (plotObs.length === 0) return null;

    // Sort descending by timestamp
    const sorted = [...plotObs].sort((a, b) => 
      new Date(b.measurementTimestamp).getTime() - new Date(a.measurementTimestamp).getTime()
    );

    const moisture = sorted.find(o => o.parameterKey === 'soil_moisture');
    const temp = sorted.find(o => o.parameterKey === 'air_temperature' || o.parameterKey === 'soil_temperature');
    const ph = sorted.find(o => o.parameterKey === 'soil_ph');
    const humidity = sorted.find(o => o.parameterKey === 'humidity');

    return {
      latest: sorted[0],
      moisture: moisture?.value ?? null,
      temp: temp?.value ?? null,
      ph: ph?.value ?? null,
      humidity: humidity?.value ?? null,
      source: sorted[0].dataSource,
      timestamp: sorted[0].measurementTimestamp
    };
  };

  // Helper to compute plot condition status dynamically
  const getPlotCondition = (sec: PlotBed, crop: Crop | null, obs: ReturnType<typeof getLatestObservations>) => {
    if (!sec.cropId) {
      return { status: 'FALLOW', label: 'Fallow Land', color: 'bg-amber-900/60 text-amber-300 border-amber-800' };
    }

    if (!obs || (obs.moisture === null && obs.temp === null && obs.ph === null)) {
      return { status: 'NO DATA', label: 'No Observation', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }

    if (crop) {
      if (obs.moisture !== null && obs.moisture < crop.idealMoistureMin) {
        return { status: 'LOW MOISTURE', label: 'Low Moisture', color: 'bg-amber-900/80 text-amber-200 border-amber-700' };
      }
      if (obs.temp !== null && obs.temp > crop.idealTempMax) {
        return { status: 'HIGH TEMPERATURE', label: 'High Temp', color: 'bg-rose-900/80 text-rose-200 border-rose-700' };
      }
      if (obs.ph !== null && (obs.ph < crop.idealPhMin || obs.ph > crop.idealPhMax)) {
        return { status: 'OUT OF RANGE', label: 'pH Alert', color: 'bg-purple-900/80 text-purple-200 border-purple-700' };
      }
    }

    return { status: 'OPTIMAL', label: 'Optimal', color: 'bg-emerald-900/80 text-emerald-200 border-emerald-700' };
  };

  // Overall Farm Health Status (Calculated strictly from actual observations)
  const farmOverallStatus = useMemo(() => {
    if (activeSections.length === 0) return { label: 'INSUFFICIENT DATA', color: 'bg-slate-100 text-slate-600 border-slate-200' };

    let totalPlotsWithObs = 0;
    let optimalCount = 0;

    activeSections.forEach(s => {
      const c = crops.find(crop => crop.id === s.cropId) || null;
      const obs = getLatestObservations(s.id, s.code);
      if (obs && (obs.moisture !== null || obs.temp !== null)) {
        totalPlotsWithObs++;
        const cond = getPlotCondition(s, c, obs);
        if (cond.status === 'OPTIMAL') optimalCount++;
      }
    });

    if (totalPlotsWithObs === 0) {
      return { label: 'INSUFFICIENT DATA', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }

    const pct = Math.round((optimalCount / totalPlotsWithObs) * 100);
    return {
      label: `${pct}% Optimal (${totalPlotsWithObs}/${activeSections.length} Monitored)`,
      color: pct >= 75 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
    };
  }, [activeSections, crops, telemetryObservations]);

  const selectedPlotObj = activeSections.find(p => p.id === selectedPlotId);
  const selectedCropObj = selectedPlotObj?.cropId ? crops.find(c => c.id === selectedPlotObj.cropId) : null;
  const selectedPlotObs = selectedPlotObj ? getLatestObservations(selectedPlotObj.id, selectedPlotObj.code) : null;

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-10">
      <PrototypeModeBanner />

      {/* Top Header & Export Manifest */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-800 text-white rounded-2xl shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{activeFarmland?.name || 'iiit dharwad'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {activeSections.length} Plot Partitions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{activeFarmland?.location || 'Dharwad, Karnataka'} &bull; Digital Twin Canvas</span>
            </p>
          </div>
        </div>

        <button
          onClick={exportFarmlandCsv}
          className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Manifest CSV</span>
        </button>
      </div>

      {/* DYNAMIC FARM OVERVIEW RIBBON (Calculated from actual data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Farm Area</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalFarmLand} <span className="text-xs font-bold text-slate-500">{unit}</span></div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Allocated Land</span>
            <div className="text-2xl font-black text-emerald-950 mt-0.5">{totalAllocatedArea} <span className="text-xs font-bold text-emerald-700">{unit}</span></div>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{allocatedCultivatedArea} {unit} Cultivated</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Sprout className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Unallocated Balance</span>
            <div className="text-2xl font-black text-sky-950 mt-0.5">{remainingUnallocated} <span className="text-xs font-bold text-sky-700">{unit}</span></div>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{activeSections.length} Plots Partitioned</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-400 uppercase text-[10px]">Land Allocation Index</span>
            <span className="text-emerald-700 font-extrabold">{cultivationPct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${cultivationPct}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium pt-1">
            <span>Crops: <strong>{activeCropCount}</strong></span>
            <span>Observations Today: <strong>{observationsTodayCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-4 bg-emerald-950 text-emerald-200 rounded-2xl border border-emerald-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* TOP-DOWN REALISTIC FARM CANVAS CONTAINER */}
      <div className="bg-[#1c1613] rounded-3xl p-6 sm:p-8 border border-[#3b2d24] shadow-2xl space-y-6">
        
        {/* Canvas Toolbar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3b2d24] pb-4">
          <div>
            <h3 className="text-lg font-bold text-amber-100 flex items-center gap-2">
              <span>Top-Down Land Cell Matrix</span>
              <span className="text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full">
                {activeSections.length} Plots Defined
              </span>
            </h3>
            <p className="text-xs text-amber-300/70 mt-0.5">
              Proportional acreage cell layout. Click any plot to inspect real-time observations or trigger hardware.
            </p>
          </div>

          {/* System Health / Data Summary Badge + 3D View Mode Toggle */}
          <div className="flex items-center space-x-3 self-start sm:self-auto flex-wrap gap-2">
            <div className="bg-[#140f0d] p-1 rounded-xl flex items-center space-x-1 border border-[#3b2d24]">
              <button
                type="button"
                onClick={() => setDisplay3D(true)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  display3D ? 'bg-emerald-600 text-white shadow-xs' : 'text-amber-400 hover:text-white'
                }`}
              >
                3D Digital Twins
              </button>
              <button
                type="button"
                onClick={() => setDisplay3D(false)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  !display3D ? 'bg-emerald-600 text-white shadow-xs' : 'text-amber-400 hover:text-white'
                }`}
              >
                2D Canopy Svg
              </button>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 ${farmOverallStatus.color}`}>
              <Activity className="w-4 h-4" />
              <span>{farmOverallStatus.label}</span>
            </div>
            <DataSourceBadge source="MANUAL_PROTOTYPE" />
          </div>
        </div>

        {/* PROPORTIONAL AGRICULTURAL TOP-DOWN PLOT MATRIX GRID */}
        {activeSections.length > 0 ? (
          <div className="flex flex-wrap gap-5 p-4 rounded-2xl bg-[#140f0d] border border-[#2e231c] shadow-inner">
            {activeSections.map((sec) => {
              const crop = sec.cropId ? crops.find(c => c.id === sec.cropId) : null;
              const isSelected = selectedPlotId === sec.id;
              const obs = getLatestObservations(sec.id, sec.code);
              const condition = getPlotCondition(sec, crop, obs);

              // Proportional width & height allocation based on acreage
              const areaValue = Number(sec.area) || 1;
              const areaFraction = totalFarmLand > 0 ? areaValue / totalFarmLand : 0.25;

              // Flex-basis and min-height scale dynamically with plot acreage
              const flexBasisPx = Math.max(260, Math.min(650, Math.round(areaFraction * 1200)));
              const minHeightPx = Math.max(260, Math.min(420, Math.round(240 + areaFraction * 300)));

              return (
                <div
                  key={sec.id}
                  onClick={() => setSelectedPlotId(sec.id)}
                  style={{
                    flexGrow: areaValue,
                    flexShrink: 1,
                    flexBasis: `${flexBasisPx}px`,
                    minHeight: `${minHeightPx}px`
                  }}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-lg ${
                    isSelected 
                      ? 'border-emerald-500 ring-4 ring-emerald-500/30 shadow-emerald-950/80 scale-[1.01]' 
                      : 'border-[#4a3a2f] hover:border-amber-600/80 hover:shadow-2xl'
                  }`}
                >
                  {/* Top-Down Crop Canopy Layer or 3D Digital Twin or Rich Fallow Soil Texture */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    {crop ? (
                      display3D ? (
                        <div className="w-full h-full pointer-events-none">
                          <Plant3DCanvas
                            plot={sec}
                            crop={crop}
                            compact={true}
                            showCaption={false}
                            showMetricsOverlay={false}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-700">
                          <PlantCanopySvg 
                            stage={CropService.getCanopyStage(CropService.getCurrentStageForPlot(sec, crop))} 
                            cropType={crop.name} 
                            size={400} 
                          />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full bg-[#2a1d15] bg-[radial-gradient(#3a291e_1px,transparent_1px)] [background-size:12px_12px] flex items-center justify-center p-6 text-center">
                        <div className="space-y-1 text-amber-700/60 group-hover:text-amber-600 transition-colors">
                          <Layers className="w-8 h-8 mx-auto stroke-[1.5]" />
                          <span className="text-xs font-bold tracking-wider uppercase block text-amber-600/80">Fallow Land</span>
                          <span className="text-[10px] block text-amber-700/60 font-mono">Unallocated Soil ({sec.area} {unit})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Top Section Header Overlay (Gradient for legibility) */}
                  <div className="relative z-10 p-4 flex items-start justify-between bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-extrabold text-white bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700 shadow-xs">
                          {sec.code}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${condition.color}`}>
                          {condition.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white mt-1.5 drop-shadow-md">
                        {sec.name}
                      </h4>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-900/90 text-amber-200 border border-amber-900/60 shadow-md">
                      {sec.area} {unit}
                    </span>
                  </div>

                  {/* Bottom Section Details & Telemetry Overlay */}
                  <div className="relative z-10 p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-transparent space-y-2 text-white">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 truncate">
                        {crop ? `${crop.name} (${crop.variety})` : '🌱 Fallow / Unassigned'}
                      </span>
                      {obs && <DataSourceBadge source={obs.source} />}
                    </div>

                    {crop ? (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        {obs && (obs.moisture !== null || obs.temp !== null) ? (
                          <>
                            <span className="flex items-center space-x-1 text-sky-300">
                              <Droplet className="w-3.5 h-3.5 text-sky-400" />
                              <span>{formatMoisture(obs.moisture)}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-amber-300">
                              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                              <span>{formatTemperature(obs.temp)}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-purple-300">
                              <span>pH {formatPh(obs.ph)}</span>
                            </span>
                          </>
                        ) : (
                          <div className="w-full text-center text-[11px] text-slate-400 font-sans italic py-0.5">
                            No observation
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-800/80" onClick={e => e.stopPropagation()}>
                        <select
                          onChange={e => {
                            e.stopPropagation();
                            assignCropToSection(sec.id, e.target.value || null);
                          }}
                          className="w-full text-xs font-bold text-slate-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="">+ Assign Crop to Section...</option>
                          {crops.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.variety})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#140f0d] rounded-2xl border border-dashed border-[#3b2d24] text-amber-200/60 space-y-3">
            <Layers className="w-10 h-10 mx-auto text-amber-700" />
            <h4 className="text-base font-bold text-amber-100">No Plot Beds Partitioned Yet</h4>
            <p className="text-xs text-amber-300/60 max-w-md mx-auto">
              Please use the "+ Add Farm" wizard to define section plot beds for {activeFarmland?.name || 'this farm'}.
            </p>
          </div>
        )}
      </div>

      {/* DETAILED PLOT INSPECTION DRAWER / MODAL */}
      {selectedPlotObj && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 animate-fadeIn">
          
          {/* Inspection Drawer Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                  Plot Identity Drawer
                </span>
                <span className="text-xs text-slate-400 font-mono">{selectedPlotObj.code}</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">{selectedPlotObj.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Property: <strong>{activeFarmland?.name}</strong> &bull; Total Partition Area: <strong>{selectedPlotObj.area} {unit}</strong>
              </p>
            </div>

            {/* Actuator Action Controls */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  triggerActuator(selectedPlotObj.id, 'irrigation');
                  setNotice(`15-min precision irrigation pulse executed on ${selectedPlotObj.code}. Soil moisture boosted.`);
                  setTimeout(() => setNotice(null), 3500);
                }}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Droplet className="w-4 h-4" />
                <span>Irrigate 15-Min Pulse</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerActuator(selectedPlotObj.id, 'hvac');
                  setNotice(`Canopy ventilation fan toggled on ${selectedPlotObj.code}.`);
                  setTimeout(() => setNotice(null), 3500);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Toggle Fan</span>
              </button>

              <button
                onClick={() => setSelectedPlotId(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Detailed Observations & Crop Agronomics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Crop Info */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Cultivar</span>
              <p className="text-base font-black text-emerald-400">
                {selectedCropObj ? selectedCropObj.name : '🌱 Fallow Land'}
              </p>
              <p className="text-xs text-slate-300 font-medium">
                {selectedCropObj ? selectedCropObj.variety : 'No crop assigned'}
              </p>
            </div>

            {/* Soil Moisture */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Latest Soil Moisture</span>
              <p className="text-xl font-black text-sky-300">
                {selectedPlotObs && selectedPlotObs.moisture !== null ? `${selectedPlotObs.moisture}%` : `${selectedPlotObj.soilMoisture}%`}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Target: {selectedCropObj ? `${selectedCropObj.idealMoistureMin}%–${selectedCropObj.idealMoistureMax}%` : '50%–75%'}
              </span>
            </div>

            {/* Air Temperature */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Latest Temperature</span>
              <p className="text-xl font-black text-amber-300">
                {selectedPlotObs && selectedPlotObs.temp !== null ? `${selectedPlotObs.temp}°C` : `${selectedPlotObj.airTemp}°C`}
              </p>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Target: {selectedCropObj ? `${selectedCropObj.idealTempMin}°C–${selectedCropObj.idealTempMax}°C` : '20°C–28°C'}
              </span>
            </div>

            {/* Observation Source & Timestamp */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Telemetry Origin</span>
              <div className="pt-0.5">
                <DataSourceBadge source={selectedPlotObs?.source || 'MANUAL_PROTOTYPE'} />
              </div>
              <p className="text-[10px] text-slate-400 font-mono pt-1">
                {selectedPlotObs ? `Observed: ${new Date(selectedPlotObs.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : 'Default Node Telemetry'}
              </p>
            </div>
          </div>

          {/* Interactive 3D Digital Twin Viewport */}
          {selectedCropObj && (
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 p-1">
              <div className="h-[320px] w-full">
                <Plant3DCanvas
                  plot={selectedPlotObj}
                  crop={selectedCropObj}
                  height={320}
                  showCaption={true}
                  showMetricsOverlay={true}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualFarmView;
