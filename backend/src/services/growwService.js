/**
 * Groww API integration — the ONLY module in this codebase that talks to
 * Groww. Controllers and other services never call Groww directly (see
 * marketDataService.js for the orchestration layer above this one).
 *
 * Endpoint contract verified against Groww's own published docs
 * (https://groww.in/trade-api/docs/curl, fetched during development —
 * there is no official Node SDK, only a Python one, so this talks to the
 * plain REST API directly with axios):
 *
 *   Base URL: https://api.groww.in/v1
 *   Auth:     Authorization: Bearer <GROWW_API_AUTH_TOKEN>
 *             Accept: application/json
 *             X-API-VERSION: 1.0
 *
 *   GET /live-data/quote?exchange=NSE&segment=CASH&trading_symbol=RELIANCE
 *   GET /live-data/ltp?segment=CASH&exchange_symbols=NSE_RELIANCE,NSE_TCS
 *   GET /live-data/ohlc?segment=CASH&exchange_symbols=NSE_RELIANCE,NSE_TCS
 *   GET /historical/candle/range?exchange=NSE&segment=CASH&trading_symbol=WIPRO
 *       &start_time=YYYY-MM-DD HH:mm:ss&end_time=YYYY-MM-DD HH:mm:ss&interval_in_minutes=N
 *       (Groww's docs mark this endpoint deprecated in favor of a
 *       "Get Historical Candle Data" method whose REST contract Groww does
 *       not publish outside its Python SDK — see README "Limitations".
 *       It is still the only historical endpoint with a documented,
 *       verifiable request/response shape, so MarkPulse uses it rather
 *       than guessing at an undocumented replacement.)
 *
 * The access token is generated manually from a Groww account's "Trading
 * APIs" settings and expires daily at 6:00 AM IST — this module does not
 * attempt silent token refresh; an expired/missing token surfaces as a
 * typed ProviderAuthError / ProviderConfigError so the rest of the app can
 * react honestly (see marketDataService's fallback-to-demo behavior).
 */
const axios = require('axios');
const config = require('../config/env');

class ProviderError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
class ProviderConfigError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_CONFIG_ERROR');
  }
}
class ProviderAuthError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_AUTH_ERROR');
  }
}
class ProviderRateLimitError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_RATE_LIMIT');
  }
}
class ProviderHttpError extends ProviderError {
  constructor(message, status) {
    super(message, 'PROVIDER_HTTP_ERROR');
    this.status = status;
  }
}
class ProviderNetworkError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_NETWORK_ERROR');
  }
}
class ProviderResponseError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_RESPONSE_ERROR');
  }
}

function client() {
  if (!config.groww.authToken) {
    throw new ProviderConfigError('GROWW_API_AUTH_TOKEN is not configured.');
  }
  return axios.create({
    baseURL: config.groww.baseUrl,
    timeout: 8000,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.groww.authToken}`,
      'X-API-VERSION': '1.0',
    },
  });
}

/** Maps any axios failure into one of our typed provider errors. */
function translateError(err, context) {
  if (err instanceof ProviderError) return err;
  if (err.response) {
    const status = err.response.status;
    if (status === 401 || status === 403) {
      return new ProviderAuthError(`Groww API authentication failed while ${context}.`);
    }
    if (status === 429) {
      return new ProviderRateLimitError(`Groww API rate limit hit while ${context}.`);
    }
    return new ProviderHttpError(`Groww API returned ${status} while ${context}.`, status);
  }
  if (err.request) {
    return new ProviderNetworkError(`No response from Groww API while ${context}.`);
  }
  return new ProviderResponseError(`Unexpected error while ${context}: ${err.message}`);
}

/** GET /live-data/quote — full quote for a single instrument. */
async function getQuote({ exchange, segment, symbol }) {
  try {
    const { data } = await client().get('/live-data/quote', {
      params: { exchange, segment, trading_symbol: symbol },
    });
    if (!data || typeof data.last_price !== 'number') {
      throw new ProviderResponseError(`Malformed quote response for ${symbol}.`);
    }
    return normalizeQuote(symbol, exchange, data);
  } catch (err) {
    throw translateError(err, `fetching quote for ${symbol}`);
  }
}

/** GET /live-data/ltp — last traded price for up to 50 symbols at once. */
async function getLtp({ segment, exchangeSymbols }) {
  try {
    const { data } = await client().get('/live-data/ltp', {
      params: { segment, exchange_symbols: exchangeSymbols.join(',') },
    });
    return data || {};
  } catch (err) {
    throw translateError(err, 'fetching LTP batch');
  }
}

/** GET /live-data/ohlc — OHLC for up to 50 symbols at once. */
async function getOhlc({ segment, exchangeSymbols }) {
  try {
    const { data } = await client().get('/live-data/ohlc', {
      params: { segment, exchange_symbols: exchangeSymbols.join(',') },
    });
    return data || {};
  } catch (err) {
    throw translateError(err, 'fetching OHLC batch');
  }
}

/** GET /historical/candle/range — candle history for charting. */
async function getHistoricalCandles({ exchange, segment, symbol, startTime, endTime, intervalInMinutes }) {
  try {
    const { data } = await client().get('/historical/candle/range', {
      params: {
        exchange,
        segment,
        trading_symbol: symbol,
        start_time: startTime,
        end_time: endTime,
        interval_in_minutes: intervalInMinutes,
      },
    });
    if (!data || !Array.isArray(data.candles)) {
      throw new ProviderResponseError(`Malformed historical candle response for ${symbol}.`);
    }
    // Each candle: [timestamp(epoch seconds), open, high, low, close, volume]
    return data.candles.map((c) => ({
      timestamp: new Date(c[0] * 1000).toISOString(),
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5],
    }));
  } catch (err) {
    throw translateError(err, `fetching historical candles for ${symbol}`);
  }
}

/** Normalizes Groww's quote shape into MarkPulse's internal NormalizedMarketSnapshot. */
function normalizeQuote(symbol, exchange, raw) {
  return {
    symbol,
    exchange,
    price: raw.last_price,
    previousClose: raw.ohlc?.close ?? null,
    open: raw.ohlc?.open ?? null,
    high: raw.ohlc?.high ?? null,
    low: raw.ohlc?.low ?? null,
    volume: raw.volume ?? null,
    timestamp: new Date().toISOString(),
    source: 'groww',
    isLive: true,
  };
}

module.exports = {
  getQuote,
  getLtp,
  getOhlc,
  getHistoricalCandles,
  ProviderError,
  ProviderConfigError,
  ProviderAuthError,
  ProviderRateLimitError,
  ProviderHttpError,
  ProviderNetworkError,
  ProviderResponseError,
};
