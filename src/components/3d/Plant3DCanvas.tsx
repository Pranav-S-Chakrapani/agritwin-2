import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ProceduralPlantMesh } from './ProceduralPlantMesh';
import { computeGrowthVisualState, GrowthVisualState } from '../../lib/growthVisualEngine';
import { PlotBed, Crop } from '../../types';
import { Sparkles, Activity, Droplet, Thermometer, ShieldCheck } from 'lucide-react';
import { formatMoisture, formatTemperature } from '../../lib/formatters';

interface Plant3DCanvasProps {
  plot?: PlotBed | null;
  crop?: Crop | null;
  visionData?: { diseaseRisk?: number; plantHeight?: number; canopyCoverage?: number; fruitRipeness?: number } | null;
  compact?: boolean;
  height?: string | number;
  showCaption?: boolean;
  showMetricsOverlay?: boolean;
}

export const Plant3DCanvas: React.FC<Plant3DCanvasProps> = ({
  plot,
  crop,
  visionData,
  compact = false,
  height = '100%',
  showCaption = true,
  showMetricsOverlay = true,
}) => {
  const visualState: GrowthVisualState = computeGrowthVisualState(plot, crop, visionData);

  const getSourceBadgeStyle = (source: GrowthVisualState['source']) => {
    switch (source) {
      case 'ai_vision':
        return {
          bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700',
          dot: 'bg-emerald-400',
        };
      case 'heuristic_fallback':
        return {
          bg: 'bg-amber-950/90 text-amber-300 border-amber-700',
          dot: 'bg-amber-400',
        };
      case 'manual_stage_only':
      default:
        return {
          bg: 'bg-slate-900/90 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  const badge = getSourceBadgeStyle(visualState.source);

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 select-none flex flex-col justify-between"
      style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: compact ? '180px' : '360px' }}
    >
      {/* ── WebGL 3D Canvas ── */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          camera={{ position: [0, 1.2, 3.2], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight
            position={[5, 8, 4]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-4, 3, -2]} intensity={0.5} color="#38bdf8" />
          <pointLight position={[3, 1, 2]} intensity={0.4} color="#fde047" />

          <Suspense fallback={null}>
            <ProceduralPlantMesh visualState={visualState} compact={compact} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={!compact}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={1.8}
            maxDistance={5.0}
            autoRotate={false}
          />
        </Canvas>
      </div>

      {/* ── Top HUD Strip: Stage & Vigor ── */}
      {showMetricsOverlay && !compact && (
        <div className="relative z-10 p-4 flex items-start justify-between gap-2 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-white shadow-lg space-y-0.5">
            <div className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 3D Digital Twin &bull; {visualState.cropName}
            </div>
            <div className="text-sm font-black flex items-center gap-2">
              <span>{visualState.stage}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                visualState.wilt_factor > 0.4 ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}>
                {visualState.wilt_factor > 0.4 ? `Wilt Droop ${(visualState.wilt_factor * 100).toFixed(0)}%` : 'Turgid / Healthy'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-white shadow-lg text-right space-y-0.5">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Vigor Index</div>
            <div className="text-sm font-black text-emerald-400">
              {visualState.vigor_score} / 100
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Strip: Data Provenance Attribution Caption ── */}
      {showCaption && (
        <div className="relative z-10 p-3 sm:p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm ${badge.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {visualState.sourceLabel}
            </span>
            {plot && (
              <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
                Moisture: {formatMoisture(plot.soilMoisture)} &bull; Temp: {formatTemperature(plot.airTemp)}
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-400 font-sans italic">
            {compact ? 'Interactive 3D Twin' : 'Drag to rotate 360° &bull; Real-time biophysical droop'}
          </span>
        </div>
      )}
    </div>
  );
};
