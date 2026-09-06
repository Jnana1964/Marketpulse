const { MARKET_HOURS_IST } = require('../config/constants');

const IST_TIME_ZONE = 'Asia/Kolkata';

/** Returns {year, month, day, hour, minute, weekday(0=Sun..6=Sat)} for "now" in IST, without a date library. */
function nowInIst(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  }).formatToParts(date);

  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === '24' ? '0' : map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: weekdayMap[map.weekday],
  };
}

function minutesSinceMidnight({ hour, minute }) {
  return hour * 60 + minute;
}

/**
 * Returns one of MARKET_OPEN | MARKET_CLOSED | PRE_MARKET | POST_MARKET.
 * Weekends are always MARKET_CLOSED. This is a clock-based approximation
 * (NSE/BSE cash-segment hours) — it does not account for exchange holidays,
 * which would require a holiday calendar the app does not have.
 */
function getMarketStatus(date = new Date()) {
  const ist = nowInIst(date);
  if (ist.weekday === 0 || ist.weekday === 6) return 'MARKET_CLOSED';

  const nowMin = minutesSinceMidnight(ist);
  const preStart = minutesSinceMidnight({ hour: MARKET_HOURS_IST.PRE_MARKET_START.hour, minute: MARKET_HOURS_IST.PRE_MARKET_START.minute });
  const openStart = minutesSinceMidnight({ hour: MARKET_HOURS_IST.MARKET_OPEN_START.hour, minute: MARKET_HOURS_IST.MARKET_OPEN_START.minute });
  const openEnd = minutesSinceMidnight({ hour: MARKET_HOURS_IST.MARKET_OPEN_END.hour, minute: MARKET_HOURS_IST.MARKET_OPEN_END.minute });
  const postEnd = minutesSinceMidnight({ hour: MARKET_HOURS_IST.POST_MARKET_END.hour, minute: MARKET_HOURS_IST.POST_MARKET_END.minute });

  if (nowMin >= preStart && nowMin < openStart) return 'PRE_MARKET';
  if (nowMin >= openStart && nowMin < openEnd) return 'MARKET_OPEN';
  if (nowMin >= openEnd && nowMin < postEnd) return 'POST_MARKET';
  return 'MARKET_CLOSED';
}

/** Human-readable "X seconds/minutes/hours ago" for a given ISO/Date timestamp. */
function timeAgo(from, to = new Date()) {
  if (!from) return null;
  const fromDate = from instanceof Date ? from : new Date(from);
  const diffMs = to.getTime() - fromDate.getTime();
  if (diffMs < 0) return 'just now';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec} second${sec === 1 ? '' : 's'} ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? '' : 's'} ago`;
}

module.exports = { nowInIst, getMarketStatus, timeAgo, IST_TIME_ZONE };
