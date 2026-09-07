const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');

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


/*
|--------------------------------------------------------------------------
| ACCESS TOKEN CACHE
|--------------------------------------------------------------------------
|
| Groww API Key + Secret are used to generate an access token.
| We keep that token in memory and reuse it.
|
*/

let accessToken = null;
let tokenExpiry = null;


/*
|--------------------------------------------------------------------------
| BASE HTTP CLIENT
|--------------------------------------------------------------------------
*/

function baseClient() {
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


/*
|--------------------------------------------------------------------------
| GENERATE CHECKSUM
|--------------------------------------------------------------------------
|
| Groww documentation:
|
| SHA256(API_SECRET + TIMESTAMP)
|
*/

function generateChecksum(secret, timestamp) {
  const input = `${secret}${timestamp}`;

  return crypto
    .createHash('sha256')
    .update(input)
    .digest('hex');
}


/*
|--------------------------------------------------------------------------
| CHECK CREDENTIALS
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| CHECK TOKEN VALIDITY
|--------------------------------------------------------------------------
*/

function hasValidToken() {
  if (!accessToken || !tokenExpiry) {
    return false;
  }

  /*
   | Refresh slightly before expiry.
   */

  return Date.now() < tokenExpiry - 60 * 1000;
}


/*
|--------------------------------------------------------------------------
| GENERATE ACCESS TOKEN
|--------------------------------------------------------------------------
*/

async function generateAccessToken() {
  validateCredentials();

  try {
    const timestamp = Math.floor(
      Date.now() / 1000
    ).toString();

    const checksum = generateChecksum(
      config.groww.apiSecret,
      timestamp
    );

    const response = await baseClient().post(
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
     | Groww response can contain token directly
     | or inside payload.
     */

    const token =
      data?.token ||
      data?.payload?.token;


    if (!token) {
      throw new ProviderResponseError(
        'Groww did not return an access token.'
      );
    }


    accessToken = token;


    /*
     | If expiry is returned, use it.
     | Otherwise keep token temporarily.
     */

    const expiry =
      data?.expiry ||
      data?.payload?.expiry;


    if (expiry) {
      const parsedExpiry = new Date(expiry).getTime();

      if (!Number.isNaN(parsedExpiry)) {
        tokenExpiry = parsedExpiry;
      } else {
        tokenExpiry =
          Date.now() + 5 * 60 * 60 * 1000;
      }
    } else {
      tokenExpiry =
        Date.now() + 5 * 60 * 60 * 1000;
    }


    return accessToken;

  } catch (error) {
    throw translateError(
      error,
      'generating Groww access token'
    );
  }
}


/*
|--------------------------------------------------------------------------
| GET ACCESS TOKEN
|--------------------------------------------------------------------------
*/

async function getAccessToken() {
  if (hasValidToken()) {
    return accessToken;
  }

  return generateAccessToken();
}


/*
|--------------------------------------------------------------------------
| AUTHENTICATED CLIENT
|--------------------------------------------------------------------------
*/

async function authenticatedClient() {
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


/*
|--------------------------------------------------------------------------
| ERROR TRANSLATION
|--------------------------------------------------------------------------
*/

function translateError(error, context) {

  if (error instanceof ProviderError) {
    return error;
  }


  if (error.response) {

    const status = error.response.status;


    if (
      status === 401 ||
      status === 403
    ) {
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


/*
|--------------------------------------------------------------------------
| NORMALIZE QUOTE
|--------------------------------------------------------------------------
*/

function normalizeQuote(
  symbol,
  exchange,
  raw
) {

  /*
   | Groww may return data directly
   | or inside payload.
   */

  const data =
    raw?.payload ||
    raw;


  const lastPrice =
    data?.last_price;


  if (
    typeof lastPrice !== 'number'
  ) {
    throw new ProviderResponseError(
      `Malformed quote response for ${symbol}.`
    );
  }


  return {
    symbol,

    exchange,

    price: lastPrice,

    previousClose:
      data?.ohlc?.close ??
      null,

    open:
      data?.ohlc?.open ??
      null,

    high:
      data?.ohlc?.high ??
      null,

    low:
      data?.ohlc?.low ??
      null,

    volume:
      data?.volume ??
      null,

    timestamp:
      new Date().toISOString(),

    source: 'groww',

    isLive: true,
  };
}


/*
|--------------------------------------------------------------------------
| GET QUOTE
|--------------------------------------------------------------------------
*/

async function getQuote({
  exchange,
  segment,
  symbol,
}) {

  try {

    const api =
      await authenticatedClient();


    const response =
      await api.get(
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
     | If token expired,
     | clear cached token.
     */

    if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {

      accessToken = null;
      tokenExpiry = null;
    }


    throw translateError(
      error,
      `fetching quote for ${symbol}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| GET LTP
|--------------------------------------------------------------------------
*/

async function getLtp({
  segment,
  exchangeSymbols,
}) {

  try {

    const api =
      await authenticatedClient();


    const response =
      await api.get(
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


/*
|--------------------------------------------------------------------------
| GET OHLC
|--------------------------------------------------------------------------
*/

async function getOhlc({
  segment,
  exchangeSymbols,
}) {

  try {

    const api =
      await authenticatedClient();


    const response =
      await api.get(
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


/*
|--------------------------------------------------------------------------
| GET HISTORICAL CANDLES
|--------------------------------------------------------------------------
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

    const api =
      await authenticatedClient();


    const response =
      await api.get(
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


    const data =
      response.data?.payload ||
      response.data;


    if (
      !data ||
      !Array.isArray(
        data.candles
      )
    ) {

      throw new ProviderResponseError(
        `Malformed historical candle response for ${symbol}.`
      );
    }


    return data.candles.map(
      (candle) => {

        const timestamp =
          typeof candle[0] === 'number'
            ? new Date(
                candle[0] * 1000
              ).toISOString()
            : new Date(
                candle[0]
              ).toISOString();


        return {
          timestamp,

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


/*
|--------------------------------------------------------------------------
| CONNECTION INFO
|--------------------------------------------------------------------------
*/

function getConnectionInfo() {

  return {
    apiKeyConfigured:
      Boolean(
        config.groww.apiKey
      ),

    apiSecretConfigured:
      Boolean(
        config.groww.apiSecret
      ),

    accessTokenCached:
      Boolean(
        accessToken
      ),

    baseUrl:
      config.groww.baseUrl,
  };
}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

  getQuote,

  getLtp,

  getOhlc,

  getHistoricalCandles,

  getAccessToken,

  getConnectionInfo,

  ProviderError,

  ProviderConfigError,

  ProviderAuthError,

  ProviderRateLimitError,

  ProviderHttpError,

  ProviderNetworkError,

  ProviderResponseError,
};
