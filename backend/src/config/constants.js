/**
 * Centralized thresholds and magic numbers.
 *
 * Every tunable in the change-detection / importance / caching / freshness
 * logic lives here so it can be reasoned about (and changed) in one place,
 * instead of being scattered as literals across services.
 */

// ---- Market data caching (see services/marketDataService.js) ----
const CACHE = {
  QUOTE_TTL_MS: 20_000, // 20s: within the 15-30s band the spec asks for
};

// ---- Data freshness labeling (see utils + DataFreshness component contract) ----
const FRESHNESS = {
  LIVE_MAX_AGE_MS: 30_000, // <=30s old data still reads as LIVE
  DELAYED_MAX_AGE_MS: 5 * 60_000, // <=5min reads as DELAYED
  // anything older reads as STALE
};

// ---- Movement classification bands (percentage magnitude) ----
// These are descriptive labels for the UI, not investment thresholds.
const MOVEMENT_BANDS = {
  SMALL_MAX: 0.5,
  MODERATE_MAX: 2,
  SIGNIFICANT_MAX: 5,
  // anything above SIGNIFICANT_MAX is "major"
};

// ---- Importance score weights (0-100 total, see importanceService.js) ----
const IMPORTANCE_WEIGHTS = {
  PRICE_MOVEMENT_MAX: 40,
  VOLATILITY_MAX: 20,
  HIGH_LOW_MAX: 20,
  TIME_SINCE_CHECK_MAX: 10,
  DATA_FRESHNESS_MAX: 10,
};

// Price-movement points scale linearly up to this % move, then caps.
const PRICE_MOVEMENT_SATURATION_PCT = 6;
// Volatility ((high-low)/prevClose) points scale linearly up to this ratio.
const VOLATILITY_SATURATION_RATIO = 0.05;
// Hours since last check that earns the full "time since checked" points.
const TIME_SINCE_CHECK_SATURATION_HOURS = 12;

// ---- Attention levels (importance score -> label) ----
const ATTENTION_LEVELS = [
  { min: 80, max: 100, key: 'HIGH_PRIORITY', label: 'High priority' },
  { min: 60, max: 79, key: 'IMPORTANT', label: 'Important' },
  { min: 30, max: 59, key: 'MODERATE', label: 'Worth reviewing' },
  { min: 0, max: 29, key: 'LOW', label: 'Stable' },
];

// ---- Daily high/low proximity ----
const HIGH_LOW_PROXIMITY_PCT = 0.3; // within 0.3% of the day's high/low counts as "near"

// ---- Market hours (IST, NSE/BSE cash segment) ----
const MARKET_HOURS_IST = {
  PRE_MARKET_START: { hour: 9, minute: 0 },
  MARKET_OPEN_START: { hour: 9, minute: 15 },
  MARKET_OPEN_END: { hour: 15, minute: 30 },
  POST_MARKET_END: { hour: 16, minute: 0 },
};

module.exports = {
  CACHE,
  FRESHNESS,
  MOVEMENT_BANDS,
  IMPORTANCE_WEIGHTS,
  PRICE_MOVEMENT_SATURATION_PCT,
  VOLATILITY_SATURATION_RATIO,
  TIME_SINCE_CHECK_SATURATION_HOURS,
  ATTENTION_LEVELS,
  HIGH_LOW_PROXIMITY_PCT,
  MARKET_HOURS_IST,
};
