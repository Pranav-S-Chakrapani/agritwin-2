import React, { useState, useEffect } from 'react';
import { Settings2, Droplet, Wind, Sun, Sprout, Building2, Power } from 'lucide-react';
import { logFieldAction } from '../lib/audit-log';
import { useAgriStore } from '../context/AgriStore';
import { PlotService } from '../services/canonicalServices';

export const DeviceControl = () => {
  const { farmlands, activeFarmland, plots: allPlots, crops, triggerActuator } = useAgriStore();
  const plots = PlotService.getPlotsForFarm(allPlots, activeFarmland?.id);
  const [selectedPlot, setSelectedPlot] = useState('');
  const [controls, setControls] = useState<any>({
    irrigation: { enabled: false, mode: 'auto' },
    hvac: { enabled: false, mode: 'auto' },
    growLight: { enabled: false, mode: 'manual' },
  });

  useEffect(() => {
    if (plots.length > 0) {
      const exists = plots.some(p => p.id === selectedPlot);
      if (!exists) setSelectedPlot(plots[0].id);
    } else {
      setSelectedPlot('');
    }
  }, [plots, selectedPlot, activeFarmland?.id]);

  const activePlotObj = plots.find(p => p.id === selectedPlot) || plots[0];
  const plotCode = activePlotObj ? activePlotObj.code : selectedPlot;

  const toggleDevice = async (device: string, currentEnabled: boolean, mode: string) => {
    const nextState = !currentEnabled;
    const cleanMode = (mode || 'auto').toLowerCase();
    setControls((prev: any) => ({ ...prev, [device]: { enabled: nextState, mode: cleanMode } }));
    const actionType = device === 'growLight' ? 'grow_light' : (device as any);
    if (device === 'irrigation' && nextState) triggerActuator(selectedPlot, 'irrigation');
    await logFieldAction(
      selectedPlot, actionType, cleanMode === 'auto' ? 'auto' : 'manual',
      `${device.toUpperCase()} actuator ${nextState ? 'Activated ON' : 'Deactivated OFF'} via Control Panel (${cleanMode.toUpperCase()} mode).`,
      plotCode
    );
  };

  const toggleMode = async (device: string, enabled: boolean, currentMode: string) => {
    const nextMode = (currentMode || '').toLowerCase() === 'auto' ? 'manual' : 'auto';
    setControls((prev: any) => ({ ...prev, [device]: { enabled, mode: nextMode } }));
    const actionType = device === 'growLight' ? 'grow_light' : (device as any);
    await logFieldAction(selectedPlot, actionType, 'manual', `${device.toUpperCase()} mode changed to ${nextMode.toUpperCase()}.`, plotCode);
  };

  if (plots.length === 0) {
    return (
      <div className="at-card">
        <div className="at-empty">
          <div className="at-empty-icon">
            <Settings2 style={{ width: 28, height: 28, color: 'var(--color-text-muted)' }} />
          </div>
          <div className="at-empty-title">No Plots Configured</div>
          <div className="at-empty-text">Configure plots in Onboarding or Virtual Farm to access edge device controls.</div>
        </div>
      </div>
    );
  }

  const DEVICES = [
    {
      key: 'irrigation',
      label: 'Precision Drip Irrigation',
      description: 'Automated solenoid valve triggered by root-zone soil moisture telemetry',
      icon: <Droplet style={{ width: 22, height: 22 }} />,
      iconColor: '#0284c7',
      iconBg: '#f0f9ff',
      onColor: '#0284c7',
      stateLabel: controls?.irrigation?.enabled ? 'VALVE OPEN (ACTIVE)' : 'CLOSED (STANDBY)',
      btnLabel: controls?.irrigation?.enabled ? 'Stop Irrigation' : 'Start 15-Min Pulse',
    },
    {
      key: 'hvac',
      label: 'Canopy Ventilation & Fans',
      description: 'High-efficiency airflow fans for VPD stabilization and heat dissipation',
      icon: <Wind style={{ width: 22, height: 22 }} />,
      iconColor: '#0d9488',
      iconBg: '#f0fdfa',
      onColor: '#0d9488',
      stateLabel: controls?.hvac?.enabled ? 'RUNNING (BLOWING)' : 'STOPPED',
      btnLabel: controls?.hvac?.enabled ? 'Turn Fans Off' : 'Turn Fans On',
    },
    {
      key: 'growLight',
      label: 'PAR Supplemental Grow Light',
      description: 'Full-spectrum LED illumination for photosynthetic photon flux boost',
      icon: <Sun style={{ width: 22, height: 22 }} />,
      iconColor: '#d97706',
      iconBg: '#fffbeb',
      onColor: '#d97706',
      stateLabel: controls?.growLight?.enabled ? 'ILLUMINATING (100%)' : 'OFF',
      btnLabel: controls?.growLight?.enabled ? 'Turn Lights Off' : 'Turn Lights On',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="at-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-lg)',
              background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings2 style={{ width: 18, height: 18, color: '#0284c7' }} />
            </div>
            Edge Device & Actuator Control
          </h1>
          <p className="at-page-subtitle">
            Manual and automated actuation of precision irrigation, canopy fans, and supplemental lighting for{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{activeFarmland?.name || 'this farm'}</strong>
          </p>
        </div>

        {/* Plot Selector */}
        <div className="at-farm-selector" style={{ flexShrink: 0 }}>
          <Sprout style={{ width: 14, height: 14, color: 'var(--color-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, flexShrink: 0 }}>Plot:</span>
          <select
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
            aria-label="Select plot for device control"
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {plots.map(p => {
              const c = crops.find(crop => crop.id === p.cropId);
              return <option key={p.id} value={p.id}>{p.code}: {c ? `${c.name} (${c.variety})` : p.name}</option>;
            })}
          </select>
        </div>
      </div>

      {/* ── Device Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {DEVICES.map(({ key, label, description, icon, iconColor, iconBg, onColor, stateLabel, btnLabel }) => {
          const ctl = controls?.[key] || {};
          const isEnabled = ctl.enabled;
          const isAuto = (ctl.mode || '').toLowerCase() === 'auto';

          return (
            <div
              key={key}
              className="at-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                borderTop: isEnabled ? `3px solid ${onColor}` : '3px solid var(--color-border)',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 'var(--radius-xl)',
                  background: isEnabled ? iconBg : 'var(--color-surface-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isEnabled ? iconColor : 'var(--color-text-muted)',
                  transition: 'all 0.2s',
                  border: `1px solid ${isEnabled ? iconColor + '30' : 'var(--color-border)'}`,
                  flexShrink: 0,
                }}>
                  {icon}
                </div>
                <button
                  onClick={() => toggleMode(key, isEnabled, ctl.mode)}
                  className={`at-badge ${isAuto ? 'success' : 'warning'}`}
                  style={{ cursor: 'pointer', border: 'none' as any, background: 'transparent' }}
                  title="Toggle auto/manual mode"
                >
                  <span className="at-badge-dot" />
                  {isAuto ? 'Auto' : 'Manual'}
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  {label}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {description}
                </p>
              </div>

              {/* State indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: isEnabled ? (iconBg) : 'var(--color-surface-muted)',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${isEnabled ? iconColor + '25' : 'var(--color-border-muted)'}`,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                  State
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isEnabled ? onColor : 'var(--color-text-muted)',
                    boxShadow: isEnabled ? `0 0 0 3px ${onColor}25` : 'none',
                    animation: isEnabled ? 'at-pulse 2s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: isEnabled ? onColor : 'var(--color-text-muted)' }}>
                    {stateLabel}
                  </span>
                </div>
              </div>

              {/* Action button */}
              <button
                id={`at-device-${key}-btn`}
                onClick={() => toggleDevice(key, isEnabled, ctl.mode)}
                className="at-btn"
                style={{
                  width: '100%', justifyContent: 'center', gap: 8,
                  background: isEnabled ? 'var(--color-danger)' : onColor,
                  color: 'white',
                  border: 'none',
                  boxShadow: isEnabled ? '0 4px 14px rgba(220,38,38,0.25)' : `0 4px 14px ${onColor}30`,
                  fontWeight: 700,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <Power style={{ width: 15, height: 15 }} />
                {btnLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* System info footer */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--color-surface-muted)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        fontSize: 12,
        color: 'var(--color-text-muted)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Building2 style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--color-primary)' }} />
        <span>
          Controlling devices for <strong style={{ color: 'var(--color-text-secondary)' }}>{activeFarmland?.name || 'active farm'}</strong>
          {' '}&middot; Plot: <strong style={{ color: 'var(--color-text-secondary)' }}>{activePlotObj?.code || '—'}</strong>
          {' '}&middot; All actions are logged to the field audit trail.
        </span>
      </div>
    </div>
  );
};

export default DeviceControl;
