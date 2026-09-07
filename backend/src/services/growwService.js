/**
 * Groww API integration.
 *
 * This is the ONLY module in the application that communicates
 * directly with the Groww REST API.
 */

const axios = require('axios');
const config = require('../config/env');

/* ============================================================
   CUSTOM PROVIDER ERRORS
============================================================ */

class ProviderError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
  }
}

class ProviderConfigError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_CONFIG_ERROR');
    this.name = 'ProviderConfigError';
  }
}

class ProviderAuthError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_AUTH_ERROR');
    this.name = 'ProviderAuthError';
  }
}

class ProviderRateLimitError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_RATE_LIMIT');
    this.name = 'ProviderRateLimitError';
  }
}

class ProviderHttpError extends ProviderError {
  constructor(message, status) {
    super(message, 'PROVIDER_HTTP_ERROR');
    this.name = 'ProviderHttpError';
    this.status = status;
  }
}

class ProviderNetworkError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_NETWORK_ERROR');
    this.name = 'ProviderNetworkError';
  }
}

class ProviderResponseError extends ProviderError {
  constructor(message) {
    super(message, 'PROVIDER_RESPONSE_ERROR');
    this.name = 'ProviderResponseError';
  }
}


/* ============================================================
   AXIOS CLIENT
============================================================ */

function client() {
  if (!config.groww.authToken) {
    throw new ProviderConfigError(
      'GROWW_API_AUTH_TOKEN is not configured.'
    );
  }

  return axios.create({
    baseURL: config.groww.baseUrl,
    timeout: 10000,

    headers: {
      Accept: 'application/json',

      Authorization: `Bearer ${config.groww.authToken}`,

      'X-API-VERSION': '1.0',
    },
  });
}


/* ============================================================
   ERROR TRANSLATION
============================================================ */

function translateError(err, context) {
  // Do not translate our own errors again.
  if (err instanceof ProviderError) {
    return err;
  }

  // HTTP response received.
  if (err.response) {
    const status = err.response.status;

    if (status === 401 || status === 403) {
      return new ProviderAuthError(
        `Groww API authentication failed while ${context}.`
      );
    }

    if (status === 429) {
      return new ProviderRateLimitError(
        `Groww API rate limit hit while ${context}.`
      );
    }

    return new ProviderHttpError(
      `Groww API returned HTTP ${status} while ${context}.`,
      status
    );
  }

  // Request was sent but no response was received.
  if (err.request) {
    return new ProviderNetworkError(
      `No response received from Groww API while ${context}.`
    );
  }

  // Other unexpected errors.
  return new ProviderResponseError(
    `Unexpected error while ${context}: ${err.message}`
  );
}


/* ============================================================
   RESPONSE VALIDATION
============================================================ */

function getSuccessfulPayload(data, context) {
  if (!data || typeof data !== 'object') {
    throw new ProviderResponseError(
      `Empty or invalid response from Groww while ${context}.`
    );
  }

  if (data.status !== 'SUCCESS') {
    const errorMessage =
      data.error?.message ||
      data.message ||
      `Groww API request failed while ${context}.`;

    throw new ProviderResponseError(errorMessage);
  }

  if (
    !Object.prototype.hasOwnProperty.call(data, 'payload') ||
    data.payload === null ||
    data.payload === undefined
  ) {
    throw new ProviderResponseError(
      `Groww API returned no payload while ${context}.`
    );
  }

  return data.payload;
}


/* ============================================================
   OHLC PARSER
============================================================ */

/**
 * Groww documentation may represent OHLC as an object-like string.
 *
 * This helper supports:
 *
 * 1. Normal object:
 *    { open: 100, high: 110, low: 95, close: 105 }
 *
 * 2. JSON string:
 *    '{"open":100,"high":110,"low":95,"close":105}'
 *
 * 3. Object-like string:
 *    '{open: 100,high: 110,low: 95,close: 105}'
 */

function parseOhlc(ohlc) {
  if (!ohlc) {
    return {};
  }

  // Already an object.
  if (typeof ohlc === 'object') {
    return {
      open: Number.isFinite(Number(ohlc.open))
        ? Number(ohlc.open)
        : null,

      high: Number.isFinite(Number(ohlc.high))
        ? Number(ohlc.high)
        : null,

      low: Number.isFinite(Number(ohlc.low))
        ? Number(ohlc.low)
        : null,

      close: Number.isFinite(Number(ohlc.close))
        ? Number(ohlc.close)
        : null,
    };
  }

  // Not a string.
  if (typeof ohlc !== 'string') {
    return {};
  }

  // Try normal JSON first.
  try {
    const parsed = JSON.parse(ohlc);

    if (parsed && typeof parsed === 'object') {
      return parseOhlc(parsed);
    }
  } catch (error) {
    // Continue to regex parsing.
  }

  // Parse object-like format:
  // {open: 149.50,high: 150.50,low: 148.50,close: 149.50}

  const getValue = (key) => {
    const regex = new RegExp(
      `${key}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`,
      'i'
    );

    const match = ohlc.match(regex);

    if (!match) {
      return null;
    }

    const value = Number(match[1]);

    return Number.isFinite(value)
      ? value
      : null;
  };

  return {
    open: getValue('open'),
    high: getValue('high'),
    low: getValue('low'),
    close: getValue('close'),
  };
}


/* ============================================================
   GET QUOTE
============================================================ */

/**
 * GET /live-data/quote
 *
 * Returns complete live market information for one instrument.
 */

async function getQuote({
  exchange,
  segment,
  symbol,
}) {
  try {
    const { data } = await client().get(
      '/live-data/quote',
      {
        params: {
          exchange,
          segment,
          trading_symbol: symbol,
        },
      }
    );

    const payload = getSuccessfulPayload(
      data,
      `fetching quote for ${symbol}`
    );

    const lastPrice = Number(payload.last_price);

    if (!Number.isFinite(lastPrice)) {
      throw new ProviderResponseError(
        `Malformed quote response for ${symbol}: last_price is missing.`
      );
    }

    return normalizeQuote(
      symbol,
      exchange,
      payload
    );
  } catch (err) {
    throw translateError(
      err,
      `fetching quote for ${symbol}`
    );
  }
}


/* ============================================================
   GET LTP
============================================================ */

/**
 * GET /live-data/ltp
 *
 * Fetches latest prices for up to 50 instruments.
 */

async function getLtp({
  segment,
  exchangeSymbols,
}) {
  try {
    if (
      !Array.isArray(exchangeSymbols) ||
      exchangeSymbols.length === 0
    ) {
      throw new ProviderResponseError(
        'exchangeSymbols must be a non-empty array.'
      );
    }

    const { data } = await client().get(
      '/live-data/ltp',
      {
        params: {
          segment,

          exchange_symbols:
            exchangeSymbols.join(','),
        },
      }
    );

    const payload = getSuccessfulPayload(
      data,
      'fetching LTP batch'
    );

    if (
      !payload ||
      typeof payload !== 'object'
    ) {
      throw new ProviderResponseError(
        'Malformed LTP response from Groww.'
      );
    }

    return payload;
  } catch (err) {
    throw translateError(
      err,
      'fetching LTP batch'
    );
  }
}


/* ============================================================
   GET OHLC
============================================================ */

/**
 * GET /live-data/ohlc
 *
 * Fetches current OHLC values for up to 50 instruments.
 */

async function getOhlc({
  segment,
  exchangeSymbols,
}) {
  try {
    if (
      !Array.isArray(exchangeSymbols) ||
      exchangeSymbols.length === 0
    ) {
      throw new ProviderResponseError(
        'exchangeSymbols must be a non-empty array.'
      );
    }

    const { data } = await client().get(
      '/live-data/ohlc',
      {
        params: {
          segment,

          exchange_symbols:
            exchangeSymbols.join(','),
        },
      }
    );

    const payload = getSuccessfulPayload(
      data,
      'fetching OHLC batch'
    );

    if (
      !payload ||
      typeof payload !== 'object'
    ) {
      throw new ProviderResponseError(
        'Malformed OHLC response from Groww.'
      );
    }

    return payload;
  } catch (err) {
    throw translateError(
      err,
      'fetching OHLC batch'
    );
  }
}


/* ============================================================
   GET HISTORICAL CANDLES
============================================================ */

/**
 * GET /historical/candle/range
 *
 * Fetches historical OHLC candle data.
 */

async function getHistoricalCandles({
  exchange,
  segment,
  symbol,
  startTime,
  endTime,
  intervalInMinutes,
}) {
  try {
    const { data } = await client().get(
      '/historical/candle/range',
      {
        params: {
          exchange,
          segment,
          trading_symbol: symbol,
          start_time: startTime,
          end_time: endTime,
          interval_in_minutes:
            intervalInMinutes,
        },
      }
    );

    const payload = getSuccessfulPayload(
      data,
      `fetching historical candles for ${symbol}`
    );

    if (
      !payload ||
      !Array.isArray(payload.candles)
    ) {
      throw new ProviderResponseError(
        `Malformed historical candle response for ${symbol}.`
      );
    }

    return payload.candles
      .filter(
        (candle) =>
          Array.isArray(candle) &&
          candle.length >= 6
      )
      .map((candle) => {
        const timestamp =
          Number(candle[0]);

        return {
          timestamp:
            Number.isFinite(timestamp)
              ? new Date(
                  timestamp * 1000
                ).toISOString()
              : null,

          open: Number(candle[1]),

          high: Number(candle[2]),

          low: Number(candle[3]),

          close: Number(candle[4]),

          volume: Number(candle[5]),
        };
      });

  } catch (err) {
    throw translateError(
      err,
      `fetching historical candles for ${symbol}`
    );
  }
}


/* ============================================================
   NORMALIZE QUOTE
============================================================ */

/**
 * Converts Groww's response into MarkPulse's
 * internal market snapshot format.
 */

function normalizeQuote(
  symbol,
  exchange,
  raw
) {
  const ohlc = parseOhlc(raw.ohlc);

  const lastPrice = Number(raw.last_price);

  return {
    symbol,

    exchange,

    price:
      Number.isFinite(lastPrice)
        ? lastPrice
        : null,

    previousClose:
      ohlc.close,

    open:
      ohlc.open,

    high:
      ohlc.high,

    low:
      ohlc.low,

    volume:
      raw.volume !== undefined &&
      raw.volume !== null &&
      Number.isFinite(Number(raw.volume))
        ? Number(raw.volume)
        : null,

    timestamp:
      raw.last_trade_time
        ? new Date(
            Number(raw.last_trade_time)
          ).toISOString()
        : new Date().toISOString(),

    source: 'groww',

    isLive: true,
  };
}


/* ============================================================
   EXPORTS
============================================================ */

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
