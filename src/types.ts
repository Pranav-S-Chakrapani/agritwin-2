export type ViewMode = 'dashboard' | 'twin' | 'disease' | 'growth' | 'ripeness' | 'yield' | 'sensors' | 'alerts';

export type AreaUnit = 'acres' | 'hectares' | 'sqft' | 'sqm';

export type UserRole = 'admin' | 'farm_manager' | 'worker' | 'viewer' | 'farmer';

export interface FarmProfile {
  name: string;
  location: string;
  totalArea: number;
  unit: string;
  totalAreaSqm?: number;
  boundary?: [number, number][];
  createdAt?: string;
  onboardingCompleted?: boolean;
}

export interface Crop {
  id: string;
  name: string;
  variety: string;
  growthDurationDays: number;
  waterRequirementLpd: number;
  idealMoistureMin: number;
  idealMoistureMax: number;
  idealTempMin: number;
  idealTempMax: number;
  idealPhMin: number;
  idealPhMax: number;
  gddBaseTemp?: number;
  createdAt?: string;
}

export interface Farmland {
  id: string;
  name: string;
  location: string;
  address?: string;
  ownerName?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactRole?: 'Owner' | 'Manager' | 'Worker';
  hasMapCoordinates?: boolean;
  totalArea: number;
  unit: string;
  sectionsCount: number;
  sensorsCount?: number;
  healthScore?: number;
  lastUpdate?: string;
  createdAt: string;
}

export interface PlotBed {
  id: string;
  code: string;
  name: string;
  area: number;
  areaUnit: string;
  areaSqm?: number;
  cropId: string | null;
  cropType?: string;
  cropVariety?: string;
  soilType?: string;
  growthStage?: 'Germination' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Maturation' | 'Harvesting';
  sensorNodeId: string;
  sensorId?: string;
  boundaryCoordinates?: [number, number][];
  soilMoisture: number;
  airTemp: number;
  soilPh: number;
  humidity?: number;
  parLux?: number;
  daysPlanted: number;
  isWatering?: boolean;
  hvacActive?: boolean;
  irrigationStatus?: 'Active Drip' | 'Automated Sprinkler' | 'Scheduled' | 'Idle';
  soilHealthScore?: number;
  createdAt?: string;
  farmId?: string;
}

export interface IoTSensor {
  id: string;
  farmId?: string;
  plotId?: string;
  sensorCode?: string;
  nodeName: string;
  assignedPlotCode: string;
  type?: string;
  sensorTypes?: string[];
  batteryPct: number;
  status: 'Online' | 'Offline';
  lastPing: string;
  currentReading?: string;
}

export interface AuditLogEntry {
  id: string;
  plot_id: string;
  plot_code: string;
  action_type: 'irrigation' | 'hvac' | 'grow_light' | 'manual_note';
  triggered_by: 'auto' | 'manual';
  timestamp: string;
  details: string;
}

export type ActivityEventType =
  | 'telemetry_update'
  | 'sensor_online'
  | 'sensor_offline'
  | 'farm_created'
  | 'farm_updated'
  | 'farm_deleted'
  | 'plot_created'
  | 'plot_updated'
  | 'plot_deleted'
  | 'sensor_added'
  | 'sensor_removed'
  | 'alert_generated'
  | 'alert_resolved'
  | 'irrigation_triggered'
  | 'hvac_triggered'
  | 'user_login'
  | 'user_logout'
  | 'csv_export'
  | 'manual_observation'
  | 'settings_modified'
  | 'system_event';

export type ActivitySeverity = 'info' | 'warning' | 'critical' | 'success';

export interface FieldActivity {
  id: string;
  timestamp: string;
  farmId?: string;
  plotId?: string;
  sensorId?: string;
  eventType: ActivityEventType;
  title: string;
  description: string;
  severity: ActivitySeverity;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export type AlertType =
  | 'low_soil_moisture'
  | 'high_temperature'
  | 'low_humidity'
  | 'abnormal_ph'
  | 'sensor_offline'
  | 'data_missing'
  | 'critical_system_error'
  | 'high_soil_moisture'
  | 'low_temperature';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'dismissed';

export interface FarmAlert {
  id: string;
  farmId?: string;
  plotId?: string;
  sensorId?: string;
  alertType: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  parameterKey?: string;
  value?: number;
  threshold?: number;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  full_name: string;
  role: UserRole;
  assigned_farm_ids: string[];
  phone?: string;
  isActive?: boolean;
  created_at: string;
}

export type DataSourceType = 'MANUAL_PROTOTYPE' | 'SENSOR' | 'AI_ML' | 'DERIVED' | 'SIMULATION' | 'SIMULATED' | 'LIVE_SENSOR' | 'IMPORTED' | 'AI';

export interface TelemetryObservation {
  id: string;
  farmId: string;
  plotId: string;
  deviceId: string;
  sensorId: string;
  parameterKey: string;
  displayName: string;
  value: number;
  unit: string;
  measurementTimestamp: string;
  receivedTimestamp: string;
  qualityStatus: 'VALID' | 'WARNING' | 'INVALID' | 'SUSPECT';
  dataSource: DataSourceType;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ParameterDefinition {
  key: string;
  displayName: string;
  unit: string;
  category: 'soil' | 'atmosphere' | 'water' | 'crop';
  minRange: number;
  maxRange: number;
}

export interface TelemetryRecord {
  id?: string;
  timestamp: string;
  plotCode: string;
  cropName: string;
  soilMoisture: number;
  airTemp: number;
  soilPh: number;
  status: 'Optimal' | 'Low Water' | 'Heat Stress';
}

export interface CropParameter {
  id: string;
  name: string;
  unit: string;
  currentValue: number;
  targetValue: number;
  status: 'optimal' | 'warning' | 'critical';
  description: string;
  iconName: string;
  color: string;
  historicalData: { time: string; value: number; baseline: number }[];
}

export interface SensorData {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  sunlightLux: number;
  co2Level: number;
  lastUpdated: string;
  status: 'online' | 'offline' | 'warning';
}

export interface Alert {
  id: string;
  type: 'disease' | 'growth' | 'moisture' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface DigitalTwinCropState {
  cropType: string;
  plantingDate: string;
  currentDay: number;
  stage: 'Germination' | 'Vegetative' | 'Flowering' | 'Fruit Set' | 'Harvest Ready';
  healthScore: number;
  plantHeightCm: number;
  canopyCoveragePercent: number;
  growthRateCmPerDay: number;
  diseaseRiskPercent: number;
  diseaseDetected?: string;
  fruitRipenessPercent: number;
  estimatedYieldKgPerM2: number;
  sensors: SensorData;
  alerts: Alert[];
}

export interface AiVisionAnalysisResult {
  plantHeightEstimateCm: number;
  canopyCoveragePercent: number;
  growthStage: string;
  healthAssessment: {
    diseaseName: string;
    riskScore: number;
    severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
    recommendedAction: string;
  };
  fruitRipeness: {
    ripenessPercent: number;
    colorStage: string;
    daysToOptimalHarvest: number;
  };
  yieldProjectionKgPerM2: number;
  confidenceScore: number;
  keyObservations: string[];
}

export interface ArchitectureComponent {
  id: string;
  title: string;
  layer: 'hardware' | 'edge' | 'cloud' | 'digital-twin' | 'web-app';
  icon: string;
  description: string;
  techStack: string[];
  roleInProject: string;
}

export interface PresentationConfig {
  projectTitle: string;
  studentName: string;
  collegeName: string;
  teamMembers: string[];
  clientName: string;
}

export interface ExportFilter {
  dateFrom?: string;
  dateTo?: string;
  farmId?: string;
  plotId?: string;
  sensorId?: string;
  severity?: ActivitySeverity | 'all';
  eventType?: ActivityEventType | 'all';
  format?: 'csv' | 'excel';
}
