/**
 * Weather-driven generation model for Solar & Wind assets
 * Strictly deterministic physics-based formulas replacing random mock numbers.
 *
 * Requirements (Prompt 22):
 * - Solar: capacityMW * (radiation / ref_irradiance) * temp_derating, clamped to [0, capacityMW]
 * - Wind: capacityMW * power_curve(windspeed), cut-in ~3.5 m/s, rated ~12.5 m/s, cut-out ~25 m/s
 * - Realistic variance: ±3-5%
 * - Labeled: "Generation: modeled from live weather data — not live SCADA"
 */

export const GENERATION_LABEL = 'Generation: modeled from live weather data — not live SCADA';
export const WEATHER_LABEL = 'Live weather: Open-Meteo';

const REFERENCE_IRRADIANCE = 1000; // Standard Test Condition (W/m2)
const STC_TEMP = 25; // °C
const TEMP_COEFFICIENT = 0.004; // -0.4% per degree above 25°C

/**
 * Standard wind turbine power curve calculation (0 to 1 fraction of rated capacity)
 */
export function calculateWindPowerRatio(windSpeed) {
  const CUT_IN = 3.5;
  const RATED = 12.5;
  const CUT_OUT = 25.0;

  if (windSpeed < CUT_IN || windSpeed >= CUT_OUT) {
    return 0.0;
  }
  if (windSpeed >= RATED) {
    return 1.0;
  }
  // Cubic curve between cut-in and rated wind speed
  const ratio = (windSpeed - CUT_IN) / (RATED - CUT_IN);
  return Math.min(1.0, Math.max(0.0, Math.pow(ratio, 3)));
}

/**
 * Solar PV power derating factor from cell/ambient temperature
 */
export function calculateSolarTempDerating(temperature) {
  const estimatedCellTemp = temperature + 15;
  if (estimatedCellTemp <= STC_TEMP) return 1.0;
  const derate = 1.0 - (estimatedCellTemp - STC_TEMP) * TEMP_COEFFICIENT;
  return Math.max(0.65, Math.min(1.0, derate));
}

/**
 * Deterministic generation calculation for an asset given live weather conditions
 */
export function calculateAssetOutputMW(asset, weather, addNoise = true) {
  if (asset.status === 'offline' || asset.status === 'maintenance') {
    return 0.0;
  }

  const capacity = Number(asset.capacityMW) || 0;
  let baseOutput = 0;

  if (asset.type === 'solar') {
    const radiation = Math.max(0, Number(weather?.shortwaveRadiation || weather?.directNormalIrradiance || 0));
    const irradianceRatio = Math.min(1.2, radiation / REFERENCE_IRRADIANCE);
    const tempDerating = calculateSolarTempDerating(Number(weather?.temperature || 30));
    baseOutput = capacity * irradianceRatio * tempDerating;
  } else if (asset.type === 'wind') {
    const windSpeed = Math.max(0, Number(weather?.windSpeed || 0));
    const powerRatio = calculateWindPowerRatio(windSpeed);
    baseOutput = capacity * powerRatio;
  }

  if (asset.status === 'degraded') {
    baseOutput *= 0.72;
  }

  if (addNoise && baseOutput > 0) {
    const variance = Math.random() * 0.08 - 0.04;
    baseOutput = baseOutput * (1 + variance);
  }

  const clampedOutput = Math.min(capacity, Math.max(0, baseOutput));
  return Number(clampedOutput.toFixed(3));
}

/**
 * Compute portfolio telemetry summary from live weather
 */
export function computePortfolioGeneration(assets, kutchWeather, banaskanthaWeather) {
  let totalSolarMW = 0;
  let totalWindMW = 0;
  let totalCapacityMW = 0;

  const assetOutputs = assets.map((asset) => {
    const weather =
      asset.siteName === 'Banaskantha' ? banaskanthaWeather.current : kutchWeather.current;
    const outputMW = calculateAssetOutputMW(asset, weather, true);

    totalCapacityMW += asset.capacityMW;
    if (asset.type === 'solar') {
      totalSolarMW += outputMW;
    } else {
      totalWindMW += outputMW;
    }

    return {
      assetId: asset.assetId,
      siteName: asset.siteName,
      type: asset.type,
      capacityMW: asset.capacityMW,
      outputMW,
      performanceRatio:
        asset.capacityMW > 0 ? Number(((outputMW / asset.capacityMW) * 100).toFixed(1)) : 0,
      status: asset.status,
    };
  });

  const totalOutputMW = totalSolarMW + totalWindMW;
  const overallPR =
    totalCapacityMW > 0 ? Number(((totalOutputMW / totalCapacityMW) * 100).toFixed(1)) : 0;

  return {
    totalOutputMW: Number(totalOutputMW.toFixed(2)),
    totalSolarMW: Number(totalSolarMW.toFixed(2)),
    totalWindMW: Number(totalWindMW.toFixed(2)),
    totalCapacityMW: Number(totalCapacityMW.toFixed(2)),
    performanceRatio: overallPR,
    assetCount: assets.length,
    assetOutputs,
    label: GENERATION_LABEL,
    weatherLabel: WEATHER_LABEL,
  };
}

export default {
  calculateAssetOutputMW,
  calculateWindPowerRatio,
  calculateSolarTempDerating,
  computePortfolioGeneration,
  GENERATION_LABEL,
  WEATHER_LABEL,
};
