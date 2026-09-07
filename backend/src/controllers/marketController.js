const pool = require(
  '../config/db'
);


const asyncHandler = require(
  '../utils/asyncHandler'
);


const {
  ok,
  fail,
} = require(
  '../utils/apiResponse'
);


const {
  ApiError,
} = require(
  '../middleware/errorMiddleware'
);


const marketDataService = require(
  '../services/marketDataService'
);


const {
  findInstrument,
} = require(
  '../config/instrumentUniverse'
);


const {
  assertOwnedWatchlist,
} = require(
  './watchlistController'
);


/* =========================================================
   TEST CONNECTION
========================================================= */

/**
 * Test Groww connection.
 *
 * This endpoint intentionally does NOT require
 * application authentication.
 *
 * GET:
 *
 * /api/market/test
 */

const testConnection =
  asyncHandler(
    async (req, res) => {

      try {

        const result =
          await marketDataService
            .testLiveConnection();


        return ok(
          res,
          result
        );

      } catch (error) {

        return fail(

          res,


          'Groww API connection failed.',


          502,


          {

            mode:
              marketDataService
                .getMode(),


            error: {

              name:
                error.name,


              code:
                error.code ||
                'UNKNOWN_ERROR',


              message:
                error.message,


              status:
                error.status ||
                null,
            },
          },


          error.code ||
          'PROVIDER_ERROR'
        );
      }
    }
  );


/* =========================================================
   GET QUOTE
========================================================= */

/**
 * GET:
 *
 * /api/market/quote/:symbol
 */

const getQuote =
  asyncHandler(
    async (req, res) => {

      const {
        symbol,
      } = req.params;


      const instrument =
        findInstrument(symbol);


      if (!instrument) {

        return fail(

          res,


          `${symbol} is not a supported instrument.`,


          404,


          null,


          'INSTRUMENT_NOT_SUPPORTED'
        );
      }


      const quote =
        await marketDataService
          .getQuote({

            symbol:
              instrument.symbol,


            exchange:
              instrument.exchange,


            segment:
              instrument.segment ||
              'CASH',
          });


      return ok(

        res,


        {

          quote,

          instrument,
        }
      );
    }
  );


/* =========================================================
   GET WATCHLIST MARKET DATA
========================================================= */

/**
 * GET:
 *
 * /api/market/watchlist/:watchlistId
 */

const getWatchlistMarketData =
  asyncHandler(
    async (req, res) => {

      const watchlist =
        await assertOwnedWatchlist(

          req.user.id,

          req.params.watchlistId
        );


      const [items] =
        await pool.query(

          `
          SELECT *
          FROM watchlist_items
          WHERE watchlist_id = :id
          `,


          {
            id:
              watchlist.id,
          }
        );


      const quotes =
        await marketDataService
          .getQuotes(items);


      return ok(

        res,


        {

          watchlist,

          quotes,
        }
      );
    }
  );


/* =========================================================
   GET STOCK
========================================================= */

/**
 * GET:
 *
 * /api/market/stocks/:symbol
 */

const getStock =
  asyncHandler(
    async (req, res) => {

      const {
        symbol,
      } = req.params;


      const instrument =
        findInstrument(symbol);


      if (!instrument) {

        throw new ApiError(

          `${symbol} is not a supported instrument.`,


          404,


          'INSTRUMENT_NOT_SUPPORTED'
        );
      }


      const quote =
        await marketDataService
          .getQuote({

            symbol:
              instrument.symbol,


            exchange:
              instrument.exchange,


            segment:
              instrument.segment ||
              'CASH',
          });


      return ok(

        res,


        {

          instrument,

          quote,
        }
      );
    }
  );


/* =========================================================
   GET HISTORY
========================================================= */

/**
 * GET:
 *
 * /api/market/history/:symbol?range=1D
 *
 * Supported ranges:
 *
 * 1D
 * 1W
 * 1M
 * 3M
 */

const getHistory =
  asyncHandler(
    async (req, res) => {

      const {
        symbol,
      } = req.params;


      const instrument =
        findInstrument(symbol);


      if (!instrument) {

        throw new ApiError(

          `${symbol} is not a supported instrument.`,


          404,


          'INSTRUMENT_NOT_SUPPORTED'
        );
      }


      const range =

        (
          req.query.range ||
          '1D'
        )
          .toUpperCase();


      const now =
        new Date();


      const rangeConfig = {

        '1D': {

          hours:
            7,


          intervalMinutes:
            15,
        },


        '1W': {

          hours:
            24 * 7,


          intervalMinutes:
            60,
        },


        '1M': {

          hours:
            24 * 30,


          intervalMinutes:
            240,
        },


        '3M': {

          hours:
            24 * 90,


          intervalMinutes:
            1440,
        },

      }[range];


      if (!rangeConfig) {

        throw new ApiError(

          'Unsupported range. Use one of 1D, 1W, 1M, 3M.',


          422,


          'VALIDATION_ERROR'
        );
      }


      const startTime =

        new Date(

          now.getTime() -

          rangeConfig.hours *

            60 *

            60 *

            1000
        );


      const formatDateTime =
        (date) => {

          return date

            .toISOString()

            .slice(0, 19)

            .replace(
              'T',
              ' '
            );
        };


      const result =
        await marketDataService
          .getHistoricalCandles({

            symbol:
              instrument.symbol,


            exchange:
              instrument.exchange,


            segment:
              instrument.segment ||
              'CASH',


            startTime:
              formatDateTime(
                startTime
              ),


            endTime:
              formatDateTime(
                now
              ),


            intervalInMinutes:
              rangeConfig
                .intervalMinutes,
          });


      return ok(

        res,


        {

          instrument,


          range,


          candles:
            result.candles,


          source:
            result.source,


          dataStatus:
            result.dataStatus,


          providerNote:
            result.providerNote ||
            null,
        }
      );
    }
  );


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

  testConnection,

  getQuote,

  getWatchlistMarketData,

  getStock,

  getHistory,
};
