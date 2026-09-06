/**
 * Optional background snapshot job.
 *
 * Deliberately simple: a single setInterval that walks users who have
 * auto-refresh enabled and runs the same evaluateWatchlist used by the
 * dashboard endpoint, so a user's "since last checked" baseline can
 * advance even between visits. This is NOT a distributed job queue —
 * for a hackathon-scale app a single-process interval is easier to
 * reason about and just as effective. If it ever misbehaves, disable it
 * (ENABLE_BACKGROUND_JOB=false) and rely on user-triggered snapshots only,
 * which is what the dashboard/stock-detail endpoints already provide.
 */
const pool = require('../config/db');
const changeDetectionService = require('./../services/changeDetectionService');
const logger = require('../utils/logger');

const RUN_INTERVAL_MS = 5 * 60_000; // every 5 minutes
let intervalHandle = null;

async function runOnce() {
  const [users] = await pool.query(
    `SELECT DISTINCT w.user_id, s.change_sensitivity FROM watchlists w
     JOIN user_settings s ON s.user_id = w.user_id
     WHERE s.auto_refresh = 1`
  );

  for (const user of users) {
    try {
      const [items] = await pool.query(
        `SELECT wi.* FROM watchlist_items wi
         JOIN watchlists w ON w.id = wi.watchlist_id
         WHERE w.user_id = :userId`,
        { userId: user.user_id }
      );
      if (items.length === 0) continue;
      // advanceLastCheck:false — a background poll is not the user "checking",
      // so it must not move last_market_check_at (see changeDetectionService).
      await changeDetectionService.evaluateWatchlist(user.user_id, items, user.change_sensitivity || 'MEDIUM', {
        advanceLastCheck: false,
      });
    } catch (err) {
      // One user's failure should never stop the job for everyone else.
      logger.error(`Background snapshot job failed for user ${user.user_id}`, err);
    }
  }
}

function start() {
  if (intervalHandle) return;
  logger.info(`Background market snapshot job starting (every ${RUN_INTERVAL_MS / 60000} min).`);
  intervalHandle = setInterval(() => {
    runOnce().catch((err) => logger.error('Background snapshot job run failed', err));
  }, RUN_INTERVAL_MS);
}

function stop() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}

module.exports = { start, stop, runOnce };
