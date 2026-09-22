import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useAgriStore } from '../../context/AgriStore';
import { useAuth } from '../../context/AuthContext';

const GlobalTopBar: React.FC<{ onMenuToggle: () => void; sidebarOpen: boolean }> = ({ onMenuToggle }) => {
  const { activeFarmland, alerts } = useAgriStore();

  const { userProfile, role, isAdmin } = useAuth();

  const [isDark, setIsDark] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agritwin_theme');
      return stored === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return false;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof window !== 'undefined') {
      const themeVal = next ? 'dark' : 'light';
      localStorage.setItem('agritwin_theme', themeVal);
      document.documentElement.setAttribute('data-theme', themeVal);
      if (next) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agritwin_theme');
      if (stored === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark');
        setIsDark(true);
      }
    }
  }, []);

  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;
  const criticalAlertCount = alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      {/* Critical Alert Banner */}
      {criticalAlertCount > 0 && (
        <Link
          to="/alerts"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 24px',
            background: 'var(--color-danger)',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <span style={{ animation: 'at-pulse 1.5s infinite' }}>🚨</span>
          <span>
            {criticalAlertCount} critical alert{criticalAlertCount > 1 ? 's' : ''} require immediate field intervention
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.85, textDecoration: 'underline' }}>
            View Alerts →
          </span>
        </Link>
      )}

      {/* Main Top Bar */}
      <header
        style={{
          height: 'var(--header-height)',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          flexShrink: 0,
        }}
      >
        {/* Mobile menu button / hamburger */}
        <button
          onClick={onMenuToggle}
          className="at-btn-icon"
          style={{ border: 'none', background: 'transparent' }}
          id="at-mobile-menu-btn"
          aria-label="Toggle navigation"
        >
          <Menu style={{ width: 19, height: 19, color: 'var(--color-text-secondary)' }} />
        </button>

        {/* Global Search Bar from Reference */}
        <div className="at-search at-hide-mobile" style={{ width: 260 }}>
          <Search className="at-search-icon" style={{ width: 15, height: 15 }} />
          <input
            className="at-input"
            type="text"
            placeholder="Search..."
            style={{
              paddingLeft: 34,
              fontSize: 13,
              borderRadius: 'var(--radius-lg)',
              height: 36,
              background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
            }}
            aria-label="Global search"
          />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Active Farm Indicator */}
        {activeFarmland && (
          <div
            className="at-hide-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: 'var(--color-primary-subtle)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-lg)',
              flexShrink: 0,
              height: 36,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary-text)' }}>
              {activeFarmland.name}
            </span>
          </div>
        )}

        {/* Live status */}
        <div className="at-live" style={{ flexShrink: 0, height: 32, padding: '0 12px' }}>
          <span className="at-live-dot" />
          Live
        </div>

        {/* Last updated */}
        <div
          className="at-hide-mobile"
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            fontWeight: 400,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            lineHeight: 1.25,
          }}
        >
          <span>Last updated</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: 11 }}>
            {dateStr}, {timeStr}
          </span>
        </div>

        {/* Alerts Bell */}
        <Link
          to="/alerts"
          title="Alerts & Notifications"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid',
            transition: 'all 0.15s',
            flexShrink: 0,
            height: 36,
            ...(criticalAlertCount > 0
              ? { background: 'var(--color-danger-bg)', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger-text)' }
              : activeAlertCount > 0
              ? { background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning-border)', color: 'var(--color-warning-text)' }
              : { background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
            ),
          }}
          id="at-alerts-link"
        >
          <Bell style={{ width: 15, height: 15 }} />
          <span className="at-hide-xs">Alerts</span>
          {activeAlertCount > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                color: 'white',
                lineHeight: 1.5,
                background: criticalAlertCount > 0 ? 'var(--color-danger)' : 'var(--color-warning)',
              }}
            >
              {activeAlertCount}
            </span>
          )}
        </Link>

        {/* Dark Mode / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="at-btn-icon"
          style={{
            height: 36,
            width: 36,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-muted)',
            border: '1px solid var(--color-border)',
            color: isDark ? '#fbbf24' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          id="at-theme-toggle-btn"
        >
          {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
        </button>

        {/* User Pill from Reference ("Welcome Researcher ▾") */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            background: 'var(--color-surface-muted)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'default',
            flexShrink: 0,
            height: 36,
          }}
          title={`${userProfile?.full_name || 'Researcher'} — ${role}`}
        >
          <div className="at-avatar" style={{ width: 24, height: 24, fontSize: 11, borderRadius: '50%', background: '#0f172a', color: 'white' }}>
            {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'R'}
          </div>
          <div style={{ lineHeight: 1.2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              className="at-truncate at-hide-xs"
              style={{ fontSize: 12, color: 'var(--color-text-muted)' }}
            >
              Welcome
            </span>
            <span
              className="at-truncate"
              style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}
            >
              {userProfile?.full_name?.split(' ')[0] || 'Researcher'}
            </span>
          </div>
          <ChevronDown style={{ width: 12, height: 12, color: 'var(--color-text-muted)' }} />
        </div>
      </header>

      <style>{`
        @media (max-width: 1023px) {
          #at-mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          .at-hide-xs { display: none; }
        }
      `}</style>
    </>
  );
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="at-shell">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="at-sidebar-backdrop lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <div
        style={{
          position: 'fixed',
          zIndex: 40,
          height: '100%',
          top: 0,
          left: 0,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        id="at-sidebar-mobile"
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Static sidebar on large screens */}
      <div
        style={{
          flexShrink: 0,
          display: 'none',
        }}
        id="at-sidebar-desktop"
      >
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="at-main">
        <GlobalTopBar
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          sidebarOpen={sidebarOpen}
        />
        <main className="at-content" id="at-main-content">
          <div className="at-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          #at-sidebar-mobile { display: none !important; }
          #at-sidebar-desktop { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default AppLayout;
