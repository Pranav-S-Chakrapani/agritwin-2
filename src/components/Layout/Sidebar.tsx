import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Sprout,
  Radio,
  LineChart,
  Box,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Leaf,
  Building2,
  BrainCircuit,
  FlaskConical,
  GitCompare,
  Sliders,
  Camera,
  Database,
  Cpu,
  Users,
  ClipboardList,
  Activity,
  Grid,
  Search,
  X,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAgriStore } from '../../context/AgriStore';
import { SensorService, PlotService } from '../../services/canonicalServices';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { userProfile, role, isAdmin, logout } = useAuth();
  const { alerts, farmlands, sensors, plots, activeFarmland, selectFarmland } = useAgriStore();
  const navigate = useNavigate();

  // Collapsible menu states
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [farmNavOpen, setFarmNavOpen] = useState(false);
  const [farmSearch, setFarmSearch] = useState('');

  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;
  const criticalCount = alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `at-nav-item${isActive ? ' active' : ''}`;

  const subNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `at-nav-item text-sm${isActive ? ' active' : ''}`;

  const filteredFarms = useMemo(() => {
    if (!farmSearch.trim()) return farmlands;
    return farmlands.filter(
      (f) =>
        f.name.toLowerCase().includes(farmSearch.toLowerCase()) ||
        f.location.toLowerCase().includes(farmSearch.toLowerCase())
    );
  }, [farmlands, farmSearch]);

  const handleSelectFarm = (farmId: string) => {
    selectFarmland(farmId);
    if (onClose) onClose();
  };

  return (
    <aside className="at-sidebar" style={{ fontFamily: 'Inter, sans-serif', overflowY: 'auto' }}>
      {/* ── Brand Header ── */}
      <div className="at-sidebar-brand" style={{ justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="at-sidebar-logo">
            <Leaf style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text-primary, #0f172a)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              AgriTwin
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted, #64748b)', fontWeight: 400, lineHeight: 1.3 }}>
              Digital Twin Platform
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="at-btn-icon lg:hidden"
            style={{ width: 28, height: 28 }}
            aria-label="Close menu"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* ── Farm Switcher Compact Accordion ── */}
      <div style={{ borderBottom: '1px solid var(--color-border-muted, #f1f5f9)', flexShrink: 0 }}>
        <button
          onClick={() => setFarmNavOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary, #475569)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Building2 style={{ width: 14, height: 14, color: 'var(--color-primary, #16a34a)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted, #64748b)' }}>
              Active Farm: <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{activeFarmland?.name?.split(' ')[0] || 'Select'}</strong>
            </span>
          </div>
          {farmNavOpen
            ? <ChevronUp style={{ width: 13, height: 13, color: 'var(--color-text-muted, #64748b)' }} />
            : <ChevronDown style={{ width: 13, height: 13, color: 'var(--color-text-muted, #64748b)' }} />
          }
        </button>

        {farmNavOpen && (
          <div style={{ padding: '0 10px 10px' }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search
                style={{
                  position: 'absolute',
                  left: 9,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 12,
                  height: 12,
                  color: 'var(--color-text-muted, #64748b)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search farms..."
                value={farmSearch}
                onChange={(e) => setFarmSearch(e.target.value)}
                className="at-input"
                style={{
                  width: '100%',
                  paddingLeft: 28,
                  height: 30,
                  fontSize: 12,
                  borderRadius: 'var(--radius-lg, 8px)',
                  background: 'var(--color-surface-muted, #f8fafc)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                }}
                aria-label="Search farms"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 150, overflowY: 'auto' }}>
              {filteredFarms.map((farm) => {
                const isActive = activeFarmland?.id === farm.id;
                return (
                  <button
                    key={farm.id}
                    onClick={() => handleSelectFarm(farm.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #bbf7d0' : '1px solid transparent',
                      background: isActive ? '#f0fdf4' : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#15803d' : '#0f172a' }} className="at-truncate">
                      {farm.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{farm.location}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Navigation (7-8 Clean Top-Level Items) ── */}
      <nav className="at-sidebar-nav" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        {/* 1. Dashboard */}
        <NavLink to="/" end className={navItemClass} onClick={onClose}>
          <LayoutDashboard className="at-nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        {/* 2. Farm Map */}
        <NavLink to="/map" className={navItemClass} onClick={onClose}>
          <Map className="at-nav-icon" />
          <span>Farm Map</span>
        </NavLink>

        {/* 3. Crops (Contains Crop Health & Vision) */}
        <NavLink to="/crop-health" className={navItemClass} onClick={onClose}>
          <Sprout className="at-nav-icon" />
          <span>Crops</span>
        </NavLink>

        {/* 4. Sensors (Contains Sensor Telemetry & Device Control) */}
        <NavLink to="/sensors" className={navItemClass} onClick={onClose}>
          <Radio className="at-nav-icon" />
          <span>Sensors</span>
        </NavLink>

        {/* 5. Analytics */}
        <NavLink to="/analytics" className={navItemClass} onClick={onClose}>
          <LineChart className="at-nav-icon" />
          <span>Analytics</span>
        </NavLink>

        {/* 6. Digital Twin (Contains 3D Live Farm View & My Farms/Plots) */}
        <NavLink to="/virtual-farm" className={navItemClass} onClick={onClose}>
          <Box className="at-nav-icon" />
          <span>Digital Twin</span>
        </NavLink>

        {/* 7. Reports (Contains Field Log, Activity Log, Alerts) */}
        <NavLink to="/history" className={navItemClass} onClick={onClose}>
          <FileText className="at-nav-icon" />
          <span>Reports</span>
          {activeAlertCount > 0 && (
            <span className={`at-nav-badge${criticalCount > 0 ? '' : ' warning'}`} style={{ marginLeft: 'auto' }}>
              {activeAlertCount}
            </span>
          )}
        </NavLink>

        <div style={{ height: 1, background: 'var(--color-border-muted, #f1f5f9)', margin: '8px 4px' }} />

        {/* ── Advanced & AI Section (Collapsible) ── */}
        <div>
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted, #64748b)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '8px 12px',
              borderRadius: '8px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BrainCircuit style={{ width: 14, height: 14, color: '#16a34a' }} />
              Advanced & AI
            </span>
            {advancedOpen ? <ChevronDown style={{ width: 13, height: 13 }} /> : <ChevronRight style={{ width: 13, height: 13 }} />}
          </button>

          {advancedOpen && (
            <div style={{ paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
              <NavLink to="/advisor" className={subNavItemClass} onClick={onClose}>
                <BrainCircuit className="at-nav-icon" style={{ width: 15, height: 15 }} />
                <span>AI Crop Advisor</span>
              </NavLink>
              <NavLink to="/research" className={subNavItemClass} onClick={onClose}>
                <FlaskConical className="at-nav-icon" style={{ width: 15, height: 15 }} />
                <span>Research Workspace</span>
              </NavLink>
              <NavLink to="/compare" className={subNavItemClass} onClick={onClose}>
                <GitCompare className="at-nav-icon" style={{ width: 15, height: 15 }} />
                <span>Crop Comparison</span>
              </NavLink>
              <NavLink to="/what-if" className={subNavItemClass} onClick={onClose}>
                <Sliders className="at-nav-icon" style={{ width: 15, height: 15 }} />
                <span>What-If Simulator</span>
              </NavLink>
              <NavLink to="/camera" className={subNavItemClass} onClick={onClose}>
                <Camera className="at-nav-icon" style={{ width: 15, height: 15 }} />
                <span>Camera Feed</span>
              </NavLink>
              <NavLink to="/control" className={subNavItemClass} onClick={onClose}>
                <Activity className="at-nav-icon" style={{ width: 15, height: 15 }} />
                <span>Device Control</span>
              </NavLink>
              <NavLink to="/my-farms" className={subNavItemClass} onClick={onClose}>
                <Building2 className="at-nav-icon" style={{ width: 15, height: 15 }} />
                <span>My Farms & Plots</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* ── Settings & Administration Section (Collapsible - Admin Only) ── */}
        {isAdmin && (
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted, #64748b)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings style={{ width: 14, height: 14, color: '#475569' }} />
                Settings
              </span>
              {settingsOpen ? <ChevronDown style={{ width: 13, height: 13 }} /> : <ChevronRight style={{ width: 13, height: 13 }} />}
            </button>

            {settingsOpen && (
              <div style={{ paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                <NavLink to="/db-monitor" className={subNavItemClass} onClick={onClose}>
                  <Database className="at-nav-icon" style={{ width: 15, height: 15 }} />
                  <span>System Health</span>
                </NavLink>
                <NavLink to="/developer-tools" className={subNavItemClass} onClick={onClose}>
                  <Cpu className="at-nav-icon" style={{ width: 15, height: 15 }} />
                  <span>Developer Tools</span>
                </NavLink>
                <NavLink to="/users" className={subNavItemClass} onClick={onClose}>
                  <Users className="at-nav-icon" style={{ width: 15, height: 15 }} />
                  <span>User Management</span>
                </NavLink>
                <NavLink to="/sensor-mapping" className={subNavItemClass} onClick={onClose}>
                  <Radio className="at-nav-icon" style={{ width: 15, height: 15 }} />
                  <span>Sensor Mapping</span>
                </NavLink>
                <NavLink to="/audit-log" className={subNavItemClass} onClick={onClose}>
                  <ClipboardList className="at-nav-icon" style={{ width: 15, height: 15 }} />
                  <span>Field Audit Log</span>
                </NavLink>
                <NavLink to="/add-farmland" className={subNavItemClass} onClick={onClose}>
                  <PlusCircle className="at-nav-icon" style={{ width: 15, height: 15 }} />
                  <span>Add Farmland</span>
                </NavLink>
              </div>
            )}

          </div>
        )}

      </nav>

      {/* ── User Footer Profile ── */}
      <div className="at-sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border, #e2e8f0)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              className="at-avatar"
              style={{
                width: 32,
                height: 32,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: '50%',
                background: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'R'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }} className="at-truncate">
                {userProfile?.full_name || 'Researcher'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted, #64748b)' }}>
                {role?.toUpperCase()} {isAdmin ? '· ADMIN' : ''}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted, #64748b)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: '6px',
            }}
            aria-label="Log out"
          >
            <LogOut style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </aside>
  );
};
