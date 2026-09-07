/**
 * Market data orchestration layer.
 *
 * Controllers call this module.
 * Controllers never communicate directly with Groww.
 */

const config = require('../config/env');

const constants =
  require('../config/constants');

const logger =
  require('../utils/logger');

const groww =
  require('./growwService');

const demo =
  require('./demoMarketData');

const {
  getMarketStatus,
} = require('../utils/dateUtils');


/* ============================================================
   QUOTE CACHE
============================================================ */

const quoteCache =
  new Map();


function cacheKey(
  exchange,
  symbol
) {

  return `${exchange}_${symbol}`;

}


function isCacheFresh(
  entry
) {

  if (!entry) {
    return false;
  }


  return (
    Date.now() -
      entry.fetchedAt
  ) <
    constants.CACHE.QUOTE_TTL_MS;

}


/* ============================================================
   LIVE MODE
============================================================ */

function liveModeEnabled() {

  return (
    config.marketDataMode === 'live' &&
    Boolean(
      config.groww.apiKey
    ) &&
    Boolean(
      config.groww.apiSecret
    )
  );

}


/* ============================================================
   DATA STATUS
============================================================ */

function withDataStatus(
  snapshot
) {

  const timestamp =
    new Date(
      snapshot.timestamp
    ).getTime();


  const ageMs =
    Date.now() - timestamp;


  let dataStatus;


  if (
    snapshot.source === 'demo'
  ) {

    dataStatus = 'DEMO';

  } else if (
    ageMs <=
    constants.FRESHNESS
      .LIVE_MAX_AGE_MS
  ) {

    dataStatus = 'LIVE';

  } else if (
    ageMs <=
    constants.FRESHNESS
      .DELAYED_MAX_AGE_MS
  ) {

    dataStatus = 'DELAYED';

  } else {

    dataStatus = 'STALE';

  }


  return {

    ...snapshot,

    dataStatus,

    ageMs,

  };

}


/* ============================================================
   GET ONE QUOTE
============================================================ */

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


  if (
    isCacheFresh(cached)
  ) {

    return withDataStatus(
      cached.snapshot
    );

  }


  /*
   * LIVE MODE
   */

  if (
    liveModeEnabled()
  ) {

    try {

      const snapshot =
        await groww.getQuote({

          symbol,

          exchange,

          segment,

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

    } catch (err) {

      logger.warn(
        `Groww quote failed for ${symbol}. Falling back to demo data.`,
        {

          code:
            err.code,

          message:
            err.message,

        }
      );


      const fallback =
        demo.getDemoQuote(
          symbol
        );


      /*
       * No fallback available.
       */

      if (!fallback) {

        throw err;

      }


      quoteCache.set(
        key,
        {

          snapshot:
            fallback,

          fetchedAt:
            Date.now(),

        }
      );


      return {

        ...withDataStatus(
          fallback
        ),

        providerNote:
          `Groww API unavailable: ${err.message}. Showing demo data instead.`,

      };

    }

  }


  /*
   * DEMO MODE
   */

  const demoSnapshot =
    demo.getDemoQuote(
      symbol
    );


  if (!demoSnapshot) {

    return null;

  }


  quoteCache.set(
    key,
    {

      snapshot:
        demoSnapshot,

      fetchedAt:
        Date.now(),

    }
  );


  return withDataStatus(
    demoSnapshot
  );

}


/* ============================================================
   GET MULTIPLE QUOTES
============================================================ */

async function getQuotes(
  items
) {

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


/* ============================================================
   HISTORICAL DATA
============================================================ */

async function getHistoricalCandles({

  symbol,

  exchange,

  segment = 'CASH',

  startTime,

  endTime,

  intervalInMinutes,

}) {

  if (
    liveModeEnabled()
  ) {

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

        source:
          'groww',

      };

    } catch (err) {

      logger.warn(
        `Groww historical data failed for ${symbol}. Falling back to demo candles.`,
        {

          code:
            err.code,

          message:
            err.message,

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

        source:
          'demo',

        providerNote:
          `Groww historical API unavailable: ${err.message}`,

      };

    }

  }


  return {

    candles:
      demo.getDemoCandles(
        symbol,
        {

          startTime,

          endTime,

          intervalMinutes:
            intervalInMinutes ||
            15,

        }
      ),

    source:
      'demo',

  };

}


/* ============================================================
   MODE INFORMATION
============================================================ */

function getMode() {

  const credentialsConfigured =
    Boolean(
      config.groww.apiKey
    ) &&
    Boolean(
      config.groww.apiSecret
    );


  let reason = null;


  if (
    config.marketDataMode !== 'live'
  ) {

    reason =
      'MARKET_DATA_MODE=demo — running on deterministic demo data by configuration.';

  } else if (
    !credentialsConfigured
  ) {

    reason =
      'GROWW_API_KEY or GROWW_API_SECRET is not configured, so MarkPulse is running on demo data.';

  }


  return {

    mode:
      liveModeEnabled()
        ? 'live'
        : 'demo',

    marketStatus:
      getMarketStatus(),

    reason,

    credentialsConfigured,

  };

}


/* ============================================================
   EXPORTS
============================================================ */

module.exports = {

  getQuote,

  getQuotes,

  getHistoricalCandles,

  getMode,

};
