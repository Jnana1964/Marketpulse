/**
 * Centralized environment configuration.
 *
 * Every other module reads config through this file instead of touching
 * `process.env` directly — one place to see what the app depends on, and
 * one place to change defaults.
 */
const dotenv = require('dotenv');
dotenv.config();

function requireEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean),

  db: {
    host: requireEnv('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT || 3306),
    user: requireEnv('DB_USER', 'root'),
    password: process.env.DB_PASSWORD || '',
    database: requireEnv('DB_NAME', 'markpulse'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // "live" attempts real Groww API calls; "demo" always uses the seeded
  // instrument universe. Even in "live" mode, a missing token forces demo
  // behavior — see marketDataService for the fallback logic.
  marketDataMode: (process.env.MARKET_DATA_MODE || 'demo').toLowerCase(),

  groww: {
    baseUrl: 'https://api.groww.in/v1',
    authToken: process.env.GROWW_API_AUTH_TOKEN || '',
  },

  // Off by default — see jobs/marketSnapshotJob.js for why an unrequested
  // background poll must never be the default behavior.
  enableBackgroundJob: (process.env.ENABLE_BACKGROUND_JOB || 'false').toLowerCase() === 'true',
};

module.exports = config;
