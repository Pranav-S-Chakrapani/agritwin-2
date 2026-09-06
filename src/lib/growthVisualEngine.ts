import { PlotBed, Crop } from '../types';
import { CropService } from '../services/canonicalServices';

export type CropCategory = 'grain' | 'tall_stalk' | 'bush_fruit' | 'generic';

export interface GrowthVisualState {
  stage: string;
  stageKey: 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
  cropCategory: CropCategory;
  cropName: string;
  vigor_score: number;
  canopy_scale: number;
  wilt_factor: number; // 0.0 (turgid, erect) to 1.0 (severely wilted/drooping)
  leaf_color: string;
  stem_color: string;
  fruit_color: string;
  fruit_count: number;
  fruit_scale: number;
  source: 'ai_vision' | 'heuristic_fallback' | 'manual_stage_only';
  sourceLabel: string;
  details: string;
}

/**
 * Computes the biophysical wilting factor of the plant (0.0 = fully turgid/erect, 1.0 = severely wilted/drooping).
 * As soil moisture drops below the species-appropriate threshold, vascular turgor pressure decreases,
 * causing stem curvature and downward leaf drooping.
 */
export function computeWiltFactor(soilMoisture?: number | null, idealMin = 45): number {
  if (soilMoisture === undefined || soilMoisture === null || isNaN(soilMoisture)) return 0.0;
  if (soilMoisture >= idealMin) return 0.0;
  
  // As moisture drops below idealMin (e.g. from 45% down to 15%), wilt factor scales from 0.0 to 1.0
  const severeThreshold = Math.max(10, idealMin * 0.35);
  if (soilMoisture <= severeThreshold) return 1.0;
  
  const factor = (idealMin - soilMoisture) / (idealMin - severeThreshold);
  return Number(Math.min(1.0, Math.max(0.0, factor)).toFixed(3));
}

/**
 * Maps a crop name to its structural 3D procedural plant archetype.
 */
export function getCropCategory(cropName?: string): CropCategory {
  if (!cropName) return 'bush_fruit';
  const name = cropName.toLowerCase();
  if (name.includes('wheat') || name.includes('rice') || name.includes('barley') || name.includes('grain')) {
    return 'grain';
  }
  if (name.includes('maize') || name.includes('corn') || name.includes('sugarcane') || name.includes('cane')) {
    return 'tall_stalk';
  }
  return 'bush_fruit'; // Cotton, Tomato, Chilli, Brinjal, Soybean, Strawberry, etc.
}

/**
 * Computes the single canonical 3D visual state for a crop plot.
 * Combines CropService stage resolution, real-time sensor biophysics, and AI Vision outputs.
 */
export function computeGrowthVisualState(
  plot?: PlotBed | null,
  crop?: Crop | null,
  visionData?: { diseaseRisk?: number; plantHeight?: number; canopyCoverage?: number; fruitRipeness?: number } | null
): GrowthVisualState {
  // 1. Single source of truth stage from CropService
  const stage = CropService.getCurrentStageForPlot(plot, crop);
  const stageKey = CropService.getCanopyStage(stage);
  const cropName = crop?.name || plot?.cropType || 'Crop';
  const cropCat = getCropCategory(cropName);

  const idealMoistureMin = crop?.idealMoistureMin || 45;
  const currentMoisture = plot?.soilMoisture ?? 55;
  const currentTemp = plot?.airTemp ?? 25;
  const currentPh = plot?.soilPh ?? 6.5;

  // 2. Compute Wilt Factor from Soil Moisture
  const wilt_factor = computeWiltFactor(currentMoisture, idealMoistureMin);

  // 3. Compute Vigor Score and Source Attribution
  let vigor_score = 85;
  let source: GrowthVisualState['source'] = 'manual_stage_only';
  let sourceLabel = 'Illustrative — awaiting sensor/vision data';
  let details = '';

  if (visionData && (visionData.diseaseRisk !== undefined || visionData.canopyCoverage !== undefined)) {
    source = 'ai_vision';
    sourceLabel = 'From AI Vision Scan';
    const diseasePenalty = (visionData.diseaseRisk || 0) * 1.4;
    const wiltPenalty = wilt_factor * 35;
    vigor_score = Math.max(15, Math.min(100, Math.round(100 - diseasePenalty - wiltPenalty)));
    details = `Vision scan detected ${visionData.canopyCoverage || 70}% canopy coverage, ${visionData.diseaseRisk || 2}% disease risk.`;
  } else if (plot && (plot.soilMoisture !== undefined || plot.airTemp !== undefined)) {
    source = 'heuristic_fallback';
    sourceLabel = 'Heuristic: soil-moisture based';
    
    // Heuristic score combining moisture, temp, and pH
    let score = 95;
    if (wilt_factor > 0) score -= wilt_factor * 45;
    if (currentTemp > 38 || currentTemp < 12) score -= 20;
    else if (currentTemp > 33 || currentTemp < 18) score -= 10;
    if (currentPh < 5.5 || currentPh > 8.0) score -= 15;
    
    vigor_score = Math.max(20, Math.min(100, Math.round(score)));
    details = `Calculated from live sensor readings: ${currentMoisture.toFixed(1)}% moisture, ${currentTemp.toFixed(1)}°C temp, pH ${currentPh.toFixed(2)}.`;
  }

  // 4. Canopy Scale Factor
  let canopy_scale = 1.0;
  if (visionData?.plantHeight) {
    canopy_scale = Number((visionData.plantHeight / 50).toFixed(2));
  } else {
    switch (stageKey) {
      case 'vegetative': canopy_scale = 0.65; break;
      case 'flowering':  canopy_scale = 0.88; break;
      case 'fruiting':   canopy_scale = 1.05; break;
      case 'harvest':    canopy_scale = 1.0; break;
      default:           canopy_scale = 0.75;
    }
  }

  // 5. Leaf & Foliage Color Shifting
  let leaf_color = '#10b981'; // vibrant emerald green
  let stem_color = '#059669'; // healthy stem green
  
  if (wilt_factor >= 0.7 || vigor_score < 45) {
    // Severe wilt / chlorosis: desiccated dry yellow-brown
    leaf_color = '#ca8a04';
    stem_color = '#78350f';
  } else if (wilt_factor >= 0.35 || vigor_score < 65) {
    // Moderate stress: pale yellowish-green
    leaf_color = '#84cc16';
    stem_color = '#65a30d';
  } else {
    // Healthy lush green
    leaf_color = cropCat === 'tall_stalk' ? '#16a34a' : '#10b981';
    stem_color = '#047857';
  }

  // 6. Fruit & Flower Attributes
  let fruit_color = '#ef4444'; // Red default (tomato / berries)
  let fruit_count = 0;
  let fruit_scale = 1.0;

  if (stageKey === 'flowering') {
    fruit_count = 3;
    fruit_scale = 0.4;
    fruit_color = cropName.toLowerCase().includes('cotton') ? '#f8fafc' : '#facc15'; // white or yellow blossoms
  } else if (stageKey === 'fruiting' || stageKey === 'harvest') {
    fruit_count = 5;
    fruit_scale = stageKey === 'harvest' ? 1.0 : 0.8;
    const lowCrop = cropName.toLowerCase();
    if (lowCrop.includes('cotton')) {
      fruit_color = '#ffffff'; // White cotton bolls
    } else if (lowCrop.includes('wheat') || lowCrop.includes('rice')) {
      fruit_color = '#eab308'; // Golden ripe grain
    } else if (lowCrop.includes('maize') || lowCrop.includes('corn')) {
      fruit_color = '#f59e0b'; // Amber maize cob
    } else if (lowCrop.includes('chilli') || lowCrop.includes('pepper')) {
      fruit_color = '#dc2626'; // Red chilli
    } else if (lowCrop.includes('brinjal') || lowCrop.includes('eggplant')) {
      fruit_color = '#7e22ce'; // Purple brinjal
    } else {
      fruit_color = '#ef4444'; // Red fruit
    }
  }

  return {
    stage,
    stageKey,
    cropCategory: cropCat,
    cropName,
    vigor_score,
    canopy_scale,
    wilt_factor,
    leaf_color,
    stem_color,
    fruit_color,
    fruit_count,
    fruit_scale,
    source,
    sourceLabel,
    details
  };
}
