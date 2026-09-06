/**
 * THE MEANINGFUL CHANGE ENGINE — the core of MarkPulse.
 *
 * Compares each watchlist item's CURRENT market state against the user's
 * OWN previous observation of it (not just the stock's daily previous
 * close), classifies what kind of change happened, scores its importance,
 * and produces a deterministic, explainable human-readable insight.
 *
 * Ordering is deliberate and matches the product spec exactly:
 *   1. Read last_market_check_at (before anything changes).
 *   2. Read each item's previous snapshot.
 *   3. Fetch current market data.
 *   4. Compare.
 *   5. Generate change events + importance scores.
 *   6. Store new snapshots.
 *   7. Only THEN update last_market_check_at.
 * Steps 6-7 happen after the comparison is computed so nothing overwrites
 * the baseline the response itself was computed against.
 */
const pool = require('../config/db');
const constants = require('../config/constants');
const marketDataService = require('./marketDataService');
const snapshotService = require('./snapshotService');
const importanceService = require('./importanceService');
const logger = require('../utils/logger');

function pctChange(current, previous) {
  if (previous === null || previous === undefined || Number(previous) === 0) return null;
  return ((current - previous) / previous) * 100;
}

function isNear(price, target, proximityPct) {
  if (price === null || target === null || target === undefined || Number(target) === 0) return false;
  return Math.abs((target - price) / target) * 100 <= proximityPct;
}

function movementLabel(pct) {
  const abs = Math.abs(pct);
  if (abs <= constants.MOVEMENT_BANDS.SMALL_MAX) return 'minimal';
  if (abs <= constants.MOVEMENT_BANDS.MODERATE_MAX) return 'moderate';
  if (abs <= constants.MOVEMENT_BANDS.SIGNIFICANT_MAX) return 'significant';
  return 'major';
}

function buildInsight({ symbol, hasPrevious, changePercent, todayChangePercent, nearDailyHigh, nearDailyLow, volatilityFlag, gapFlag, stale }) {
  const reasons = [];
  let message;

  if (!hasPrevious) {
    message = `First time tracking ${symbol} — no prior check to compare against yet.`;
    if (nearDailyHigh) reasons.push('trading near today\'s high');
    else if (nearDailyLow) reasons.push('trading near today\'s low');
  } else {
    const abs = Math.abs(changePercent);
    const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'unchanged';
    if (movementLabel(changePercent) === 'minimal') {
      message = `${symbol} has shown minimal movement since your last check.`;
    } else {
      message = `${symbol} is ${direction} ${abs.toFixed(2)}% since your last check.`;
    }

    if (nearDailyHigh) reasons.push('trading near today\'s high');
    if (nearDailyLow) reasons.push('trading near today\'s low');
    if (volatilityFlag) reasons.push('showing a wider than usual intraday range today');
    if (gapFlag) reasons.push('showing a notable move from today\'s opening price');
  }

  if (stale) reasons.push('the latest market data may be outdated');

  let whyItMatters = null;
  if (reasons.length > 0) {
    if (hasPrevious && movementLabel(changePercent) !== 'minimal') {
      whyItMatters = `Price ${changePercent > 0 ? 'increased' : 'decreased'} ${Math.abs(changePercent).toFixed(2)}% since your previous check and is ${reasons.join(', ')}.`;
    } else {
      whyItMatters = `${symbol} is ${reasons.join(', ')}.`;
    }
  } else if (hasPrevious) {
    whyItMatters = 'No unusual signals beyond the price move itself.';
  } else if (todayChangePercent !== null) {
    whyItMatters = `Trading ${todayChangePercent >= 0 ? 'up' : 'down'} ${Math.abs(todayChangePercent).toFixed(2)}% today so far.`;
  }

  return { message, whyItMatters, reasons };
}

const EVENT_COOLDOWN_MINUTES = 5;

/**
 * Prevents change_events from turning into noise: on a 30s auto-refresh, a
 * stock sitting near its daily high stays "near its daily high" on every
 * single poll — logging a fresh row each time would flood the Changes/
 * History views with duplicates of the same fact. This keeps only the
 * first occurrence within a cooldown window per (item, event type).
 */
async function filterAlreadyLogged(userId, itemId, events, now) {
  if (events.length === 0) return events;
  const cutoff = snapshotService.toMysqlDatetime(new Date(now.getTime() - EVENT_COOLDOWN_MINUTES * 60_000));
  const [recent] = await pool.query(
    `SELECT DISTINCT event_type FROM change_events
     WHERE user_id = :userId AND watchlist_item_id = :itemId AND detected_at >= :cutoff`,
    { userId, itemId, cutoff }
  );
  const recentTypes = new Set(recent.map((r) => r.event_type));
  return events.filter((e) => !recentTypes.has(e.type));
}

async function persistChangeEvents(userId, item, quote, now, events) {
  if (events.length === 0) return;
  const values = events.map((e) => [
    userId,
    item.id,
    e.type,
    e.previousValue,
    e.currentValue,
    e.changePercentage,
    e.importanceScore,
    e.message,
    snapshotService.toMysqlDatetime(now),
  ]);
  await pool.query(
    `INSERT INTO change_events
       (user_id, watchlist_item_id, event_type, previous_value, current_value, change_percentage, importance_score, message, detected_at)
     VALUES ?`,
    [values]
  );
}

async function evaluateItem(userId, item, { now, sensitivity, lastMarketCheckAt }) {
  const previousSnapshot = await snapshotService.getPreviousSnapshot(userId, item.id, now);
  const quote = await marketDataService.getQuote({ symbol: item.symbol, exchange: item.exchange });

  if (!quote) {
    return {
      item,
      status: 'MARKET_DATA_UNAVAILABLE',
      message: `Unable to retrieve market data for ${item.symbol}.`,
    };
  }

  const hasPrevious = Boolean(previousSnapshot);
  const sinceCheckChangePercent = hasPrevious ? pctChange(quote.price, previousSnapshot.price) : null;
  const todayChangePercent = pctChange(quote.price, quote.previousClose);

  const nearDailyHigh = isNear(quote.price, quote.high, constants.HIGH_LOW_PROXIMITY_PCT) && quote.price <= quote.high;
  const nearDailyLow = isNear(quote.price, quote.low, constants.HIGH_LOW_PROXIMITY_PCT) && quote.price >= quote.low;
  const volatilityRatio = quote.high !== null && quote.low !== null && quote.previousClose
    ? (quote.high - quote.low) / quote.previousClose
    : null;
  const volatilityFlag = volatilityRatio !== null && volatilityRatio >= constants.VOLATILITY_SATURATION_RATIO * 0.5;
  const gapFromOpenPct = quote.open ? pctChange(quote.price, quote.open) : null;
  const gapFlag = gapFromOpenPct !== null && Math.abs(gapFromOpenPct) >= constants.MOVEMENT_BANDS.MODERATE_MAX;
  const stale = quote.dataStatus === 'STALE';

  const hoursSinceCheck = lastMarketCheckAt ? (now.getTime() - new Date(lastMarketCheckAt).getTime()) / 3_600_000 : null;

  const { score, breakdown } = importanceService.calculateImportance({
    changePercent: hasPrevious ? sinceCheckChangePercent : todayChangePercent,
    volatilityRatio,
    nearDailyHigh,
    nearDailyLow,
    hoursSinceCheck,
    dataStatus: quote.dataStatus,
    sensitivity,
  });
  const attentionLevel = importanceService.getAttentionLevel(score);

  const insight = buildInsight({
    symbol: item.symbol,
    hasPrevious,
    changePercent: sinceCheckChangePercent,
    todayChangePercent,
    nearDailyHigh,
    nearDailyLow,
    volatilityFlag,
    gapFlag,
    stale,
  });

  // Build the persisted change_events rows for this evaluation. Only
  // non-trivial price moves are logged as events — a 0.02% wobble isn't a
  // "change" worth a history entry, even though the API response above
  // still reports the exact figure.
  const events = [];
  if (hasPrevious && sinceCheckChangePercent !== null && movementLabel(sinceCheckChangePercent) !== 'minimal') {
    events.push({
      type: 'PRICE_MOVEMENT',
      previousValue: previousSnapshot.price,
      currentValue: quote.price,
      changePercentage: sinceCheckChangePercent,
      importanceScore: score,
      message: insight.message,
    });
  }
  if (nearDailyHigh) {
    events.push({ type: 'DAILY_HIGH', previousValue: quote.high, currentValue: quote.price, changePercentage: null, importanceScore: score, message: `${item.symbol} is trading near today's high.` });
  }
  if (nearDailyLow) {
    events.push({ type: 'DAILY_LOW', previousValue: quote.low, currentValue: quote.price, changePercentage: null, importanceScore: score, message: `${item.symbol} is trading near today's low.` });
  }
  if (volatilityFlag) {
    events.push({ type: 'VOLATILITY', previousValue: null, currentValue: volatilityRatio, changePercentage: null, importanceScore: score, message: `${item.symbol} has an unusually wide intraday range today.` });
  }
  if (gapFlag) {
    events.push({ type: 'GAP_FROM_OPEN', previousValue: quote.open, currentValue: quote.price, changePercentage: gapFromOpenPct, importanceScore: score, message: `${item.symbol} moved significantly from its opening price.` });
  }
  if (stale) {
    events.push({ type: 'STALE_DATA', previousValue: null, currentValue: null, changePercentage: null, importanceScore: score, message: 'Market data has not been updated recently.' });
  }

  try {
    await snapshotService.storeSnapshot(userId, item.id, quote, now);
    const eventsToLog = await filterAlreadyLogged(userId, item.id, events, now);
    await persistChangeEvents(userId, item, quote, now, eventsToLog);
  } catch (err) {
    logger.error(`Failed to persist snapshot/events for watchlist item ${item.id}`, err);
    // Don't let a storage failure for one stock hide the computed result —
    // the user still sees this stock's insight, just without history saved.
  }

  return {
    item: { id: item.id, symbol: item.symbol, exchange: item.exchange, instrumentName: item.instrument_name },
    quote: {
      price: quote.price,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      previousClose: quote.previousClose,
      volume: quote.volume,
      timestamp: quote.timestamp,
      dataStatus: quote.dataStatus,
      source: quote.source,
    },
    sinceLastChecked: {
      hasPrevious,
      previousPrice: hasPrevious ? Number(previousSnapshot.price) : null,
      previousSnapshotTime: hasPrevious ? previousSnapshot.snapshot_time : null,
      changePercent: sinceCheckChangePercent,
    },
    today: { changePercent: todayChangePercent },
    flags: { nearDailyHigh, nearDailyLow, volatilityFlag, gapFromOpenPct, gapFlag, stale },
    importanceScore: score,
    importanceBreakdown: breakdown,
    attentionLevel,
    message: insight.message,
    whyItMatters: insight.whyItMatters,
  };
}

/**
 * Evaluates every item in a watchlist and returns the "since you last
 * checked" comparison for each, ranked by importance (highest first) per
 * the product spec's default ordering rule.
 */
async function evaluateWatchlist(userId, watchlistItems, sensitivity = 'MEDIUM', { advanceLastCheck = true } = {}) {
  const now = new Date();
  const previousCheckAt = await snapshotService.getLastMarketCheck(userId); // step 1, BEFORE any writes

  const results = await Promise.all(
    watchlistItems.map((item) =>
      evaluateItem(userId, item, { now, sensitivity, lastMarketCheckAt: previousCheckAt }).catch((err) => {
        logger.error(`evaluateItem failed for ${item.symbol}`, err);
        return { item: { id: item.id, symbol: item.symbol }, status: 'ERROR', message: 'Unable to evaluate this stock right now.' };
      })
    )
  );

  results.sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0));

  // `advanceLastCheck` is false for the background snapshot job: it stores
  // fresh snapshots so history/charts stay populated, but it must NOT move
  // last_market_check_at, because that timestamp means "the user actually
  // looked" — advancing it silently would make the next real dashboard
  // visit compare against a poll the user never saw, hiding real changes.
  if (advanceLastCheck) {
    await snapshotService.updateLastMarketCheck(userId, now); // step 7, AFTER everything above
  }

  return { previousCheckAt, checkedAt: now.toISOString(), items: results };
}

module.exports = { evaluateWatchlist, evaluateItem, movementLabel };
