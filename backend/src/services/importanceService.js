/**
 * Importance scoring — turns the raw signals changeDetectionService
 * computes into a single explainable 0-100 score, per the weighting the
 * product spec defines:
 *   price movement   0-40
 *   volatility        0-20
 *   daily high/low    0-20
 *   time since check  0-10
 *   data freshness    0-10
 */
const {
  IMPORTANCE_WEIGHTS,
  PRICE_MOVEMENT_SATURATION_PCT,
  VOLATILITY_SATURATION_RATIO,
  TIME_SINCE_CHECK_SATURATION_HOURS,
  ATTENTION_LEVELS,
} = require('../config/constants');

// Change-sensitivity setting scales how easily a move earns points —
// "High" sensitivity reaches full marks on a smaller move, "Low" needs a
// bigger one. This is what Settings > Change Sensitivity actually controls.
const SENSITIVITY_MULTIPLIER = { LOW: 0.65, MEDIUM: 1, HIGH: 1.5 };

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function calculateImportance({
  changePercent, // signed %, since-last-check when available, else vs previous close
  volatilityRatio, // (high-low)/previousClose
  nearDailyHigh,
  nearDailyLow,
  hoursSinceCheck, // null on a user's first-ever check
  dataStatus, // LIVE | DELAYED | STALE | DEMO
  sensitivity = 'MEDIUM',
}) {
  const multiplier = SENSITIVITY_MULTIPLIER[sensitivity] || 1;

  const priceFraction = changePercent === null ? 0 : clamp01((Math.abs(changePercent) / PRICE_MOVEMENT_SATURATION_PCT) * multiplier);
  const pricePoints = priceFraction * IMPORTANCE_WEIGHTS.PRICE_MOVEMENT_MAX;

  const volatilityFraction = volatilityRatio === null ? 0 : clamp01((volatilityRatio / VOLATILITY_SATURATION_RATIO) * multiplier);
  const volatilityPoints = volatilityFraction * IMPORTANCE_WEIGHTS.VOLATILITY_MAX;

  const highLowPoints = nearDailyHigh || nearDailyLow ? IMPORTANCE_WEIGHTS.HIGH_LOW_MAX : 0;

  const timeFraction = hoursSinceCheck === null ? 0 : clamp01(hoursSinceCheck / TIME_SINCE_CHECK_SATURATION_HOURS);
  const timePoints = timeFraction * IMPORTANCE_WEIGHTS.TIME_SINCE_CHECK_MAX;

  const freshnessFraction = dataStatus === 'STALE' ? 0 : dataStatus === 'DELAYED' ? 0.5 : 1;
  const freshnessPoints = freshnessFraction * IMPORTANCE_WEIGHTS.DATA_FRESHNESS_MAX;

  const total = Math.round(pricePoints + volatilityPoints + highLowPoints + timePoints + freshnessPoints);
  return {
    score: Math.max(0, Math.min(100, total)),
    breakdown: {
      pricePoints: Math.round(pricePoints),
      volatilityPoints: Math.round(volatilityPoints),
      highLowPoints,
      timePoints: Math.round(timePoints),
      freshnessPoints: Math.round(freshnessPoints),
    },
  };
}

function getAttentionLevel(score) {
  const level = ATTENTION_LEVELS.find((l) => score >= l.min && score <= l.max);
  return level ? { key: level.key, label: level.label } : { key: 'LOW', label: 'Stable' };
}

module.exports = { calculateImportance, getAttentionLevel };
