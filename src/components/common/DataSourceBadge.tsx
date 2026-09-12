import React from 'react';
import { DataSourceType } from '../../types';
import { User, Radio, Cpu, Sparkles, Sliders } from 'lucide-react';

interface DataSourceBadgeProps {
  source?: DataSourceType;
  className?: string;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ source = 'MANUAL_PROTOTYPE', className = '' }) => {
  switch (source) {
    case 'MANUAL_PROTOTYPE':
      return (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs ${className}`}>
          <User className="w-3 h-3 text-indigo-500" />
          <span>MANUAL PROTOTYPE</span>
        </span>
      );

    case 'SENSOR':
      return (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs ${className}`}>
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>LIVE SENSOR</span>
        </span>
      );

    case 'AI_ML':
      return (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs ${className}`}>
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span>AI / ML PREDICTION</span>
        </span>
      );

    case 'SIMULATED':
      return (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs ${className}`}>
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>SIMULATED</span>
        </span>
      );

    case 'LIVE_SENSOR':
      return (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs ${className}`}>
          <Radio className="w-3 h-3 text-sky-500 animate-pulse" />
          <span>LIVE SENSOR</span>
        </span>
      );

    case 'DERIVED':
      return (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs ${className}`}>
          <Cpu className="w-3 h-3 text-amber-500" />
          <span>DERIVED BIOPHYSICAL</span>
        </span>
      );

    case 'SIMULATION':
      return (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs ${className}`}>
          <Sliders className="w-3 h-3 text-slate-500" />
          <span>WHAT-IF SIMULATION</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs ${className}`}>
          <span>{source}</span>
        </span>
      );
  }
};

export default DataSourceBadge;
