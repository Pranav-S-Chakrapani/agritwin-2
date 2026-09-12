import React, { useState, useMemo } from 'react';
import {
  History,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Database,
  FileSpreadsheet,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { SensorProvenance } from '../components/common/SensorProvenance';
import { exportTelemetry } from '../lib/csv-exporter';

export const FieldLog: React.FC = () => {
  const { telemetryObservations, activeSections, activeFarmland } = useAgriStore();

  const [selectedPlot, setSelectedPlot] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedParam, setSelectedParam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allObservations = useMemo(() => {
    return [...telemetryObservations].sort(
      (a, b) => new Date(b.measurementTimestamp).getTime() - new Date(a.measurementTimestamp).getTime()
    );
  }, [telemetryObservations]);

  const filteredRecords = useMemo(() => {
    return allObservations.filter(record => {
      if (selectedPlot !== 'ALL' && record.plotId !== selectedPlot) {
        const matchingPlot = activeSections.find(p => p.id === selectedPlot || p.code === selectedPlot);
        if (record.plotId !== matchingPlot?.id && record.plotId !== matchingPlot?.code) return false;
      }
      if (selectedSource !== 'ALL' && record.dataSource !== selectedSource) return false;
      if (selectedParam !== 'ALL' && record.parameterKey !== selectedParam) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!record.displayName.toLowerCase().includes(q) && !record.plotId.toLowerCase().includes(q) && !record.parameterKey.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allObservations, selectedPlot, selectedSource, selectedParam, searchQuery, activeSections]);

  const handleExport = (format: 'csv' | 'excel') => {
    const recordsToExport = filteredRecords.length > 0 ? filteredRecords : allObservations;
    exportTelemetry(recordsToExport, { format, farmId: activeFarmland?.id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PrototypeModeBanner />

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <History style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
            </div>
            Historical Telemetry
          </h1>
          <p className="at-page-subtitle">
            Authoritative historical ledger of all sensor observations &bull;{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{filteredRecords.length}</strong>
            {' '}of <strong style={{ color: 'var(--color-text-primary)' }}>{allObservations.length}</strong> records
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => handleExport('csv')} className="at-btn at-btn-primary" id="at-export-telemetry-btn">
            <Download style={{ width: 15, height: 15 }} />
            CSV ({filteredRecords.length})
          </button>
          <button onClick={() => handleExport('excel')} className="at-btn at-btn-secondary" id="at-export-telemetry-excel-btn">
            <FileSpreadsheet style={{ width: 15, height: 15 }} />
            Excel
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="at-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <div>
          <label className="at-label" style={{ fontSize: 11 }}>Plot</label>
          <select value={selectedPlot} onChange={e => setSelectedPlot(e.target.value)} className="at-input at-select" style={{ height: 36, fontSize: 13 }} aria-label="Filter by plot">
            <option value="ALL">All Plots</option>
            {activeSections.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="at-label" style={{ fontSize: 11 }}>Data Source</label>
          <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} className="at-input at-select" style={{ height: 36, fontSize: 13 }} aria-label="Filter by data source">
            <option value="ALL">All Sources</option>
            <option value="SIMULATED">SIMULATED</option>
            <option value="MANUAL_PROTOTYPE">MANUAL_PROTOTYPE</option>
            <option value="LIVE_SENSOR">LIVE_SENSOR</option>
            <option value="DERIVED">DERIVED</option>
            <option value="AI">AI</option>
            <option value="IMPORTED">IMPORTED</option>
          </select>
        </div>
        <div>
          <label className="at-label" style={{ fontSize: 11 }}>Parameter</label>
          <select value={selectedParam} onChange={e => setSelectedParam(e.target.value)} className="at-input at-select" style={{ height: 36, fontSize: 13 }} aria-label="Filter by parameter">
            <option value="ALL">All Parameters</option>
            <option value="soil_moisture">Soil Moisture (%)</option>
            <option value="air_temperature">Air Temperature (°C)</option>
            <option value="soil_ph">Soil pH</option>
            <option value="humidity">Humidity (%)</option>
            <option value="light">Solar Radiation (lx)</option>
          </select>
        </div>
        <div>
          <label className="at-label" style={{ fontSize: 11 }}>Search</label>
          <div className="at-search">
            <Search className="at-search-icon" style={{ width: 14, height: 14 }} />
            <input className="at-input" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search parameter, plot..." style={{ paddingLeft: 32, height: 36, fontSize: 13 }} aria-label="Search telemetry" />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="at-table-wrap">
        <table className="at-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Plot / Node</th>
              <th>Parameter</th>
              <th>Value</th>
              <th>Source</th>
              <th>Data Source</th>
              <th style={{ textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Database style={{ width: 28, height: 28, opacity: 0.4 }} />
                    No historical observations match your current filters.
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => {
                const dateObj = new Date(record.measurementTimestamp);
                const formatted = isNaN(dateObj.getTime()) ? record.measurementTimestamp : dateObj.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const plotObj = activeSections.find(p => p.id === record.plotId || p.code === record.plotId);

                return (
                  <tr key={record.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        <Clock style={{ width: 12, height: 12 }} />
                        {formatted}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          background: 'var(--color-primary)',
                          color: 'white', fontSize: 10, fontWeight: 700,
                          padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace',
                        }}>
                          {plotObj?.code || record.plotId}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          ({record.deviceId || 'NODE'})
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{record.displayName}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--color-text-primary)' }}>
                        {record.value}
                      </span>
                      <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>{record.unit}</span>
                    </td>
                    <td><SensorProvenance obs={record} plots={activeSections} farmland={activeFarmland} /></td>
                    <td><DataSourceBadge source={record.dataSource} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="at-badge success" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                        {record.qualityStatus || 'VALID'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FieldLog;
