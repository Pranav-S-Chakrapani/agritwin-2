import React, { useState, useEffect } from 'react';
import { Settings2, Droplet, Wind, Sun, Sprout, Building2 } from 'lucide-react';
import { logFieldAction } from '../lib/audit-log';
import { useAgriStore } from '../context/AgriStore';
import { PlotService } from '../services/canonicalServices';

export const DeviceControl = () => {
  const { farmlands, activeFarmland, plots: allPlots, crops, triggerActuator } = useAgriStore();
  const plots = PlotService.getPlotsForFarm(allPlots, activeFarmland?.id);
  const [selectedPlot, setSelectedPlot] = useState('');
  const [controls, setControls] = useState<any>({
    irrigation: { enabled: false, mode: 'auto' },
    hvac: { enabled: false, mode: 'auto' },
    growLight: { enabled: false, mode: 'manual' }
  });

  // Keep selectedPlot synchronized with the active farm's plot list
  useEffect(() => {
    if (plots.length > 0) {
      const exists = plots.some(p => p.id === selectedPlot);
      if (!exists) {
        setSelectedPlot(plots[0].id);
      }
    } else {
      setSelectedPlot('');
    }
  }, [plots, selectedPlot, activeFarmland?.id]);

  const activePlotObj = plots.find(p => p.id === selectedPlot) || plots[0];
  const plotCode = activePlotObj ? activePlotObj.code : selectedPlot;

  const toggleDevice = async (device: string, currentEnabled: boolean, mode: string) => {
    const nextState = !currentEnabled;
    const cleanMode = (mode || 'auto').toLowerCase();

    setControls((prev: any) => ({
      ...prev,
      [device]: { enabled: nextState, mode: cleanMode }
    }));

    const actionType = device === 'growLight' ? 'grow_light' : (device as any);
    const triggeredBy = cleanMode === 'auto' ? 'auto' : 'manual';
    const statusText = nextState ? 'Activated ON' : 'Deactivated OFF';

    if (device === 'irrigation' && nextState) {
      triggerActuator(selectedPlot, 'irrigation');
    }

    await logFieldAction(
      selectedPlot,
      actionType,
      triggeredBy,
      `${device.toUpperCase()} actuator ${statusText} via Control Panel (${cleanMode.toUpperCase()} mode).`,
      plotCode
    );
  };

  const toggleMode = async (device: string, enabled: boolean, currentMode: string) => {
    const isAuto = (currentMode || '').toLowerCase() === 'auto';
    const nextMode = isAuto ? 'manual' : 'auto';

    setControls((prev: any) => ({
      ...prev,
      [device]: { enabled, mode: nextMode }
    }));

    const actionType = device === 'growLight' ? 'grow_light' : (device as any);
    await logFieldAction(
      selectedPlot,
      actionType,
      'manual',
      `${device.toUpperCase()} operating mode changed to ${nextMode.toUpperCase()}.`,
      plotCode
    );
  };

  if (plots.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <Sprout className="w-12 h-12 text-emerald-800 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Plots Configured</h2>
        <p className="text-sm text-slate-500">Configure plots in Onboarding or Virtual Farm to access edge device controls.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {activeFarmland?.name || 'Active Farm'}
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center">
            <Settings2 className="mr-3 text-sky-600 w-8 h-8" />
            Edge Device & Actuator Control
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Manual and automated actuation of precision irrigation valves, canopy fans, and supplemental lighting for <strong>{activeFarmland?.name || 'this farm'}</strong>
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Plot:</span>
          <select 
            value={selectedPlot} 
            onChange={(e) => setSelectedPlot(e.target.value)}
            className="bg-slate-50 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            {plots.map(p => {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Irrigation Valve */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
                <Droplet className="w-6 h-6" />
              </div>
              <button
                onClick={() => toggleMode('irrigation', controls?.irrigation?.enabled, controls?.irrigation?.mode)}
                className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                  controls?.irrigation?.mode === 'auto'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {controls?.irrigation?.mode || 'AUTO'} MODE
              </button>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Precision Drip Irrigation</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Automated solenoid valve triggered by root-zone soil moisture telemetry</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <span className="text-slate-500 font-bold uppercase">Valve State:</span>
              <span className={`font-black ${controls?.irrigation?.enabled ? 'text-sky-600' : 'text-slate-400'}`}>
                {controls?.irrigation?.enabled ? 'VALVE OPEN (ACTIVE)' : 'CLOSED (STANDBY)'}
              </span>
            </div>

            <button
              onClick={() => toggleDevice('irrigation', controls?.irrigation?.enabled, controls?.irrigation?.mode)}
              className={`w-full py-3 rounded-2xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 ${
                controls?.irrigation?.enabled 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' 
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
              }`}
            >
              {controls?.irrigation?.enabled ? 'STOP IRRIGATION' : 'START 15-MIN PULSE'}
            </button>
          </div>
        </div>

        {/* HVAC / Shade Fans */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
                <Wind className="w-6 h-6" />
              </div>
              <button
                onClick={() => toggleMode('hvac', controls?.hvac?.enabled, controls?.hvac?.mode)}
                className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                  controls?.hvac?.mode === 'auto'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {controls?.hvac?.mode || 'AUTO'} MODE
              </button>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Canopy Ventilation & Fans</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">High-efficiency airflow fans for VPD stabilization and heat dissipation</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <span className="text-slate-500 font-bold uppercase">Fan State:</span>
              <span className={`font-black ${controls?.hvac?.enabled ? 'text-teal-600' : 'text-slate-400'}`}>
                {controls?.hvac?.enabled ? 'RUNNING (BLOWING)' : 'STOPPED'}
              </span>
            </div>

            <button
              onClick={() => toggleDevice('hvac', controls?.hvac?.enabled, controls?.hvac?.mode)}
              className={`w-full py-3 rounded-2xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 ${
                controls?.hvac?.enabled 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' 
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
              }`}
            >
              {controls?.hvac?.enabled ? 'TURN FANS OFF' : 'TURN FANS ON'}
            </button>
          </div>
        </div>

        {/* Supplemental Lighting */}
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <Sun className="w-6 h-6" />
              </div>
              <button
                onClick={() => toggleMode('growLight', controls?.growLight?.enabled, controls?.growLight?.mode)}
                className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                  controls?.growLight?.mode === 'auto'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {controls?.growLight?.mode || 'MANUAL'} MODE
              </button>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">PAR Supplemental Grow Light</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Full-spectrum LED illumination for photosynthetic photon flux boost</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <span className="text-slate-500 font-bold uppercase">LED State:</span>
              <span className={`font-black ${controls?.growLight?.enabled ? 'text-amber-600' : 'text-slate-400'}`}>
                {controls?.growLight?.enabled ? 'ILLUMINATING (100%)' : 'OFF'}
              </span>
            </div>

            <button
              onClick={() => toggleDevice('growLight', controls?.growLight?.enabled, controls?.growLight?.mode)}
              className={`w-full py-3 rounded-2xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 ${
                controls?.growLight?.enabled 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' 
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
              }`}
            >
              {controls?.growLight?.enabled ? 'TURN LIGHTS OFF' : 'TURN LIGHTS ON'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceControl;
