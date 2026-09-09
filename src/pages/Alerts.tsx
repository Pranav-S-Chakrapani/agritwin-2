import React, { useState, useMemo } from 'react';
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Download,
  Building2,
  Sprout,
  Clock,
  Check,
  X,
  Search,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { useAuth } from '../context/AuthContext';
import { FarmAlert, AlertSeverity, AlertStatus } from '../types';
import { exportAlerts } from '../lib/csv-exporter';

function getSeverityInfo(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return { label: 'Critical', cls: 'danger', icon: <ShieldAlert style={{ width: 14, height: 14 }} /> };
    case 'warning':
      return { label: 'Warning', cls: 'warning', icon: <AlertTriangle style={{ width: 14, height: 14 }} /> };
    default:
      return { label: 'Notice', cls: 'info', icon: <Info style={{ width: 14, height: 14 }} /> };
  }
}

export const Alerts: React.FC = () => {
  const { alerts, resolveAlert, dismissAlert, farmlands, plots } = useAgriStore();
  const { userProfile } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'dismissed'>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [farmFilter, setFarmFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activeCount    = alerts.filter((a) => a.status === 'active').length;
  const criticalCount  = alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;
  const warningCount   = alerts.filter((a) => a.status === 'active' && a.severity === 'warning').length;
  const resolvedCount  = alerts.filter((a) => a.status === 'resolved').length;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      if (farmFilter !== 'all' && alert.farmId !== farmFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!alert.title.toLowerCase().includes(term) && !alert.message.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [alerts, statusFilter, severityFilter, farmFilter, searchTerm]);

  const handleExport = () => {
    exportAlerts(filteredAlerts, { farmId: farmFilter, severity: severityFilter as any }, userProfile?.full_name);
  };

  const STATUS_TABS = [
    { id: 'active',   label: `Active`,   count: activeCount },
    { id: 'resolved', label: `Resolved`, count: resolvedCount },
    { id: 'all',      label: `All`,      count: alerts.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell style={{ width: 22, height: 22, color: activeCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }} />
            Alerts & Warnings
          </h1>
          <p className="at-page-subtitle">
            Real-time threshold surveillance — soil moisture, heat stress, humidity, and soil pH anomalies.
          </p>
        </div>
        <button onClick={handleExport} className="at-btn at-btn-secondary" id="at-export-alerts-btn">
          <Download style={{ width: 15, height: 15 }} />
          Export CSV
        </button>
      </div>

      {/* ── KPI Metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { label: 'Active Alerts', value: activeCount, cls: activeCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)', sub: 'Requiring attention' },
          { label: 'Critical', value: criticalCount, cls: criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)', sub: 'Immediate action' },
          { label: 'Warnings', value: warningCount, cls: warningCount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)', sub: 'Threshold exceeded' },
          { label: 'Resolved', value: resolvedCount, cls: 'var(--color-success)', sub: 'Completed cycles' },
        ].map((m) => (
          <div key={m.label} className="at-metric-card">
            <div className="at-metric-label">{m.label}</div>
            <div className="at-metric-value" style={{ color: m.cls, fontSize: 28 }}>{m.value}</div>
            <div className="at-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="at-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`at-filter-btn${statusFilter === tab.id ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {tab.label}
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: statusFilter === tab.id ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: statusFilter === tab.id ? 'white' : 'var(--color-text-muted)',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-muted)' }}>
          <div>
            <label className="at-label" style={{ fontSize: 11 }}>Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="at-input at-select"
              style={{ height: 36, fontSize: 13 }}
              aria-label="Filter by severity"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Notice</option>
            </select>
          </div>

          <div>
            <label className="at-label" style={{ fontSize: 11 }}>Farm</label>
            <select
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
              className="at-input at-select"
              style={{ height: 36, fontSize: 13 }}
              aria-label="Filter by farm"
            >
              <option value="all">All Farms ({farmlands.length})</option>
              {farmlands.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="at-label" style={{ fontSize: 11 }}>Search</label>
            <div className="at-search">
              <Search className="at-search-icon" style={{ width: 14, height: 14 }} />
              <input
                className="at-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alerts..."
                style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
                aria-label="Search alerts"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Results count ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredAlerts.length}</strong> alert{filteredAlerts.length !== 1 ? 's' : ''}
        </span>
        {criticalCount > 0 && (
          <span className="at-badge danger">
            <span className="at-badge-dot" style={{ animation: 'at-pulse 1.5s infinite' }} />
            {criticalCount} critical — immediate action required
          </span>
        )}
      </div>

      {/* ── Alert Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredAlerts.length === 0 ? (
          <div className="at-card">
            <div className="at-empty">
              <div className="at-empty-icon">
                <CheckCircle2 style={{ width: 28, height: 28, color: 'var(--color-success)' }} />
              </div>
              <div className="at-empty-title">All clear</div>
              <div className="at-empty-text">
                No alerts matching your current filter. All field parameters are within optimal ranges.
              </div>
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const sev = getSeverityInfo(alert.severity);
            const farm = farmlands.find((f) => f.id === alert.farmId);
            const plot = plots.find((p) => p.id === alert.plotId || p.code === alert.plotId);
            const isResolved = alert.status === 'resolved';
            const cleanTitle = (alert.title || '').replace(/\(undefined\)/gi, '').replace(/\bundefined\b/gi, 'Sensor Node').trim();
            const cleanMessage = (alert.message || '').replace(/\(undefined\)/gi, '').replace(/\bundefined\b/gi, 'Sensor Node').trim();

            const leftBorderColor = alert.severity === 'critical'
              ? 'var(--color-danger)'
              : alert.severity === 'warning'
              ? 'var(--color-warning)'
              : 'var(--color-info)';

            return (
              <div
                key={alert.id}
                className="at-card"
                style={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${leftBorderColor}`,
                  opacity: isResolved ? 0.7 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className={`at-badge ${sev.cls}`} style={{ gap: 4 }}>
                        {sev.icon}
                        {sev.label}
                      </span>
                      {isResolved && (
                        <span className="at-badge success">
                          <span className="at-badge-dot" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                      {cleanTitle}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {cleanMessage}
                    </p>
                  </div>

                  {/* Actions */}
                  {!isResolved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => resolveAlert(alert.id, userProfile?.full_name)}
                        className="at-btn at-btn-primary at-btn-sm"
                        id={`at-resolve-${alert.id}`}
                        style={{ gap: 5 }}
                      >
                        <Check style={{ width: 13, height: 13 }} />
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="at-btn-icon"
                        title="Dismiss alert"
                        aria-label="Dismiss"
                        style={{ width: 30, height: 30 }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer metadata */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  borderTop: '1px solid var(--color-border-muted)',
                  paddingTop: 10,
                  flexWrap: 'wrap',
                }}>
                  {farm && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      <Building2 style={{ width: 12, height: 12, color: 'var(--color-primary)' }} />
                      {farm.name}
                    </span>
                  )}
                  {plot && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      <Sprout style={{ width: 12, height: 12, color: 'var(--color-secondary)' }} />
                      {plot.name} ({plot.code})
                    </span>
                  )}
                  {alert.value !== undefined && alert.threshold !== undefined && (
                    <span>
                      Reading: <strong style={{ color: 'var(--color-text-primary)' }}>{alert.value}</strong>
                      {' '}| Threshold: <strong style={{ color: 'var(--color-text-primary)' }}>{alert.threshold}</strong>
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                  {alert.resolvedBy && (
                    <span style={{ color: 'var(--color-success-text)', fontWeight: 600 }}>
                      Resolved by: {alert.resolvedBy}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Alerts;
