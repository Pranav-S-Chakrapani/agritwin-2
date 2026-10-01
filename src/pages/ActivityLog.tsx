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
  Filter,
  Radio,
  Sliders,
  Target,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { useAuth } from '../context/AuthContext';
import { FieldActivity, ActivitySeverity, TelemetryObservation } from '../types';
import {
  exportActivityLog,
  exportTelemetry,
  exportAlerts,
  exportWideSensorReadingsCsv,
  WideTelemetryRecord,
} from '../lib/csv-exporter';
import { useAllSensorsStatus } from '../hooks/useSensorStatus';

type TimeFilter = 'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom' | 'moment';

export const ActivityLog: React.FC = () => {
  const { fieldActivities, farmlands, plots, telemetryObservations, alerts, sensorNodes } = useAgriStore();
  const { userProfile } = useAuth();
  const { nodesList } = useAllSensorsStatus();

  const [activeTab, setActiveTab] = useState<'telemetry' | 'activity' | 'alerts'>('telemetry');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  const [plotFilter, setPlotFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Custom Date Range Pickers
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Specific Moment Lookup (e.g. "Yesterday at 07:00 AM")
  const [momentDate, setMomentDate] = useState<string>(() => {
    const yesterday = new Date(Date.now() - 86400000);
    return yesterday.toISOString().split('T')[0];
  });
  const [momentTime, setMomentTime] = useState<string>('07:00');

  // Convert telemetryObservations into wide per-reading records
  const allWideTelemetryRecords: WideTelemetryRecord[] = useMemo(() => {
    // Group observations by timestamp + deviceId
    const groups = new Map<string, {
      timestampIso: string;
      nodeId: string;
      plotId: string;
      metadata?: any;
      values: Record<string, number>;
    }>();

    (telemetryObservations || []).forEach((obs) => {
      const ts = obs.measurementTimestamp;
      const nodeId = obs.sensorId || obs.deviceId || 'Node_1';
      const key = `${nodeId}_${ts}`;

      if (!groups.has(key)) {
        groups.set(key, {
          timestampIso: ts,
          nodeId,
          plotId: obs.plotId,
          metadata: obs.metadata,
          values: {},
        });
      }

      const grp = groups.get(key)!;
      grp.values[obs.parameterKey] = obs.value;
      if (obs.metadata && Object.keys(obs.metadata).length > 0) {
        grp.metadata = obs.metadata;
      }
    });

    // If live observations in current session are empty/sparse, synthesize from active sensor nodes
    if (groups.size === 0 && Object.keys(sensorNodes || {}).length > 0) {
      Object.values(sensorNodes).forEach((sn) => {
        const ts = sn.lastUpdated || new Date().toISOString();
        const key = `${sn.id}_${ts}`;
        groups.set(key, {
          timestampIso: ts,
          nodeId: sn.id,
          plotId: sn.raw?.plot_id || 'plot_dharwad_01',
          metadata: {
            statusMode: sn.statusMode || (sn.isCalibrating ? 'CALIBRATING' : (sn.isOnline ? 'LIVE' : 'OFFLINE')),
          },
          values: {
            soil_moisture: sn.soilMoisture ?? 0,
            air_temperature: sn.airTemp ?? 0,
            humidity: sn.humidity ?? 0,
            soil_ph: sn.soilPH ?? 0,
            lux: sn.lux ?? 0,
            soil_ec: sn.soilEC ?? 0,
            nitrogen: sn.nitrogen ?? 0,
            phosphorus: sn.phosphorus ?? 0,
            potassium: sn.potassium ?? 0,
            soil_temp: sn.soilTemp ?? 0,
          },
        });
      });
    }

    const records: WideTelemetryRecord[] = Array.from(groups.values()).map((g) => {
      const plot = plots.find((p) => p.id === g.plotId);
      const meta = g.metadata || {};

      return {
        timestampIso: g.timestampIso,
        timestampLocal: new Date(g.timestampIso).toLocaleString(),
        nodeId: g.nodeId,
        plotId: g.plotId,
        plotName: plot?.name || g.plotId,
        statusMode: meta.statusMode || 'LIVE',
        airTemp: g.values.air_temperature ?? meta.airTemp,
        humidity: g.values.humidity ?? meta.humidity,
        lux: g.values.lux ?? meta.lux,
        soilMoisture: g.values.soil_moisture ?? meta.soilMoisture,
        soilPH: g.values.soil_ph ?? meta.soilPH,
        soilEC: g.values.soil_ec ?? meta.soilEC,
        nitrogen: g.values.nitrogen ?? meta.nitrogen,
        phosphorus: g.values.phosphorus ?? meta.phosphorus,
        potassium: g.values.potassium ?? meta.potassium,
        soilTemp: g.values.soil_temp ?? meta.soilTemp,
      };
    });

    // Sort most recent first
    return records.sort((a, b) => new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime());
  }, [telemetryObservations, sensorNodes, plots]);

  // Target epoch for moment search
  const targetMomentEpoch = useMemo(() => {
    if (!momentDate || !momentTime) return null;
    const d = new Date(`${momentDate}T${momentTime}:00`);
    return isNaN(d.getTime()) ? null : d.getTime();
  }, [momentDate, momentTime]);

  // Closest match finding
  const closestMomentMatches = useMemo(() => {
    if (!targetMomentEpoch || allWideTelemetryRecords.length === 0) return [];

    const nodes = ['Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7'];
    const results: Array<{ record: WideTelemetryRecord; diffSec: number }> = [];

    nodes.forEach((nid) => {
      if (nodeFilter !== 'all' && nodeFilter !== nid) return;
      const nodeRecords = allWideTelemetryRecords.filter((r) => r.nodeId === nid);
      if (nodeRecords.length === 0) return;

      let closest = nodeRecords[0];
      let minDiff = Math.abs(new Date(closest.timestampIso).getTime() - targetMomentEpoch);

      for (const r of nodeRecords) {
        const diff = Math.abs(new Date(r.timestampIso).getTime() - targetMomentEpoch);
        if (diff < minDiff) {
          minDiff = diff;
          closest = r;
        }
      }

      results.push({
        record: closest,
        diffSec: Math.round(minDiff / 1000),
      });
    });

    return results;
  }, [targetMomentEpoch, allWideTelemetryRecords, nodeFilter]);

  // Filtered Telemetry Records
  const filteredTelemetry = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 7 * 86400000;
    const startOf30Days = startOfToday - 30 * 86400000;

    if (timeFilter === 'moment') {
      return closestMomentMatches.map((m) => m.record);
    }

    return allWideTelemetryRecords.filter((r) => {
      const t = new Date(r.timestampIso).getTime();

      if (timeFilter === 'today' && t < startOfToday) return false;
      if (timeFilter === 'yesterday' && (t < startOfYesterday || t >= startOfToday)) return false;
      if (timeFilter === '7days' && t < startOf7Days) return false;
      if (timeFilter === '30days' && t < startOf30Days) return false;
      if (timeFilter === 'custom') {
        if (customFrom && t < new Date(customFrom).getTime()) return false;
        if (customTo && t > new Date(customTo + (customTo.includes('T') ? '' : 'T23:59:59')).getTime()) return false;
      }

      if (nodeFilter !== 'all' && r.nodeId !== nodeFilter) return false;
      if (plotFilter !== 'all' && r.plotId !== plotFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (
          !r.nodeId.toLowerCase().includes(term) &&
          !(r.plotName || '').toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    allWideTelemetryRecords,
    timeFilter,
    nodeFilter,
    plotFilter,
    searchTerm,
    customFrom,
    customTo,
    closestMomentMatches,
  ]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return fieldActivities.filter((act) => {
      if (plotFilter !== 'all' && act.plotId !== plotFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (
          !act.title.toLowerCase().includes(term) &&
          !act.description.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [fieldActivities, plotFilter, searchTerm]);

  // CSV Export Handler
  const handleExportCsv = () => {
    if (activeTab === 'telemetry') {
      const suffix = nodeFilter !== 'all' ? `_${nodeFilter}` : '_all_nodes';
      exportWideSensorReadingsCsv(
        filteredTelemetry,
        `agritwin_telemetry_history${suffix}`,
        userProfile?.full_name
      );
    } else if (activeTab === 'activity') {
      exportActivityLog(filteredActivities, { plotId: plotFilter }, userProfile?.full_name);
    } else {
      exportAlerts(alerts, {}, userProfile?.full_name);
    }
  };

  const TIME_TABS: { id: TimeFilter; label: string }[] = [
    { id: 'all', label: 'All History' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'moment', label: '🎯 Specific Moment Lookup' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#dcfce7', color: '#15803d' }}>
              PERSISTENT REPOSITORY
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Target Table: <code>public.telemetry_observations</code> (Supabase)
            </span>
          </div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ClipboardList style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
            </div>
            Historical Telemetry & Activity Reports
          </h1>
          <p className="at-page-subtitle">
            Query past readings down to the second, look up closest matching historical timestamps, and export filtered datasets to CSV.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleExportCsv}
            className="at-btn at-btn-primary"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#16a34a',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <Download style={{ width: 14, height: 14 }} />
            Download Filtered CSV ({filteredTelemetry.length} Rows)
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: 8 }}>
        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'telemetry' ? '2px solid #16a34a' : 'none',
            color: activeTab === 'telemetry' ? '#16a34a' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Cpu style={{ width: 16, height: 16 }} />
          Sensor Readings History (7 Nodes)
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'activity' ? '2px solid #16a34a' : 'none',
            color: activeTab === 'activity' ? '#16a34a' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ClipboardList style={{ width: 16, height: 16 }} />
          Farm Activity Log
        </button>
      </div>

      {/* ── Filter Controls Card ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        
        {/* Time Preset Buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TIME_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: 12,
                fontWeight: 700,
                border: timeFilter === tab.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: timeFilter === tab.id ? '#0f172a' : '#ffffff',
                color: timeFilter === tab.id ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Moment Lookup Sub-Bar (When Moment Tab is Selected) */}
        {timeFilter === 'moment' && (
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0f172a', fontWeight: 700, fontSize: 13 }}>
              <Target style={{ width: 16, height: 16, color: '#16a34a' }} />
              Jump to Exact Moment:
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Date:</span>
              <input
                type="date"
                value={momentDate}
                onChange={(e) => setMomentDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Time:</span>
              <input
                type="time"
                value={momentTime}
                onChange={(e) => setMomentTime(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff' }}
              />
            </div>

            <button
              onClick={() => {
                const yesterday = new Date(Date.now() - 86400000);
                setMomentDate(yesterday.toISOString().split('T')[0]);
                setMomentTime('07:00');
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Preset: Yesterday 7:00 AM
            </button>
          </div>
        )}

        {/* Custom Date Range Inputs */}
        {timeFilter === 'custom' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>From:</span>
              <input
                type="datetime-local"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>To:</span>
              <input
                type="datetime-local"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff' }}
              />
            </div>
          </div>
        )}

        {/* Node & Plot Dropdown Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          {/* Node Filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Filter by Sensor Node
            </label>
            <select
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff' }}
            >
              <option value="all">All 7 Hardware Nodes (Node_1 – Node_7)</option>
              {['Node_1', 'Node_2', 'Node_3', 'Node_4', 'Node_5', 'Node_6', 'Node_7'].map((nid) => (
                <option key={nid} value={nid}>{nid}</option>
              ))}
            </select>
          </div>

          {/* Plot Filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Filter by Farmland Plot
            </label>
            <select
              value={plotFilter}
              onChange={(e) => setPlotFilter(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff' }}
            >
              <option value="all">All Farmland Plots</option>
              {plots.map((p) => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>
          </div>

          {/* Search Term */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
              Search Text
            </label>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search node, plot, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: 30, paddingRight: 10, height: 33, borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: 12, background: '#ffffff' }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── Moment Match Callout Banner ── */}
      {timeFilter === 'moment' && closestMomentMatches.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 800, fontSize: 13 }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            Closest Telemetry Readings to {momentDate} {momentTime}:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {closestMomentMatches.map((m) => (
              <span
                key={m.record.nodeId}
                style={{
                  fontSize: 12,
                  background: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                }}
              >
                <strong>{m.record.nodeId}:</strong> {new Date(m.record.timestampIso).toLocaleTimeString()} (Δ {m.diffSec}s)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Telemetry Table View (All 10 Fields) ── */}
      {activeTab === 'telemetry' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Logged Sensor Telemetry Records ({filteredTelemetry.length})
            </h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Showing full 10-parameter breakdown per snapshot
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px' }}>Timestamp</th>
                  <th style={{ padding: '12px 14px' }}>Node ID</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Moisture</th>
                  <th style={{ padding: '12px 14px' }}>Air Temp</th>
                  <th style={{ padding: '12px 14px' }}>Humidity</th>
                  <th style={{ padding: '12px 14px' }}>Soil pH</th>
                  <th style={{ padding: '12px 14px' }}>Light</th>
                  <th style={{ padding: '12px 14px' }}>Soil EC</th>
                  <th style={{ padding: '12px 14px' }}>NPK (N-P-K)</th>
                  <th style={{ padding: '12px 14px' }}>Soil Temp</th>
                </tr>
              </thead>
              <tbody>
                {filteredTelemetry.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                      No telemetry records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTelemetry.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Timestamp */}
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#334155' }}>
                        <div>{new Date(r.timestampIso).toLocaleDateString()}</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(r.timestampIso).toLocaleTimeString()}</div>
                      </td>

                      {/* Node ID */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.nodeId}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{r.plotName}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            background: r.statusMode === 'CALIBRATING' ? '#ffedd5' : '#dcfce7',
                            color: r.statusMode === 'CALIBRATING' ? '#c2410c' : '#15803d',
                          }}
                        >
                          {r.statusMode}
                        </span>
                      </td>

                      {/* Moisture */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0284c7' }}>
                        {r.soilMoisture !== undefined ? `${r.soilMoisture}%` : '--'}
                      </td>

                      {/* Air Temp */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ea580c' }}>
                        {r.airTemp !== undefined ? `${r.airTemp}°C` : '--'}
                      </td>

                      {/* Humidity */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#8b5cf6' }}>
                        {r.humidity !== undefined ? `${r.humidity}%` : '--'}
                      </td>

                      {/* Soil pH */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#16a34a' }}>
                        {r.soilPH !== undefined ? r.soilPH : '--'}
                      </td>

                      {/* Light */}
                      <td style={{ padding: '12px 14px', color: '#ca8a04' }}>
                        {r.lux !== undefined ? `${Math.round(r.lux)} lx` : '--'}
                      </td>

                      {/* Soil EC */}
                      <td style={{ padding: '12px 14px', color: '#f59e0b' }}>
                        {r.soilEC !== undefined ? `${r.soilEC} µS/cm` : '--'}
                      </td>

                      {/* NPK */}
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        {r.nitrogen !== undefined ? `${r.nitrogen}-${r.phosphorus}-${r.potassium}` : '--'}
                      </td>

                      {/* Soil Temp */}
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {r.soilTemp !== undefined ? `${r.soilTemp}°C` : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Activity View ── */}
      {activeTab === 'activity' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Operational Field Activities ({filteredActivities.length})
            </h3>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 13, color: '#0f172a' }}>{act.title}</strong>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: '4px', background: '#e2e8f0', color: '#475569' }}>
                      {act.eventType}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>{act.description}</p>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {new Date(act.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ActivityLog;
