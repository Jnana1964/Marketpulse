/**
 * Groww API integration.
 *
 * This module is the ONLY module that directly communicates with Groww.
 *
 * Authentication flow:
 *
 * GROWW_API_KEY
 *       +
 * GROWW_API_SECRET
 *       ↓
 * Generate SHA256(secret + timestamp)
 *       ↓
 * POST /token/api/access
 *       ↓
 * Receive access token
 *       ↓
 * Use token for market-data requests
 */

const axios = require('axios');
const crypto = require('crypto');

const config = require('../config/env');


/* ============================================================
   CUSTOM ERRORS
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
   ACCESS TOKEN CACHE
============================================================ */

/**
 * We cache the generated access token in memory.
 *
 * Render may restart the service at any time, which is fine:
 * the application will simply generate a new token.
 */

let cachedAccessToken = null;
let tokenExpiryTime = 0;


/* ============================================================
   CONFIGURATION CHECK
============================================================ */

function ensureCredentials() {
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


/* ============================================================
   CHECKSUM GENERATION
============================================================ */

/**
 * Groww checksum:
 *
 * SHA256(API_SECRET + TIMESTAMP)
 *
 * Timestamp must be epoch seconds.
 */

function generateChecksum(secret, timestamp) {
  const input = `${secret}${timestamp}`;

  return crypto
    .createHash('sha256')
    .update(input)
    .digest('hex');
}


/* ============================================================
   ERROR TRANSLATION
============================================================ */

function translateError(err, context) {
  if (err instanceof ProviderError) {
    return err;
  }


  if (err.response) {
    const status = err.response.status;


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


    const providerMessage =
      err.response.data?.message ||
      err.response.data?.error?.message ||
      `Groww API returned HTTP ${status}.`;


    return new ProviderHttpError(
      `${providerMessage} (${context})`,
      status
    );
  }


  if (err.request) {
    return new ProviderNetworkError(
      `No response received from Groww API while ${context}.`
    );
  }


  return new ProviderResponseError(
    `Unexpected error while ${context}: ${err.message}`
  );
}


/* ============================================================
   ACCESS TOKEN GENERATION
============================================================ */

async function generateAccessToken() {
  ensureCredentials();


  try {
    const timestamp = Math.floor(
      Date.now() / 1000
    ).toString();


    const checksum = generateChecksum(
      config.groww.apiSecret,
      timestamp
    );


    const response = await axios.post(
      `${config.groww.baseUrl}/token/api/access`,

      {
        key_type: 'approval',

        checksum,

        timestamp,
      },

      {
        timeout: 10000,

        headers: {
          Authorization: `Bearer ${config.groww.apiKey}`,

          'Content-Type': 'application/json',

          Accept: 'application/json',
        },
      }
    );


    const data = response.data;


    /*
     * Groww documents:
     *
     * {
     *   token: "...",
     *   expiry: "...",
     *   ...
     * }
     */

    if (!data || !data.token) {
      throw new ProviderResponseError(
        'Groww access token response did not contain a token.'
      );
    }


    cachedAccessToken = data.token;


    /*
     * If Groww returns an expiry timestamp,
     * use it.
     *
     * Otherwise cache temporarily for safety.
     */

    if (data.expiry) {
      const expiryMs = new Date(
        data.expiry
      ).getTime();


      if (
        Number.isFinite(expiryMs) &&
        expiryMs > Date.now()
      ) {
        /*
         * Refresh 60 seconds before expiry.
         */

        tokenExpiryTime =
          expiryMs - 60 * 1000;
      } else {
        tokenExpiryTime =
          Date.now() + 5 * 60 * 1000;
      }
    } else {
      tokenExpiryTime =
        Date.now() + 5 * 60 * 1000;
    }


    return cachedAccessToken;

  } catch (err) {

    cachedAccessToken = null;

    tokenExpiryTime = 0;


    throw translateError(
      err,
      'generating Groww access token'
    );
  }
}


/* ============================================================
   GET VALID ACCESS TOKEN
============================================================ */

async function getAccessToken() {

  /*
   * Reuse cached token if valid.
   */

  if (
    cachedAccessToken &&
    Date.now() < tokenExpiryTime
  ) {
    return cachedAccessToken;
  }


  return generateAccessToken();
}


/* ============================================================
   AUTHENTICATED AXIOS CLIENT
============================================================ */

async function client() {

  const accessToken =
    await getAccessToken();


  return axios.create({

    baseURL: config.groww.baseUrl,

    timeout: 10000,

    headers: {

      Accept: 'application/json',

      Authorization:
        `Bearer ${accessToken}`,

      'X-API-VERSION': '1.0',

    },

  });
}


/* ============================================================
   NORMALIZE QUOTE
============================================================ */

function normalizeQuote(
  symbol,
  exchange,
  raw
) {

  /*
   * Some API responses are wrapped inside
   * a payload object.
   */

  const quoteData =
    raw?.payload || raw;


  if (
    !quoteData ||
    typeof quoteData.last_price !== 'number'
  ) {

    throw new ProviderResponseError(
      `Malformed quote response for ${symbol}.`
    );

  }


  return {

    symbol,

    exchange,

    price:
      quoteData.last_price,

    previousClose:
      quoteData.ohlc?.close ??
      quoteData.previous_close ??
      null,

    open:
      quoteData.ohlc?.open ??
      null,

    high:
      quoteData.ohlc?.high ??
      null,

    low:
      quoteData.ohlc?.low ??
      null,

    volume:
      quoteData.volume ??
      quoteData.total_volume ??
      null,

    timestamp:
      new Date().toISOString(),

    source: 'groww',

    isLive: true,

  };

}


/* ============================================================
   GET QUOTE
============================================================ */

async function getQuote({
  exchange,
  segment = 'CASH',
  symbol,
}) {

  try {

    const apiClient =
      await client();


    const response =
      await apiClient.get(
        '/live-data/quote',
        {
          params: {

            exchange,

            segment,

            trading_symbol:
              symbol,

          },
        }
      );


    return normalizeQuote(
      symbol,
      exchange,
      response.data
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

async function getLtp({
  segment = 'CASH',
  exchangeSymbols,
}) {

  try {

    const apiClient =
      await client();


    const response =
      await apiClient.get(
        '/live-data/ltp',
        {
          params: {

            segment,

            exchange_symbols:
              exchangeSymbols.join(','),

          },
        }
      );


    return response.data;

  } catch (err) {

    throw translateError(
      err,
      'fetching Groww LTP data'
    );

  }

}


/* ============================================================
   GET OHLC
============================================================ */

async function getOhlc({
  segment = 'CASH',
  exchangeSymbols,
}) {

  try {

    const apiClient =
      await client();


    const response =
      await apiClient.get(
        '/live-data/ohlc',
        {
          params: {

            segment,

            exchange_symbols:
              exchangeSymbols.join(','),

          },
        }
      );


    return response.data;

  } catch (err) {

    throw translateError(
      err,
      'fetching Groww OHLC data'
    );

  }

}


/* ============================================================
   GET HISTORICAL CANDLES
============================================================ */

async function getHistoricalCandles({
  exchange,
  segment = 'CASH',
  symbol,
  startTime,
  endTime,
  intervalInMinutes,
}) {

  try {

    const apiClient =
      await client();


    const response =
      await apiClient.get(
        '/historical/candle/range',
        {
          params: {

            exchange,

            segment,

            trading_symbol:
              symbol,

            start_time:
              startTime,

            end_time:
              endTime,

            interval_in_minutes:
              intervalInMinutes,

          },
        }
      );


    const responseData =
      response.data?.payload ||
      response.data;


    const rawCandles =
      responseData?.candles;


    if (
      !Array.isArray(rawCandles)
    ) {

      throw new ProviderResponseError(
        `Malformed historical candle response for ${symbol}.`
      );

    }


    return rawCandles.map(
      (candle) => ({

        timestamp:
          new Date(
            Number(candle[0]) * 1000
          ).toISOString(),

        open:
          candle[1],

        high:
          candle[2],

        low:
          candle[3],

        close:
          candle[4],

        volume:
          candle[5] ?? null,

      })
    );

  } catch (err) {

    throw translateError(
      err,
      `fetching historical candles for ${symbol}`
    );

  }

}


/* ============================================================
   EXPORTS
============================================================ */

module.exports = {

  getQuote,

  getLtp,

  getOhlc,

  getHistoricalCandles,

  getAccessToken,

  ProviderError,

  ProviderConfigError,

  ProviderAuthError,

  ProviderRateLimitError,

  ProviderHttpError,

  ProviderNetworkError,

  ProviderResponseError,

};
