import React, { useState, useMemo } from 'react';
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Filter,
  Download,
  Building2,
  Sprout,
  Clock,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { useAuth } from '../context/AuthContext';
import { FarmAlert, AlertSeverity, AlertStatus } from '../types';
import { exportAlerts } from '../lib/csv-exporter';

function getSeverityBadge(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return { label: 'Critical Alert', bg: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' };
    case 'warning':
      return { label: 'Warning', bg: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
    case 'info':
    default:
      return { label: 'Notice', bg: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' };
  }
}

export const Alerts: React.FC = () => {
  const { alerts, resolveAlert, dismissAlert, farmlands, plots } = useAgriStore();
  const { userProfile } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'dismissed'>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [farmFilter, setFarmFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const criticalCount = alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.status === 'active' && a.severity === 'warning').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      if (farmFilter !== 'all' && alert.farmId !== farmFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!alert.title.toLowerCase().includes(term) && !alert.message.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [alerts, statusFilter, severityFilter, farmFilter, searchTerm]);

  const handleExport = () => {
    exportAlerts(filteredAlerts, { farmId: farmFilter, severity: severityFilter as any }, userProfile?.full_name);
  };
  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              Automated Alert Engine
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight">Farm Alerts &amp; Warnings</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time threshold surveillance for soil moisture deficits, heat stress, low humidity, and abnormal soil pH.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Alerts CSV
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-extrabold uppercase text-slate-400">Active Alerts</div>
          <div className={`text-2xl font-black mt-1 ${activeCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {activeCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Requiring Attention</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-extrabold uppercase text-slate-400">Critical</div>
          <div className={`text-2xl font-black mt-1 ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {criticalCount}
          </div>
          <div className="text-[10px] text-rose-600 font-bold mt-0.5">Immediate Action</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-extrabold uppercase text-slate-400">Warnings</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{warningCount}</div>
          <div className="text-[10px] text-amber-600 font-bold mt-0.5">Threshold Alerts</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-extrabold uppercase text-slate-400">Resolved</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Completed Cycles</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'resolved', label: `Resolved (${resolvedCount})` },
            { id: 'all', label: `All Alerts (${alerts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Notice</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Farm</label>
            <select
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Farms ({farmlands.length})</option>
              {farmlands.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alerts..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            No active alerts matching your current filter. All field parameters are optimal!
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const badge = getSeverityBadge(alert.severity);
            const farm = farmlands.find((f) => f.id === alert.farmId);
            const plot = plots.find((p) => p.id === alert.plotId || p.code === alert.plotId);
            const isResolved = alert.status === 'resolved';
            const cleanTitle = (alert.title || '').replace(/\(undefined\)/gi, '').replace(/\bundefined\b/gi, 'Sensor Node').trim();
            const cleanMessage = (alert.message || '').replace(/\(undefined\)/gi, '').replace(/\bundefined\b/gi, 'Sensor Node').trim();

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-2xs space-y-3 ${
                  isResolved ? 'border-slate-200 opacity-75' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      {isResolved && (
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Resolved
                        </span>
                      )}
                      <h3 className="font-extrabold text-base text-slate-900">{cleanTitle}</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-0.5">{cleanMessage}</p>
                  </div>

                  {/* Actions */}
                  {!isResolved && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => resolveAlert(alert.id, userProfile?.full_name)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Resolved
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Strip */}
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
                  {farm && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building2 className="w-3 h-3 text-emerald-600" /> {farm.name}
                    </span>
                  )}
                  {plot && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Sprout className="w-3 h-3 text-teal-600" /> {plot.name} ({plot.code})
                    </span>
                  )}
                  {alert.value !== undefined && alert.threshold !== undefined && (
                    <span className="text-slate-600">
                      Reading: <strong>{alert.value}</strong> | Threshold: <strong>{alert.threshold}</strong>
                    </span>
                  )}
                  <span className="ml-auto text-slate-400">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                  {alert.resolvedBy && (
                    <span className="text-emerald-700 font-medium">
                      Resolved by: <strong>{alert.resolvedBy}</strong>
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
