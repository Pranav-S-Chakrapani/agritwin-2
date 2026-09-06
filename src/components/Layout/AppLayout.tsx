import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import {
  Building2,
  ShieldCheck,
  Menu,
  X,
  Bell,
  ChevronDown
} from 'lucide-react';
import { useAgriStore } from '../../context/AgriStore';
import { useAuth } from '../../context/AuthContext';

const GlobalHeaderBar: React.FC<{ onMenuToggle: () => void; sidebarOpen: boolean }> = ({ onMenuToggle, sidebarOpen }) => {
  const {
    farmlands,
    activeFarmland,
    selectFarmland,
    alerts,
  } = useAgriStore();

  const { userProfile, role, isAdmin } = useAuth();

  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;
  const criticalAlertCount = alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;

  return (
    <header className="mb-4 flex flex-col gap-2.5 pb-3 border-b border-slate-200/80">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile/Tablet toggle + Farm selector */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs cursor-pointer shrink-0 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Farm Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs min-w-0">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500 hidden md:inline shrink-0">Farm:</span>
            <div className="relative flex items-center min-w-0">
              <select
                value={activeFarmland?.id || farmlands[0]?.id || ''}
                onChange={(e) => selectFarmland(e.target.value)}
                className="bg-transparent text-slate-900 text-xs sm:text-sm font-extrabold outline-none cursor-pointer pr-4 max-w-[170px] sm:max-w-[240px] md:max-w-[300px] truncate"
              >
                {farmlands.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.totalArea} {f.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Alerts Bell + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Alerts Bell Link */}
          <Link
            to="/alerts"
            title="Field Alerts & Warnings"
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition-all border cursor-pointer ${
              criticalAlertCount > 0
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : activeAlertCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
            {activeAlertCount > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full text-white ${
                criticalAlertCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
              }`}>
                {activeAlertCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-xs">
            <ShieldCheck className={`w-4 h-4 shrink-0 ${isAdmin ? 'text-indigo-600' : 'text-emerald-600'}`} />
            <span className="text-slate-800 hidden md:inline max-w-[120px] truncate font-extrabold">
              {userProfile?.full_name || 'Field Operator'}
            </span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
              isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {role || 'farmer'}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner (if any) */}
      {criticalAlertCount > 0 && (
        <Link
          to="/alerts"
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs"
        >
          <span className="animate-pulse text-base">🚨</span>
          <span className="truncate">{criticalAlertCount} critical alert{criticalAlertCount > 1 ? 's' : ''} require field intervention</span>
          <span className="ml-auto text-xs underline font-semibold shrink-0">View &rarr;</span>
        </Link>
      )}
    </header>
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
