/**
 * Market data orchestration layer.
 *
 * Controllers call this, never growwService or demoMarketData directly.
 * Responsibilities: pick live vs. demo, cache quotes for a short window so
 * a busy dashboard doesn't hammer the Groww API, and always attach an
 * honest `dataStatus` (LIVE / DEMO / STALE) instead of letting callers
 * guess from raw fields.
 */
const config = require('../config/env');
const constants = require('../config/constants');
const logger = require('../utils/logger');
const groww = require('./growwService');
const demo = require('./demoMarketData');
const { getMarketStatus } = require('../utils/dateUtils');

// In-memory cache: key `${exchange}_${symbol}` -> { snapshot, fetchedAt }
const quoteCache = new Map();

function cacheKey(exchange, symbol) {
  return `${exchange}_${symbol}`;
}

function isCacheFresh(entry) {
  return entry && Date.now() - entry.fetchedAt < constants.CACHE.QUOTE_TTL_MS;
}

function liveModeEnabled() {
  return config.marketDataMode === 'live' && Boolean(config.groww.authToken);
}

/** Attaches LIVE / DEMO / STALE based on source + age, per the freshness thresholds. */
function withDataStatus(snapshot) {
  const ageMs = Date.now() - new Date(snapshot.timestamp).getTime();
  let dataStatus;
  if (snapshot.source === 'demo') {
    dataStatus = 'DEMO';
  } else if (ageMs <= constants.FRESHNESS.LIVE_MAX_AGE_MS) {
    dataStatus = 'LIVE';
  } else if (ageMs <= constants.FRESHNESS.DELAYED_MAX_AGE_MS) {
    dataStatus = 'DELAYED';
  } else {
    dataStatus = 'STALE';
  }
  return { ...snapshot, dataStatus, ageMs };
}

/**
 * Fetches (or reuses a cached) normalized quote for one instrument.
 * Never throws for provider failures — falls back to demo data with a
 * `providerNote` explaining why, so the UI can stay honest without the
 * whole request failing.
 */
async function getQuote({ symbol, exchange, segment = 'CASH' }) {
  const key = cacheKey(exchange, symbol);
  const cached = quoteCache.get(key);
  if (isCacheFresh(cached)) {
    return withDataStatus(cached.snapshot);
  }

  if (liveModeEnabled()) {
    try {
      const snapshot = await groww.getQuote({ exchange, segment, symbol });
      quoteCache.set(key, { snapshot, fetchedAt: Date.now() });
      return withDataStatus(snapshot);
    } catch (err) {
      logger.warn(`Groww quote failed for ${symbol}, falling back to demo data`, { code: err.code, message: err.message });
      const fallback = demo.getDemoQuote(symbol);
      if (!fallback) throw err; // no demo baseline either — nothing we can show
      quoteCache.set(key, { snapshot: fallback, fetchedAt: Date.now() });
      return { ...withDataStatus(fallback), providerNote: 'Unable to reach the Groww API — showing demo data instead.' };
    }
  }

  const demoSnapshot = demo.getDemoQuote(symbol);
  if (!demoSnapshot) return null;
  quoteCache.set(key, { snapshot: demoSnapshot, fetchedAt: Date.now() });
  return withDataStatus(demoSnapshot);
}

/** Batch version for a whole watchlist — same caching/fallback rules per symbol. */
async function getQuotes(items) {
  const results = await Promise.all(
    items.map(async (item) => {
      const quote = await getQuote({ symbol: item.symbol, exchange: item.exchange });
      return { item, quote };
    })
  );
  return results;
}

async function getHistoricalCandles({ symbol, exchange, segment = 'CASH', startTime, endTime, intervalInMinutes }) {
  if (liveModeEnabled()) {
    try {
      const candles = await groww.getHistoricalCandles({
        exchange,
        segment,
        symbol,
        startTime,
        endTime,
        intervalInMinutes,
      });
      return { candles, source: 'groww' };
    } catch (err) {
      logger.warn(`Groww historical data failed for ${symbol}, falling back to demo candles`, { code: err.code });
      return { candles: demo.getDemoCandles(symbol, { startTime, endTime, intervalMinutes: intervalInMinutes || 15 }), source: 'demo' };
    }
  }
  return { candles: demo.getDemoCandles(symbol, { startTime, endTime, intervalMinutes: intervalInMinutes || 15 }), source: 'demo' };
}

function getMode() {
  return {
    mode: liveModeEnabled() ? 'live' : 'demo',
    marketStatus: getMarketStatus(),
    reason: liveModeEnabled()
      ? null
      : config.marketDataMode === 'live'
        ? 'GROWW_API_AUTH_TOKEN is not configured, so MarkPulse is running on demo data.'
        : 'MARKET_DATA_MODE=demo — running on deterministic demo data by configuration.',
  };
}

module.exports = { getQuote, getQuotes, getHistoricalCandles, getMode };
