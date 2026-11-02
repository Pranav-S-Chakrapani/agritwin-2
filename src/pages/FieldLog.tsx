import React, { useState, useMemo } from 'react';
import {
  History,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Database,
  FileSpreadsheet,
  Cpu,
  Layers,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { SensorProvenance } from '../components/common/SensorProvenance';
import { exportTelemetry } from '../lib/csv-exporter';

// Available sensor parameters
const AVAILABLE_PARAMETERS = [
  { key: 'ALL', label: 'All Parameters' },
  { key: 'air_temperature', label: 'Air Temperature (°C)' },
  { key: 'humidity', label: 'Humidity (%)' },
  { key: 'lux', label: 'Light Intensity (lux)' },
  { key: 'soil_moisture', label: 'Soil Moisture (%)' },
  { key: 'soil_ph', label: 'Soil pH' },
  { key: 'soil_ec', label: 'Soil EC (µS/cm)' },
  { key: 'nitrogen', label: 'Nitrogen (mg/kg)' },
  { key: 'phosphorus', label: 'Phosphorus (mg/kg)' },
  { key: 'potassium', label: 'Potassium (mg/kg)' },
  { key: 'soil_temp', label: 'Soil Temperature (°C)' },
];

export const FieldLog: React.FC = () => {
  const { telemetryObservations, activeSections, activeFarmland, sensorNodes } = useAgriStore();

  const [selectedPlot, setSelectedPlot] = useState<string>('ALL');
  const [selectedNode, setSelectedNode] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedParam, setSelectedParam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Plot-to-Node mapping derived dynamically from plot assignments & fallback structure
  const plotNodeMap = useMemo(() => {
    const map: Record<string, string[]> = {
      'plot_dharwad_02': ['Node_2'],
      'plot_dharwad_03': ['Node_3'],
      'plot_dharwad_04': ['Node_4'],
    };

    activeSections.forEach((plot) => {
      if (!map[plot.id]) {
        if (plot.code === 'PLOT-A02') map[plot.id] = ['Node_2'];
        else if (plot.code === 'PLOT-A03') map[plot.id] = ['Node_3'];
        else if (plot.code === 'PLOT-A04') map[plot.id] = ['Node_4'];
      }
    });

    return map;
  }, [activeSections]);

  // Available nodes for currently selected plot
  const availableNodesForPlot = useMemo(() => {
    if (selectedPlot === 'ALL') {
      return ['Node_2', 'Node_3', 'Node_4'];
    }
    const nodes = plotNodeMap[selectedPlot];
    if (nodes && nodes.length > 0) return nodes;

    const matchedPlot = activeSections.find((p) => p.id === selectedPlot || p.code === selectedPlot);
    if (matchedPlot) {
      if (matchedPlot.code === 'PLOT-A02' || matchedPlot.id === 'plot_dharwad_02') return ['Node_2'];
      if (matchedPlot.code === 'PLOT-A03' || matchedPlot.id === 'plot_dharwad_03') return ['Node_3'];
      if (matchedPlot.code === 'PLOT-A04' || matchedPlot.id === 'plot_dharwad_04') return ['Node_4'];
    }
    return ['Node_2', 'Node_3', 'Node_4'];
  }, [selectedPlot, plotNodeMap, activeSections]);

  // When plot changes, synchronize or reset selectedNode if no longer valid
  const handlePlotChange = (newPlot: string) => {
    setSelectedPlot(newPlot);
    if (newPlot === 'ALL') {
      // Keep selectedNode or reset to ALL
    } else {
      const nodes = plotNodeMap[newPlot] || [];
      if (nodes.length === 1) {
        setSelectedNode(nodes[0]);
      } else if (!nodes.includes(selectedNode)) {
        setSelectedNode('ALL');
      }
    }
  };

  const allObservations = useMemo(() => {
    return [...telemetryObservations].sort(
      (a, b) => new Date(b.measurementTimestamp).getTime() - new Date(a.measurementTimestamp).getTime()
    );
  }, [telemetryObservations]);

  const filteredRecords = useMemo(() => {
    return allObservations.filter(record => {
      // 1. Plot Filter
      if (selectedPlot !== 'ALL') {
        const matchingPlot = activeSections.find(p => p.id === selectedPlot || p.code === selectedPlot);
        const plotIdMatch = record.plotId === selectedPlot || (matchingPlot && (record.plotId === matchingPlot.id || record.plotId === matchingPlot.code));
        
        // Also check if observation's node belongs to this plot
        const plotNodes = plotNodeMap[selectedPlot] || (matchingPlot ? plotNodeMap[matchingPlot.id] : []);
        const nodeMatch = plotNodes && (plotNodes.includes(record.deviceId) || plotNodes.includes(record.sensorId));
        
        if (!plotIdMatch && !nodeMatch) return false;
      }

      // 2. Node Filter
      if (selectedNode !== 'ALL') {
        const devId = (record.deviceId || record.sensorId || '').toLowerCase();
        const targetNode = selectedNode.toLowerCase();
        if (devId !== targetNode && !devId.includes(targetNode)) return false;
      }

      // 3. Data Source Filter
      if (selectedSource !== 'ALL' && record.dataSource !== selectedSource) return false;

      // 4. Parameter Filter
      if (selectedParam !== 'ALL') {
        const pKey = record.parameterKey.toLowerCase();
        const targetKey = selectedParam.toLowerCase();
        const isMatch = pKey === targetKey ||
          (targetKey === 'lux' && (pKey === 'light' || pKey === 'lux' || pKey === 'ambient_light')) ||
          (targetKey === 'air_temperature' && (pKey === 'airtemp' || pKey === 'air_temp' || pKey === 'air_temperature')) ||
          (targetKey === 'soil_moisture' && (pKey === 'soilmoisture' || pKey === 'soil_moisture')) ||
          (targetKey === 'soil_ph' && (pKey === 'soilph' || pKey === 'soil_ph')) ||
          (targetKey === 'soil_ec' && (pKey === 'soilec' || pKey === 'soil_ec')) ||
          (targetKey === 'soil_temp' && (pKey === 'soiltemp' || pKey === 'soil_temp'));

        if (!isMatch) return false;
      }

      // 5. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !record.displayName.toLowerCase().includes(q) &&
          !record.plotId.toLowerCase().includes(q) &&
          !record.parameterKey.toLowerCase().includes(q) &&
          !(record.deviceId || '').toLowerCase().includes(q) &&
          !(record.sensorId || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allObservations, selectedPlot, selectedNode, selectedSource, selectedParam, searchQuery, activeSections, plotNodeMap]);

  const handleExport = (format: 'csv' | 'excel') => {
    const recordsToExport = filteredRecords.length > 0 ? filteredRecords : allObservations;
    exportTelemetry(recordsToExport, {
      format,
      farmId: activeFarmland?.id,
      plotId: selectedPlot !== 'ALL' ? selectedPlot : undefined,
      sensorId: selectedNode !== 'ALL' ? selectedNode : undefined,
    });
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
      <div className="at-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {/* Plot Selector with Hierarchy */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Plot (Node Assignment)</label>
          <select
            value={selectedPlot}
            onChange={e => handlePlotChange(e.target.value)}
            className="at-input at-select"
            style={{ height: 36, fontSize: 13 }}
            aria-label="Filter by plot"
          >
            <option value="ALL">All Plots (Entire Farm)</option>
            {activeSections.map(p => {
              const nodes = plotNodeMap[p.id] || (p.code === 'PLOT-A02' ? ['Node_2'] : p.code === 'PLOT-A03' ? ['Node_3'] : p.code === 'PLOT-A04' ? ['Node_4'] : []);
              const nodeText = nodes.length > 0 ? ` [${nodes.join(', ')}]` : '';
              return (
                <option key={p.id} value={p.id}>
                  {p.code}: {p.name}{nodeText}
                </option>
              );
            })}
          </select>
        </div>

        {/* Node Selector (Scoped to Selected Plot) */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Hardware Node</label>
          <select
            value={selectedNode}
            onChange={e => setSelectedNode(e.target.value)}
            className="at-input at-select"
            style={{ height: 36, fontSize: 13 }}
            aria-label="Filter by hardware node"
          >
            <option value="ALL">All Nodes ({availableNodesForPlot.join(', ') || 'None'})</option>
            {availableNodesForPlot.map(nid => (
              <option key={nid} value={nid}>{nid}</option>
            ))}
          </select>
        </div>

        {/* Data Source Filter */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Data Source</label>
          <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} className="at-input at-select" style={{ height: 36, fontSize: 13 }} aria-label="Filter by data source">
            <option value="ALL">All Sources</option>
            <option value="LIVE_SENSOR">LIVE_SENSOR</option>
            <option value="SIMULATED">SIMULATED</option>
            <option value="MANUAL_PROTOTYPE">MANUAL_PROTOTYPE</option>
            <option value="DERIVED">DERIVED</option>
            <option value="AI">AI</option>
            <option value="IMPORTED">IMPORTED</option>
          </select>
        </div>

        {/* Sensor Parameter Filter */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Sensor Parameter</label>
          <select value={selectedParam} onChange={e => setSelectedParam(e.target.value)} className="at-input at-select" style={{ height: 36, fontSize: 13 }} aria-label="Filter by parameter">
            {AVAILABLE_PARAMETERS.map(param => (
              <option key={param.key} value={param.key}>{param.label}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="at-label" style={{ fontSize: 11, fontWeight: 700 }}>Search</label>
          <div className="at-search">
            <Search className="at-search-icon" style={{ width: 14, height: 14 }} />
            <input className="at-input" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search parameter, plot, node..." style={{ paddingLeft: 32, height: 36, fontSize: 13 }} aria-label="Search telemetry" />
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
