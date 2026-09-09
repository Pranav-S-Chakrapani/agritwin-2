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
  Cpu,
  FlaskConical,
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
    `at-nav-item${isActive ? ' active' : ''}`;

  const subNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `at-nav-item text-sm${isActive ? ' active' : ''}`;

  return (
    <aside className="at-sidebar" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Brand Header ── */}
      <div className="at-sidebar-brand" style={{ justifyContent: 'space-between' }}>
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

      {/* ── Navigation ── */}
      <nav className="at-sidebar-nav">

        {/* MY FARM */}
        <span className="at-sidebar-section-label">My Farm</span>

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
            <NavLink to="/vision" className={subNavItemClass} onClick={onClose}>
              <Sprout className="at-nav-icon" style={{ width: 16, height: 16 }} />
              <span>Crop Vision Scanner</span>
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

      {/* ── Sustainable Farms Banner matching Reference ── */}
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
      <div className="at-sidebar-footer">
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
