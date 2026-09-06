/**
 * Snapshot persistence: the mechanism that makes "since you last checked"
 * possible at all. A snapshot is written once per watchlist item per user
 * interaction (dashboard load, stock detail view) — not on a fast timer —
 * per the "controlled snapshots" strategy (see README trade-offs).
 */
const pool = require('../config/db');

/** Most recent snapshot strictly before `beforeTime` for this user+item, or null if none exists yet. */
async function getPreviousSnapshot(userId, watchlistItemId, beforeTime = new Date()) {
  const [rows] = await pool.query(
    `SELECT * FROM market_snapshots
     WHERE user_id = :userId AND watchlist_item_id = :itemId AND snapshot_time < :beforeTime
     ORDER BY snapshot_time DESC LIMIT 1`,
    { userId, itemId: watchlistItemId, beforeTime: toMysqlDatetime(beforeTime) }
  );
  return rows[0] || null;
}

async function storeSnapshot(userId, watchlistItemId, quote, snapshotTime = new Date()) {
  await pool.query(
    `INSERT INTO market_snapshots
       (user_id, watchlist_item_id, symbol, exchange, price, open, high, low, previous_close, volume, snapshot_time)
     VALUES (:userId, :itemId, :symbol, :exchange, :price, :open, :high, :low, :previousClose, :volume, :snapshotTime)`,
    {
      userId,
      itemId: watchlistItemId,
      symbol: quote.symbol,
      exchange: quote.exchange,
      price: quote.price,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      previousClose: quote.previousClose,
      volume: quote.volume,
      snapshotTime: toMysqlDatetime(snapshotTime),
    }
  );
}

async function getLastMarketCheck(userId) {
  const [rows] = await pool.query('SELECT last_market_check_at FROM user_sessions WHERE user_id = :userId', { userId });
  return rows[0]?.last_market_check_at || null;
}

async function updateLastMarketCheck(userId, time = new Date()) {
  await pool.query(
    `INSERT INTO user_sessions (user_id, last_active_at, last_market_check_at)
     VALUES (:userId, :time, :time)
     ON DUPLICATE KEY UPDATE last_active_at = VALUES(last_active_at), last_market_check_at = VALUES(last_market_check_at)`,
    { userId, time: toMysqlDatetime(time) }
  );
}

async function getSnapshotHistory(userId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT DISTINCT snapshot_time FROM market_snapshots WHERE user_id = :userId ORDER BY snapshot_time DESC LIMIT :limit`,
    { userId, limit }
  );
  return rows;
}

async function getSnapshotsAt(userId, snapshotTime) {
  const [rows] = await pool.query(
    `SELECT * FROM market_snapshots WHERE user_id = :userId AND snapshot_time = :snapshotTime`,
    { userId, snapshotTime }
  );
  return rows;
}

function toMysqlDatetime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  getPreviousSnapshot,
  storeSnapshot,
  getLastMarketCheck,
  updateLastMarketCheck,
  getSnapshotHistory,
  getSnapshotsAt,
  toMysqlDatetime,
};
