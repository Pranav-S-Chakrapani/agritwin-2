import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Crop, Farmland, PlotBed, UserProfile, AuditLogEntry, TelemetryObservation, IoTSensor, FieldActivity, FarmAlert } from '../types';
import {
  saveFarmsToSupabase,
  savePlotsToSupabase,
  saveSensorsToSupabase,
  deleteFarmFromSupabase,
  deletePlotFromSupabase,
  saveActivityToSupabase,
  saveAlertToSupabase,
  subscribeToSupabaseMultiTable,
  saveTelemetryObservationToSupabase,
  clearSimulatedTelemetryFromSupabase,
  isSupabaseConfigured
} from '../lib/supabase';
import { telemetrySimulator } from '../services/telemetrySimulator';
import { SEEDED_FARMS, SEEDED_PLOTS, SEEDED_SENSORS, generateSeededTelemetry, seedMultiFarmSystemToSupabase } from '../lib/multi-farm-seeder';
import { ActivityLogger, setActivityCallback, seedActivityLog } from '../lib/activity-logger';
import { evaluatePlotAlerts, evaluateSensorAlerts } from '../lib/alert-engine';

export const STORE_KEYS = {
  CROPS: 'agritwin_crops',
  FARMLANDS: 'agritwin_farmlands',
  PLOTS: 'agritwin_plots',
  SENSORS: 'agritwin_sensors',
  USERS: 'agritwin_users',
  AUDIT_LOGS: 'agritwin_audit_logs',
  TELEMETRY_OBSERVATIONS: 'agritwin_telemetry_observations',
  FIELD_ACTIVITIES: 'agritwin_field_activities',
  ALERTS: 'agritwin_alerts',
  ACTIVE_FARM_ID: 'agritwin_active_farm_id',
  CURRENT_USER: 'agritwin_current_user_profile',
  DEMO_TELEMETRY_ACTIVE: 'agritwin_demo_telemetry_active'
} as const;

export const SEED_CROPS: Crop[] = [
  {
    id: 'crop_tomato_sarpan',
    name: 'Tomato',
    variety: 'Sarpan F1-STH-520',
    growthDurationDays: 105,
    waterRequirementLpd: 4.5,
    idealMoistureMin: 55,
    idealMoistureMax: 75,
    idealTempMin: 20,
    idealTempMax: 28,
    idealPhMin: 6.0,
    idealPhMax: 6.8,
    gddBaseTemp: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: 'crop_chilli_byadgi',
    name: 'Chilli',
    variety: 'Byadgi Dabbi',
    growthDurationDays: 150,
    waterRequirementLpd: 3.2,
    idealMoistureMin: 50,
    idealMoistureMax: 70,
    idealTempMin: 22,
    idealTempMax: 32,
    idealPhMin: 6.2,
    idealPhMax: 7.2,
    gddBaseTemp: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: 'crop_cotton_rch',
    name: 'Cotton',
    variety: 'Bt-Hybrid RCH-2',
    growthDurationDays: 165,
    waterRequirementLpd: 6.0,
    idealMoistureMin: 45,
    idealMoistureMax: 65,
    idealTempMin: 24,
    idealTempMax: 35,
    idealPhMin: 6.5,
    idealPhMax: 7.8,
    gddBaseTemp: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: 'crop_corn_sugar',
    name: 'Sweet Corn / Maize',
    variety: 'Sugar-75',
    growthDurationDays: 90,
    waterRequirementLpd: 5.5,
    idealMoistureMin: 60,
    idealMoistureMax: 80,
    idealTempMin: 18,
    idealTempMax: 30,
    idealPhMin: 5.8,
    idealPhMax: 7.0,
    gddBaseTemp: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: 'crop_groundnut_tmv',
    name: 'Groundnut / Peanut',
    variety: 'TMV-2',
    growthDurationDays: 115,
    waterRequirementLpd: 3.0,
    idealMoistureMin: 40,
    idealMoistureMax: 60,
    idealTempMin: 22,
    idealTempMax: 30,
    idealPhMin: 6.0,
    idealPhMax: 7.0,
    gddBaseTemp: 13,
    createdAt: new Date().toISOString()
  }
];

export const SEED_USERS: UserProfile[] = [
  {
    uid: 'usr_admin_001',
    email: 'admin@agritwin.com',
    full_name: 'System Administrator',
    role: 'admin',
    assigned_farm_ids: ['farm_iiit_dharwad'],
    created_at: new Date().toISOString()
  },
  {
    uid: 'usr_farmer_002',
    email: 'farmer@agritwin.com',
    full_name: 'Irappa Patil',
    role: 'farmer',
    assigned_farm_ids: ['farm_iiit_dharwad'],
    created_at: new Date().toISOString()
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    plot_id: 'sec_a_tomato',
    plot_code: 'SEC-A',
    action_type: 'irrigation',
    triggered_by: 'manual',
    details: 'Precision drip cycle executed on SEC-A (Tomato). Moisture increased to 66.9%.'
  },
  {
    id: 'audit_02',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    plot_id: 'sec_b_chilli',
    plot_code: 'SEC-B',
    action_type: 'hvac',
    triggered_by: 'manual',
    details: 'Canopy ventilation fan activated on SEC-B (Chilli).'
  }
];

const SEED_ACTIVITIES: FieldActivity[] = [
  {
    id: 'act_init_1',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    farmId: 'farm_iiit_dharwad',
    plotId: 'plot_dharwad_01',
    eventType: 'farm_created',
    title: 'IIIT Dharwad Smart Farm Online',
    description: 'Central campus testbed connected to AgriTwin cloud telemetry.',
    severity: 'success',
    createdBy: 'System Administrator'
  },
  {
    id: 'act_init_2',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    farmId: 'farm_iiit_dharwad',
    plotId: 'plot_dharwad_01',
    eventType: 'sensor_online',
    title: 'Sensor Unit Node 01 Connected',
    description: 'Multi-parameter soil probe is transmitting data every 10s.',
    severity: 'success',
  },
  {
    id: 'act_init_3',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    farmId: 'farm_iiit_dharwad',
    plotId: 'plot_dharwad_02',
    eventType: 'irrigation_triggered',
    title: 'Automated Drip Cycle Complete',
    description: '15-minute moisture recovery cycle completed on Section B.',
    severity: 'info',
    createdBy: 'Automated Rule Engine'
  }
];

const SEED_INITIAL_ALERTS: FarmAlert[] = [
  {
    id: 'alert_init_1',
    farmId: 'farm_iiit_dharwad',
    plotId: 'plot_dharwad_03',
    alertType: 'low_soil_moisture',
    title: '⚠️ Low Soil Moisture — Section C (Cotton)',
    message: 'Soil moisture dropped to 31.5% in Section C. Drip pulse recommended.',
    severity: 'warning',
    status: 'active',
    parameterKey: 'soil_moisture',
    value: 31.5,
    threshold: 35,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString()
  }
];

interface AgriStoreContextType {
  crops: Crop[];
  farmlands: Farmland[];
  plots: PlotBed[];
  sensors: IoTSensor[];
  users: UserProfile[];
  auditLogs: AuditLogEntry[];
  fieldActivities: FieldActivity[];
  alerts: FarmAlert[];
  telemetryObservations: TelemetryObservation[];
  activeFarmland: Farmland | null;
  activeSections: PlotBed[];
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isWorker: boolean;
  isDemoTelemetryActive: boolean;
  toggleDemoTelemetry: (enable: boolean) => void;
  triggerTelemetrySimulationNow: () => Promise<void>;
  clearSimulatedTelemetry: () => Promise<{ count: number; message: string }>;
  seedMultiFarmSystem: () => Promise<any>;
  setCurrentUser: (u: UserProfile | null) => void;
  selectFarmland: (farmId: string) => void;
  addFarmland: (farmData: Omit<Farmland, 'id' | 'createdAt'>, sectionsData?: Array<Partial<PlotBed> & { code: string; name: string; area: number; cropId?: string | null }>) => Farmland;
  updateFarmland: (farmData: Farmland) => void;
  deleteFarmland: (farmId: string) => void;
  addPlot: (plotData: Omit<PlotBed, 'id' | 'createdAt'>) => PlotBed;
  updatePlot: (plotData: PlotBed) => void;
  deletePlot: (plotId: string) => void;
  addCrop: (cropData: Omit<Crop, 'id'>) => Crop;
  updateCrop: (cropData: Crop) => void;
  deleteCrop: (cropId: string) => void;
  assignCropToSection: (sectionId: string, cropId: string | null) => void;
  triggerActuator: (sectionId: string, type: 'irrigation' | 'hvac' | 'growLight', mode?: 'manual' | 'auto') => Promise<void>;
  addTelemetryObservation: (obsData: Omit<TelemetryObservation, 'id' | 'receivedTimestamp'>) => TelemetryObservation;
  addAlert: (alertData: Omit<FarmAlert, 'id' | 'createdAt'>) => FarmAlert;
  resolveAlert: (alertId: string, resolvedBy?: string) => void;
  dismissAlert: (alertId: string) => void;
  addFieldActivity: (activity: Omit<FieldActivity, 'id' | 'timestamp'>) => FieldActivity;
  addUser: (userData: Omit<UserProfile, 'uid' | 'created_at'>) => UserProfile;
  updateUserRole: (uid: string, role: any) => void;
  deleteUser: (uid: string) => void;
  exportFarmlandCsv: () => void;
}

const AgriStoreContext = createContext<AgriStoreContextType | undefined>(undefined);

const loadInitialState = <T,>(key: string, seed: T): T => {
  if (typeof window === 'undefined') return seed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(seed) ? ((Array.isArray(parsed) ? parsed : seed) as unknown as T) : ((parsed || seed) as T);
  } catch (e) {
    return seed;
  }
};

export const AgriStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [crops, setCrops] = useState<Crop[]>(() => loadInitialState(STORE_KEYS.CROPS, SEED_CROPS));
  const [farmlands, setFarmlands] = useState<Farmland[]>(() => loadInitialState(STORE_KEYS.FARMLANDS, SEEDED_FARMS));
  const [plots, setPlots] = useState<PlotBed[]>(() => loadInitialState(STORE_KEYS.PLOTS, SEEDED_PLOTS));
  const [sensors, setSensors] = useState<IoTSensor[]>(() => loadInitialState(STORE_KEYS.SENSORS, SEEDED_SENSORS));
  const [users, setUsers] = useState<UserProfile[]>(() => loadInitialState(STORE_KEYS.USERS, SEED_USERS));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadInitialState(STORE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS));
  const [fieldActivities, setFieldActivities] = useState<FieldActivity[]>(() => loadInitialState(STORE_KEYS.FIELD_ACTIVITIES, SEED_ACTIVITIES));
  const [alerts, setAlerts] = useState<FarmAlert[]>(() => loadInitialState(STORE_KEYS.ALERTS, SEED_INITIAL_ALERTS));
  const [telemetryObservations, setTelemetryObservations] = useState<TelemetryObservation[]>(() => loadInitialState(STORE_KEYS.TELEMETRY_OBSERVATIONS, generateSeededTelemetry()));

  const [activeFarmId, setActiveFarmId] = useState<string>(() => {
    if (typeof window === 'undefined') return SEEDED_FARMS[0].id;
    return localStorage.getItem(STORE_KEYS.ACTIVE_FARM_ID) || SEEDED_FARMS[0].id;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return loadInitialState(STORE_KEYS.CURRENT_USER, SEED_USERS[0]);
  });

  const [isDemoTelemetryActive, setIsDemoTelemetryActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORE_KEYS.DEMO_TELEMETRY_ACTIVE);
    return stored === null ? true : stored === 'true';
  });

  // Sync ActivityLogger callback to AgriStore state
  useEffect(() => {
    seedActivityLog(fieldActivities);
    setActivityCallback((newAct) => {
      setFieldActivities((prev) => [newAct, ...prev.filter((a) => a.id !== newAct.id)].slice(0, 500));
      saveActivityToSupabase(newAct);
    });
  }, []);

  const seedMultiFarmSystem = async () => {
    const res = await seedMultiFarmSystemToSupabase();
    setFarmlands(SEEDED_FARMS);
    setPlots(SEEDED_PLOTS);
    setSensors(SEEDED_SENSORS);
    setTelemetryObservations(generateSeededTelemetry());
    return res;
  };

  useEffect(() => {
    saveFarmsToSupabase(farmlands);
    savePlotsToSupabase(plots);
    saveSensorsToSupabase(sensors);
  }, []);

  // ── Ingestion Boundary Physiological Validator ────────────────────────────
  // Strict physical ranges: pH 3.5-9.0, Moisture 0-100%, Temp 15-42°C, Humidity 0-100%
  const validateAndTagTelemetry = (obs: TelemetryObservation): TelemetryObservation => {
    let qualityStatus = obs.qualityStatus || 'VALID';
    const key = (obs.parameterKey || '').toLowerCase();
    const val = Number(obs.value);

    if (isNaN(val)) {
      qualityStatus = 'SUSPECT';
    } else if (key.includes('ph') && (val < 3.5 || val > 9.0)) {
      qualityStatus = 'SUSPECT';
    } else if ((key.includes('moisture') || key.includes('sm')) && (val < 0.0 || val > 100.0)) {
      qualityStatus = 'SUSPECT';
    } else if ((key.includes('temp') || key.includes('at')) && (val < 10.0 || val > 48.0)) {
      qualityStatus = 'SUSPECT';
    } else if (key.includes('hum') && (val < 0.0 || val > 100.0)) {
      qualityStatus = 'SUSPECT';
    }

    return {
      ...obs,
      qualityStatus: qualityStatus as any,
    };
  };

  // Real-time Telemetry Processor (used by Supabase Realtime & Simulator)
  const processIncomingTelemetry = useCallback((incomingObs: TelemetryObservation[]) => {
    if (!incomingObs || incomingObs.length === 0) return;

    // Validate at the ingestion boundary
    const validatedIncoming = incomingObs.map(validateAndTagTelemetry);

    setTelemetryObservations((prev) => {
      const obsMap = new Map<string, TelemetryObservation>();
      (prev || []).forEach((o) => { if (o && o.id) obsMap.set(o.id, o); });
      validatedIncoming.forEach((o) => { if (o && o.id) obsMap.set(o.id, o); });

      const validObs = Array.from(obsMap.values()).filter((o) => o && o.id && o.measurementTimestamp);
      const mergedList = validObs.sort((a, b) => {
        const tA = new Date(a.measurementTimestamp).getTime() || 0;
        const tB = new Date(b.measurementTimestamp).getTime() || 0;
        return tB - tA;
      });

      // Update plot live telemetry state
      setPlots((prevPlots) => {
        const updatedPlots = prevPlots.map((plot) => {
          const plotObs = mergedList.filter((o) => o.plotId === plot.id || o.plotId === plot.code);
          if (plotObs.length === 0) return plot;

          const latestSm = plotObs.find((o) => o.parameterKey === 'soil_moisture' && o.qualityStatus !== 'SUSPECT');
          const latestTemp = plotObs.find((o) => (o.parameterKey === 'air_temperature' || o.parameterKey === 'soil_temperature') && o.qualityStatus !== 'SUSPECT');
          const latestPh = plotObs.find((o) => o.parameterKey === 'soil_ph' && o.qualityStatus !== 'SUSPECT');
          const latestHum = plotObs.find((o) => o.parameterKey === 'humidity' && o.qualityStatus !== 'SUSPECT');

          const newSm = latestSm ? latestSm.value : plot.soilMoisture;
          const newTemp = latestTemp ? latestTemp.value : plot.airTemp;
          const newPh = latestPh ? latestPh.value : plot.soilPh;
          const newHum = latestHum ? latestHum.value : plot.humidity;

          // Dynamically compute soil health score based on agronomic thresholds
          let healthScore = 95;
          if (newSm < 30 || newSm > 80) healthScore -= 12;
          else if (newSm < 40 || newSm > 70) healthScore -= 5;
          if (newTemp < 15 || newTemp > 35) healthScore -= 10;
          else if (newTemp < 18 || newTemp > 30) healthScore -= 4;
          if (newPh < 5.8 || newPh > 7.5) healthScore -= 8;

          return {
            ...plot,
            soilMoisture: newSm,
            airTemp: newTemp,
            soilPh: newPh,
            humidity: newHum,
            soilHealthScore: Math.max(50, Math.min(99, healthScore)),
          };
        });

        // Run alert evaluation on updated plots
        updatedPlots.forEach((p) => {
          setAlerts((currentAlerts) => {
            const newAlerts = evaluatePlotAlerts(p, currentAlerts);
            if (newAlerts.length > 0) {
              newAlerts.forEach((na) => {
                saveAlertToSupabase(na);
                ActivityLogger.alertGenerated(na.title, na.farmId, na.plotId);
              });
              return [...newAlerts, ...currentAlerts];
            }
            return currentAlerts;
          });
        });

        return updatedPlots;
      });

      return mergedList;
    });
  }, []);

  // Real-time Supabase Subscription
  useEffect(() => {
    const handleRealtimeActivity = (act: FieldActivity) => {
      setFieldActivities((prev) => [act, ...prev.filter((a) => a.id !== act.id)].slice(0, 500));
    };

    const handleRealtimeAlert = (alert: FarmAlert) => {
      setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
    };

    const unsubSupabase = subscribeToSupabaseMultiTable(
      processIncomingTelemetry,
      (f) => setFarmlands(f),
      (p) => setPlots(p),
      (s) => setSensors(s),
      handleRealtimeActivity,
      handleRealtimeAlert
    );

    return () => {
      unsubSupabase();
    };
  }, [processIncomingTelemetry]);

  const plotsRef = useRef(plots);
  const cropsRef = useRef(crops);
  const sensorsRef = useRef(sensors);
  useEffect(() => { plotsRef.current = plots; }, [plots]);
  useEffect(() => { cropsRef.current = crops; }, [crops]);
  useEffect(() => { sensorsRef.current = sensors; }, [sensors]);

  useEffect(() => {
    if (isDemoTelemetryActive) {
      telemetrySimulator.start(
        () => plotsRef.current,
        () => cropsRef.current,
        () => sensorsRef.current,
        (incomingObs, updatedSensors) => {
          if (incomingObs && incomingObs.length > 0) {
            processIncomingTelemetry(incomingObs);
          }
          if (updatedSensors && updatedSensors.length > 0) {
            setSensors((prev) => {
              const map = new Map<string, IoTSensor>();
              (prev || []).forEach((s) => map.set(s.id, s));
              updatedSensors.forEach((s) => {
                map.set(s.id, s);
                // Evaluate sensor alerts
                setAlerts((currAlerts) => {
                  const newAlerts = evaluateSensorAlerts(s, currAlerts);
                  if (newAlerts.length > 0) {
                    newAlerts.forEach((na) => saveAlertToSupabase(na));
                    return [...newAlerts, ...currAlerts];
                  }
                  return currAlerts;
                });
              });
              return Array.from(map.values());
            });
          }
        }
      );
    } else {
      telemetrySimulator.stop();
    }
  }, [isDemoTelemetryActive, processIncomingTelemetry]);

  const toggleDemoTelemetry = (enable: boolean) => {
    setIsDemoTelemetryActive(enable);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORE_KEYS.DEMO_TELEMETRY_ACTIVE, String(enable));
    }
  };

  const triggerTelemetrySimulationNow = async () => {
    await telemetrySimulator.triggerCycle((incomingObs, updatedSensors) => {
      if (incomingObs && incomingObs.length > 0) {
        processIncomingTelemetry(incomingObs);
      }
      if (updatedSensors && updatedSensors.length > 0) {
        setSensors((prev) => {
          const map = new Map<string, IoTSensor>();
          (prev || []).forEach((s) => map.set(s.id, s));
          updatedSensors.forEach((s) => map.set(s.id, s));
          return Array.from(map.values());
        });
      }
    });
  };

  const clearSimulatedTelemetry = async (): Promise<{ count: number; message: string }> => {
    // 1. Delete from Supabase
    const { count: deletedDbCount, error } = await clearSimulatedTelemetryFromSupabase();

    // 2. Filter out simulated telemetry from in-memory state
    let memoryDeleted = 0;
    setTelemetryObservations((prev) => {
      const nonSimulated = (prev || []).filter((o) => o.dataSource !== 'SIMULATED');
      memoryDeleted = (prev || []).length - nonSimulated.length;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORE_KEYS.TELEMETRY_OBSERVATIONS, JSON.stringify(nonSimulated.slice(0, 50)));
        } catch {}
      }
      return nonSimulated;
    });

    const totalPurged = Math.max(deletedDbCount, memoryDeleted);
    const msg = error
      ? `Purged ${memoryDeleted} records from local session (Supabase error: ${error.message})`
      : `Successfully purged ${totalPurged} SIMULATED telemetry observation(s) from database & session.`;

    ActivityLogger.plotUpdated('ALL', `Admin purged ${totalPurged} simulated records. Database restored to clean state.`);
    return { count: totalPurged, message: msg };
  };

  // LocalStorage Persist Effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.CROPS, JSON.stringify(crops)); } catch {}
    }
  }, [crops]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.FARMLANDS, JSON.stringify(farmlands)); } catch {}
    }
  }, [farmlands]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.PLOTS, JSON.stringify(plots)); } catch {}
    }
  }, [plots]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.SENSORS, JSON.stringify(sensors)); } catch {}
    }
  }, [sensors]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.USERS, JSON.stringify(users)); } catch {}
    }
  }, [users]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs)); } catch {}
    }
  }, [auditLogs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.FIELD_ACTIVITIES, JSON.stringify(fieldActivities.slice(0, 200))); } catch {}
    }
  }, [fieldActivities]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.ALERTS, JSON.stringify(alerts.slice(0, 100))); } catch {}
    }
  }, [alerts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cappedObs = (telemetryObservations || []).slice(0, 50);
        localStorage.setItem(STORE_KEYS.TELEMETRY_OBSERVATIONS, JSON.stringify(cappedObs));
      } catch {}
    }
  }, [telemetryObservations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORE_KEYS.ACTIVE_FARM_ID, activeFarmId); } catch {}
    }
  }, [activeFarmId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (currentUser) {
          localStorage.setItem(STORE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        } else {
          localStorage.removeItem(STORE_KEYS.CURRENT_USER);
        }
      } catch {}
    }
  }, [currentUser]);

  const activeFarmland = useMemo(() => {
    return farmlands.find((f) => f.id === activeFarmId) || farmlands[0] || null;
  }, [farmlands, activeFarmId]);

  const activeSections = useMemo(() => {
    if (!activeFarmland) return [];
    return plots.filter((p) => p.farmId === activeFarmland.id);
  }, [plots, activeFarmland]);

  const isAdmin = currentUser?.role === 'admin';
  const isWorker = currentUser?.role === 'farmer' || currentUser?.role === 'worker';

  const selectFarmland = (farmId: string) => {
    setActiveFarmId(farmId);
  };

  // ── FARM CRUD ─────────────────────────────────────────────────────────────
  const addFarmland = (
    farmData: Omit<Farmland, 'id' | 'createdAt'>,
    sectionsData?: Array<Partial<PlotBed> & { code: string; name: string; area: number; cropId?: string | null }>
  ): Farmland => {
    const farmId = `farm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFarmland: Farmland = {
      ...farmData,
      id: farmId,
      createdAt: new Date().toISOString(),
    };

    const newSections: PlotBed[] = (sectionsData || []).map((sec, idx) => ({
      id: `plot_${farmId}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      farmId,
      code: sec.code,
      name: sec.name,
      area: sec.area,
      areaUnit: sec.areaUnit || farmData.unit || 'acres',
      areaSqm: sec.areaSqm || sec.area * 4046.86,
      cropId: sec.cropId || null,
      sensorNodeId: `NODE-${farmId.slice(-4)}-${sec.code}`,
      sensorId: `NODE-${farmId.slice(-4)}-${sec.code}`,
      soilMoisture: sec.soilMoisture ?? 62,
      airTemp: sec.airTemp ?? 25,
      soilPh: sec.soilPh ?? 6.5,
      humidity: sec.humidity ?? 60,
      parLux: sec.parLux ?? 680,
      daysPlanted: sec.daysPlanted ?? 1,
      isWatering: false,
      hvacActive: false,
      createdAt: new Date().toISOString(),
    } as any));

    setFarmlands((prev) => [newFarmland, ...prev]);
    if (newSections.length > 0) {
      setPlots((prev) => [...prev, ...newSections]);
    }
    setActiveFarmId(farmId);

    saveFarmsToSupabase([newFarmland]);
    if (newSections.length > 0) {
      savePlotsToSupabase(newSections);
    }

    ActivityLogger.farmCreated(newFarmland.name, newFarmland.id, currentUser?.full_name);

    return newFarmland;
  };

  const updateFarmland = (farmData: Farmland) => {
    setFarmlands((prev) => prev.map((f) => (f.id === farmData.id ? farmData : f)));
    saveFarmsToSupabase([farmData]);
    ActivityLogger.farmUpdated(farmData.name, farmData.id, `Name/details updated`, currentUser?.full_name);
  };

  const deleteFarmland = (farmId: string) => {
    const target = farmlands.find((f) => f.id === farmId);
    setFarmlands((prev) => prev.filter((f) => f.id !== farmId));
    setPlots((prev) => prev.filter((p) => p.farmId !== farmId));
    setSensors((prev) => prev.filter((s) => s.farmId !== farmId));

    deleteFarmFromSupabase(farmId);

    if (activeFarmId === farmId) {
      const remaining = farmlands.filter((f) => f.id !== farmId);
      if (remaining.length > 0) setActiveFarmId(remaining[0].id);
    }

    if (target) {
      ActivityLogger.farmDeleted(target.name, target.id, currentUser?.full_name);
    }
  };

  // ── PLOT CRUD ─────────────────────────────────────────────────────────────
  const addPlot = (plotData: Omit<PlotBed, 'id' | 'createdAt'>): PlotBed => {
    const plotId = `plot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPlot: PlotBed = {
      ...plotData,
      id: plotId,
      createdAt: new Date().toISOString(),
    };

    setPlots((prev) => [...prev, newPlot]);
    savePlotsToSupabase([newPlot]);

    // Update parent farm sectionsCount
    if (plotData.farmId) {
      setFarmlands((prev) =>
        prev.map((f) => (f.id === plotData.farmId ? { ...f, sectionsCount: (f.sectionsCount || 0) + 1 } : f))
      );
    }

    ActivityLogger.plotCreated(newPlot.name, newPlot.farmId || '', newPlot.id, currentUser?.full_name);
    return newPlot;
  };

  const updatePlot = (plotData: PlotBed) => {
    setPlots((prev) => prev.map((p) => (p.id === plotData.id ? plotData : p)));
    savePlotsToSupabase([plotData]);
    ActivityLogger.plotUpdated(plotData.name, plotData.farmId || '', plotData.id, `Parameters/crop updated`, currentUser?.full_name);
  };

  const deletePlot = (plotId: string) => {
    const target = plots.find((p) => p.id === plotId);
    setPlots((prev) => prev.filter((p) => p.id !== plotId));
    deletePlotFromSupabase(plotId);
    if (target) {
      ActivityLogger.plotDeleted(target.name, target.farmId || '', target.id, currentUser?.full_name);
    }
  };

  // ── CROP CRUD ─────────────────────────────────────────────────────────────
  const addCrop = (cropData: Omit<Crop, 'id'>): Crop => {
    const newCrop: Crop = {
      ...cropData,
      id: `crop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setCrops((prev) => [newCrop, ...prev]);
    return newCrop;
  };

  const updateCrop = (cropData: Crop) => {
    setCrops((prev) => prev.map((c) => (c.id === cropData.id ? cropData : c)));
  };

  const deleteCrop = (cropId: string) => {
    setCrops((prev) => prev.filter((c) => c.id !== cropId));
    setPlots((prev) => prev.map((p) => (p.cropId === cropId ? { ...p, cropId: null } : p)));
  };

  const assignCropToSection = (sectionId: string, cropId: string | null) => {
    setPlots((prev) => prev.map((p) => (p.id === sectionId ? { ...p, cropId } : p)));
    const targetPlot = plots.find((p) => p.id === sectionId);
    if (targetPlot) {
      const crop = crops.find((c) => c.id === cropId);
      ActivityLogger.plotUpdated(
        targetPlot.name,
        targetPlot.farmId || '',
        targetPlot.id,
        `Assigned crop: ${crop ? crop.name : 'None'}`,
        currentUser?.full_name
      );
    }
  };

  // ── ACTUATOR TRIGGER ──────────────────────────────────────────────────────
  const triggerActuator = async (
    sectionId: string,
    type: 'irrigation' | 'hvac' | 'growLight',
    mode: 'manual' | 'auto' = 'manual'
  ) => {
    const plot = plots.find((p) => p.id === sectionId);
    const operator = currentUser?.full_name || 'System Operator';
    if (!plot) return;

    let updatedPlot = { ...plot };
    let details = '';

    if (type === 'irrigation') {
      const boostedMoisture = Math.min(95, Number((plot.soilMoisture + 8.5).toFixed(1)));
      updatedPlot = { ...plot, isWatering: true, soilMoisture: boostedMoisture };
      details = `${operator} executed 15-Min Precision Pulse on ${plot.code}. Moisture set to ${boostedMoisture}%. (${mode.toUpperCase()})`;
      ActivityLogger.irrigationTriggered(plot.code, boostedMoisture, operator, plot.farmId, plot.id);
    } else if (type === 'hvac') {
      const nextHvac = !plot.hvacActive;
      const reducedTemp = nextHvac ? Number((plot.airTemp - 2.0).toFixed(1)) : plot.airTemp;
      updatedPlot = { ...plot, hvacActive: nextHvac, airTemp: reducedTemp };
      details = `${operator} toggled Canopy Fan ${nextHvac ? 'ON' : 'OFF'} on ${plot.code}. Temp adjusted to ${reducedTemp}°C. (${mode.toUpperCase()})`;
      ActivityLogger.hvacTriggered(plot.code, nextHvac, reducedTemp, operator, plot.farmId, plot.id);
    } else {
      details = `${operator} toggled Grow Light on ${plot.code}. (${mode.toUpperCase()})`;
    }

    setPlots((prev) => prev.map((p) => (p.id === sectionId ? updatedPlot : p)));

    if (type === 'irrigation') {
      setTimeout(() => {
        setPlots((prev) => prev.map((p) => (p.id === sectionId ? { ...p, isWatering: false } : p)));
      }, 2000);
    }

    const newLog: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      plot_id: plot.id,
      plot_code: plot.code,
      action_type: type === 'growLight' ? 'grow_light' : type,
      triggered_by: mode,
      details,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // ── TELEMETRY OBSERVATION ─────────────────────────────────────────────────
  const addTelemetryObservation = (
    obsData: Omit<TelemetryObservation, 'id' | 'receivedTimestamp'>
  ): TelemetryObservation => {
    const id = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newObs: TelemetryObservation = {
      ...obsData,
      id,
      receivedTimestamp: new Date().toISOString(),
    };

    setTelemetryObservations((prev) => [newObs, ...prev]);
    saveTelemetryObservationToSupabase(newObs);

    // Update plot
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === obsData.plotId || p.code === obsData.plotId) {
          const updated = { ...p };
          if (obsData.parameterKey === 'soil_moisture') updated.soilMoisture = obsData.value;
          if (obsData.parameterKey === 'air_temperature') updated.airTemp = obsData.value;
          if (obsData.parameterKey === 'soil_ph') updated.soilPh = obsData.value;
          if (obsData.parameterKey === 'humidity') updated.humidity = obsData.value;
          return updated;
        }
        return p;
      })
    );

    ActivityLogger.manualObservation(
      obsData.displayName || obsData.parameterKey,
      obsData.value,
      obsData.unit,
      obsData.plotId,
      currentUser?.full_name || 'User',
      obsData.farmId,
      obsData.plotId
    );

    return newObs;
  };

  // ── ALERTS CRUD ───────────────────────────────────────────────────────────
  const addAlert = (alertData: Omit<FarmAlert, 'id' | 'createdAt'>): FarmAlert => {
    const newAlert: FarmAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    saveAlertToSupabase(newAlert);
    return newAlert;
  };

  const resolveAlert = (alertId: string, resolvedBy?: string) => {
    const target = alerts.find((a) => a.id === alertId);
    const by = resolvedBy || currentUser?.full_name || 'Operator';
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString(), resolvedBy: by }
          : a
      )
    );
    if (target) {
      ActivityLogger.alertResolved(target.title, by, target.farmId);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'dismissed' as const } : a))
    );
  };

  // ── FIELD ACTIVITY ────────────────────────────────────────────────────────
  const addFieldActivity = (activity: Omit<FieldActivity, 'id' | 'timestamp'>): FieldActivity => {
    const newAct: FieldActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setFieldActivities((prev) => [newAct, ...prev]);
    saveActivityToSupabase(newAct);
    return newAct;
  };

  // ── USER MANAGEMENT ───────────────────────────────────────────────────────
  const addUser = (userData: Omit<UserProfile, 'uid' | 'created_at'>): UserProfile => {
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser: UserProfile = {
      ...userData,
      uid,
      created_at: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUserRole = (uid: string, role: any) => {
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
    if (currentUser?.uid === uid) {
      setCurrentUser((prev) => (prev ? { ...prev, role } : null));
    }
  };

  const deleteUser = (uid: string) => {
    setUsers((prev) => prev.filter((u) => u.uid !== uid));
  };

  const exportFarmlandCsv = () => {
    const headers = ['Farm ID', 'Farm Name', 'Location', 'Total Area', 'Unit', 'Sections Count', 'Health Score'];
    const rows = farmlands.map((f) => [
      f.id,
      f.name,
      f.location,
      f.totalArea,
      f.unit,
      f.sectionsCount,
      f.healthScore ?? 90,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agritwin_farmlands_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    ActivityLogger.csvExported('Farmlands List', farmlands.length, currentUser?.full_name);
  };

  return (
    <AgriStoreContext.Provider
      value={{
        crops,
        farmlands,
        plots,
        sensors,
        users,
        auditLogs,
        fieldActivities,
        alerts,
        telemetryObservations,
        activeFarmland,
        activeSections,
        currentUser,
        isAdmin,
        isWorker,
        isDemoTelemetryActive,
        toggleDemoTelemetry,
        triggerTelemetrySimulationNow,
        clearSimulatedTelemetry,
        seedMultiFarmSystem,
        setCurrentUser,
        selectFarmland,
        addFarmland,
        updateFarmland,
        deleteFarmland,
        addPlot,
        updatePlot,
        deletePlot,
        addCrop,
        updateCrop,
        deleteCrop,
        assignCropToSection,
        triggerActuator,
        addTelemetryObservation,
        addAlert,
        resolveAlert,
        dismissAlert,
        addFieldActivity,
        addUser,
        updateUserRole,
        deleteUser,
        exportFarmlandCsv,
      }}
    >
      {children}
    </AgriStoreContext.Provider>
  );
};

export const useAgriStore = () => {
  const context = useContext(AgriStoreContext);
  if (!context) {
    throw new Error('useAgriStore must be used within an AgriStoreProvider');
  }
  return context;
};

export default AgriStoreProvider;
