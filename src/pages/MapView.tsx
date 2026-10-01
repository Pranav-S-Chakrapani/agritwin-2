import React from 'react';
import { InteractiveFarmDigitalTwin } from '../components/map/InteractiveFarmDigitalTwin';
import { useAgriStore } from '../context/AgriStore';
import { Map, Layers, Radio, Compass, Building2, MapPin } from 'lucide-react';

export const MapView: React.FC = () => {
  const { activeSections: plots, crops, activeFarmland, sensorNodes } = useAgriStore();
  const [selectedZone, setSelectedZone] = React.useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#e0f2fe', color: '#0369a1' }}>
              GEOSPATIAL GIS TWIN
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              High-Resolution Satellite Orthomosaic
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '6px 0 0', letterSpacing: '-0.02em' }}>
            Farm Map & Zone Boundaries
          </h1>
          <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>
            Interactive satellite map showing the 4 active zones at IIIT Dharwad Farm with live sensor layer overlays.
          </p>
        </div>

        {activeFarmland && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: 12,
          }}>
            <Building2 style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeFarmland.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
                <MapPin style={{ width: 10, height: 10 }} />
                15.4589° N, 75.0078° E
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Map Component (Matches Dashboard) */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <InteractiveFarmDigitalTwin
          plots={plots}
          crops={crops}
          selectedZoneId={selectedZone}
          onSelectZone={setSelectedZone}
          sensorNodes={sensorNodes}
          height={600}
        />
      </div>
    </div>
  );
};

export default MapView;
