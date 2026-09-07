const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/apiResponse');
const { ApiError } = require('../middleware/errorMiddleware');
const marketDataService = require('../services/marketDataService');
const { findInstrument } = require('../config/instrumentUniverse');
const { assertOwnedWatchlist } = require('./watchlistController');

/**
 * PHASE 4 verification endpoint: proves the Groww integration is wired up
 * correctly (or explains exactly why it isn't) before anything in the UI
 * depends on its response shape. Intentionally does not require auth so
 * it can be curled directly during setup.
 */
const testConnection = asyncHandler(async (req, res) => {
  const config = require('../config/env');
  const groww = require('../services/growwService');

  const mode = marketDataService.getMode();

  try {
    const quote = await groww.getQuote({
      symbol: 'RELIANCE',
      exchange: 'NSE',
      segment: 'CASH',
    });

    return ok(res, {
      mode,
      growwConnection: {
        success: true,
        message: 'Successfully connected to Groww API.',
      },
      quote,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: 'Groww API connection failed.',
      data: {
        mode,
        tokenConfigured: Boolean(config.groww.authToken),
        baseUrl: config.groww.baseUrl,
        error: {
          name: error.name,
          code: error.code || null,
          message: error.message,
          status: error.status || null,
        },
      },
    });
  }
});

const getQuote = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const instrument = findInstrument(symbol);
  if (!instrument) {
    return fail(res, `${symbol} is not a supported instrument.`, 404, null, 'INSTRUMENT_NOT_SUPPORTED');
  }
  const quote = await marketDataService.getQuote({ symbol: instrument.symbol, exchange: instrument.exchange });
  return ok(res, { quote, instrument });
});

const getWatchlistMarketData = asyncHandler(async (req, res) => {
  const watchlist = await assertOwnedWatchlist(req.user.id, req.params.watchlistId);
  const [items] = await pool.query('SELECT * FROM watchlist_items WHERE watchlist_id = :id', { id: watchlist.id });
  const quotes = await marketDataService.getQuotes(items);
  return ok(res, { watchlist, quotes });
});

const getStock = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const instrument = findInstrument(symbol);
  if (!instrument) {
    throw new ApiError(`${symbol} is not a supported instrument.`, 404, 'INSTRUMENT_NOT_SUPPORTED');
  }
  const quote = await marketDataService.getQuote({ symbol: instrument.symbol, exchange: instrument.exchange });
  return ok(res, { instrument, quote });
});

const getHistory = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const instrument = findInstrument(symbol);
  if (!instrument) {
    throw new ApiError(`${symbol} is not a supported instrument.`, 404, 'INSTRUMENT_NOT_SUPPORTED');
  }

  const range = (req.query.range || '1D').toUpperCase();
  const now = new Date();
  const rangeConfig = {
    '1D': { hours: 7, intervalMinutes: 15 },
    '1W': { hours: 24 * 7, intervalMinutes: 60 },
    '1M': { hours: 24 * 30, intervalMinutes: 240 },
    '3M': { hours: 24 * 90, intervalMinutes: 1440 },
  }[range];

  if (!rangeConfig) {
    throw new ApiError('Unsupported range. Use one of 1D, 1W, 1M, 3M.', 422, 'VALIDATION_ERROR');
  }

  const startTime = new Date(now.getTime() - rangeConfig.hours * 60 * 60 * 1000);
  const { candles, source } = await marketDataService.getHistoricalCandles({
    symbol: instrument.symbol,
    exchange: instrument.exchange,
    startTime: startTime.toISOString().slice(0, 19).replace('T', ' '),
    endTime: now.toISOString().slice(0, 19).replace('T', ' '),
    intervalInMinutes: rangeConfig.intervalMinutes,
  });

  return ok(res, { instrument, range, candles, source });
});

module.exports = { testConnection, getQuote, getWatchlistMarketData, getStock, getHistory };
