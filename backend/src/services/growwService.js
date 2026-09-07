/**
 * Groww API integration.
 *
 * This is the ONLY service that communicates directly
 * with the Groww API.
 *
 * Authentication flow:
 *
 * 1. API Key + API Secret
 * 2. Generate timestamp
 * 3. SHA256(API_SECRET + timestamp)
 * 4. POST /token/api/access
 * 5. Receive access token
 * 6. Use access token for market API requests
 */

const axios = require('axios');
const crypto = require('crypto');

const config = require('../config/env');


/* =========================================================
   CUSTOM ERRORS
========================================================= */

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


/* =========================================================
   ACCESS TOKEN CACHE
========================================================= */

/*
 * Access tokens are cached in memory.
 *
 * This prevents generating a new token for every request.
 */

let accessToken = null;

let tokenExpiry = null;

let tokenPromise = null;


/* =========================================================
   VALIDATE CONFIGURATION
========================================================= */

function validateCredentials() {
  if (!config.groww.apiKey) {
    throw new ProviderConfigError(
      'GROWW_API_KEY is not configured.'
    );
  }

  if (!config.groww.apiSecret) {
    throw new ProviderConfigError(
      'GROWW_API_SECRET is not configured.'
    );
  }
}


/* =========================================================
   BASE CLIENT
========================================================= */

function createBaseClient() {
  return axios.create({
    baseURL: config.groww.baseUrl,

    timeout: 10000,

    headers: {
      Accept: 'application/json',

      'Content-Type': 'application/json',

      'X-API-VERSION': '1.0',
    },
  });
}


/* =========================================================
   GENERATE CHECKSUM
========================================================= */

/*
 * Groww checksum:
 *
 * SHA256(API_SECRET + TIMESTAMP)
 */

function generateChecksum(secret, timestamp) {
  const input = `${secret}${timestamp}`;

  return crypto
    .createHash('sha256')
    .update(input, 'utf8')
    .digest('hex');
}


/* =========================================================
   TOKEN VALIDITY
========================================================= */

function hasValidToken() {
  if (!accessToken || !tokenExpiry) {
    return false;
  }

  /*
   * Refresh one minute before expiry.
   */

  return Date.now() < tokenExpiry - 60 * 1000;
}


/* =========================================================
   CLEAR TOKEN
========================================================= */

function clearAccessToken() {
  accessToken = null;

  tokenExpiry = null;

  tokenPromise = null;
}


/* =========================================================
   GENERATE ACCESS TOKEN
========================================================= */

async function requestAccessToken() {
  validateCredentials();

  try {
    /*
     * Current Unix timestamp in seconds.
     */

    const timestamp = Math.floor(
      Date.now() / 1000
    ).toString();


    const checksum = generateChecksum(
      config.groww.apiSecret,
      timestamp
    );


    const client = createBaseClient();


    const response = await client.post(
      '/token/api/access',

      {
        key_type: 'approval',

        checksum,

        timestamp,
      },

      {
        headers: {
          Authorization: `Bearer ${config.groww.apiKey}`,
        },
      }
    );


    const data = response.data;


    /*
     * Expected Groww response:
     *
     * {
     *   token: "...",
     *   expiry: "..."
     * }
     *
     * Also support payload wrapper defensively.
     */

    const responseData =
      data?.payload ||
      data;


    const token = responseData?.token;


    if (!token || typeof token !== 'string') {
      throw new ProviderResponseError(
        'Groww did not return a valid access token.'
      );
    }


    accessToken = token;


    /*
     * Groww returns expiry as ISO date-time.
     */

    const expiry = responseData?.expiry;


    if (expiry) {
      const expiryTime = new Date(expiry).getTime();

      if (!Number.isNaN(expiryTime)) {
        tokenExpiry = expiryTime;
      }
    }


    /*
     * Fallback expiry.
     *
     * This is only used if the API does not provide
     * a parseable expiry.
     */

    if (!tokenExpiry) {
      tokenExpiry =
        Date.now() + 5 * 60 * 60 * 1000;
    }


    return accessToken;

  } catch (error) {
    clearAccessToken();

    throw translateError(
      error,
      'generating access token'
    );
  }
}


/* =========================================================
   GET ACCESS TOKEN
========================================================= */

async function getAccessToken() {
  if (hasValidToken()) {
    return accessToken;
  }


  /*
   * Prevent multiple simultaneous requests from generating
   * multiple tokens.
   */

  if (tokenPromise) {
    return tokenPromise;
  }


  tokenPromise = requestAccessToken();

  try {
    const token = await tokenPromise;

    return token;

  } finally {
    tokenPromise = null;
  }
}


/* =========================================================
   AUTHENTICATED CLIENT
========================================================= */

async function createAuthenticatedClient() {
  const token = await getAccessToken();


  return axios.create({
    baseURL: config.groww.baseUrl,

    timeout: 10000,

    headers: {
      Accept: 'application/json',

      'Content-Type': 'application/json',

      Authorization: `Bearer ${token}`,

      'X-API-VERSION': '1.0',
    },
  });
}


/* =========================================================
   ERROR TRANSLATION
========================================================= */

function translateError(error, context) {
  if (error instanceof ProviderError) {
    return error;
  }


  if (error.response) {
    const status = error.response.status;


    if (status === 401 || status === 403) {
      return new ProviderAuthError(
        `Groww API authentication failed while ${context}.`
      );
    }


    if (status === 429) {
      return new ProviderRateLimitError(
        `Groww API rate limit reached while ${context}.`
      );
    }


    return new ProviderHttpError(
      `Groww API returned HTTP ${status} while ${context}.`,
      status
    );
  }


  if (error.request) {
    return new ProviderNetworkError(
      `No response from Groww API while ${context}.`
    );
  }


  return new ProviderResponseError(
    `Unexpected error while ${context}: ${error.message}`
  );
}


/* =========================================================
   PARSE OHLC
========================================================= */

/*
 * Groww documentation may represent OHLC as an object
 * or as a string depending on the response.
 */

function parseOhlc(ohlc) {
  if (!ohlc) {
    return {
      open: null,
      high: null,
      low: null,
      close: null,
    };
  }


  /*
   * Already an object.
   */

  if (
    typeof ohlc === 'object' &&
    !Array.isArray(ohlc)
  ) {
    return {
      open: ohlc.open ?? null,

      high: ohlc.high ?? null,

      low: ohlc.low ?? null,

      close: ohlc.close ?? null,
    };
  }


  /*
   * Handle string format.
   */

  if (typeof ohlc === 'string') {
    const getValue = (name) => {
      const regex = new RegExp(
        `${name}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`,
        'i'
      );

      const match = ohlc.match(regex);

      return match
        ? Number(match[1])
        : null;
    };


    return {
      open: getValue('open'),

      high: getValue('high'),

      low: getValue('low'),

      close: getValue('close'),
    };
  }


  return {
    open: null,

    high: null,

    low: null,

    close: null,
  };
}


/* =========================================================
   NORMALIZE QUOTE
========================================================= */

function normalizeQuote(
  symbol,
  exchange,
  rawResponse
) {
  const raw =
    rawResponse?.payload ||
    rawResponse;


  if (
    !raw ||
    typeof raw.last_price !== 'number'
  ) {
    throw new ProviderResponseError(
      `Malformed quote response for ${symbol}.`
    );
  }


  const ohlc = parseOhlc(raw.ohlc);


  return {
    symbol,

    exchange,

    price: raw.last_price,

    previousClose: ohlc.close,

    open: ohlc.open,

    high: ohlc.high,

    low: ohlc.low,

    volume: raw.volume ?? null,

    timestamp: raw.last_trade_time
      ? new Date(raw.last_trade_time).toISOString()
      : new Date().toISOString(),

    source: 'groww',

    isLive: true,

    dayChange: raw.day_change ?? null,

    dayChangePercent:
      raw.day_change_perc ?? null,

    averagePrice:
      raw.average_price ?? null,

    week52High:
      raw.week_52_high ?? null,

    week52Low:
      raw.week_52_low ?? null,
  };
}


/* =========================================================
   GET QUOTE
========================================================= */

async function getQuote({
  exchange,
  segment = 'CASH',
  symbol,
}) {
  try {
    const client =
      await createAuthenticatedClient();


    const response = await client.get(
      '/live-data/quote',
      {
        params: {
          exchange,

          segment,

          trading_symbol: symbol,
        },
      }
    );


    return normalizeQuote(
      symbol,
      exchange,
      response.data
    );

  } catch (error) {
    /*
     * Clear token if authentication failed.
     */

    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      clearAccessToken();
    }


    throw translateError(
      error,
      `fetching quote for ${symbol}`
    );
  }
}


/* =========================================================
   GET LTP
========================================================= */

async function getLtp({
  segment = 'CASH',
  exchangeSymbols,
}) {
  try {
    if (
      !Array.isArray(exchangeSymbols) ||
      exchangeSymbols.length === 0
    ) {
      return {};
    }


    const client =
      await createAuthenticatedClient();


    const response = await client.get(
      '/live-data/ltp',
      {
        params: {
          segment,

          exchange_symbols:
            exchangeSymbols.join(','),
        },
      }
    );


    return (
      response.data?.payload ||
      response.data ||
      {}
    );

  } catch (error) {
    throw translateError(
      error,
      'fetching LTP batch'
    );
  }
}


/* =========================================================
   GET OHLC
========================================================= */

async function getOhlc({
  segment = 'CASH',
  exchangeSymbols,
}) {
  try {
    if (
      !Array.isArray(exchangeSymbols) ||
      exchangeSymbols.length === 0
    ) {
      return {};
    }


    const client =
      await createAuthenticatedClient();


    const response = await client.get(
      '/live-data/ohlc',
      {
        params: {
          segment,

          exchange_symbols:
            exchangeSymbols.join(','),
        },
      }
    );


    return (
      response.data?.payload ||
      response.data ||
      {}
    );

  } catch (error) {
    throw translateError(
      error,
      'fetching OHLC batch'
    );
  }
}


/* =========================================================
   GET HISTORICAL CANDLES
========================================================= */

async function getHistoricalCandles({
  exchange,

  segment = 'CASH',

  symbol,

  startTime,

  endTime,

  intervalInMinutes,
}) {
  try {
    const client =
      await createAuthenticatedClient();


    const response = await client.get(
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


    const data =
      response.data?.payload ||
      response.data;


    if (
      !data ||
      !Array.isArray(data.candles)
    ) {
      throw new ProviderResponseError(
        `Malformed historical candle response for ${symbol}.`
      );
    }


    return data.candles.map(
      (candle) => {
        const rawTimestamp =
          candle[0];


        let timestamp;


        /*
         * Historical API normally returns epoch seconds.
         */

        if (
          typeof rawTimestamp === 'number'
        ) {
          timestamp = new Date(
            rawTimestamp * 1000
          ).toISOString();
        } else {
          timestamp = new Date(
            rawTimestamp
          ).toISOString();
        }


        return {
          timestamp,

          open:
            Number(candle[1]),

          high:
            Number(candle[2]),

          low:
            Number(candle[3]),

          close:
            Number(candle[4]),

          volume:
            candle[5] ?? null,
        };
      }
    );

  } catch (error) {
    throw translateError(
      error,
      `fetching historical candles for ${symbol}`
    );
  }
}


/* =========================================================
   CONNECTION INFORMATION
========================================================= */

function getConnectionInfo() {
  return {
    apiKeyConfigured:
      Boolean(config.groww.apiKey),

    apiSecretConfigured:
      Boolean(config.groww.apiSecret),

    accessTokenCached:
      Boolean(accessToken),

    baseUrl:
      config.groww.baseUrl,
  };
}


/* =========================================================
   TEST CONNECTION
========================================================= */

async function testConnection() {
  const quote = await getQuote({
    exchange: 'NSE',

    segment: 'CASH',

    symbol: 'RELIANCE',
  });


  return {
    connected: true,

    quote,

    connection: getConnectionInfo(),
  };
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getQuote,

  getLtp,

  getOhlc,

  getHistoricalCandles,

  getAccessToken,

  getConnectionInfo,

  testConnection,

  clearAccessToken,

  ProviderError,

  ProviderConfigError,

  ProviderAuthError,

  ProviderRateLimitError,

  ProviderHttpError,

  ProviderNetworkError,

  ProviderResponseError,
};
