const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const { ApiError } = require('../middleware/errorMiddleware');
const changeDetectionService = require('../services/changeDetectionService');
const marketDataService = require('../services/marketDataService');
const snapshotService = require('../services/snapshotService');
const { timeAgo, getMarketStatus } = require('../utils/dateUtils');
const { ATTENTION_LEVELS } = require('../config/constants');

async function getDefaultWatchlist(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM watchlists WHERE user_id = :userId ORDER BY created_at ASC LIMIT 1',
    { userId }
  );
  if (!rows[0]) throw new ApiError('No watchlist found for this account.', 404, 'WATCHLIST_NOT_FOUND');
  return rows[0];
}

async function getSensitivity(userId) {
  const [rows] = await pool.query('SELECT change_sensitivity FROM user_settings WHERE user_id = :userId', { userId });
  return rows[0]?.change_sensitivity || 'MEDIUM';
}

function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit' }).format(now)
  );
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

const getDashboard = asyncHandler(async (req, res) => {
  const watchlist = req.query.watchlistId
    ? (await pool.query('SELECT * FROM watchlists WHERE id = :id AND user_id = :userId', { id: req.query.watchlistId, userId: req.user.id }))[0][0]
    : await getDefaultWatchlist(req.user.id);
  if (!watchlist) throw new ApiError('Watchlist not found.', 404, 'WATCHLIST_NOT_FOUND');

  const [items] = await pool.query('SELECT * FROM watchlist_items WHERE watchlist_id = :id ORDER BY created_at ASC', {
    id: watchlist.id,
  });

  const sensitivity = await getSensitivity(req.user.id);
  const evaluation = items.length
    ? await changeDetectionService.evaluateWatchlist(req.user.id, items, sensitivity)
    : { previousCheckAt: null, checkedAt: new Date().toISOString(), items: [] };

  const evaluated = evaluation.items.filter((r) => !r.status);
  const attention = evaluated.filter((r) => r.attentionLevel && r.attentionLevel.key !== 'LOW').slice(0, 5);
  const quiet = evaluated.filter((r) => !r.attentionLevel || r.attentionLevel.key === 'LOW');

  const significantMovements = evaluated.filter(
    (r) => r.sinceLastChecked?.hasPrevious && Math.abs(r.sinceLastChecked.changePercent || 0) > 2
  ).length;
  const nearLowCount = evaluated.filter((r) => r.flags?.nearDailyLow).length;
  const nearHighCount = evaluated.filter((r) => r.flags?.nearDailyHigh).length;

  // Recent change events for the timeline, most important/most recent first.
  const [recentEvents] = items.length
    ? await pool.query(
        `SELECT ce.message, ce.detected_at, wi.symbol FROM change_events ce
         JOIN watchlist_items wi ON wi.id = ce.watchlist_item_id
         WHERE ce.user_id = :userId AND ce.watchlist_item_id IN (:itemIds)
         ORDER BY ce.detected_at DESC LIMIT 6`,
        { userId: req.user.id, itemIds: items.map((i) => i.id) }
      )
    : [[]];

  const timeline = [];
  if (evaluation.previousCheckAt) {
    timeline.push({ time: evaluation.previousCheckAt, label: 'You last checked your market.' });
  }
  for (const ev of [...recentEvents].reverse()) {
    timeline.push({ time: ev.detected_at, label: ev.message });
  }
  timeline.push({ time: evaluation.checkedAt, label: 'Current market update.' });

  return ok(res, {
    greeting: greeting(),
    marketStatus: getMarketStatus(),
    mode: marketDataService.getMode(),
    watchlist: { id: watchlist.id, name: watchlist.name },
    since: {
      previousCheckAt: evaluation.previousCheckAt,
      previousCheckAgo: evaluation.previousCheckAt ? timeAgo(evaluation.previousCheckAt) : null,
      isFirstCheck: !evaluation.previousCheckAt,
      meaningfulChangeCount: attention.length,
    },
    summary: {
      significantMovements,
      stableCount: quiet.length,
      nearHighCount,
      nearLowCount,
      totalStocks: evaluated.length,
    },
    attention,
    quiet,
    watchlistPreview: evaluated,
    timeline,
    isEmpty: items.length === 0,
  });
});

const getStockInsight = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const [rows] = await pool.query(
    `SELECT wi.* FROM watchlist_items wi
     JOIN watchlists w ON w.id = wi.watchlist_id
     WHERE w.user_id = :userId AND wi.symbol = :symbol LIMIT 1`,
    { userId: req.user.id, symbol: symbol.toUpperCase() }
  );
  const item = rows[0];
  if (!item) {
    throw new ApiError(`${symbol} is not in any of your watchlists.`, 404, 'ITEM_NOT_FOUND');
  }

  const sensitivity = await getSensitivity(req.user.id);
  const lastMarketCheckAt = await snapshotService.getLastMarketCheck(req.user.id);
  const now = new Date();
  const result = await changeDetectionService.evaluateItem(req.user.id, item, { now, sensitivity, lastMarketCheckAt });

  return ok(res, result);
});

const getChanges = asyncHandler(async (req, res) => {
  const priorityFilter = (req.query.priority || 'ALL').toUpperCase(); // ALL | HIGH_PRIORITY | IMPORTANT | MODERATE | LOW
  const timeFilter = (req.query.time || 'SINCE_LAST_CHECK').toUpperCase(); // SINCE_LAST_CHECK | TODAY | LAST_24H

  let sinceClause = '';
  if (timeFilter === 'TODAY') sinceClause = 'AND DATE(ce.detected_at) = CURDATE()';
  else if (timeFilter === 'LAST_24H') sinceClause = 'AND ce.detected_at >= (NOW() - INTERVAL 24 HOUR)';

  const [rows] = await pool.query(
    `SELECT ce.*, wi.symbol, wi.exchange, wi.instrument_name FROM change_events ce
     JOIN watchlist_items wi ON wi.id = ce.watchlist_item_id
     WHERE ce.user_id = :userId ${sinceClause}
     ORDER BY ce.importance_score DESC, ce.detected_at DESC
     LIMIT 100`,
    { userId: req.user.id }
  );

  const withLevel = rows.map((r) => ({
    ...r,
    attentionLevel: ATTENTION_LEVELS.find((l) => r.importance_score >= l.min && r.importance_score <= l.max),
    detectedAgo: timeAgo(r.detected_at),
  }));

  const filtered =
    priorityFilter === 'ALL' ? withLevel : withLevel.filter((r) => r.attentionLevel?.key === priorityFilter);

  return ok(res, { changes: filtered, total: filtered.length });
});

/**
 * History page support. Not in the spec's original endpoint list, but
 * section 31 (History page) needs a way to list past "checks" and compare
 * two of them — each distinct `snapshot_time` for a user IS one check, so
 * this reads that directly out of market_snapshots rather than adding a
 * new table. Documented as an intentional, additive endpoint in README.
 */
const getHistory = asyncHandler(async (req, res) => {
  const [checks] = await pool.query(
    `SELECT snapshot_time, COUNT(*) AS stockCount,
            SUM(CASE WHEN ce.importance_score >= 60 THEN 1 ELSE 0 END) AS significantCount
     FROM market_snapshots ms
     LEFT JOIN change_events ce
       ON ce.watchlist_item_id = ms.watchlist_item_id AND ce.detected_at = ms.snapshot_time AND ce.user_id = ms.user_id
     WHERE ms.user_id = :userId
     GROUP BY ms.snapshot_time
     ORDER BY ms.snapshot_time DESC
     LIMIT 30`,
    { userId: req.user.id }
  );
  return ok(res, {
    checks: checks.map((c) => ({
      snapshotTime: c.snapshot_time,
      ago: timeAgo(c.snapshot_time),
      stockCount: c.stockCount,
      significantCount: Number(c.significantCount) || 0,
    })),
  });
});

const getHistoryDetail = asyncHandler(async (req, res) => {
  const { snapshotTime } = req.params;
  const [rows] = await pool.query(
    `SELECT ms.*, wi.symbol, wi.instrument_name FROM market_snapshots ms
     JOIN watchlist_items wi ON wi.id = ms.watchlist_item_id
     WHERE ms.user_id = :userId AND ms.snapshot_time = :snapshotTime`,
    { userId: req.user.id, snapshotTime }
  );
  if (rows.length === 0) throw new ApiError('No check found at that time.', 404, 'HISTORY_NOT_FOUND');

  // Compare each stock's price at this checkpoint against its snapshot
  // immediately before it, so the page can show the same "what changed
  // between these two checks" story as the dashboard does for "now".
  const withPreviousDelta = await Promise.all(
    rows.map(async (row) => {
      const previous = await snapshotService.getPreviousSnapshot(req.user.id, row.watchlist_item_id, new Date(snapshotTime));
      const changePercent = previous ? ((row.price - previous.price) / previous.price) * 100 : null;
      return { symbol: row.symbol, instrumentName: row.instrument_name, price: Number(row.price), changePercent };
    })
  );

  return ok(res, { snapshotTime, stocks: withPreviousDelta });
});

module.exports = { getDashboard, getStockInsight, getChanges, getHistory, getHistoryDetail };
