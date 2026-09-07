const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');

const BASE_URL = 'https://api.groww.in/v1';

let cachedToken = null;
let tokenExpiry = null;


/* =========================================================
   ERROR CLASSES
========================================================= */

class ProviderError extends Error {
  constructor(message, code, status = null) {
    super(message);

    this.name = 'ProviderError';
    this.code = code;
    this.status = status;
  }
}


/* =========================================================
   GENERATE CHECKSUM
========================================================= */

/*
 * Groww:
 *
 * SHA256(API_SECRET + TIMESTAMP)
 */

function generateChecksum(secret, timestamp) {
  return crypto
    .createHash('sha256')
    .update(`${secret}${timestamp}`)
    .digest('hex');
}


/* =========================================================
   GENERATE ACCESS TOKEN
========================================================= */

async function generateAccessToken() {

  const apiKey = config.groww.apiKey;

  const apiSecret = config.groww.apiSecret;


  if (!apiKey) {
    throw new ProviderError(
      'GROWW_API_KEY is not configured.',
      'PROVIDER_CONFIG_ERROR'
    );
  }


  if (!apiSecret) {
    throw new ProviderError(
      'GROWW_API_SECRET is not configured.',
      'PROVIDER_CONFIG_ERROR'
    );
  }


  const timestamp =
    Math.floor(Date.now() / 1000).toString();


  const checksum =
    generateChecksum(
      apiSecret,
      timestamp
    );


  try {

    const response =
      await axios.post(

        `${BASE_URL}/token/api/access`,

        {
          key_type: 'approval',

          checksum,

          timestamp,
        },

        {
          headers: {

            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          timeout: 10000,
        }
      );


    const data =
      response.data;


    const token =
      data.token ||
      data.payload?.token;


    if (!token) {

      throw new ProviderError(
        'Groww did not return an access token.',
        'PROVIDER_RESPONSE_ERROR'
      );
    }


    cachedToken =
      token;


    /*
     * Groww may return expiry.
     */

    const expiry =
      data.expiry ||
      data.payload?.expiry;


    if (expiry) {

      const expiryTime =
        new Date(expiry).getTime();


      if (!Number.isNaN(expiryTime)) {
        tokenExpiry =
          expiryTime;
      }
    }


    /*
     * Safe fallback.
     */

    if (!tokenExpiry) {

      tokenExpiry =
        Date.now() +
        (5 * 60 * 1000);
    }


    return cachedToken;

  } catch (error) {

    if (
      error instanceof ProviderError
    ) {
      throw error;
    }


    const status =
      error.response?.status ||
      null;


    const responseData =
      error.response?.data;


    const message =

      responseData?.error?.message ||

      responseData?.message ||

      error.message ||

      'Failed to generate Groww access token.';


    let code =
      'PROVIDER_AUTH_ERROR';


    if (status === 429) {
      code =
        'PROVIDER_RATE_LIMIT';
    }

    else if (
      !status
    ) {
      code =
        'PROVIDER_NETWORK_ERROR';
    }


    throw new ProviderError(
      message,
      code,
      status
    );
  }
}


/* =========================================================
   GET ACCESS TOKEN
========================================================= */

async function getAccessToken() {

  /*
   * Reuse token if valid.
   *
   * Refresh 30 seconds early.
   */

  if (

    cachedToken &&

    tokenExpiry &&

    Date.now() <
      tokenExpiry - 30000

  ) {

    return cachedToken;
  }


  return generateAccessToken();
}


/* =========================================================
   CREATE AUTHENTICATED CLIENT
========================================================= */

async function getClient() {

  const token =
    await getAccessToken();


  return axios.create({

    baseURL:
      BASE_URL,


    timeout:
      10000,


    headers: {

      Authorization:
        `Bearer ${token}`,

      Accept:
        'application/json',

      'X-API-VERSION':
        '1.0',
    },
  });
}


/* =========================================================
   NORMALIZE QUOTE
========================================================= */

function normalizeQuote(
  symbol,
  exchange,
  raw
) {

  const data =
    raw.payload ||
    raw;


  return {

    symbol,

    exchange,


    price:
      data.last_price ??
      data.ltp ??
      null,


    previousClose:
      data.ohlc?.close ??
      data.previous_close ??
      null,


    open:
      data.ohlc?.open ??
      null,


    high:
      data.ohlc?.high ??
      null,


    low:
      data.ohlc?.low ??
      null,


    volume:
      data.volume ??
      null,


    timestamp:
      new Date().toISOString(),


    source:
      'groww',


    isLive:
      true,
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
      await getClient();


    const response =
      await client.get(

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


    const responseData =
      response.data;


    /*
     * Groww failure response.
     */

    if (
      responseData?.status ===
      'FAILURE'
    ) {

      throw new ProviderError(

        responseData.error?.message ||
        'Groww quote request failed.',

        responseData.error?.code ||
        'PROVIDER_RESPONSE_ERROR'
      );
    }


    return normalizeQuote(

      symbol,

      exchange,

      responseData
    );

  } catch (error) {

    if (
      error instanceof ProviderError
    ) {
      throw error;
    }


    const status =
      error.response?.status ||
      null;


    const responseData =
      error.response?.data;


    let code =
      'PROVIDER_HTTP_ERROR';


    if (
      status === 401 ||
      status === 403
    ) {
      code =
        'PROVIDER_AUTH_ERROR';
    }

    else if (
      status === 429
    ) {
      code =
        'PROVIDER_RATE_LIMIT';
    }

    else if (
      !status
    ) {
      code =
        'PROVIDER_NETWORK_ERROR';
    }


    throw new ProviderError(

      responseData?.error?.message ||

      responseData?.message ||

      error.message ||

      `Failed to fetch quote for ${symbol}.`,

      code,

      status
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
      await getClient();


    const response =
      await client.get(

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
      response.data;


    if (
      responseData?.status ===
      'FAILURE'
    ) {

      throw new ProviderError(

        responseData.error?.message ||
        'Groww historical request failed.',

        responseData.error?.code ||
        'PROVIDER_RESPONSE_ERROR'
      );
    }


    const candles =

      responseData?.payload?.candles ||

      responseData?.candles ||

      [];


    if (
      !Array.isArray(candles)
    ) {

      throw new ProviderError(
        'Groww returned invalid historical candle data.',
        'PROVIDER_RESPONSE_ERROR'
      );
    }


    /*
     * Normalize candles.
     */

    return candles.map(
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
          candle[5],
      })
    );

  } catch (error) {

    if (
      error instanceof ProviderError
    ) {
      throw error;
    }


    const status =
      error.response?.status ||
      null;


    const responseData =
      error.response?.data;


    let code =
      'PROVIDER_HTTP_ERROR';


    if (
      status === 401 ||
      status === 403
    ) {

      code =
        'PROVIDER_AUTH_ERROR';
    }

    else if (
      status === 429
    ) {

      code =
        'PROVIDER_RATE_LIMIT';
    }

    else if (
      !status
    ) {

      code =
        'PROVIDER_NETWORK_ERROR';
    }


    throw new ProviderError(

      responseData?.error?.message ||

      responseData?.message ||

      error.message ||

      `Failed to fetch historical data for ${symbol}.`,

      code,

      status
    );
  }
}


/* =========================================================
   TEST CONNECTION
========================================================= */

async function testConnection() {

  /*
   * First generate access token.
   */

  await getAccessToken();


  /*
   * Then test a real API request.
   */

  const quote =
    await getQuote({

      exchange:
        'NSE',

      segment:
        'CASH',

      symbol:
        'RELIANCE',
    });


  return {

    provider:
      'Groww',

    tokenGenerated:
      true,

    quoteReceived:
      Boolean(quote),

    sample:
      quote,
  };
}


/* =========================================================
   CONNECTION INFO
========================================================= */

function getConnectionInfo() {

  return {

    configured:
      Boolean(
        config.groww.apiKey &&
        config.groww.apiSecret
      ),

    apiKeyConfigured:
      Boolean(
        config.groww.apiKey
      ),

    apiSecretConfigured:
      Boolean(
        config.groww.apiSecret
      ),

    tokenCached:
      Boolean(
        cachedToken
      ),
  };
}


/* =========================================================
   CLEAR TOKEN CACHE
========================================================= */

function clearTokenCache() {

  cachedToken =
    null;

  tokenExpiry =
    null;
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

  generateAccessToken,

  getAccessToken,

  getQuote,

  getHistoricalCandles,

  testConnection,

  getConnectionInfo,

  clearTokenCache,
};
