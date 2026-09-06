import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import {
  Building2,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useAgriStore } from '../../context/AgriStore';
import { useAuth } from '../../context/AuthContext';
import { DataSourceBadge } from '../common/DataSourceBadge';

const GlobalHeaderBar: React.FC<{ onMenuToggle: () => void; sidebarOpen: boolean }> = ({ onMenuToggle, sidebarOpen }) => {
  const {
    farmlands,
    activeFarmland,
    selectFarmland,
    isDemoTelemetryActive,
    toggleDemoTelemetry,
    triggerTelemetrySimulationNow,
    alerts,
  } = useAgriStore();

  const { userProfile, role, isAdmin } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);

  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;
  const criticalAlertCount = alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;

  const handleManualSimulate = async () => {
    setIsSimulating(true);
    await triggerTelemetrySimulationNow();
    setTimeout(() => setIsSimulating(false), 800);
  };

  return (
    <div className="mb-4 flex flex-col gap-3 pb-4 border-b border-slate-200/80">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Mobile toggle + Farm selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Farm Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500 hidden sm:block">Farm:</span>
            <select
              value={activeFarmland?.id || farmlands[0]?.id || ''}
              onChange={(e) => selectFarmland(e.target.value)}
              className="bg-transparent text-slate-900 text-sm font-bold outline-none cursor-pointer max-w-[160px] sm:max-w-[220px]"
            >
              {farmlands.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.totalArea} {f.unit})
                </option>
              ))}
            </select>
          </div>

          <DataSourceBadge source="MANUAL_PROTOTYPE" />
        </div>

        {/* Right: Controls & Alerts */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Alerts Link */}
          <Link
            to="/alerts"
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition-all border ${
              criticalAlertCount > 0
                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                : activeAlertCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:block">Alerts</span>
            {activeAlertCount > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full text-white ${
                criticalAlertCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
              }`}>
                {activeAlertCount}
              </span>
            )}
          </Link>

          {isAdmin && (
            <Link
              to="/add-farmland"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:block">Add Farm</span>
            </Link>
          )}

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-xs">
            <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-indigo-600' : 'text-emerald-600'}`} />
            <span className="text-slate-800 hidden sm:block max-w-[110px] truncate">{userProfile?.full_name || 'Farmer'}</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
              isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {role || 'farmer'}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Alert Warning Strip */}
      {criticalAlertCount > 0 && (
        <Link
          to="/alerts"
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-xs"
        >
          <span className="animate-pulse text-base">🚨</span>
          <span>{criticalAlertCount} critical alert{criticalAlertCount > 1 ? 's' : ''} require immediate field attention</span>
          <span className="ml-auto text-xs underline font-semibold">View Alerts &rarr;</span>
        </Link>
      )}
    </div>
  );
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <div className={`fixed lg:static z-40 h-full transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-4">
          <GlobalHeaderBar onMenuToggle={() => setSidebarOpen((v) => !v)} sidebarOpen={sidebarOpen} />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
