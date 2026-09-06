/**
 * Deterministic demo market data.
 *
 * Used only when MARKET_DATA_MODE=demo, or when live mode has no Groww
 * token configured / the Groww call fails (see marketDataService.js) — in
 * every case the response is tagged source:'demo', isLive:false so the
 * frontend can render an explicit "DEMO DATA" label rather than ever
 * implying this is live.
 *
 * This is intentionally NOT Math.random(): every value is a pure function
 * of (symbol, wall-clock time), built from a couple of fixed-period sine
 * waves with a per-symbol phase derived from the symbol's characters. That
 * means:
 *   - the same symbol at the same minute always produces the same price
 *     (reproducible, explainable, not "hardcoded" either)
 *   - prices still move plausibly from one check to the next, which is
 *     what's needed to demo "since you last checked" credibly
 *   - nothing here is presented as, or mistaken for, real market data
 *
 * Baseline prices are illustrative starting reference points for well
 * known NSE large-caps (approximate, not live-sourced) — see README.
 */
const BASELINE_PRICE = {
  RELIANCE: 1450,
  TCS: 3820,
  INFY: 1550,
  HDFCBANK: 1680,
  ICICIBANK: 1210,
  ITC: 465,
  SBIN: 810,
  TATAMOTORS: 945,
  WIPRO: 545,
  HINDUNILVR: 2480,
  BHARTIARTL: 1590,
  ASIANPAINT: 2850,
};

const MARKET_OPEN_MINUTES_FROM_MIDNIGHT_IST = 9 * 60 + 15; // 09:15 IST
const SESSION_LENGTH_MINUTES = 375; // 09:15 -> 15:30

function seededPhase(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash * 31 + symbol.charCodeAt(i)) % 100000;
  }
  return (hash / 100000) * Math.PI * 2;
}

function istMinutesSinceMidnight(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const hour = Number(map.hour === '24' ? '0' : map.hour);
  return hour * 60 + Number(map.minute);
}

/** Pure function: illustrative price for `symbol` at instant `date`. */
function priceAt(symbol, date) {
  const baseline = BASELINE_PRICE[symbol];
  if (!baseline) return null;

  const phase = seededPhase(symbol);
  const minutesToday = istMinutesSinceMidnight(date);
  const dayFraction = Math.min(
    1,
    Math.max(0, (minutesToday - MARKET_OPEN_MINUTES_FROM_MIDNIGHT_IST) / SESSION_LENGTH_MINUTES)
  );

  const minuteBucket = Math.floor(date.getTime() / 60000);
  const intradayWave = Math.sin(phase + dayFraction * Math.PI * 2.3);
  const fineWave = Math.sin(minuteBucket * 0.37 + phase * 1.7);

  const pct = intradayWave * 0.012 + fineWave * 0.004;
  return Number((baseline * (1 + pct)).toFixed(2));
}

function marketOpenInstantToday(now) {
  const opened = new Date(now);
  // Approximate "today's 09:15 IST" by walking back to local midnight-ish
  // and adding the open offset; good enough for demo OHLC, not for real trading.
  const minutesToday = istMinutesSinceMidnight(now);
  const msSinceOpen = (minutesToday - MARKET_OPEN_MINUTES_FROM_MIDNIGHT_IST) * 60000;
  opened.setTime(now.getTime() - Math.max(0, msSinceOpen));
  return opened;
}

/** Deterministic OHLC + last price for one symbol, as of `now`. */
function getDemoQuote(symbol, now = new Date()) {
  const baseline = BASELINE_PRICE[symbol];
  if (!baseline) return null;

  const price = priceAt(symbol, now);
  const openInstant = marketOpenInstantToday(now);
  const open = priceAt(symbol, openInstant);

  // Sample a handful of checkpoints between open and now to derive a
  // plausible intraday high/low from the same deterministic wave.
  const checkpoints = 8;
  const samples = [open, price];
  for (let i = 1; i < checkpoints; i += 1) {
    const t = new Date(openInstant.getTime() + ((now.getTime() - openInstant.getTime()) * i) / checkpoints);
    samples.push(priceAt(symbol, t));
  }
  const high = Math.max(...samples);
  const low = Math.min(...samples);

  const volumeSeed = Math.abs(Math.sin(seededPhase(symbol) + Math.floor(now.getTime() / 60000) * 0.11));
  const volume = Math.round(200000 + volumeSeed * 1_800_000);

  return {
    symbol,
    exchange: 'NSE',
    price,
    previousClose: baseline,
    open,
    high,
    low,
    volume,
    timestamp: now.toISOString(),
    source: 'demo',
    isLive: false,
  };
}

/** Deterministic candle series for charting, matching getDemoQuote's model. */
function getDemoCandles(symbol, { startTime, endTime, intervalMinutes = 15 }) {
  const baseline = BASELINE_PRICE[symbol];
  if (!baseline) return [];

  const candles = [];
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const stepMs = Math.max(1, intervalMinutes) * 60000;

  for (let t = start; t <= end; t += stepMs) {
    const bucketDate = new Date(t);
    const close = priceAt(symbol, bucketDate);
    const openSample = priceAt(symbol, new Date(t - stepMs / 2));
    if (close === null) continue;
    candles.push({
      timestamp: bucketDate.toISOString(),
      open: openSample ?? close,
      high: Math.max(openSample ?? close, close),
      low: Math.min(openSample ?? close, close),
      close,
      volume: Math.round(50000 + Math.abs(Math.sin(t * 0.0001 + seededPhase(symbol))) * 400000),
    });
  }
  return candles;
}

module.exports = { BASELINE_PRICE, getDemoQuote, getDemoCandles };
