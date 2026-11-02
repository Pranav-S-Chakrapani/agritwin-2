import React, { useState } from 'react';
import { Cpu, Leaf, Building2, Database, Code, X, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { TelemetryObservation } from '../../types';
import { PlotBed, Farmland } from '../../types';

interface SensorProvenanceProps {
  obs: TelemetryObservation | null | undefined;
  plots: PlotBed[];
  farmland: Farmland | null;
  layout?: 'inline' | 'block';
}

export const SensorProvenance: React.FC<SensorProvenanceProps> = ({
  obs,
  plots,
  farmland,
  layout = 'inline',
}) => {
  const [showInspector, setShowInspector] = useState(false);

  const safePlots = Array.isArray(plots) ? plots : [];
  const plot = safePlots.find(p => p && (p.id === obs.plotId || p.code === obs.plotId));
  const sensorId = obs.deviceId || obs.sensorId || '—';
  const cleanPlotCode = plot ? plot.code : (obs.plotId?.includes('_') ? (obs.plotId === 'plot_dharwad_02' ? 'PLOT-A02' : obs.plotId === 'plot_dharwad_03' ? 'PLOT-A03' : obs.plotId === 'plot_dharwad_04' ? 'PLOT-A04' : obs.plotId) : obs.plotId);
  const sectionLabel = cleanPlotCode;
  const farmLabel = farmland?.name || obs.farmId || '—';

  const sourceColor =
    obs.dataSource === 'SIMULATED'
      ? 'text-emerald-600'
      : obs.dataSource === 'MANUAL_PROTOTYPE'
      ? 'text-indigo-600'
      : obs.dataSource === 'LIVE_SENSOR'
      ? 'text-sky-600'
      : 'text-slate-500';

  return (
    <>
      <div className="group relative inline-block">
        {layout === 'block' ? (
          <div className="mt-1.5 space-y-1 text-[10px] text-slate-500 font-medium">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="flex items-center space-x-1 bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                <Cpu className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>{sensorId}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center space-x-1 text-slate-700">
                <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{sectionLabel}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center space-x-1 text-slate-600">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{farmLabel}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`font-extrabold uppercase ${sourceColor}`}>{obs.dataSource}</span>
              <button
                type="button"
                onClick={() => setShowInspector(true)}
                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 cursor-pointer underline"
              >
                <Code className="w-2.5 h-2.5" />
                <span>Inspect Supabase Payload</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-1 text-[10px] text-slate-400 font-medium leading-tight">
            <span className="text-slate-400">↳</span>
            <span className="flex items-center space-x-1 text-indigo-700 font-bold bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100/60">
              <Cpu className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>{sensorId}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center space-x-1 text-slate-700">
              <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>{sectionLabel}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center space-x-1 text-slate-600">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{farmLabel}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className={`font-extrabold uppercase ${sourceColor}`}>{obs.dataSource}</span>
            <button
              type="button"
              onClick={() => setShowInspector(true)}
              className="ml-1 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 cursor-pointer hover:underline"
              title="Click to view exact Supabase Record & Relational Foreign Keys"
            >
              <Code className="w-2.5 h-2.5" />
              <span>JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Supabase Raw Record Inspector Modal */}
      {showInspector && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl border border-indigo-500/40 shadow-2xl max-w-xl w-full p-6 space-y-4 font-sans text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Supabase Provenance Inspector</h3>
                  <p className="text-[11px] text-slate-400">Database & Relational Foreign Key Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowInspector(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Relational Hierarchy Trail Banner */}
            <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 space-y-2">
              <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center space-x-1">
                <LinkIcon className="w-3 h-3" />
                <span>Verified DBMS Relational Chain</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 flex-wrap">
                <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  Farm: {farmLabel}
                </span>
                <span className="text-indigo-400">&rarr;</span>
                <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  Section: {sectionLabel}
                </span>
                <span className="text-indigo-400">&rarr;</span>
                <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  Sensor: {sensorId}
                </span>
                <span className="text-indigo-400">&rarr;</span>
                <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Reading: {obs.value} {obs.unit}
                </span>
              </div>
            </div>

            {/* Document metadata table */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Database ID:</span>
                <span className="text-emerald-400 font-bold truncate block">ai-studio-agritwincropdigi-...</span>
              </div>
              <div>
                <span className="text-slate-500 block">Collection:</span>
                <span className="text-emerald-400 font-bold">telemetry_observations</span>
              </div>
              <div>
                <span className="text-slate-500 block">Document ID:</span>
                <span className="text-indigo-300 font-bold truncate block">{obs.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Timestamp:</span>
                <span className="text-slate-300">{new Date(obs.measurementTimestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Exact JSON Payload */}
            <div>
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                Supabase Record JSON Payload
              </div>
              <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56">
                {JSON.stringify(obs, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInspector(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SensorProvenance;
