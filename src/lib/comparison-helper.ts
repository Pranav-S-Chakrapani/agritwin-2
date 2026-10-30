import { getPlots, getHistory } from './farm-storage';

export const fetchComparisonData = async (arg1: string[] | string, arg2: string, arg3?: string) => {
  let targetPlotIds: string[] = [];
  let parameter: string = '';

  if (Array.isArray(arg1)) {
    targetPlotIds = arg1;
    parameter = arg2;
  } else if (arg3 !== undefined) {
    targetPlotIds = [arg1, arg2];
    parameter = arg3;
  } else {
    targetPlotIds = [arg1];
    parameter = arg2;
  }

  const allPlots = getPlots();
  const history = getHistory();
  const mergedMap = new Map();

  // Synthesize a realistic telemetry timeline based on active plot parameters
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  hours.forEach((timeStr, idx) => {
    const point: Record<string, any> = { time: timeStr };
    
    targetPlotIds.forEach((plotId) => {
      const p = allPlots.find(plot => plot.id === plotId || plot.code === plotId) || allPlots[0];
      const baseTemp = p?.airTemp || 24.0;
      const baseMoisture = p?.soilMoisture || 58.0;
      const basePh = p?.soilPh || 6.5;

      const tempVariation = Math.sin((idx / 7) * Math.PI) * 4.5 - 1.5;
      const moistureVariation = -Math.sin((idx / 7) * Math.PI) * 5.2;

      if (parameter === 'soilMoisture') {
        point[plotId] = Number(Math.max(30, Math.min(85, baseMoisture + moistureVariation)).toFixed(1));
        point.soilMoisture = point[plotId];
      } else if (parameter === 'airTemp') {
        point[plotId] = Number(Math.max(16, Math.min(38, baseTemp + tempVariation)).toFixed(1));
        point.airTemp = point[plotId];
      } else if (parameter === 'soilPh') {
        point[plotId] = Number((basePh + (Math.sin(idx) * 0.1)).toFixed(2));
        point.soilPh = point[plotId];
      } else {
        point[plotId] = Number((baseTemp + tempVariation).toFixed(1));
        point[parameter] = point[plotId];
      }
    });

    mergedMap.set(timeStr, point);
  });

  return Array.from(mergedMap.values());
};

export const getSavedComparisonSessions = (): any[] => {
  try {
    const raw = localStorage.getItem('agritwin_comparison_sessions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveComparisonSession = async (sessionName: string, arg1: string[] | string, arg2: string, arg3?: string) => {
  if (!sessionName) return;
  const sessions = getSavedComparisonSessions();
  const newSession = {
    id: `session_${Date.now()}`,
    name: sessionName,
    plots: Array.isArray(arg1) ? arg1 : [arg1, arg2].filter(Boolean),
    parameter: typeof arg2 === 'string' && !arg3 ? arg2 : arg3 || 'airTemp',
    createdAt: new Date().toISOString()
  };
  sessions.unshift(newSession);
  localStorage.setItem('agritwin_comparison_sessions', JSON.stringify(sessions.slice(0, 20)));
  return newSession;
};
