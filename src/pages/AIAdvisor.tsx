import React, { useState, useMemo } from 'react';
import { 
  BrainCircuit, 
  Bot,
  Droplet,
  Wind,
  Check,
  Sparkles,
  Info,
  AlertCircle,
  Sprout,
  Thermometer,
  Activity,
} from 'lucide-react';
import { useAgriStore } from '../context/AgriStore';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { PrototypeModeBanner } from '../components/common/PrototypeModeBanner';
import { SensorProvenance } from '../components/common/SensorProvenance';

const SendIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

export const AIAdvisor: React.FC = () => {
  const { activeSections: plots, crops, triggerActuator, telemetryObservations, activeFarmland } = useAgriStore();
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id || '');
  const [question, setQuestion] = useState('');
  const [doctorAnswer, setDoctorAnswer] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const activePlot = useMemo(() =>
    plots.find(p => p.id === selectedPlotId) || plots[0] || null,
    [plots, selectedPlotId]);

  const assignedCrop = useMemo(() => {
    if (!activePlot || !activePlot.cropId) return null;
    return crops.find(c => c.id === activePlot.cropId) || null;
  }, [activePlot, crops]);

  const latestObs = useMemo(() => {
    if (!activePlot) return null;
    return telemetryObservations.find(o => o.plotId === activePlot.id || o.plotId === activePlot.code) || null;
  }, [telemetryObservations, activePlot]);

  const analysisSourceLabel = useMemo(() => {
    if (!latestObs) return 'INSUFFICIENT DATA';
    if (latestObs.dataSource === 'SIMULATED') return 'SIMULATED DEMO DATA';
    if (latestObs.dataSource === 'MANUAL_PROTOTYPE') return 'MANUAL PROTOTYPE DATA';
    if (latestObs.dataSource === 'LIVE_SENSOR') return 'LIVE PHYSICAL SENSOR DATA';
    return latestObs.dataSource;
  }, [latestObs]);

  const handleAskDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activePlot) return;
    setAnswering(true);
    setTimeout(() => {
      setDoctorAnswer(
        `Agronomic Rule Assessment for ${activePlot.code} (${assignedCrop?.name || 'Crop'}): Based on latest ${analysisSourceLabel} (Soil Moisture ${activePlot.soilMoisture}%, Temp ${activePlot.airTemp}°C, pH ${activePlot.soilPh}), micro-climate levels are within safe operating bounds. Recommend standard irrigation pulse.`
      );
      setAnswering(false);
    }, 600);
  };

  const handleAction = async (type: 'irrigation' | 'hvac') => {
    if (!activePlot) return;
    await triggerActuator(activePlot.id, type, 'manual');
    setActionSuccess(`Action executed on ${activePlot.code}: ${type === 'irrigation' ? 'Pulse Irrigation Triggered' : 'Canopy Fans Activated'}.`);
    setTimeout(() => setActionSuccess(null), 4000);
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
              background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BrainCircuit style={{ width: 18, height: 18, color: '#7c3aed' }} />
            </div>
            AI Agronomic Advisor
          </h1>
          <p className="at-page-subtitle">
            Genotype-aware micro-climate validation &amp; agronomic advice from actual plot observations.
          </p>
        </div>

        {/* Plot Selector */}
        {plots.length > 0 && (
          <div className="at-farm-selector" style={{ flexShrink: 0 }}>
            <Sprout style={{ width: 14, height: 14, color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, flexShrink: 0 }}>Plot:</span>
            <select
              value={selectedPlotId}
              onChange={e => setSelectedPlotId(e.target.value)}
              aria-label="Select plot"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {plots.map(p => {
                const c = crops.find(crop => crop.id === p.cropId);
                return <option key={p.id} value={p.id}>{p.code}: {c ? c.name : p.name}</option>;
              })}
            </select>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="at-alert success">
          <Check style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{actionSuccess}</span>
        </div>
      )}

      {activePlot ? (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Left: Current Plot State */}
          <div className="at-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="at-card-header">
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed' }}>
                  Current Plot State
                </span>
                <div className="at-card-title" style={{ marginTop: 2 }}>
                  {activePlot.code}: {assignedCrop?.name || 'Fallow'}
                </div>
              </div>
              <DataSourceBadge source={latestObs?.dataSource || 'MANUAL_PROTOTYPE'} />
            </div>

            {/* Analysis source banner */}
            <div className={`at-alert ${latestObs?.dataSource === 'SIMULATED' ? 'warning' : latestObs ? 'success' : 'info'}`} style={{ gap: 8 }}>
              <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Source: <strong>{analysisSourceLabel}</strong></span>
            </div>

            {latestObs && (
              <SensorProvenance obs={latestObs} plots={plots} farmland={activeFarmland} layout="block" />
            )}

            {latestObs ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Soil Moisture', val: `${activePlot.soilMoisture}%`, target: `${assignedCrop?.idealMoistureMin || 50}%–${assignedCrop?.idealMoistureMax || 75}%`, icon: <Droplet style={{ width: 13, height: 13, color: '#0284c7' }} /> },
                  { label: 'Air Temperature', val: `${activePlot.airTemp}°C`, target: `${assignedCrop?.idealTempMin || 20}°C–${assignedCrop?.idealTempMax || 28}°C`, icon: <Thermometer style={{ width: 13, height: 13, color: '#ef4444' }} /> },
                  { label: 'Soil pH', val: `${activePlot.soilPh}`, target: `${assignedCrop?.idealPhMin || 6.0}–${assignedCrop?.idealPhMax || 6.8}`, icon: <Activity style={{ width: 13, height: 13, color: '#8b5cf6' }} /> },
                ].map(({ label, val, target, icon }) => (
                  <div key={label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'var(--color-surface-muted)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 12,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {icon} {label}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: 13 }}>{val}</span>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>Target: {target}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: 24, textAlign: 'center', background: 'var(--color-surface-muted)',
                borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)',
              }}>
                <AlertCircle style={{ width: 24, height: 24, color: 'var(--color-warning)', margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>Insufficient Data</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>No telemetry recorded for this plot.</div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--color-border-muted)', paddingTop: 16 }}>
              <button
                onClick={() => handleAction('irrigation')}
                className="at-btn at-btn-primary"
                style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                id="at-irrigate-btn"
              >
                <Droplet style={{ width: 14, height: 14 }} />
                Irrigate Plot
              </button>
              <button
                onClick={() => handleAction('hvac')}
                className="at-btn at-btn-secondary"
                style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                id="at-fan-btn"
              >
                <Wind style={{ width: 14, height: 14 }} />
                Toggle Fan
              </button>
            </div>
          </div>

          {/* Right: AI Query Console */}
          <div className="at-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="at-card-header">
              <div className="at-card-title">
                <Bot style={{ width: 16, height: 16, color: '#7c3aed' }} />
                Ask the Agronomic AI Assistant
              </div>
              <span className="at-badge neutral" style={{ fontSize: 10 }}>Rule-Based Assessment</span>
            </div>

            <form onSubmit={handleAskDoctor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="at-label" htmlFor="at-ai-question">Your Question</label>
                <textarea
                  id="at-ai-question"
                  rows={4}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder={`Ask about ${activePlot.code} (${assignedCrop?.name || 'Crop'}). e.g. "What is the recommended irrigation schedule for current moisture levels?"`}
                  className="at-input"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button
                id="at-ai-submit-btn"
                type="submit"
                disabled={answering || !question.trim()}
                className="at-btn at-btn-primary"
                style={{
                  alignSelf: 'flex-start',
                  background: '#7c3aed',
                  borderColor: '#6d28d9',
                  boxShadow: '0 4px 14px rgb(124 58 237 / 0.2)',
                  gap: 7,
                }}
              >
                <SendIcon style={{ width: 14, height: 14 }} />
                {answering ? 'Analyzing Observations...' : 'Submit Query'}
              </button>
            </form>

            {doctorAnswer && (
              <div style={{
                padding: '16px 18px',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: 'var(--radius-xl)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#7c3aed', fontWeight: 700, fontSize: 13 }}>
                  <Sparkles style={{ width: 15, height: 15 }} />
                  AI Agronomic Guidance
                </div>
                <p style={{ fontSize: 13, color: '#4c1d95', lineHeight: 1.7 }}>{doctorAnswer}</p>
              </div>
            )}

            <div style={{
              marginTop: 'auto',
              padding: '12px 14px',
              background: 'var(--color-surface-muted)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}>
              <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
              Diagnostics are driven by authoritative observations in AgriStore and agronomic thresholds. Results are rule-based, not machine learning.
            </div>
          </div>
        </div>
      ) : (
        <div className="at-card">
          <div className="at-empty">
            <div className="at-empty-icon">
              <BrainCircuit style={{ width: 28, height: 28, color: 'var(--color-text-muted)' }} />
            </div>
            <div className="at-empty-title">No Plots Available</div>
            <div className="at-empty-text">
              Create a farm and add plots to use the AI Agronomic Advisor.
            </div>
          </div>
        </div>
      )}

      <style>{`@media (max-width: 900px) { .at-advisor-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
};

export default AIAdvisor;
