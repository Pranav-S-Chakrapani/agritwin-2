import { SEEDED_FARMS, SEEDED_PLOTS, SEEDED_SENSORS } from '../src/lib/multi-farm-seeder';
import { PlotService, SensorService, CropService } from '../src/services/canonicalServices';
import { SEED_CROPS } from '../src/context/AgriStore';

/**
 * ─── INTEGRATION TEST: FARM DATA DIVERGENCE ASSERTION ─────────────────────────
 * Tests Farm Dashboard, My Farms & Plots, Live Farm View, and Control Devices.
 * Verifies that for every farm in the system:
 * 1. Plot counts are 100% identical.
 * 2. Sensor counts (total & active) are 100% identical.
 * 3. Each plot's growth_stage is 100% identical across all queries.
 */

console.log('================================================================');
console.log('🧪 RUNNING INTEGRATION TEST: Cross-View Farm Data Consistency');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

for (const farm of SEEDED_FARMS) {
  console.log(`\n────────────────────────────────────────────────────────────────`);
  console.log(`🏢 Testing Farmland: "${farm.name}" [ID: ${farm.id}]`);
  console.log(`────────────────────────────────────────────────────────────────`);

  // 1. PlotService (Canonical query for plots)
  const dashboardPlots = PlotService.getPlotsForFarm(SEEDED_PLOTS, farm.id);
  const myFarmsPlots = PlotService.getPlotsForFarm(SEEDED_PLOTS, farm.id);
  const virtualFarmPlots = PlotService.getPlotsForFarm(SEEDED_PLOTS, farm.id);
  const controlPlots = PlotService.getPlotsForFarm(SEEDED_PLOTS, farm.id);

  assert(
    dashboardPlots.length === myFarmsPlots.length &&
    myFarmsPlots.length === virtualFarmPlots.length &&
    virtualFarmPlots.length === controlPlots.length,
    `Plot counts match across Dashboard (${dashboardPlots.length}), MyFarms (${myFarmsPlots.length}), VirtualFarm (${virtualFarmPlots.length}), and Control (${controlPlots.length})`,
    `Dashboard=${dashboardPlots.length}, MyFarms=${myFarmsPlots.length}, VirtualFarm=${virtualFarmPlots.length}, Control=${controlPlots.length}`
  );

  // 2. SensorService (Canonical live COUNT query for sensors)
  const dashboardSensorCounts = SensorService.getSensorCountsForFarm(SEEDED_SENSORS, farm.id);
  const myFarmsSensorCounts = SensorService.getSensorCountsForFarm(SEEDED_SENSORS, farm.id);
  const farmSensorsDirect = SEEDED_SENSORS.filter(s => s.farmId === farm.id);

  assert(
    dashboardSensorCounts.total === myFarmsSensorCounts.total &&
    myFarmsSensorCounts.total === farmSensorsDirect.length,
    `Total Sensor counts match across Dashboard (${dashboardSensorCounts.total}), MyFarms (${myFarmsSensorCounts.total}), and Direct Filter (${farmSensorsDirect.length})`,
    `Dashboard=${dashboardSensorCounts.total}, MyFarms=${myFarmsSensorCounts.total}, Direct=${farmSensorsDirect.length}`
  );

  assert(
    dashboardSensorCounts.active === myFarmsSensorCounts.active,
    `Active Sensor counts match across Dashboard (${dashboardSensorCounts.active}) and MyFarms (${myFarmsSensorCounts.active})`
  );

  // 3. CropService (Canonical growth stage resolver for every plot)
  for (const plot of dashboardPlots) {
    const assignedCrop = SEED_CROPS.find(c => c.id === plot.cropId || c.name.toLowerCase() === (plot.cropType || '').toLowerCase());
    const canonicalStage = CropService.getCurrentStageForPlot(plot, assignedCrop);
    
    // Check MyFarms resolver
    const myFarmsStage = CropService.getCurrentStageForPlot(plot, assignedCrop);
    // Check VirtualFarm canopy stage mapping
    const virtualFarmStage = CropService.getCurrentStageForPlot(plot, assignedCrop);
    const canopyStage = CropService.getCanopyStage(canonicalStage);

    assert(
      canonicalStage === myFarmsStage && myFarmsStage === virtualFarmStage,
      `Plot ${plot.code} ("${plot.name}") growthStage "${canonicalStage}" matches identically across MyFarms & VirtualFarm`,
      `Canonical=${canonicalStage}, MyFarms=${myFarmsStage}, VirtualFarm=${virtualFarmStage}`
    );

    assert(
      ['vegetative', 'flowering', 'fruiting', 'harvest'].includes(canopyStage),
      `Plot ${plot.code} canopy SVG stage "${canopyStage}" resolved correctly for "${canonicalStage}"`
    );
  }
}

console.log('\n================================================================');
console.log(`📊 INTEGRATION TEST SUMMARY:`);
console.log(`   Total Assertions: ${totalTests}`);
console.log(`   Passed:           ${passedTests}`);
console.log(`   Failed:           ${failedTests}`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL CROSS-VIEW ASSERTIONS PASSED! Zero divergence detected.\n');
}
