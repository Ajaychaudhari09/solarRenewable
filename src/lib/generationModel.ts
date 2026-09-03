/**
 * Weather-driven generation model for Solar & Wind assets
 * Deterministic physics-based formulas replacing random mock numbers.
 */

export const GENERATION_LABEL = 'Generation: modeled from live weather data — not live SCADA';
export const WEATHER_LABEL = 'Live weather: Open-Meteo';

const REFERENCE_IRRADIANCE = 1000;
const STC_TEMP = 25;
const TEMP_COEFFICIENT = 0.004;

export function calculateWindPowerRatio(windSpeed: number): number {
  const CUT_IN = 3.5;
  const RATED = 12.5;
  const CUT_OUT = 25.0;

  if (windSpeed < CUT_IN || windSpeed >= CUT_OUT) return 0.0;
  if (windSpeed >= RATED) return 1.0;
  const ratio = (windSpeed - CUT_IN) / (RATED - CUT_IN);
  return Math.min(1.0, Math.max(0.0, Math.pow(ratio, 3)));
}

export function calculateSolarTempDerating(temperature: number): number {
  const estimatedCellTemp = temperature + 15;
  if (estimatedCellTemp <= STC_TEMP) return 1.0;
  const derate = 1.0 - (estimatedCellTemp - STC_TEMP) * TEMP_COEFFICIENT;
  return Math.max(0.65, Math.min(1.0, derate));
}

export function calculateAssetOutputMW(asset: any, weather: any, addNoise = true): number {
  if (asset.status === 'offline' || asset.status === 'maintenance') return 0.0;
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

  return Number(Math.min(capacity, Math.max(0, baseOutput)).toFixed(3));
}
