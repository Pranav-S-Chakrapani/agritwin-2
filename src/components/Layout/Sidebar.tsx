import React, { useState, useMemo } from 'react';
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
  Cpu,
  FlaskConical,
  Search,
  ChevronUp,
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

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [farmNavOpen, setFarmNavOpen] = useState(true);
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
    return farmlands.filter((f) =>
      f.name.toLowerCase().includes(farmSearch.toLowerCase()) ||
      f.location.toLowerCase().includes(farmSearch.toLowerCase())
    );
  }, [farmlands, farmSearch]);

  const getFarmSensorCounts = (farmId: string) =>
    SensorService.getSensorCountsForFarm(sensors, farmId);

  const getFarmPlotCount = (farmId: string) =>
    PlotService.getPlotsForFarm(plots, farmId).length;

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
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              AgriTwin
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400, lineHeight: 1.3 }}>
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

      {/* ── Farm Navigator ── */}
      <div
        style={{
          borderBottom: '1px solid var(--color-border-muted)',
          flexShrink: 0,
        }}
      >
        {/* Section Header */}
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
            color: 'var(--color-text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Building2 style={{ width: 14, height: 14, color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              My Farms
            </span>
            {farmlands.length > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary)',
                  color: 'white',
                  lineHeight: 1.5,
                }}
              >
                {farmlands.length}
              </span>
            )}
          </div>
          {farmNavOpen
            ? <ChevronUp style={{ width: 13, height: 13, color: 'var(--color-text-muted)' }} />
            : <ChevronDown style={{ width: 13, height: 13, color: 'var(--color-text-muted)' }} />
          }
        </button>

        {farmNavOpen && (
          <div style={{ padding: '0 10px 10px' }}>
            {/* Search box */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search
                style={{
                  position: 'absolute',
                  left: 9,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 12,
                  height: 12,
                  color: 'var(--color-text-muted)',
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
                  height: 32,
                  fontSize: 12,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border)',
                }}
                aria-label="Search farms"
              />
            </div>

            {/* Farm list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredFarms.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '6px 10px', textAlign: 'center' }}>
                  {farmlands.length === 0 ? 'No farms yet. Load demo data.' : 'No farms match search.'}
                </div>
              )}
              {filteredFarms.map((farm) => {
                const counts = getFarmSensorCounts(farm.id);
                const plotCount = getFarmPlotCount(farm.id);
                const isActive = activeFarmland?.id === farm.id;
                const hasOffline = counts.offline > 0;

                return (
                  <button
                    key={farm.id}
                    onClick={() => handleSelectFarm(farm.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-lg)',
                      border: isActive
                        ? '1px solid var(--color-primary-border)'
                        : '1px solid transparent',
                      background: isActive
                        ? 'var(--color-primary-muted)'
                        : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--color-surface-muted)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                    title={`${farm.name} — ${farm.location}`}
                    id={`farm-nav-${farm.id}`}
                  >
                    {/* Status indicator dot */}
                    <div style={{ marginTop: 4, flexShrink: 0 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: hasOffline ? 'var(--color-warning)' : 'var(--color-success)',
                          boxShadow: hasOffline
                            ? '0 0 0 2px #fef3c7'
                            : '0 0 0 2px #dcfce7',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? 'var(--color-primary-text)' : 'var(--color-text-primary)',
                          lineHeight: 1.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {farm.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {farm.location}
                      </div>

                      {/* Sensor & Plot counts */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-surface-muted)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Radio style={{ width: 8, height: 8 }} />
                          {counts.total} sensors
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-surface-muted)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Grid style={{ width: 8, height: 8 }} />
                          {plotCount} plots
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <ChevronRight style={{ width: 12, height: 12, color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="at-sidebar-nav">

        {/* MY FARM */}
        <span className="at-sidebar-section-label">Overview</span>

        <NavLink to="/" end className={navItemClass} onClick={onClose}>
          <LayoutDashboard className="at-nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/my-farms" className={navItemClass} onClick={onClose}>
          <Building2 className="at-nav-icon" />
          <span>My Farms & Plots</span>
        </NavLink>

        <NavLink to="/virtual-farm" className={navItemClass} onClick={onClose}>
          <Grid className="at-nav-icon" />
          <span>Live Farm View</span>
        </NavLink>

        <NavLink to="/crop-health" className={navItemClass} onClick={onClose}>
          <Sprout className="at-nav-icon" />
          <span>Crop Health</span>
        </NavLink>

        <NavLink to="/analytics" className={navItemClass} onClick={onClose}>
          <LineChart className="at-nav-icon" />
          <span>Sensor Charts</span>
        </NavLink>

        <NavLink to="/control" className={navItemClass} onClick={onClose}>
          <Activity className="at-nav-icon" />
          <span>Device Control</span>
        </NavLink>

        {/* MONITORING */}
        <span className="at-sidebar-section-label">Monitoring</span>

        <NavLink
          to="/alerts"
          onClick={onClose}
          className={({ isActive }) =>
            `at-nav-item${isActive ? ' active' : ''}${criticalCount > 0 && !isActive ? ' text-danger' : ''}`
          }
        >
          <Bell className="at-nav-icon" />
          <span>Alerts & Warnings</span>
          {activeAlertCount > 0 && (
            <span className={`at-nav-badge${criticalCount > 0 ? '' : ' warning'}`}>
              {activeAlertCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/activity-log" className={navItemClass} onClick={onClose}>
          <ClipboardList className="at-nav-icon" />
          <span>Activity Log</span>
        </NavLink>

        <NavLink to="/history" className={navItemClass} onClick={onClose}>
          <FileText className="at-nav-icon" />
          <span>Field Log</span>
        </NavLink>

        {/* ADVANCED & AI */}
        <span className="at-sidebar-section-label" style={{ marginTop: 4 }}>
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
              color: 'var(--color-text-muted)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: 0,
            }}
          >
            Advanced & AI
            {advancedOpen
              ? <ChevronDown style={{ width: 12, height: 12 }} />
              : <ChevronRight style={{ width: 12, height: 12 }} />
            }
          </button>
        </span>

        {advancedOpen && (
          <>
            <NavLink to="/advisor" className={subNavItemClass} onClick={onClose}>
              <BrainCircuit className="at-nav-icon" style={{ width: 16, height: 16 }} />
              <span>AI Crop Advisor</span>
            </NavLink>
            <NavLink to="/research" className={subNavItemClass} onClick={onClose}>
              <FlaskConical className="at-nav-icon" style={{ width: 16, height: 16 }} />
              <span>Research Workspace</span>
            </NavLink>
            <NavLink to="/map" className={subNavItemClass} onClick={onClose}>
              <Map className="at-nav-icon" style={{ width: 16, height: 16 }} />
              <span>Map View</span>
            </NavLink>
            <NavLink to="/compare" className={subNavItemClass} onClick={onClose}>
              <GitCompare className="at-nav-icon" style={{ width: 16, height: 16 }} />
              <span>Crop Comparison</span>
            </NavLink>
            <NavLink to="/what-if" className={subNavItemClass} onClick={onClose}>
              <Sliders className="at-nav-icon" style={{ width: 16, height: 16 }} />
              <span>What-If Simulator</span>
            </NavLink>
            <NavLink to="/camera" className={subNavItemClass} onClick={onClose}>
              <Camera className="at-nav-icon" style={{ width: 16, height: 16 }} />
              <span>Camera Feed</span>
            </NavLink>
            <NavLink to="/sensors" className={subNavItemClass} onClick={onClose}>
              <Radio className="at-nav-icon" style={{ width: 16, height: 16 }} />
              <span>Sensor Units</span>
            </NavLink>
          </>
        )}

        {/* ADMINISTRATION (Admin Only) */}
        {isAdmin && (
          <>
            <span className="at-sidebar-section-label" style={{ marginTop: 4 }}>
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: 0,
                }}
              >
                Administration
                {adminOpen
                  ? <ChevronDown style={{ width: 12, height: 12 }} />
                  : <ChevronRight style={{ width: 12, height: 12 }} />
                }
              </button>
            </span>

            {adminOpen && (
              <>
                <NavLink to="/db-monitor" className={subNavItemClass} onClick={onClose}>
                  <Database className="at-nav-icon" style={{ width: 16, height: 16 }} />
                  <span>System Health</span>
                </NavLink>
                <NavLink to="/developer-tools" className={subNavItemClass} onClick={onClose}>
                  <Cpu className="at-nav-icon" style={{ width: 16, height: 16 }} />
                  <span>Developer Tools</span>
                </NavLink>
                <NavLink to="/users" className={subNavItemClass} onClick={onClose}>
                  <Users className="at-nav-icon" style={{ width: 16, height: 16 }} />
                  <span>User Management</span>
                </NavLink>
                <NavLink to="/farm-management/crops" className={subNavItemClass} onClick={onClose}>
                  <FolderKanban className="at-nav-icon" style={{ width: 16, height: 16 }} />
                  <span>Plots & Crop Config</span>
                </NavLink>
                <NavLink to="/farm-management/audit-log" className={subNavItemClass} onClick={onClose}>
                  <FileText className="at-nav-icon" style={{ width: 16, height: 16 }} />
                  <span>Field Audit Log</span>
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      {/* ── Sustainable Farms Banner ── */}
      <div
        style={{
          margin: '12px 12px 8px',
          padding: '14px 16px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
          }}
        >
          <Leaf style={{ width: 16, height: 16, color: 'white' }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary-text)', lineHeight: 1.2 }}>
            Sustainable Farms
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', lineHeight: 1.2 }}>
            Smarter Futures
          </div>
        </div>
      </div>

      {/* ── User Footer ── */}
      <div className="at-sidebar-footer" style={{ flexShrink: 0 }}>
        <div className="at-avatar">
          {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="at-truncate" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {userProfile?.full_name || 'Researcher'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
            {role || 'Researcher'}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="at-btn-icon"
          style={{ border: 'none', color: 'var(--color-text-muted)', background: 'transparent' }}
          title="Sign Out"
          aria-label="Sign out"
        >
          <LogOut style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
