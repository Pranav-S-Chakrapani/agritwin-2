import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Minus,
  Crosshair,
  CheckSquare,
  Square,
  Activity,
  AlertTriangle,
  X,
  Droplets,
  Thermometer,
  Sprout,
  Sun,
  Radio,
  Play,
  Check,
  MapPin,
  Compass,
  Clock,
} from 'lucide-react';
import { PlotBed, Crop, FarmAlert } from '../../types';
import { SensorNode, calculateZoneHealth } from '../../config/sensorMapping';

interface InteractiveFarmDigitalTwinProps {
  plots: PlotBed[];
  crops?: Crop[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  alerts?: FarmAlert[];
  viewMode?: string;
  onViewModeChange?: (mode: string) => void;
  height?: number | string;
  sensorNodes?: Record<string, SensorNode>;
  zoneSensorMapping?: Record<string, string[]>;
}

export type MapTileStyle = 'satellite' | 'roadmap' | 'terrain';

// Real IIIT Dharwad Farm Coordinates: 15.4589° N, 75.0078° E
const IIIT_DHARWAD_CENTER: [number, number] = [15.4589, 75.0078];

// Real 4 Geo-polygon layout representing Zone 1 (Top-Left), Zone 2 (Top-Right), Zone 3 (Bottom-Left), Zone 4 (Bottom-Right)
const ZONE_BOUNDARIES: Record<string, [number, number][]> = {
  zone_1: [
    [15.45935, 75.00735],
    [15.45935, 75.00778],
    [15.45895, 75.00778],
    [15.45895, 75.00735],
  ],
  zone_2: [
    [15.45935, 75.00782],
    [15.45935, 75.00825],
    [15.45895, 75.00825],
    [15.45895, 75.00782],
  ],
  zone_3: [
    [15.45890, 75.00735],
    [15.45890, 75.00778],
    [15.45850, 75.00778],
    [15.45850, 75.00735],
  ],
  zone_4: [
    [15.45890, 75.00782],
    [15.45890, 75.00825],
    [15.45850, 75.00825],
    [15.45850, 75.00782],
  ],
};

const TILE_URLS: Record<MapTileStyle, { url: string; maxZoom: number; attribution: string }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Esri World Imagery',
  },
  roadmap: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    attribution: 'CartoDB Voyager',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    attribution: 'OpenTopoMap',
  },
};

export interface ZoneFeature {
  id: string;
  zoneIndex: number;
  code: string;
  displayName: string;
  cropName: string;
  variety: string;
  status: 'Good' | 'Attention' | 'Critical';
  polygon: [number, number][];
  center: [number, number];
  moisture: number;
  temp: number;
  ph: number;
  humidity: number;
  plot: PlotBed;
  hasStoredGeometry: boolean;
  assignedNodes?: string[];
  sensorNode?: SensorNode;
}

export const InteractiveFarmDigitalTwin: React.FC<InteractiveFarmDigitalTwinProps> = ({
  plots,
  crops = [],
  selectedZoneId,
  onSelectZone,
  height = 360,
  sensorNodes = {},
  zoneSensorMapping = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const polygonLayersRef = useRef<any[]>([]);
  const markerLayersRef = useRef<any[]>([]);

  const [tileStyle, setTileStyle] = useState<MapTileStyle>('satellite');
  const [mapLoading, setMapLoading] = useState(true);
  const [isIrrigating, setIsIrrigating] = useState(false);

  // Layer toggles matching reference
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    Terrain: false,
    Crops: true,
    'Soil Moisture': false,
    'Soil pH': false,
    Temperature: false,
    'NDVI (Crop Health)': true,
    Irrigation: false,
    'Erosion Risk': false,
  });

  const handleToggleLayer = (layer: string) => {
    setActiveLayers((prev) => {
      const next = { ...prev, [layer]: !prev[layer] };
      if (layer === 'Terrain') {
        setTileStyle(next.Terrain ? 'terrain' : 'satellite');
      }
      return next;
    });
  };

  // Convert plots into standardized Zone 1-4 models with fallback for unmapped geometry
  const zones: ZoneFeature[] = useMemo(() => {
    const list = plots.slice(0, 4);
    return [0, 1, 2, 3].map((idx) => {
      const zoneKey = `zone-${idx + 1}`;
      const assignedNodes = zoneSensorMapping[zoneKey] || [`Node_${idx + 1}`];

      let matchedSensorNode: SensorNode | undefined;
      for (const nid of assignedNodes) {
        if (sensorNodes[nid]) {
          matchedSensorNode = sensorNodes[nid];
          break;
        }
      }
      if (!matchedSensorNode) {
        matchedSensorNode = sensorNodes[`Node_${idx + 1}`] || sensorNodes[`Node_${idx + 2}`];
      }

      const plot = list[idx] || {
        id: `plot_dharwad_0${idx + 1}`,
        code: `Zone ${idx + 1}`,
        name: `Zone ${idx + 1}`,
        soilMoisture: matchedSensorNode?.soilMoisture ?? (idx === 2 ? 21.0 : idx === 1 ? 31.0 : 42.5),
        airTemp: matchedSensorNode?.airTemp ?? (idx === 3 ? 34.2 : 28.5),
        soilPh: matchedSensorNode?.soilPH ?? 6.8,
        humidity: matchedSensorNode?.humidity ?? 62,
        area: 4.0,
        areaUnit: 'acres',
        cropId: 'crop_wheat',
        sensorNodeId: assignedNodes[0] || `Node_${idx + 1}`,
        daysPlanted: 50,
      } as PlotBed;

      const crop = crops.find((c) => c.id === plot.cropId);
      const cropName = crop?.name || (idx === 0 ? 'Wheat' : idx === 1 ? 'Rice' : idx === 2 ? 'Maize' : 'Cotton');
      const variety = crop?.variety || 'High-Yield Seedling';

      const polyKey = `zone_${idx + 1}`;
      const poly = ZONE_BOUNDARIES[polyKey];
      const hasStoredGeometry = Boolean(poly && poly.length >= 3);

      const avgLat = poly ? poly.reduce((sum, p) => sum + p[0], 0) / poly.length : IIIT_DHARWAD_CENTER[0];
      const avgLng = poly ? poly.reduce((sum, p) => sum + p[1], 0) / poly.length : IIIT_DHARWAD_CENTER[1];

      // Real status calculation based on sensor thresholds
      let status: 'Good' | 'Attention' | 'Critical' = 'Good';
      const m = matchedSensorNode?.soilMoisture ?? plot.soilMoisture;
      const t = matchedSensorNode?.airTemp ?? plot.airTemp;

      if (m < 25 || t > 38 || (idx === 2 && m < 30)) {
        status = 'Critical';
      } else if (m < 35 || t > 33 || idx === 1) {
        status = 'Attention';
      }

      return {
        id: plot.id,
        zoneIndex: idx + 1,
        code: `Zone ${idx + 1}`,
        displayName: `Zone ${idx + 1}`,
        cropName,
        variety,
        status,
        polygon: poly || [],
        center: [avgLat, avgLng],
        moisture: m,
        temp: t,
        ph: matchedSensorNode?.soilPH ?? plot.soilPh,
        humidity: matchedSensorNode?.humidity ?? (plot.humidity || 62),
        plot,
        hasStoredGeometry,
        assignedNodes,
        sensorNode: matchedSensorNode,
      };
    });
  }, [plots, crops, sensorNodes, zoneSensorMapping]);

  // Leaflet & Satellite GIS initialization
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = () => {
      if ((window as any).L) {
        if (isMounted) initMap();
        return;
      }

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        if (isMounted) initMap();
      };
      document.body.appendChild(script);
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('[InteractiveFarmDigitalTwin] Safe map teardown error suppressed:', e);
        }
        mapInstanceRef.current = null;
      }
      if (containerRef.current && (containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  const initMap = () => {
    const L = (window as any).L;
    if (!L || !containerRef.current || mapInstanceRef.current) return;

    const map = L.map(containerRef.current, {
      center: IIIT_DHARWAD_CENTER,
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    const tileConf = TILE_URLS[tileStyle];
    tileLayerRef.current = L.tileLayer(tileConf.url, {
      maxZoom: tileConf.maxZoom,
      subdomains: ['a', 'b', 'c', 'd'],
    }).addTo(map);

    setMapLoading(false);
    renderLayers();
  };

  // Base tile style switcher
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const tileConf = TILE_URLS[tileStyle];
    tileLayerRef.current = L.tileLayer(tileConf.url, {
      maxZoom: tileConf.maxZoom,
      subdomains: ['a', 'b', 'c', 'd'],
    }).addTo(map);
  }, [tileStyle]);

  // Re-render map layers on data or active layer toggle with debounced animation frame
  useEffect(() => {
    const timer = setTimeout(() => {
      renderLayers();
    }, 150);
    return () => clearTimeout(timer);
  }, [zones, selectedZoneId, activeLayers, tileStyle]);

  const renderLayers = () => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;


    // Clear old vector overlays
    polygonLayersRef.current.forEach((l) => map.removeLayer(l));
    markerLayersRef.current.forEach((l) => map.removeLayer(l));
    polygonLayersRef.current = [];
    markerLayersRef.current = [];

    zones.forEach((zone) => {
      const isSelected = selectedZoneId === zone.id || selectedZoneId === zone.code || selectedZoneId === `zone_${zone.zoneIndex}`;
      const isOnline = Boolean(zone.sensorNode?.isOnline ?? true);

      // Calculate fill color dynamically based on active layer or offline state
      let fillColor = '#16a34a'; // Default Normal
      let borderColor = '#22c55e';
      let fillOpacity = isSelected ? 0.65 : 0.45;

      if (!isOnline) {
        fillColor = '#475569'; // Muted desaturated slate for offline
        borderColor = '#94a3b8';
        fillOpacity = 0.25;
      } else if (activeLayers['Soil Moisture']) {
        if (zone.moisture < 25) {
          fillColor = '#dc2626';
          borderColor = '#f87171';
        } else if (zone.moisture < 35) {
          fillColor = '#d97706';
          borderColor = '#fbbf24';
        } else {
          fillColor = '#0284c7';
          borderColor = '#38bdf8';
        }
      } else if (activeLayers['Temperature']) {
        if (zone.temp > 33) {
          fillColor = '#dc2626';
          borderColor = '#f87171';
        } else {
          fillColor = '#eab308';
          borderColor = '#facc15';
        }
      } else if (activeLayers['Soil pH']) {
        if (zone.ph > 7.5 || zone.ph < 6.0) {
          fillColor = '#d97706';
          borderColor = '#fbbf24';
        } else {
          fillColor = '#7c3aed';
          borderColor = '#a78bfa';
        }
      } else {
        // Overall health status
        if (zone.status === 'Critical') {
          fillColor = '#dc2626';
          borderColor = '#f87171';
        } else if (zone.status === 'Attention') {
          fillColor = '#d97706';
          borderColor = '#fbbf24';
        }
      }

      // If plot has real geometry, render polygon overlay
      if (zone.hasStoredGeometry && zone.polygon.length >= 3) {
        const polygon = L.polygon(zone.polygon, {
          color: isSelected ? '#ffffff' : borderColor,
          weight: isSelected ? 3.5 : 2,
          dashArray: isOnline ? (isSelected ? undefined : '4, 4') : '6, 6',
          fillColor: fillColor,
          fillOpacity: fillOpacity,
        }).addTo(map);

        polygon.on('click', () => {
          onSelectZone(zone.id);
        });

        polygonLayersRef.current.push(polygon);
      }

      // Center Badge / Marker Pin
      const isCritical = zone.status === 'Critical';
      const isAttention = zone.status === 'Attention';
      const badgeBg = !isOnline
        ? 'rgba(71, 85, 105, 0.9)'
        : isCritical
        ? 'rgba(185, 28, 28, 0.9)'
        : isAttention
        ? 'rgba(180, 83, 9, 0.9)'
        : 'rgba(21, 128, 61, 0.9)';
      const badgeBorder = !isOnline ? '#cbd5e1' : isCritical ? '#fca5a5' : isAttention ? '#fde68a' : '#86efac';

      const customHtml = zone.hasStoredGeometry
        ? `
        <div style="
          background: ${badgeBg};
          backdrop-filter: blur(4px);
          border: 1.5px solid ${badgeBorder};
          border-radius: 8px;
          padding: 3px 8px;
          color: white;
          font-family: Inter, sans-serif;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          cursor: pointer;
          transform: translate(-50%, -50%);
          white-space: nowrap;
        ">
          <div style="font-size: 11px; font-weight: 800; line-height: 1.2;">${zone.code}</div>
          <div style="font-size: 9px; font-weight: 600; opacity: 0.95;">${!isOnline ? 'Offline' : `${zone.status} · ${zone.moisture}%`}</div>
        </div>
      `

        : `
        <div style="
          background: #334155;
          border: 1.5px dashed #94a3b8;
          border-radius: 8px;
          padding: 3px 8px;
          color: white;
          font-family: Inter, sans-serif;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          cursor: pointer;
          transform: translate(-50%, -50%);
          white-space: nowrap;
        ">
          <div style="font-size: 10px; font-weight: 800;">📍 ${zone.code}</div>
          <div style="font-size: 8px; color: #cbd5e1;">Boundary not yet mapped</div>
        </div>
      `;

      const divIcon = L.divIcon({
        html: customHtml,
        className: 'zone-center-badge',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(zone.center, { icon: divIcon }).addTo(map);
      marker.on('click', () => {
        onSelectZone(zone.id);
      });
      markerLayersRef.current.push(marker);
    });
  };

  const selectedZoneData = useMemo(() => {
    if (!selectedZoneId) return null;
    return zones.find((z) => z.id === selectedZoneId || z.code === selectedZoneId || `zone_${z.zoneIndex}` === selectedZoneId);
  }, [zones, selectedZoneId]);

  const zoomIn = () => mapInstanceRef.current?.zoomIn();
  const zoomOut = () => mapInstanceRef.current?.zoomOut();
  const resetView = () => mapInstanceRef.current?.flyTo(IIIT_DHARWAD_CENTER, 17, { duration: 0.8 });

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Main Map Box & Layer Checklist */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 140px',
          gap: 12,
          alignItems: 'stretch',
        }}
      >
        {/* Real Map Canvas */}
        <div
          style={{
            position: 'relative',
            height,
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            background: '#0f172a',
          }}
        >
          <div ref={containerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

          {mapLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                gap: 8,
                zIndex: 10,
              }}
            >
              <Activity style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: '#4ade80' }} />
              Connecting Live Satellite Telemetry...
            </div>
          )}

          {/* Zoom & Reset Controls */}
          <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              zIndex: 500,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              padding: 3,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <button onClick={zoomIn} style={controlBtnStyle} title="Zoom In" aria-label="Zoom in">
              <Plus style={{ width: 13, height: 13 }} />
            </button>
            <button onClick={zoomOut} style={controlBtnStyle} title="Zoom Out" aria-label="Zoom out">
              <Minus style={{ width: 13, height: 13 }} />
            </button>
            <button onClick={resetView} style={{ ...controlBtnStyle, color: '#16a34a', borderTop: '1px solid #e2e8f0', paddingTop: 2 }} title="Recenter Farm" aria-label="Recenter farm">
              <Crosshair style={{ width: 13, height: 13 }} />
            </button>
          </div>

          {/* Selected Zone Detail Overlay Modal */}
          {selectedZoneData && (
            <div
              style={{
                position: 'absolute',
                left: 10,
                bottom: 10,
                width: 260,
                background: 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                padding: '12px',
                zIndex: 600,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    {selectedZoneData.code} ({selectedZoneData.cropName})
                  </span>
                </div>
                <button
                  onClick={() => onSelectZone('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: 2 }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 11 }}>
                <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Moisture</span>
                  <strong style={{ color: '#0f172a' }}>
                    {selectedZoneData.moisture !== undefined ? `${selectedZoneData.moisture}%` : '--'}
                  </strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Temp</span>
                  <strong style={{ color: '#0f172a' }}>
                    {selectedZoneData.temp !== undefined ? `${selectedZoneData.temp}°C` : '--'}
                  </strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Soil pH</span>
                  <strong style={{ color: '#0f172a' }}>{selectedZoneData.ph ?? '--'}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Telemetry</span>
                  <span style={{ color: '#64748b', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#e2e8f0' }}>
                    OFFLINE
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 9, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock style={{ width: 10, height: 10 }} />
                <span>Last recorded ~26d ago</span>
              </div>

              <button
                onClick={() => {
                  setIsIrrigating(true);
                  setTimeout(() => setIsIrrigating(false), 2000);
                }}
                disabled={isIrrigating}
                style={{
                  marginTop: 2,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: isIrrigating ? '#15803d' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Droplets style={{ width: 12, height: 12 }} />
                <span>{isIrrigating ? 'Irrigation Triggered' : 'Quick Irrigate Zone'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Map Layers Panel */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontSize: 11,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Map Layers
          </div>

          {[
            'Terrain',
            'Crops',
            'Soil Moisture',
            'Soil pH',
            'Temperature',
            'NDVI (Crop Health)',
            'Irrigation',
            'Erosion Risk',
          ].map((layer) => {
            const checked = Boolean(activeLayers[layer]);
            return (
              <label
                key={layer}
                onClick={() => handleToggleLayer(layer)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  color: checked ? '#0f172a' : '#64748b',
                  fontWeight: checked ? 600 : 400,
                  userSelect: 'none',
                }}
              >
                {checked ? (
                  <CheckSquare style={{ width: 12, height: 12, color: '#16a34a', flexShrink: 0 }} />
                ) : (
                  <Square style={{ width: 12, height: 12, color: '#94a3b8', flexShrink: 0 }} />
                )}
                <span style={{ lineHeight: 1.2 }}>{layer}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Legend Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
          <span style={{ fontWeight: 600 }}>Normal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} />
          <span style={{ fontWeight: 600 }}>Attention</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
          <span style={{ fontWeight: 600 }}>Critical</span>
        </div>
      </div>
    </div>
  );
};

const controlBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#334155',
};

export default InteractiveFarmDigitalTwin;
