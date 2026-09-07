const axios = require('axios');
const crypto = require('crypto');
const config = require(
  '../config/env'
);
/* =========================================================
   CONSTANTS
========================================================= */
const GROWW_BASE_URL =
  config.groww.baseUrl;
/* =========================================================
   TOKEN CACHE
========================================================= */
let cachedToken = null;
let tokenExpiry = null;
/* =========================================================
   GENERATE CHECKSUM
========================================================= */
/**
 * Generate Groww checksum.
 *
 * SHA256(
 *   API_SECRET + TIMESTAMP
 * )
 */
function generateChecksum(
  secret,
  timestamp
) {
  const input =
    `${secret}${timestamp}`;
  return crypto
    .createHash('sha256')
    .update(input)
    .digest('hex');
}
/* =========================================================
   GENERATE ACCESS TOKEN
========================================================= */
/**
 * Generate a Groww access token.
 *
 * POST:
 *
 * /v1/token/api/access
 *
 * Authorization:
 *
 * Bearer API_KEY
 */
async function generateAccessToken() {
  try {
    const apiKey =
      config.groww.apiKey;
    const apiSecret =
      config.groww.apiSecret;
    /* -----------------------------------------------
       VALIDATE CONFIGURATION
    ------------------------------------------------ */
    if (!apiKey) {
      throw new Error(
        'GROWW_API_KEY is missing'
      );
    }
    if (!apiSecret) {
      throw new Error(
        'GROWW_API_SECRET is missing'
      );
    }
    /* -----------------------------------------------
       TIMESTAMP
    ------------------------------------------------ */
    const timestamp =
      Math.floor(
        Date.now() / 1000
      )
        .toString();
    /* -----------------------------------------------
       CHECKSUM
    ------------------------------------------------ */
    const checksum =
      generateChecksum(
        apiSecret,
        timestamp
      );
    console.log(
      'Generating Groww access token...'
    );
    /* -----------------------------------------------
       REQUEST TOKEN
    ------------------------------------------------ */
    const response =
      await axios.post(
        `${GROWW_BASE_URL}/token/api/access`,
        {
          key_type:
            'approval',
          checksum:
            checksum,
          timestamp:
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
          timeout:
            10000,
        }
      );
    const data =
      response.data;
    /* -----------------------------------------------
       EXTRACT TOKEN
    ------------------------------------------------ */
    const token =
      data.token ||
      data.payload?.token;
    if (!token) {
      console.error(
        'Unexpected Groww token response:',
        JSON.stringify(
          data,
          null,
          2
        )
      );
      throw new Error(
        'Groww did not return an access token'
      );
    }
    /* -----------------------------------------------
       CACHE TOKEN
    ------------------------------------------------ */
    cachedToken =
      token;
    /*
     * Keep token temporarily cached.
     *
     * This prevents generating a token
     * for every API request.
     */
    tokenExpiry =
      Date.now() +
      5 *
      60 *
      1000;
    console.log(
      'Groww access token generated successfully'
    );
    return cachedToken;
  } catch (error) {
    console.error(
      'Groww token generation failed'
    );
    if (error.response) {
      console.error(
        'Groww response:',
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    } else {
      console.error(
        error.message
      );
    }
    throw error;
  }
}
/* =========================================================
   GET ACCESS TOKEN
========================================================= */
async function getAccessToken() {
  if (
    cachedToken &&
    tokenExpiry &&
    Date.now() < tokenExpiry
  ) {
    return cachedToken;
  }
  return generateAccessToken();
}
/* =========================================================
   GET AUTHENTICATED CLIENT
========================================================= */
async function getGrowwClient() {
  const token =
    await getAccessToken();
  return axios.create({
    baseURL:
      GROWW_BASE_URL,
    headers: {
      Authorization:
        `Bearer ${token}`,
      Accept:
        'application/json',
      'X-API-VERSION':
        '1.0',
    },
    timeout:
      10000,
  });
}
/* =========================================================
   TEST CONNECTION
========================================================= */
/**
 * Test that the Groww integration actually works end to end:
 * fetches a token (or reuses the cached one) and requests a
 * real quote. Used by GET /api/market/test.
 */
async function testConnection() {
  const client =
    await getGrowwClient();
  const response =
    await client.get(
      '/live-data/quote',
      {
        params: {
          exchange: 'NSE',
          segment: 'CASH',
          trading_symbol:
            'RELIANCE',
        },
      }
    );
  return {
    reachable: true,
    sample: response.data,
  };
}
/* =========================================================
   GET CONNECTION INFO
========================================================= */
/**
 * Non-secret diagnostic info about how Groww is configured.
 * Used when live mode is on but credentials are missing.
 */
function getConnectionInfo() {
  return {
    baseUrl: GROWW_BASE_URL,
    hasApiKey: Boolean(
      config.groww.apiKey
    ),
    hasApiSecret: Boolean(
      config.groww.apiSecret
    ),
  };
}
/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  generateChecksum,
  generateAccessToken,
  getAccessToken,
  getGrowwClient,
  testConnection,
  getConnectionInfo,
};
