import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Calendar,
  Download,
  Search,
  Building2,
  Sprout,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  FileSpreadsheet,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { useAuth } from '../context/AuthContext';
import { FieldActivity, ActivitySeverity, ActivityEventType } from '../types';
import { exportActivityLog, exportTelemetry, exportAlerts } from '../lib/csv-exporter';

type TimeFilter = 'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom';

function getSeverityInfo(severity: ActivitySeverity) {
  switch (severity) {
    case 'critical': return { label: 'Critical', cls: 'danger' };
    case 'warning':  return { label: 'Warning',  cls: 'warning' };
    case 'success':  return { label: 'Success',  cls: 'success' };
    default:         return { label: 'Info',     cls: 'info' };
  }
}

function getSeverityDot(severity: ActivitySeverity) {
  switch (severity) {
    case 'critical': return 'var(--color-danger)';
    case 'warning':  return 'var(--color-warning)';
    case 'success':  return 'var(--color-success)';
    default:         return 'var(--color-info)';
  }
}

export const ActivityLog: React.FC = () => {
  const { fieldActivities, farmlands, plots, sensors, telemetryObservations, alerts } = useAgriStore();
  const { userProfile } = useAuth();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [farmFilter, setFarmFilter] = useState<string>('all');
  const [plotFilter, setPlotFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [exportType, setExportType] = useState<'activity' | 'telemetry' | 'alerts'>('activity');

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 7 * 86400000;
    const startOf30Days = startOfToday - 30 * 86400000;

    return fieldActivities.filter((act) => {
      const actTime = new Date(act.timestamp).getTime();
      if (timeFilter === 'today' && actTime < startOfToday) return false;
      if (timeFilter === 'yesterday' && (actTime < startOfYesterday || actTime >= startOfToday)) return false;
      if (timeFilter === '7days' && actTime < startOf7Days) return false;
      if (timeFilter === '30days' && actTime < startOf30Days) return false;
      if (timeFilter === 'custom') {
        if (customFrom && actTime < new Date(customFrom).getTime()) return false;
        if (customTo && actTime > new Date(customTo + 'T23:59:59').getTime()) return false;
      }
      if (farmFilter !== 'all' && act.farmId !== farmFilter) return false;
      if (plotFilter !== 'all' && act.plotId !== plotFilter) return false;
      if (severityFilter !== 'all' && act.severity !== severityFilter) return false;
      if (typeFilter !== 'all' && act.eventType !== typeFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!act.title.toLowerCase().includes(term) && !act.description.toLowerCase().includes(term) && !(act.createdBy || '').toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [fieldActivities, timeFilter, farmFilter, plotFilter, severityFilter, typeFilter, searchTerm, customFrom, customTo]);

  const handleExport = (format: 'csv' | 'excel') => {
    const filter = { farmId: farmFilter, plotId: plotFilter, severity: severityFilter as any, eventType: typeFilter as any, dateFrom: customFrom || undefined, dateTo: customTo || undefined, format };
    if (exportType === 'activity') exportActivityLog(filteredActivities, filter, userProfile?.full_name);
    else if (exportType === 'telemetry') exportTelemetry(telemetryObservations, filter, userProfile?.full_name);
    else exportAlerts(alerts, filter, userProfile?.full_name);
  };

  const TIME_TABS: { id: TimeFilter; label: string }[] = [
    { id: 'all', label: 'All History' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ClipboardList style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
            </div>
            Farm Operations Timeline
          </h1>
          <p className="at-page-subtitle">
            Complete audit trail — sensor readings, telemetry, actuator cycles, alerts, and field operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={exportType}
            onChange={e => setExportType(e.target.value as any)}
            className="at-input at-select"
            style={{ height: 36, fontSize: 12, width: 'auto', minWidth: 120 }}
            aria-label="Select export type"
          >
            <option value="activity">Activity Log</option>
            <option value="telemetry">Telemetry</option>
            <option value="alerts">Alerts</option>
          </select>
          <button onClick={() => handleExport('csv')} className="at-btn at-btn-primary" id="at-export-activity-btn">
            <Download style={{ width: 14, height: 14 }} />
            CSV ({filteredActivities.length})
          </button>
          <button onClick={() => handleExport('excel')} className="at-btn at-btn-secondary" id="at-export-excel-btn">
            <FileSpreadsheet style={{ width: 14, height: 14 }} />
            Excel
          </button>
        </div>
      </div>

      {/* ── Filter Card ── */}
      <div className="at-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Time filter tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
          {TIME_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`at-filter-btn${timeFilter === tab.id ? ' active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {timeFilter === 'custom' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            background: 'var(--color-surface-muted)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            flexWrap: 'wrap',
          }}>
            <Calendar style={{ width: 15, height: 15, color: 'var(--color-primary)', flexShrink: 0 }} />
            <label className="at-label" style={{ marginBottom: 0, fontSize: 12 }}>From:</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="at-input" style={{ height: 34, fontSize: 12, width: 'auto' }} aria-label="From date" />
            <label className="at-label" style={{ marginBottom: 0, fontSize: 12 }}>To:</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="at-input" style={{ height: 34, fontSize: 12, width: 'auto' }} aria-label="To date" />
          </div>
        )}

        {/* Dropdown filters */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-muted)',
        }}>
          <div>
            <label className="at-label" style={{ fontSize: 11 }}>Farm</label>
            <select value={farmFilter} onChange={e => setFarmFilter(e.target.value)} className="at-input at-select" style={{ height: 36, fontSize: 13 }} aria-label="Filter by farm">
              <option value="all">All Farms</option>
              {farmlands.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="at-label" style={{ fontSize: 11 }}>Severity</label>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="at-input at-select" style={{ height: 36, fontSize: 13 }} aria-label="Filter by severity">
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="success">Success</option>
            </select>
          </div>
          <div>
            <label className="at-label" style={{ fontSize: 11 }}>Event Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="at-input at-select" style={{ height: 36, fontSize: 13 }} aria-label="Filter by event type">
              <option value="all">All Events</option>
              <option value="telemetry_update">Sensor Data</option>
              <option value="irrigation_triggered">Irrigation</option>
              <option value="hvac_triggered">Fan / HVAC</option>
              <option value="alert_generated">Alerts</option>
              <option value="farm_created">Farm Added</option>
              <option value="plot_created">Plot Added</option>
              <option value="user_login">User Login</option>
              <option value="csv_export">CSV Export</option>
            </select>
          </div>
          <div>
            <label className="at-label" style={{ fontSize: 11 }}>Search</label>
            <div className="at-search">
              <Search className="at-search-icon" style={{ width: 14, height: 14 }} />
              <input className="at-input" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search activity..." style={{ paddingLeft: 32, height: 36, fontSize: 13 }} aria-label="Search activities" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="at-card">
        <div className="at-card-header">
          <div className="at-card-title">
            <Clock style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
            Field Events
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}>
              ({filteredActivities.length})
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Chronological</span>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="at-empty" style={{ paddingTop: 32, paddingBottom: 32 }}>
            <div className="at-empty-icon">
              <ClipboardList style={{ width: 24, height: 24 }} />
            </div>
            <div className="at-empty-title">No activities found</div>
            <div className="at-empty-text">No activity records match your current filter settings.</div>
          </div>
        ) : (
          <div style={{
            position: 'relative', paddingLeft: 28,
            borderLeft: '2px solid var(--color-primary-border)',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {filteredActivities.map(act => {
              const sev = getSeverityInfo(act.severity);
              const dotColor = getSeverityDot(act.severity);
              const farm = farmlands.find(f => f.id === act.farmId);
              const plot = plots.find(p => p.id === act.plotId || p.code === act.plotId);

              return (
                <div key={act.id} style={{ position: 'relative' }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: -37,
                    top: 14,
                    width: 12, height: 12,
                    borderRadius: '50%',
                    background: dotColor,
                    border: '2px solid var(--color-surface)',
                    boxShadow: `0 0 0 3px ${dotColor}25`,
                  }} />

                  <div style={{
                    background: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '14px 16px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-muted)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`at-badge ${sev.cls}`}>{sev.label}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>{act.title}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0, fontWeight: 500 }}>
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{act.description}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-muted)', paddingTop: 8, flexWrap: 'wrap' }}>
                      {farm && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          <Building2 style={{ width: 11, height: 11, color: 'var(--color-primary)' }} />
                          {farm.name}
                        </span>
                      )}
                      {plot && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          <Sprout style={{ width: 11, height: 11, color: 'var(--color-secondary)' }} />
                          {plot.name} ({plot.code})
                        </span>
                      )}
                      {act.sensorId && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>
                          <Cpu style={{ width: 11, height: 11 }} />
                          {act.sensorId}
                        </span>
                      )}
                      {act.createdBy && (
                        <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}>
                          By: <strong style={{ color: 'var(--color-text-secondary)' }}>{act.createdBy}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
