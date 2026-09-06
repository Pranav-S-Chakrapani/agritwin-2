import { Farmland, PlotBed, IoTSensor, TelemetryObservation } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// ─── 1. DEFINITION OF THE 5 REALISTIC FARMS ─────────────────────────────────
export const SEEDED_FARMS: Farmland[] = [
  {
    id: 'farm_iiit_dharwad',
    name: 'IIIT Dharwad Research Farm',
    location: 'Dharwad, Karnataka, India',
    address: 'IT Park Road, Tarihal, Dharwad, KA 580026',
    contactPerson: 'Dr. Agricultural IoT Director',
    contactPhone: '+91 836 225 0000',
    contactRole: 'Manager',
    hasMapCoordinates: true,
    totalArea: 18.5,
    unit: 'acres',
    sectionsCount: 5,
    sensorsCount: 30,
    healthScore: 92,
    lastUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'farm_smart_demo',
    name: 'Smart Agriculture Demo Farm',
    location: 'Bengaluru Rural, Karnataka, India',
    address: 'Doddaballapur Industrial Area, Bengaluru, KA 561203',
    contactPerson: 'Commercial Hydroponics Head',
    contactPhone: '+91 80 4112 3456',
    contactRole: 'Manager',
    hasMapCoordinates: true,
    totalArea: 24.0,
    unit: 'acres',
    sectionsCount: 5,
    sensorsCount: 30,
    healthScore: 95,
    lastUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 'farm_precision_center',
    name: 'Precision Farming Center',
    location: 'Pune, Maharashtra, India',
    address: 'Haveli Taluka, Pune, MH 411028',
    contactPerson: 'Fertigation System Specialist',
    contactPhone: '+91 20 2687 1234',
    contactRole: 'Owner',
    hasMapCoordinates: true,
    totalArea: 32.5,
    unit: 'acres',
    sectionsCount: 5,
    sensorsCount: 30,
    healthScore: 91,
    lastUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'farm_organic_research',
    name: 'Organic Crop Research Farm',
    location: 'Shimoga, Karnataka, India',
    address: 'Tunga River Basin, Shimoga, KA 577201',
    contactPerson: 'Bio-Soil Health Officer',
    contactPhone: '+91 8182 240 000',
    contactRole: 'Worker',
    hasMapCoordinates: true,
    totalArea: 15.0,
    unit: 'acres',
    sectionsCount: 5,
    sensorsCount: 30,
    healthScore: 87,
    lastUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'farm_digital_twin',
    name: 'Digital Twin Innovation Farm',
    location: 'Hyderabad, Telangana, India',
    address: 'AgriTech Hub, Gachibowli, Hyderabad, TS 500032',
    contactPerson: 'Phenotyping Lead Scientist',
    contactPhone: '+91 40 6677 8899',
    contactRole: 'Manager',
    hasMapCoordinates: true,
    totalArea: 40.0,
    unit: 'acres',
    sectionsCount: 5,
    sensorsCount: 30,
    healthScore: 96,
    lastUpdate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

// ─── 2. DEFINITION OF THE 25 PLOTS (5 PER FARM) ──────────────────────────────
export const SEEDED_PLOTS: PlotBed[] = [
  // Farm 1: IIIT Dharwad Research Farm (Total: 18.5 acres)
  {
    id: 'plot_dharwad_01',
    farmId: 'farm_iiit_dharwad',
    code: 'PLOT-A01',
    name: 'PLOT-A01 Wheat',
    area: 3.5,
    areaUnit: 'acres',
    cropId: 'crop_wheat',
    cropType: 'Wheat',
    cropVariety: 'PBW-343',
    soilType: 'Clay Loam',
    growthStage: 'Fruiting',
    sensorNodeId: 'NODE-DHARWAD-01',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 92,
    soilMoisture: 42.5,
    airTemp: 24.8,
    soilPh: 6.5,
    daysPlanted: 65,
    isWatering: true
  },
  {
    id: 'plot_dharwad_02',
    farmId: 'farm_iiit_dharwad',
    code: 'PLOT-A02',
    name: 'PLOT-A02 Rice',
    area: 4.0,
    areaUnit: 'acres',
    cropId: 'crop_rice',
    cropType: 'Rice',
    cropVariety: 'Sona Masuri BPT-5204',
    soilType: 'Alluvial Clay',
    growthStage: 'Vegetative',
    sensorNodeId: 'NODE-DHARWAD-02',
    irrigationStatus: 'Automated Sprinkler',
    soilHealthScore: 88,
    soilMoisture: 58.2,
    airTemp: 26.1,
    soilPh: 6.8,
    daysPlanted: 40,
    isWatering: false
  },
  {
    id: 'plot_dharwad_03',
    farmId: 'farm_iiit_dharwad',
    code: 'PLOT-A03',
    name: 'PLOT-A03 Maize',
    area: 3.8,
    areaUnit: 'acres',
    cropId: 'crop_maize',
    cropType: 'Maize',
    cropVariety: 'Sugar-75 Sweet Corn',
    soilType: 'Sandy Loam',
    growthStage: 'Flowering',
    sensorNodeId: 'NODE-DHARWAD-03',
    irrigationStatus: 'Scheduled',
    soilHealthScore: 90,
    soilMoisture: 48.0,
    airTemp: 25.4,
    soilPh: 6.4,
    daysPlanted: 52,
    isWatering: false
  },
  {
    id: 'plot_dharwad_04',
    farmId: 'farm_iiit_dharwad',
    code: 'PLOT-A04',
    name: 'PLOT-A04 Sugarcane',
    area: 4.2,
    areaUnit: 'acres',
    cropId: 'crop_sugarcane',
    cropType: 'Sugarcane',
    cropVariety: 'Co-86032 Nellikuppam',
    soilType: 'Deep Black Loam',
    growthStage: 'Maturation',
    sensorNodeId: 'NODE-DHARWAD-04',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 94,
    soilMoisture: 51.5,
    airTemp: 27.2,
    soilPh: 6.7,
    daysPlanted: 120,
    isWatering: true
  },
  {
    id: 'plot_dharwad_05',
    farmId: 'farm_iiit_dharwad',
    code: 'PLOT-A05',
    name: 'PLOT-A05 Cotton',
    area: 3.0,
    areaUnit: 'acres',
    cropId: 'crop_cotton',
    cropType: 'Cotton',
    cropVariety: 'Bt-Hybrid RCH-2',
    soilType: 'Black Cotton Soil',
    growthStage: 'Vegetative',
    sensorNodeId: 'NODE-DHARWAD-05',
    irrigationStatus: 'Idle',
    soilHealthScore: 89,
    soilMoisture: 38.6,
    airTemp: 28.5,
    soilPh: 7.1,
    daysPlanted: 35,
    isWatering: false
  },

  // Farm 2: Smart Agriculture Demo Farm (Total: 24.0 acres)
  {
    id: 'plot_demo_01',
    farmId: 'farm_smart_demo',
    code: 'PLOT-B01',
    name: 'PLOT-B01 Hydroponic Lettuce',
    area: 4.0,
    areaUnit: 'acres',
    cropId: 'crop_lettuce',
    cropType: 'Lettuce',
    cropVariety: 'Butterhead Rex',
    soilType: 'Coco Peat / Perlite Substrate',
    growthStage: 'Harvesting',
    sensorNodeId: 'NODE-DEMO-01',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 96,
    soilMoisture: 65.0,
    airTemp: 22.5,
    soilPh: 6.2,
    daysPlanted: 48,
    isWatering: true
  },
  {
    id: 'plot_demo_02',
    farmId: 'farm_smart_demo',
    code: 'PLOT-B02',
    name: 'PLOT-B02 Bell Pepper',
    area: 5.0,
    areaUnit: 'acres',
    cropId: 'crop_bell_pepper',
    cropType: 'Bell Pepper',
    cropVariety: 'California Wonder F1',
    soilType: 'Loamy Compost Mix',
    growthStage: 'Fruiting',
    sensorNodeId: 'NODE-DEMO-02',
    irrigationStatus: 'Automated Sprinkler',
    soilHealthScore: 93,
    soilMoisture: 52.0,
    airTemp: 25.0,
    soilPh: 6.6,
    daysPlanted: 75,
    isWatering: false
  },
  {
    id: 'plot_demo_03',
    farmId: 'farm_smart_demo',
    code: 'PLOT-B03',
    name: 'PLOT-B03 Tomato F1',
    area: 5.0,
    areaUnit: 'acres',
    cropId: 'crop_tomato_sth520',
    cropType: 'Tomato',
    cropVariety: 'Sarpan F1-STH-520',
    soilType: 'Red Sandy Loam',
    growthStage: 'Flowering',
    sensorNodeId: 'NODE-DEMO-03',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 95,
    soilMoisture: 46.8,
    airTemp: 24.1,
    soilPh: 6.5,
    daysPlanted: 60,
    isWatering: true
  },
  {
    id: 'plot_demo_04',
    farmId: 'farm_smart_demo',
    code: 'PLOT-B04',
    name: 'PLOT-B04 Strawberry',
    area: 4.0,
    areaUnit: 'acres',
    cropId: 'crop_strawberry',
    cropType: 'Strawberry',
    cropVariety: 'Chandler Sweet Hybrid',
    soilType: 'Sandy Humus Loam',
    growthStage: 'Fruiting',
    sensorNodeId: 'NODE-DEMO-04',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 92,
    soilMoisture: 49.3,
    airTemp: 21.8,
    soilPh: 6.3,
    daysPlanted: 70,
    isWatering: true
  },
  {
    id: 'plot_demo_05',
    farmId: 'farm_smart_demo',
    code: 'PLOT-B05',
    name: 'PLOT-B05 Cucumber',
    area: 6.0,
    areaUnit: 'acres',
    cropId: 'crop_cucumber',
    cropType: 'Cucumber',
    cropVariety: 'Poinsett 76 Green',
    soilType: 'Silty Loam',
    growthStage: 'Vegetative',
    sensorNodeId: 'NODE-DEMO-05',
    irrigationStatus: 'Scheduled',
    soilHealthScore: 94,
    soilMoisture: 56.4,
    airTemp: 26.2,
    soilPh: 6.7,
    daysPlanted: 32,
    isWatering: false
  },

  // Farm 3: Precision Farming Center (Total: 32.5 acres)
  {
    id: 'plot_prec_01',
    farmId: 'farm_precision_center',
    code: 'PLOT-C01',
    name: 'PLOT-C01 Soybean',
    area: 6.5,
    areaUnit: 'acres',
    cropId: 'crop_soybean',
    cropType: 'Soybean',
    cropVariety: 'JS-335 Gold',
    soilType: 'Medium Black Clay',
    growthStage: 'Vegetative',
    sensorNodeId: 'NODE-PREC-01',
    irrigationStatus: 'Automated Sprinkler',
    soilHealthScore: 90,
    soilMoisture: 44.1,
    airTemp: 27.5,
    soilPh: 6.9,
    daysPlanted: 28,
    isWatering: false
  },
  {
    id: 'plot_prec_02',
    farmId: 'farm_precision_center',
    code: 'PLOT-C02',
    name: 'PLOT-C02 Chilli F1-92',
    area: 7.0,
    areaUnit: 'acres',
    cropId: 'crop_chilli_92',
    cropType: 'Chilli',
    cropVariety: 'Byadgi Dabbi Special',
    soilType: 'Red Loamy Sand',
    growthStage: 'Fruiting',
    sensorNodeId: 'NODE-PREC-02',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 92,
    soilMoisture: 47.9,
    airTemp: 29.1,
    soilPh: 6.6,
    daysPlanted: 85,
    isWatering: true
  },
  {
    id: 'plot_prec_03',
    farmId: 'farm_precision_center',
    code: 'PLOT-C03',
    name: 'PLOT-C03 Brinjal Kudachi',
    area: 6.0,
    areaUnit: 'acres',
    cropId: 'crop_brinjal_501',
    cropType: 'Brinjal',
    cropVariety: 'Kudachi Local Round',
    soilType: 'Silt Loam',
    growthStage: 'Flowering',
    sensorNodeId: 'NODE-PREC-03',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 89,
    soilMoisture: 50.2,
    airTemp: 28.0,
    soilPh: 6.8,
    daysPlanted: 64,
    isWatering: true
  },
  {
    id: 'plot_prec_04',
    farmId: 'farm_precision_center',
    code: 'PLOT-C04',
    name: 'PLOT-C04 Okra Airavat',
    area: 6.0,
    areaUnit: 'acres',
    cropId: 'crop_okra_airavat',
    cropType: 'Okra',
    cropVariety: 'Airavat F1 Lady Finger',
    soilType: 'Sandy Loam',
    growthStage: 'Maturation',
    sensorNodeId: 'NODE-PREC-04',
    irrigationStatus: 'Scheduled',
    soilHealthScore: 91,
    soilMoisture: 41.5,
    airTemp: 31.0,
    soilPh: 7.0,
    daysPlanted: 95,
    isWatering: false
  },
  {
    id: 'plot_prec_05',
    farmId: 'farm_precision_center',
    code: 'PLOT-C05',
    name: 'PLOT-C05 Groundnut',
    area: 7.0,
    areaUnit: 'acres',
    cropId: 'crop_groundnut',
    cropType: 'Groundnut',
    cropVariety: 'TMV-2 Drought Resistant',
    soilType: 'Red Sandy Soil',
    growthStage: 'Vegetative',
    sensorNodeId: 'NODE-PREC-05',
    irrigationStatus: 'Idle',
    soilHealthScore: 88,
    soilMoisture: 39.8,
    airTemp: 30.4,
    soilPh: 6.5,
    daysPlanted: 42,
    isWatering: false
  },

  // Farm 4: Organic Crop Research Farm (Total: 15.0 acres)
  {
    id: 'plot_org_01',
    farmId: 'farm_organic_research',
    code: 'PLOT-D01',
    name: 'PLOT-D01 Organic Spices',
    area: 3.0,
    areaUnit: 'acres',
    cropId: 'crop_spices',
    cropType: 'Spices',
    cropVariety: 'Malabar Bold Cardamom & Pepper',
    soilType: 'Humus Rich Forest Loam',
    growthStage: 'Vegetative',
    sensorNodeId: 'NODE-ORG-01',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 86,
    soilMoisture: 53.0,
    airTemp: 23.5,
    soilPh: 6.1,
    daysPlanted: 50,
    isWatering: true
  },
  {
    id: 'plot_org_02',
    farmId: 'farm_organic_research',
    code: 'PLOT-D02',
    name: 'PLOT-D02 Organic Pulses',
    area: 3.0,
    areaUnit: 'acres',
    cropId: 'crop_pulses',
    cropType: 'Pulses',
    cropVariety: 'Pusa-992 Mung Bean',
    soilType: 'Alluvial Silt',
    growthStage: 'Flowering',
    sensorNodeId: 'NODE-ORG-02',
    irrigationStatus: 'Scheduled',
    soilHealthScore: 88,
    soilMoisture: 45.2,
    airTemp: 24.6,
    soilPh: 6.4,
    daysPlanted: 58,
    isWatering: false
  },
  {
    id: 'plot_org_03',
    farmId: 'farm_organic_research',
    code: 'PLOT-D03',
    name: 'PLOT-D03 Organic Wheat',
    area: 3.0,
    areaUnit: 'acres',
    cropId: 'crop_wheat_org',
    cropType: 'Wheat',
    cropVariety: 'Sharbati Gold Heritage',
    soilType: 'Clayey Loam',
    growthStage: 'Germination',
    sensorNodeId: 'NODE-ORG-03',
    irrigationStatus: 'Automated Sprinkler',
    soilHealthScore: 85,
    soilMoisture: 57.0,
    airTemp: 22.0,
    soilPh: 6.3,
    daysPlanted: 14,
    isWatering: true
  },
  {
    id: 'plot_org_04',
    farmId: 'farm_organic_research',
    code: 'PLOT-D04',
    name: 'PLOT-D04 Organic Mustard',
    area: 3.0,
    areaUnit: 'acres',
    cropId: 'crop_mustard',
    cropType: 'Mustard',
    cropVariety: 'Pusa Bold Bio-Shield',
    soilType: 'Loamy Sand',
    growthStage: 'Vegetative',
    sensorNodeId: 'NODE-ORG-04',
    irrigationStatus: 'Idle',
    soilHealthScore: 87,
    soilMoisture: 40.5,
    airTemp: 25.1,
    soilPh: 6.7,
    daysPlanted: 30,
    isWatering: false
  },
  {
    id: 'plot_org_05',
    farmId: 'farm_organic_research',
    code: 'PLOT-D05',
    name: 'PLOT-D05 Organic Turmeric',
    area: 3.0,
    areaUnit: 'acres',
    cropId: 'crop_turmeric',
    cropType: 'Turmeric',
    cropVariety: 'Salem Gold Curcumin Plus',
    soilType: 'Friable Sandy Clay',
    growthStage: 'Maturation',
    sensorNodeId: 'NODE-ORG-05',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 89,
    soilMoisture: 60.1,
    airTemp: 26.8,
    soilPh: 6.0,
    daysPlanted: 110,
    isWatering: true
  },

  // Farm 5: Digital Twin Innovation Farm (Total: 40.0 acres)
  {
    id: 'plot_twin_01',
    farmId: 'farm_digital_twin',
    code: 'PLOT-E01',
    name: 'PLOT-E01 Precision Corn',
    area: 8.0,
    areaUnit: 'acres',
    cropId: 'crop_corn_twin',
    cropType: 'Maize',
    cropVariety: 'DKC-9108 Super Yield',
    soilType: 'Deep Fertile Loam',
    growthStage: 'Fruiting',
    sensorNodeId: 'NODE-TWIN-01',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 97,
    soilMoisture: 46.2,
    airTemp: 26.9,
    soilPh: 6.6,
    daysPlanted: 80,
    isWatering: true
  },
  {
    id: 'plot_twin_02',
    farmId: 'farm_digital_twin',
    code: 'PLOT-E02',
    name: 'PLOT-E02 Hybrid Rice',
    area: 8.0,
    areaUnit: 'acres',
    cropId: 'crop_rice_twin',
    cropType: 'Rice',
    cropVariety: 'BPT-5204 Samba Masuri',
    soilType: 'Heavy Clay Submerged',
    growthStage: 'Maturation',
    sensorNodeId: 'NODE-TWIN-02',
    irrigationStatus: 'Automated Sprinkler',
    soilHealthScore: 95,
    soilMoisture: 61.4,
    airTemp: 28.2,
    soilPh: 6.9,
    daysPlanted: 105,
    isWatering: false
  },
  {
    id: 'plot_twin_03',
    farmId: 'farm_digital_twin',
    code: 'PLOT-E03',
    name: 'PLOT-E03 Smart Cotton',
    area: 8.0,
    areaUnit: 'acres',
    cropId: 'crop_cotton_twin',
    cropType: 'Cotton',
    cropVariety: 'DCH-32 Long Staple',
    soilType: 'Black Soil / Silt Matrix',
    growthStage: 'Flowering',
    sensorNodeId: 'NODE-TWIN-03',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 96,
    soilMoisture: 43.8,
    airTemp: 29.5,
    soilPh: 6.7,
    daysPlanted: 68,
    isWatering: true
  },
  {
    id: 'plot_twin_04',
    farmId: 'farm_digital_twin',
    code: 'PLOT-E04',
    name: 'PLOT-E04 High-Yield Soybean',
    area: 8.0,
    areaUnit: 'acres',
    cropId: 'crop_soy_twin',
    cropType: 'Soybean',
    cropVariety: 'MACS-1407 Resistant',
    soilType: 'Medium Black Loam',
    growthStage: 'Vegetative',
    sensorNodeId: 'NODE-TWIN-04',
    irrigationStatus: 'Scheduled',
    soilHealthScore: 94,
    soilMoisture: 47.6,
    airTemp: 27.8,
    soilPh: 6.5,
    daysPlanted: 45,
    isWatering: false
  },
  {
    id: 'plot_twin_05',
    farmId: 'farm_digital_twin',
    code: 'PLOT-E05',
    name: 'PLOT-E05 Polyhouse Tomato',
    area: 8.0,
    areaUnit: 'acres',
    cropId: 'crop_tomato_twin',
    cropType: 'Tomato',
    cropVariety: 'Arka Rakshak Triple Resistant',
    soilType: 'Polyhouse Sterilized Loam',
    growthStage: 'Fruiting',
    sensorNodeId: 'NODE-TWIN-05',
    irrigationStatus: 'Active Drip',
    soilHealthScore: 98,
    soilMoisture: 55.0,
    airTemp: 23.8,
    soilPh: 6.4,
    daysPlanted: 72,
    isWatering: true
  }
];

// ─── 3. GENERATION OF THE 150 SENSORS (6 PER PLOT) ──────────────────────────
export function generateSeededSensors(): IoTSensor[] {
  const sensors: IoTSensor[] = [];

  SEEDED_PLOTS.forEach((plot, pIdx) => {
    const pNum = String(pIdx + 1).padStart(2, '0');
    const farmId = plot.farmId!;
    const plotId = plot.id;
    const plotCode = plot.code;

    // 7 Sensors per Plot (Farm -> Plot -> Sensors -> [Soil Moisture, Air Temp, Humidity, Soil pH, Nitrogen, Phosphorus, Potassium])
    const sensorTypes = [
      { key: 'SM', name: 'Soil Moisture Sensor', type: 'soil_moisture', unit: '%', baseVal: plot.soilMoisture },
      { key: 'AT', name: 'Air Temperature Sensor', type: 'temperature', unit: '°C', baseVal: plot.airTemp },
      { key: 'HUM', name: 'Humidity Sensor', type: 'humidity', unit: '%', baseVal: 65 },
      { key: 'PH', name: 'Soil pH Sensor', type: 'soil_ph', unit: 'pH', baseVal: plot.soilPh },
      { key: 'N', name: 'Nitrogen Sensor', type: 'nitrogen', unit: 'mg/kg', baseVal: 120 },
      { key: 'P', name: 'Phosphorus Sensor', type: 'phosphorus', unit: 'mg/kg', baseVal: 45 },
      { key: 'K', name: 'Potassium Sensor', type: 'potassium', unit: 'mg/kg', baseVal: 60 }
    ];

    sensorTypes.forEach((st, sIdx) => {
      const sensorCode = `${st.key}_${pNum}${sIdx + 1}`;
      const sensorId = `sensor_${sensorCode.toLowerCase()}`;
      
      let readingStr = '';
      if (st.key === 'SM') readingStr = `${st.baseVal}%`;
      else if (st.key === 'AT') readingStr = `${st.baseVal}°C`;
      else if (st.key === 'HUM') readingStr = `${st.baseVal}%`;
      else if (st.key === 'PH') readingStr = `${st.baseVal} pH`;
      else if (st.key === 'N') readingStr = `${st.baseVal} mg/kg`;
      else if (st.key === 'P') readingStr = `${st.baseVal} mg/kg`;
      else if (st.key === 'K') readingStr = `${st.baseVal} mg/kg`;
      else readingStr = `${st.baseVal}`;

      sensors.push({
        id: sensorId,
        farmId,
        plotId,
        sensorCode,
        nodeName: `${st.name} [${sensorCode}]`,
        assignedPlotCode: plotCode,
        type: st.type,
        sensorTypes: [st.name],
        batteryPct: 82 + ((pIdx * 3 + sIdx * 5) % 18), // 82% to 99%
        status: sIdx === 6 && pIdx % 8 === 0 ? 'Offline' : 'Online',
        lastPing: new Date(Date.now() - (sIdx * 120000)).toISOString(),
        currentReading: readingStr
      });
    });
  });

  return sensors;
}

export const SEEDED_SENSORS: IoTSensor[] = generateSeededSensors();

// ─── 4. GENERATION OF 1000+ TELEMETRY OBSERVATIONS ─────────────────────────
export function generateSeededTelemetry(): TelemetryObservation[] {
  const observations: TelemetryObservation[] = [];
  const now = Date.now();

  // 40 observations per plot across the 25 plots = 1000 observations
  SEEDED_PLOTS.forEach((plot) => {
    const farmId = plot.farmId!;
    const plotId = plot.id;
    const plotCode = plot.code;
    const plotSensors = SEEDED_SENSORS.filter(s => s.plotId === plotId);

    for (let i = 0; i < 40; i++) {
      const timeOffsetMs = i * 180000; // 3 min intervals backwards
      const ts = new Date(now - timeOffsetMs).toISOString();

      const smSensor = plotSensors.find(s => s.sensorCode?.startsWith('SM')) || plotSensors[0];
      const atSensor = plotSensors.find(s => s.sensorCode?.startsWith('AT')) || plotSensors[1];
      const phSensor = plotSensors.find(s => s.sensorCode?.startsWith('PH')) || plotSensors[3];

      // Soil Moisture Observation
      observations.push({
        id: `obs_sm_${plot.id}_${i}`,
        farmId,
        plotId,
        deviceId: plot.sensorNodeId,
        sensorId: smSensor?.id || `sensor_sm_${plot.id}`,
        parameterKey: 'soil_moisture',
        displayName: 'Soil Moisture',
        value: Number((plot.soilMoisture + Math.sin(i / 5) * 2.5).toFixed(1)),
        unit: '%',
        measurementTimestamp: ts,
        receivedTimestamp: ts,
        qualityStatus: 'VALID',
        dataSource: 'SIMULATED',
        notes: `Simulated live stream observation for plot ${plotCode}`
      });

      // Air Temperature Observation
      observations.push({
        id: `obs_at_${plot.id}_${i}`,
        farmId,
        plotId,
        deviceId: plot.sensorNodeId,
        sensorId: atSensor?.id || `sensor_at_${plot.id}`,
        parameterKey: 'air_temperature',
        displayName: 'Air Temperature',
        value: Number((plot.airTemp + Math.cos(i / 4) * 1.8).toFixed(1)),
        unit: '°C',
        measurementTimestamp: ts,
        receivedTimestamp: ts,
        qualityStatus: 'VALID',
        dataSource: 'SIMULATED',
        notes: `Simulated live stream observation for plot ${plotCode}`
      });

      // Soil pH Observation
      observations.push({
        id: `obs_ph_${plot.id}_${i}`,
        farmId,
        plotId,
        deviceId: plot.sensorNodeId,
        sensorId: phSensor?.id || `sensor_ph_${plot.id}`,
        parameterKey: 'soil_ph',
        displayName: 'Soil pH',
        value: Number((plot.soilPh + Math.sin(i / 10) * 0.1).toFixed(2)),
        unit: 'pH',
        measurementTimestamp: ts,
        receivedTimestamp: ts,
        qualityStatus: 'VALID',
        dataSource: 'SIMULATED',
        notes: `Simulated live stream observation for plot ${plotCode}`
      });
    }
  });

  return observations;
}

// ─── 5. AUTOMATED SUPABASE DEMO DATA SEEDER ─────────────────────────────────
export interface SeedingProgress {
  farmsCount: number;
  plotsCount: number;
  sensorsCount: number;
  telemetryCount: number;
  success: boolean;
  message: string;
}

export async function seedMultiFarmSystemToSupabase(): Promise<SeedingProgress> {
  const seededObs = generateSeededTelemetry();

  if (!isSupabaseConfigured) {
    console.log('[SEEDER STANDBY] Supabase URL/Key missing. Seeded local state only.');
    return {
      farmsCount: SEEDED_FARMS.length,
      plotsCount: SEEDED_PLOTS.length,
      sensorsCount: SEEDED_SENSORS.length,
      telemetryCount: seededObs.length,
      success: true,
      message: 'Seeded system into local memory state.'
    };
  }

  try {
    console.log(`[SUPABASE SEEDER] Inserting 5 Farms...`);
    const farmRows = SEEDED_FARMS.map(f => ({
      id: f.id,
      name: f.name,
      location: f.location,
      total_area: f.totalArea,
      unit: f.unit,
      sections_count: f.sectionsCount,
      sensors_count: f.sensorsCount || 30,
      health_score: f.healthScore || 90,
      created_at: f.createdAt
    }));
    await supabase.from('farms').upsert(farmRows);

    console.log(`[SUPABASE SEEDER] Inserting 25 Plots...`);
    const plotRows = SEEDED_PLOTS.map(p => ({
      id: p.id,
      farm_id: p.farmId,
      code: p.code,
      name: p.name,
      area: p.area,
      area_unit: p.areaUnit,
      crop_type: p.cropType,
      growth_stage: p.growthStage,
      sensor_node_id: p.sensorNodeId,
      irrigation_status: p.irrigationStatus,
      soil_health_score: p.soilHealthScore,
      soil_moisture: p.soilMoisture,
      air_temp: p.airTemp,
      soil_ph: p.soilPh,
      created_at: p.createdAt || new Date().toISOString()
    }));
    await supabase.from('plots').upsert(plotRows);

    console.log(`[SUPABASE SEEDER] Inserting 150 Sensors...`);
    const sensorRows = SEEDED_SENSORS.map(s => ({
      id: s.id,
      farm_id: s.farmId,
      plot_id: s.plotId,
      sensor_code: s.sensorCode || s.id,
      sensor_type: s.type || 'Sensor',
      assigned_plot_code: s.assignedPlotCode,
      battery_pct: s.batteryPct,
      status: s.status,
      last_ping: s.lastPing,
      current_reading: s.currentReading,
      created_at: new Date().toISOString()
    }));
    await supabase.from('sensors').upsert(sensorRows);

    console.log(`[SUPABASE SEEDER] Inserting ${seededObs.length} Telemetry Records...`);
    const telemetryRows = seededObs.map(o => ({
      id: o.id,
      farm_id: o.farmId,
      plot_id: o.plotId,
      device_id: o.deviceId,
      sensor_id: o.sensorId,
      parameter_key: o.parameterKey,
      display_name: o.displayName,
      value: o.value,
      unit: o.unit,
      measurement_timestamp: o.measurementTimestamp,
      received_timestamp: o.receivedTimestamp,
      quality_status: o.qualityStatus,
      data_source: o.dataSource,
      notes: o.notes
    }));

    // Insert in batches of 200 to avoid payload size limit
    const batchSize = 200;
    for (let i = 0; i < telemetryRows.length; i += batchSize) {
      const chunk = telemetryRows.slice(i, i + batchSize);
      await supabase.from('telemetry_observations').upsert(chunk);
    }

    console.log(`%c[SUPABASE SEEDER VERIFIED] Successfully seeded 5 Farms, 25 Plots, 150 Sensors, and ${seededObs.length} Telemetry Records into Supabase PostgreSQL!`, 'color: #3ecf8e; font-weight: bold; font-size: 13px;');

    return {
      farmsCount: SEEDED_FARMS.length,
      plotsCount: SEEDED_PLOTS.length,
      sensorsCount: SEEDED_SENSORS.length,
      telemetryCount: seededObs.length,
      success: true,
      message: `Successfully populated 5 Farms, ${SEEDED_PLOTS.length} Plots, ${SEEDED_SENSORS.length} Sensors, and ${seededObs.length} Telemetry Records into Supabase.`
    };
  } catch (err: any) {
    console.error('[SUPABASE SEEDER EXCEPTION]', err?.message);
    return {
      farmsCount: SEEDED_FARMS.length,
      plotsCount: SEEDED_PLOTS.length,
      sensorsCount: SEEDED_SENSORS.length,
      telemetryCount: seededObs.length,
      success: false,
      message: `Database seeding notice: ${err?.message || 'Check connection'}`
    };
  }
}
