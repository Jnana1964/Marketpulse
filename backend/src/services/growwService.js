const axios = require('axios');

const crypto = require('crypto');


/* =========================================================
   GROWW CONFIGURATION
========================================================= */

const GROW_BASE_URL =
  'https://api.groww.in/v1';


/* =========================================================
   TOKEN CACHE
========================================================= */

let cachedToken = null;

let tokenExpiry = null;


/* =========================================================
   GENERATE CHECKSUM
========================================================= */

/**
 * Groww checksum format:
 *
 * SHA256(API_SECRET + TIMESTAMP)
 *
 * TIMESTAMP:
 * Epoch time in seconds
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
 * Generate a Groww API access token.
 *
 * Environment variables:
 *
 * GROWW_API_KEY
 * GROWW_API_SECRET
 */

async function generateAccessToken() {

  try {

    const apiKey =
      process.env.GROWW_API_KEY;


    const apiSecret =
      process.env.GROWW_API_SECRET;


    /* -----------------------------------------------------
       VALIDATE ENVIRONMENT VARIABLES
    ----------------------------------------------------- */

    if (!apiKey) {

      const error =
        new Error(
          'GROWW_API_KEY is missing.'
        );

      error.code =
        'GROWW_API_KEY_MISSING';


      throw error;
    }


    if (!apiSecret) {

      const error =
        new Error(
          'GROWW_API_SECRET is missing.'
        );

      error.code =
        'GROWW_API_SECRET_MISSING';


      throw error;
    }


    /* -----------------------------------------------------
       GENERATE TIMESTAMP
    ----------------------------------------------------- */

    const timestamp =
      Math.floor(
        Date.now() / 1000
      ).toString();


    /* -----------------------------------------------------
       GENERATE CHECKSUM
    ----------------------------------------------------- */

    const checksum =
      generateChecksum(
        apiSecret,
        timestamp
      );


    console.log(
      'Generating Groww access token...'
    );


    /* -----------------------------------------------------
       REQUEST ACCESS TOKEN
    ----------------------------------------------------- */

    const response =
      await axios.post(

        `${GROW_BASE_URL}/token/api/access`,


        {
          key_type:
            'approval',

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


          timeout:
            10000,
        }
      );


    const data =
      response.data;


    console.log(
      'Groww token response received.'
    );


    /* -----------------------------------------------------
       EXTRACT TOKEN
    ----------------------------------------------------- */

    const token =

      data?.token ||

      data?.payload?.token;


    if (!token) {

      console.error(
        'Unexpected Groww token response:',
        JSON.stringify(
          data,
          null,
          2
        )
      );


      const error =
        new Error(
          'Groww did not return an access token.'
        );


      error.code =
        'GROWW_TOKEN_MISSING';


      throw error;
    }


    /* -----------------------------------------------------
       CACHE TOKEN
    ----------------------------------------------------- */

    cachedToken =
      token;


    /*
     * Cache temporarily.
     *
     * We will regenerate the token
     * when the cache expires.
     */

    tokenExpiry =
      Date.now() +
      5 * 60 * 1000;


    console.log(
      'Groww access token generated successfully.'
    );


    return cachedToken;


  } catch (error) {


    console.error(
      'Groww token generation failed.'
    );


    if (error.response) {

      console.error(
        'Groww API response:',
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );


      const providerError =
        new Error(

          error.response.data?.message ||

          error.response.data?.error?.message ||

          'Groww authentication failed.'
        );


      providerError.code =
        error.response.data?.code ||

        error.response.data?.error?.code ||

        'GROWW_AUTH_ERROR';


      providerError.status =
        error.response.status;


      throw providerError;
    }


    throw error;
  }
}


/* =========================================================
   GET ACCESS TOKEN
========================================================= */

/**
 * Returns a cached token when available.
 *
 * Otherwise generates a new token.
 */

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
   GET GROWW HTTP CLIENT
========================================================= */

/**
 * Returns an authenticated Axios client.
 *
 * The access token is automatically generated
 * when required.
 */

async function getGrowwClient() {


  const token =
    await getAccessToken();


  return axios.create({

    baseURL:
      GROW_BASE_URL,


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
   CLEAR TOKEN CACHE
========================================================= */

/**
 * Useful if an API request returns
 * an authentication failure.
 */

function clearTokenCache() {

  cachedToken = null;

  tokenExpiry = null;
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

  generateChecksum,

  generateAccessToken,

  getAccessToken,

  getGrowwClient,

  clearTokenCache,
};
