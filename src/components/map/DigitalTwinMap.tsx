import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Layers, 
  Sparkles, 
  Droplets, 
  Thermometer, 
  Radio, 
  Activity, 
  Ruler, 
  Sprout, 
  Scale, 
  Settings2, 
  LineChart, 
  X, 
  Maximize2, 
  Check, 
  ChevronRight, 
  Sun, 
  Eye, 
  MapPin, 
  Bot, 
  Droplet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { computeGrowthStatus } from '../../lib/gdd-calculator';
import PlantCanopySvg from '../common/PlantCanopySvg';
import { useUserMode } from '../../context/UserModeContext';
import { getPlots, getCrops, getFarmProfile, triggerPlotIrrigation } from '../../lib/farm-storage';
import { logFieldAction } from '../../lib/audit-log';
import { PlotBed, Crop, FarmProfile } from '../../types';

export interface PlotPolygonConfig {
  id: string;
  code: string;
  name: string;
  crop: string;
  variety: string;
  cropType: string;
  center: [number, number];
  polygonCoordinates: [number, number][];
  healthScore: number;
  healthStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  soilMoisture: number;
  airTemp: number;
  humidity: number;
  soilPh: number;
  nitrogen: number;
  vpd: number;
  yieldForecastKg: number;
  irrigationStatus: 'Active' | 'Standby';
  sensorsCount: number;
}

export type MapTileStyle = 'roadmap' | 'satellite' | 'terrain';

const TILE_URLS: Record<MapTileStyle, { url: string; maxZoom: number; attribution: string }> = {
  roadmap: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    attribution: 'CartoDB Light Positron'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Esri World Imagery'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    attribution: 'OpenTopoMap'
  }
};

export const DigitalTwinMap: React.FC = () => {
  const navigate = useNavigate();
  const { isFarmer } = useUserMode();
  
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [plots, setPlots] = useState<PlotBed[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('roadmap');

  const [layerPolygons, setLayerPolygons] = useState(true);
  const [layerHeatmap, setLayerHeatmap] = useState(true);
  const [layerSensors, setLayerSensors] = useState(true);

  const [mapLoading, setMapLoading] = useState(true);
  const [wateringTriggered, setWateringTriggered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const polygonLayersRef = useRef<any[]>([]);
  const markerLayersRef = useRef<any[]>([]);

  const reloadData = () => {
    const p = getPlots();
    const c = getCrops();
    const f = getFarmProfile();
    setPlots(p);
    setCrops(c);
    setFarmProfile(f);
    if (p.length > 0 && !selectedPlotId) {
      setSelectedPlotId(p[0].id);
    }
  };

  useEffect(() => {
    reloadData();
    const handleUpdate = () => reloadData();
    window.addEventListener('agri_storage_updated', handleUpdate);
    return () => window.removeEventListener('agri_storage_updated', handleUpdate);
  }, []);

  // Transform dynamic plots into PlotPolygonConfig array
  const plotPolygons: PlotPolygonConfig[] = useMemo(() => {
    return plots.map((p, idx) => {
      const crop = crops.find(c => c.id === p.cropId);
      const cropName = crop?.name || 'Crop';
      const variety = crop?.variety || 'Cultivar';

      // Use boundaryCoordinates if available, or generate offset polygon from base center
      let coords: [number, number][] = p.boundaryCoordinates || [];
      if (!coords || coords.length < 3) {
        const baseLat = 15.4589 + (idx % 2 === 0 ? 0.0003 : -0.0003);
        const baseLng = 75.0078 + (idx >= 2 ? 0.0007 : -0.0003);
        coords = [
          [baseLat + 0.00025, baseLng - 0.00025],
          [baseLat + 0.00025, baseLng + 0.00025],
          [baseLat - 0.00025, baseLng + 0.00025],
          [baseLat - 0.00025, baseLng - 0.00025]
        ];
      }

      // Calculate centroid
      const avgLat = coords.reduce((sum, pt) => sum + pt[0], 0) / coords.length;
      const avgLng = coords.reduce((sum, pt) => sum + pt[1], 0) / coords.length;

      let healthStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical' = 'Excellent';
      let healthScore = 95;
      if (p.airTemp > (crop?.idealTempMax || 32)) {
        healthStatus = 'Needs Attention';
        healthScore = 75;
      } else if (p.soilMoisture < (crop?.idealMoistureMin || 50)) {
        healthStatus = 'Needs Attention';
        healthScore = 78;
      }

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        crop: cropName,
        variety,
        cropType: cropName.toLowerCase(),
        center: [avgLat, avgLng],
        polygonCoordinates: coords,
        healthScore,
        healthStatus,
        soilMoisture: p.soilMoisture,
        airTemp: p.airTemp,
        humidity: 62,
        soilPh: p.soilPh,
        nitrogen: 45,
        vpd: 1.05,
        yieldForecastKg: Math.round(p.areaSqm ? p.areaSqm * 4.2 : 350),
        irrigationStatus: p.isWatering ? 'Active' : 'Standby',
        sensorsCount: p.sensorNodeId ? 4 : 2
      };
    });
  }, [plots, crops]);

  const selectedPlot = plotPolygons.find(p => p.id === selectedPlotId) || plotPolygons[0] || null;
  const growth = computeGrowthStatus(selectedPlot?.id);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = () => {
      if ((window as any).L) {
        if (isMounted) initLeafletMap();
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
        if (isMounted) initLeafletMap();
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
          console.warn('[DigitalTwinMap] Safe map teardown error suppressed:', e);
        }
        mapInstanceRef.current = null;
      }
      if (containerRef.current && (containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  const initLeafletMap = () => {
    const L = (window as any).L;
    if (!L || !containerRef.current || mapInstanceRef.current) return;

    const initialCenter = plotPolygons[0]?.center || [15.4589, 75.0078];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 17,
      zoomControl: true,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    const tileConf = TILE_URLS[tileStyle];
    tileLayerRef.current = L.tileLayer(tileConf.url, {
      maxZoom: tileConf.maxZoom,
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(map);

    setMapLoading(false);
    renderMapLayers();
  };

  // Re-render layers on state changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    renderMapLayers();
  }, [plotPolygons, selectedPlotId, layerPolygons, layerSensors, tileStyle]);

  const renderMapLayers = () => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old layers
    polygonLayersRef.current.forEach(l => map.removeLayer(l));
    markerLayersRef.current.forEach(l => map.removeLayer(l));
    polygonLayersRef.current = [];
    markerLayersRef.current = [];

    // Render Plot Polygons
    if (layerPolygons) {
      plotPolygons.forEach(p => {
        const isSelected = p.id === selectedPlotId;
        const color = isSelected ? '#0284c7' : p.healthScore >= 85 ? '#16a34a' : '#d97706';

        const poly = L.polygon(p.polygonCoordinates, {
          color,
          weight: isSelected ? 3 : 2,
          fillColor: color,
          fillOpacity: isSelected ? 0.45 : 0.25
        }).addTo(map);

        poly.on('click', () => {
          setSelectedPlotId(p.id);
        });

        polygonLayersRef.current.push(poly);
      });
    }

    // Render Plot Node Markers
    if (layerSensors) {
      plotPolygons.forEach(p => {
        const iconHtml = `
          <div style="background-color: #065f46; color: white; border: 2px solid white; border-radius: 9999px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            ${p.code}
          </div>
        `;
        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-plot-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker(p.center, { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedPlotId(p.id);
        });
        markerLayersRef.current.push(marker);
      });
    }
  };

  const handleWaterNow = async () => {
    if (!selectedPlot) return;
    setWateringTriggered(true);
    await triggerPlotIrrigation(selectedPlot.id);
    setWateringTriggered(false);
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-10">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Geospatial Digital Twin Map
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {plotPolygons.length} Active Vector {plotPolygons.length === 1 ? 'Polygon' : 'Polygons'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {farmProfile?.name || 'AgriTwin Smart Farm'} &bull; Satellite Coordinate Boundary Vectors
          </p>
        </div>

        {/* Map Layers & Style Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {(['roadmap', 'satellite', 'terrain'] as MapTileStyle[]).map(style => (
              <button
                key={style}
                onClick={() => setTileStyle(style)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  tileStyle === style ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Map Canvas */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 shadow-xs h-[520px] relative">
          <div ref={containerRef} className="w-full h-full" />
          
          {mapLoading && (
            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs font-semibold space-x-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Loading Vector Layers...</span>
            </div>
          )}

          {/* Quick Plot Bed Selector Overlay */}
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-md flex items-center space-x-1.5 max-w-full overflow-x-auto">
            {plotPolygons.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPlotId(p.id);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo(p.center, 18);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedPlotId === p.id 
                    ? 'bg-emerald-800 text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.code}: {p.crop}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Plot Dynamic Inspection Drawer */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          {selectedPlot ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {selectedPlot.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{selectedPlot.crop}</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedPlot.variety}</p>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedPlot.healthStatus}
                  </span>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Soil Moisture</span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{selectedPlot.soilMoisture}%</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Canopy Temp</span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{selectedPlot.airTemp}°C</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Substrate pH</span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">{selectedPlot.soilPh}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Yield Forecast</span>
                    <div className="text-lg font-bold text-emerald-800 mt-0.5">{selectedPlot.yieldForecastKg} kg</div>
                  </div>
                </div>

                {/* Phenology stage */}
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl border border-emerald-200 flex items-center justify-center shrink-0">
                    <PlantCanopySvg stage={growth.currentStage.key} cropType={selectedPlot.crop} size={32} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{growth.currentStage.label} Stage</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{growth.dap} Days Planted &bull; GDD: {growth.accumulatedGdd}</div>
                  </div>
                </div>
              </div>

              {/* Action Button: Water Now */}
              <div className="pt-2">
                <button
                  onClick={handleWaterNow}
                  disabled={wateringTriggered || selectedPlot.irrigationStatus === 'Active'}
                  className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    wateringTriggered || selectedPlot.irrigationStatus === 'Active'
                      ? 'bg-sky-600 text-white animate-pulse'
                      : 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <Droplet className="w-4 h-4" />
                  <span>{wateringTriggered ? 'Irrigating Plot...' : 'Water Plot Now (15-Min Pulse)'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a plot on the map to inspect live telemetry and trigger precision actuators.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default DigitalTwinMap;
