/**
 * Market data orchestration layer.
 *
 * Controllers communicate ONLY with this service.
 *
 * This service decides whether to use:
 *
 * - Groww live market data
 * - Demo market data
 *
 * It also:
 *
 * - Caches quotes
 * - Provides fallback behavior
 * - Adds LIVE / DELAYED / STALE / DEMO status
 */

const config = require('../config/env');

const constants = require('../config/constants');

const logger = require('../utils/logger');

const groww = require('./growwService');

const demo = require('./demoMarketData');

const {
  getMarketStatus,
} = require('../utils/dateUtils');


/* =========================================================
   QUOTE CACHE
========================================================= */

/*
 * Key:
 *
 * NSE_RELIANCE
 *
 * Value:
 *
 * {
 *   snapshot,
 *   fetchedAt
 * }
 */

const quoteCache = new Map();


function cacheKey(
  exchange,
  symbol
) {
  return `${exchange}_${symbol}`;
}


/* =========================================================
   CACHE VALIDITY
========================================================= */

function isCacheFresh(entry) {
  if (!entry) {
    return false;
  }

  return (
    Date.now() -
      entry.fetchedAt
    <
    constants.CACHE.QUOTE_TTL_MS
  );
}


/* =========================================================
   LIVE MODE CHECK
========================================================= */

function liveModeEnabled() {
  return (
    config.marketDataMode === 'live' &&

    Boolean(config.groww.apiKey) &&

    Boolean(config.groww.apiSecret)
  );
}


/* =========================================================
   DATA STATUS
========================================================= */

function withDataStatus(snapshot) {
  if (!snapshot) {
    return null;
  }


  const timestamp =
    new Date(snapshot.timestamp);


  const timestampMs =
    timestamp.getTime();


  /*
   * Avoid NaN if a provider gives
   * an invalid timestamp.
   */

  const ageMs =
    Number.isNaN(timestampMs)
      ? null
      : Math.max(
          0,
          Date.now() - timestampMs
        );


  let dataStatus;


  /*
   * Demo data.
   */

  if (snapshot.source === 'demo') {
    dataStatus = 'DEMO';
  }


  /*
   * Invalid timestamp.
   */

  else if (ageMs === null) {
    dataStatus = 'STALE';
  }


  /*
   * Fresh live data.
   */

  else if (
    ageMs <=
    constants.FRESHNESS.LIVE_MAX_AGE_MS
  ) {
    dataStatus = 'LIVE';
  }


  /*
   * Delayed data.
   */

  else if (
    ageMs <=
    constants.FRESHNESS.DELAYED_MAX_AGE_MS
  ) {
    dataStatus = 'DELAYED';
  }


  /*
   * Old data.
   */

  else {
    dataStatus = 'STALE';
  }


  return {
    ...snapshot,

    dataStatus,

    ageMs,
  };
}


/* =========================================================
   GET QUOTE
========================================================= */

/**
 * Fetch a market quote.
 *
 * If live Groww API fails:
 *
 * -> use demo data
 *
 * This keeps the application usable while ensuring
 * the returned data clearly says DEMO.
 */

async function getQuote({
  symbol,
  exchange,
  segment = 'CASH',
}) {
  const key =
    cacheKey(
      exchange,
      symbol
    );


  const cached =
    quoteCache.get(key);


  /*
   * Return cached quote.
   */

  if (isCacheFresh(cached)) {
    return withDataStatus(
      cached.snapshot
    );
  }


  /*
   * LIVE MODE
   */

  if (liveModeEnabled()) {
    try {
      const snapshot =
        await groww.getQuote({
          exchange,

          segment,

          symbol,
        });


      quoteCache.set(
        key,
        {
          snapshot,

          fetchedAt:
            Date.now(),
        }
      );


      return withDataStatus(
        snapshot
      );

    } catch (error) {
      logger.warn(
        `Groww quote failed for ${symbol}; falling back to demo data.`,
        {
          code: error.code,

          message:
            error.message,
        }
      );


      const fallback =
        demo.getDemoQuote(
          symbol
        );


      /*
       * No demo data exists.
       */

      if (!fallback) {
        throw error;
      }


      quoteCache.set(
        key,
        {
          snapshot: fallback,

          fetchedAt:
            Date.now(),
        }
      );


      return {
        ...withDataStatus(
          fallback
        ),

        providerNote:
          'Live Groww data is currently unavailable. Demo data is being shown.',
      };
    }
  }


  /*
   * DEMO MODE
   */

  const demoSnapshot =
    demo.getDemoQuote(symbol);


  if (!demoSnapshot) {
    return null;
  }


  quoteCache.set(
    key,
    {
      snapshot: demoSnapshot,

      fetchedAt:
        Date.now(),
    }
  );


  return withDataStatus(
    demoSnapshot
  );
}


/* =========================================================
   GET MULTIPLE QUOTES
========================================================= */

async function getQuotes(items) {
  if (!Array.isArray(items)) {
    return [];
  }


  const results =
    await Promise.all(
      items.map(
        async (item) => {
          const quote =
            await getQuote({
              symbol:
                item.symbol,

              exchange:
                item.exchange,

              segment:
                item.segment ||
                'CASH',
            });


          return {
            item,

            quote,
          };
        }
      )
    );


  return results;
}


/* =========================================================
   GET HISTORICAL CANDLES
========================================================= */

async function getHistoricalCandles({
  symbol,

  exchange,

  segment = 'CASH',

  startTime,

  endTime,

  intervalInMinutes,
}) {

  /*
   * LIVE MODE
   */

  if (liveModeEnabled()) {
    try {
      const candles =
        await groww.getHistoricalCandles({
          symbol,

          exchange,

          segment,

          startTime,

          endTime,

          intervalInMinutes,
        });


      return {
        candles,

        source: 'groww',

        dataStatus: 'LIVE',
      };

    } catch (error) {
      logger.warn(
        `Groww historical data failed for ${symbol}; falling back to demo data.`,
        {
          code: error.code,

          message:
            error.message,
        }
      );


      const candles =
        demo.getDemoCandles(
          symbol,
          {
            startTime,

            endTime,

            intervalMinutes:
              intervalInMinutes ||
              15,
          }
        );


      return {
        candles,

        source: 'demo',

        dataStatus: 'DEMO',

        providerNote:
          'Live Groww historical data is currently unavailable. Demo data is being shown.',
      };
    }
  }


  /*
   * DEMO MODE
   */

  const candles =
    demo.getDemoCandles(
      symbol,
      {
        startTime,

        endTime,

        intervalMinutes:
          intervalInMinutes ||
          15,
      }
    );


  return {
    candles,

    source: 'demo',

    dataStatus: 'DEMO',
  };
}


/* =========================================================
   TEST LIVE CONNECTION
========================================================= */

/**
 * IMPORTANT:
 *
 * Unlike getQuote(), this function DOES NOT silently
 * fall back to demo data when live mode is configured.
 *
 * This makes /api/market/test useful for debugging.
 */

async function testLiveConnection() {
  /*
   * Demo mode is intentional.
   */

  if (config.marketDataMode !== 'live') {
    const sample =
      demo.getDemoQuote(
        'RELIANCE'
      );


    return {
      connected: false,

      mode: 'demo',

      reason:
        'MARKET_DATA_MODE is set to demo.',

      sample:
        withDataStatus(sample),
    };
  }


  /*
   * Credentials missing.
   */

  if (
    !config.groww.apiKey ||
    !config.groww.apiSecret
  ) {
    return {
      connected: false,

      mode: 'live',

      reason:
        'GROWW_API_KEY or GROWW_API_SECRET is not configured.',

      connection:
        groww.getConnectionInfo(),
    };
  }


  /*
   * Explicitly test Groww.
   *
   * No demo fallback here.
   */

  const result =
    await groww.testConnection();


  return {
    connected: true,

    mode: 'live',

    reason: null,

    ...result,
  };
}


/* =========================================================
   GET MODE
========================================================= */

function getMode() {
  /*
   * Explicit demo mode.
   */

  if (
    config.marketDataMode === 'demo'
  ) {
    return {
      mode: 'demo',

      marketStatus:
        getMarketStatus(),

      reason:
        'MARKET_DATA_MODE=demo. MarkPulse is running on deterministic demo data.',

      liveConfigured: false,
    };
  }


  /*
   * Live mode with missing credentials.
   */

  if (!liveModeEnabled()) {
    return {
      mode: 'demo',

      marketStatus:
        getMarketStatus(),

      reason:
        'MARKET_DATA_MODE=live but GROWW_API_KEY or GROWW_API_SECRET is not configured.',

      liveConfigured: false,
    };
  }


  /*
   * Live mode configured.
   */

  return {
    mode: 'live',

    marketStatus:
      getMarketStatus(),

    reason: null,

    liveConfigured: true,
  };
}


/* =========================================================
   CLEAR CACHE
========================================================= */

function clearQuoteCache() {
  quoteCache.clear();
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getQuote,

  getQuotes,

  getHistoricalCandles,

  getMode,

  testLiveConnection,

  clearQuoteCache,
};
