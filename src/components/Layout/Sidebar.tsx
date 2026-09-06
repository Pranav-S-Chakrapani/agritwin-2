import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  LineChart,
  Map,
  Camera,
  Activity,
  GitCompare,
  Sliders,
  ChevronDown,
  ChevronRight,
  Leaf,
  FolderKanban,
  FileText,
  Users,
  LogOut,
  Building2,
  Radio,
  Database,
  Grid,
  BrainCircuit,
  Bell,
  ClipboardList,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAgriStore } from '../../context/AgriStore';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { userProfile, role, isAdmin, logout } = useAuth();
  const { alerts } = useAgriStore();
  const navigate = useNavigate();

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;
  const criticalCount = alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 font-bold text-sm ${
      isActive
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const subNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
      isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 shadow-2xl shrink-0 font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl shadow-md text-slate-950">
            <Leaf className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl text-white tracking-wide">AgriTwin</span>
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
                v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Farm Platform</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

        {/* ── TIER 1: FARM OPERATIONS ──────────────────────────── */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            MY FARM
          </div>

          <NavLink to="/" end className={navItemClass} onClick={onClose}>
            <LayoutDashboard className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Farm Dashboard</span>
          </NavLink>

          <NavLink to="/my-farms" className={navItemClass} onClick={onClose}>
            <Building2 className="w-5 h-5 text-teal-400 shrink-0" />
            <span>My Farms & Plots</span>
          </NavLink>

          <NavLink to="/virtual-farm" className={navItemClass} onClick={onClose}>
            <Grid className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Live Farm View</span>
          </NavLink>

          <NavLink to="/crop-health" className={navItemClass} onClick={onClose}>
            <Sprout className="w-5 h-5 text-lime-400 shrink-0" />
            <span>Crop Health Check</span>
          </NavLink>

          <NavLink to="/analytics" className={navItemClass} onClick={onClose}>
            <LineChart className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Sensor Charts</span>
          </NavLink>

          <NavLink to="/control" className={navItemClass} onClick={onClose}>
            <Activity className="w-5 h-5 text-sky-400 shrink-0" />
            <span>Control Devices</span>
          </NavLink>
        </div>

        {/* ── TIER 1.5: MONITORING & LOGS ──────────────────────── */}
        <div className="border-t border-slate-800/80 pt-3 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            MONITORING & LOGS
          </div>

          <NavLink to="/alerts" className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 font-bold text-sm relative ${
              isActive
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : criticalCount > 0
                ? 'text-red-300 bg-red-900/30 hover:bg-red-900/50'
                : activeAlertCount > 0
                ? 'text-amber-300 hover:bg-slate-800 hover:text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          } onClick={onClose}>
            <Bell className="w-5 h-5 shrink-0" />
            <span>Alerts & Warnings</span>
            {activeAlertCount > 0 && (
              <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full text-white ${
                criticalCount > 0 ? 'bg-red-500' : 'bg-amber-500'
              }`}>
                {activeAlertCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/activity-log" className={navItemClass} onClick={onClose}>
            <ClipboardList className="w-5 h-5 text-violet-400 shrink-0" />
            <span>Field Activity Log</span>
          </NavLink>

          <NavLink to="/history" className={navItemClass} onClick={onClose}>
            <FileText className="w-5 h-5 text-slate-400 shrink-0" />
            <span>Field Log</span>
          </NavLink>
        </div>

        {/* ── TIER 2: ADVANCED (COLLAPSIBLE) ──────────────── */}
        <div className="border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span>ADVANCED & AI TOOLS</span>
            {advancedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {advancedOpen && (
            <div className="mt-1 space-y-1 pl-1">
              <NavLink to="/advisor" className={subNavItemClass} onClick={onClose}>
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>AI Crop Advisor</span>
              </NavLink>
              <NavLink to="/research" className={subNavItemClass} onClick={onClose}>
                <Database className="w-4 h-4 text-purple-400" />
                <span>Research Workspace</span>
              </NavLink>
              <NavLink to="/map" className={subNavItemClass} onClick={onClose}>
                <Map className="w-4 h-4 text-purple-400" />
                <span>Map View</span>
              </NavLink>
              <NavLink to="/compare" className={subNavItemClass} onClick={onClose}>
                <GitCompare className="w-4 h-4 text-purple-400" />
                <span>Crop Comparison</span>
              </NavLink>
              <NavLink to="/what-if" className={subNavItemClass} onClick={onClose}>
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>What-If Simulator</span>
              </NavLink>
              <NavLink to="/camera" className={subNavItemClass} onClick={onClose}>
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Camera Feed</span>
              </NavLink>
              <NavLink to="/vision" className={subNavItemClass} onClick={onClose}>
                <Sprout className="w-4 h-4 text-purple-400" />
                <span>Crop Vision Scanner</span>
              </NavLink>
              <NavLink to="/sensors" className={subNavItemClass} onClick={onClose}>
                <Radio className="w-4 h-4 text-purple-400" />
                <span>Sensor Units (Detailed)</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* ── TIER 3: ADMINISTRATION (ADMIN ONLY) ──────────── */}
        {isAdmin && (
          <div className="border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span>ADMINISTRATION</span>
              {adminOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {adminOpen && (
              <div className="mt-1 space-y-1 pl-1">
                <NavLink to="/db-monitor" className={subNavItemClass} onClick={onClose}>
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>System Health</span>
                </NavLink>
                <NavLink to="/developer-tools" className={subNavItemClass} onClick={onClose}>
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>Developer Tools</span>
                </NavLink>
                <NavLink to="/users" className={subNavItemClass} onClick={onClose}>
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>User Management</span>
                </NavLink>
                <NavLink to="/farm-management/crops" className={subNavItemClass} onClick={onClose}>
                  <FolderKanban className="w-4 h-4 text-indigo-400" />
                  <span>Plots & Crop Config</span>
                </NavLink>
                <NavLink to="/farm-management/audit-log" className={subNavItemClass} onClick={onClose}>
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Field Audit Log</span>
                </NavLink>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-base text-emerald-400 shrink-0">
            {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="truncate">
            <span className="text-sm font-bold text-white block truncate">{userProfile?.full_name || 'System User'}</span>
            <span className="text-[11px] font-black uppercase text-emerald-400 block tracking-wider">{role || 'farmer'}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
