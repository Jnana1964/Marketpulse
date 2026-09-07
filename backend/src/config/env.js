/**
 * Centralized environment configuration.
 *
 * Every other module reads configuration through this file
 * instead of accessing process.env directly.
 */

const dotenv = require('dotenv');

dotenv.config();


function requireEnv(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}


const config = {

  env:
    process.env.NODE_ENV ||
    'development',


  port:
    Number(process.env.PORT || 5000),


  corsAllowedOrigins:
    (
      process.env.CORS_ALLOWED_ORIGINS ||
      'http://localhost:5173'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),


  /* =========================================================
     DATABASE
  ========================================================= */

  db: {

    host:
      requireEnv(
        'DB_HOST',
        'localhost'
      ),


    port:
      Number(
        process.env.DB_PORT ||
        3306
      ),


    user:
      requireEnv(
        'DB_USER',
        'root'
      ),


    password:
      process.env.DB_PASSWORD ||
      '',


    database:
      requireEnv(
        'DB_NAME',
        'markpulse'
      ),
  },


  /* =========================================================
     JWT
  ========================================================= */

  jwt: {

    secret:
      requireEnv(
        'JWT_SECRET'
      ),


    expiresIn:
      process.env.JWT_EXPIRES_IN ||
      '7d',
  },


  /* =========================================================
     MARKET DATA
  ========================================================= */

  /*
   * Supported modes:
   *
   * live -> Uses Groww API
   * demo -> Uses demo market data
   */

  marketDataMode:
    (
      process.env.MARKET_DATA_MODE ||
      'demo'
    ).toLowerCase(),


  /* =========================================================
     GROWW API
  ========================================================= */

  /*
   * Environment variables:
   *
   * GROWW_API_KEY
   * GROWW_API_SECRET
   */

  groww: {

    baseUrl:
      'https://api.groww.in/v1',


    apiKey:
      process.env.GROWW_API_KEY ||
      '',


    apiSecret:
      process.env.GROWW_API_SECRET ||
      '',
  },


  /* =========================================================
     BACKGROUND JOB
  ========================================================= */

  enableBackgroundJob:

    (
      process.env.ENABLE_BACKGROUND_JOB ||
      'false'
    ).toLowerCase() === 'true',
};


module.exports = config;
