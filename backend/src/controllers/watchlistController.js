const pool = require('../config/db');
const { ApiError } = require('../middleware/errorMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const { findInstrument } = require('../config/instrumentUniverse');

async function assertOwnedWatchlist(userId, watchlistId) {
  const [rows] = await pool.query('SELECT * FROM watchlists WHERE id = :id AND user_id = :userId', {
    id: watchlistId,
    userId,
  });
  if (!rows[0]) throw new ApiError('Watchlist not found.', 404, 'WATCHLIST_NOT_FOUND');
  return rows[0];
}

const listWatchlists = asyncHandler(async (req, res) => {
  const [watchlists] = await pool.query(
    'SELECT id, name, created_at, updated_at FROM watchlists WHERE user_id = :userId ORDER BY created_at ASC',
    { userId: req.user.id }
  );
  return ok(res, { watchlists });
});

const createWatchlist = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ApiError('Watchlist name is required.', 422, 'VALIDATION_ERROR');
  }
  const [result] = await pool.query('INSERT INTO watchlists (user_id, name) VALUES (:userId, :name)', {
    userId: req.user.id,
    name: name.trim(),
  });
  return ok(res, { id: result.insertId, name: name.trim() }, 'Watchlist created.', 201);
});

const getWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await assertOwnedWatchlist(req.user.id, req.params.id);
  const [items] = await pool.query(
    'SELECT * FROM watchlist_items WHERE watchlist_id = :watchlistId ORDER BY created_at ASC',
    { watchlistId: watchlist.id }
  );
  return ok(res, { watchlist, items });
});

const renameWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await assertOwnedWatchlist(req.user.id, req.params.id);
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ApiError('Watchlist name is required.', 422, 'VALIDATION_ERROR');
  }
  await pool.query('UPDATE watchlists SET name = :name WHERE id = :id', { name: name.trim(), id: watchlist.id });
  return ok(res, { id: watchlist.id, name: name.trim() }, 'Watchlist renamed.');
});

const deleteWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await assertOwnedWatchlist(req.user.id, req.params.id);
  await pool.query('DELETE FROM watchlists WHERE id = :id', { id: watchlist.id });
  return ok(res, { id: watchlist.id }, 'Watchlist deleted.');
});

const addItem = asyncHandler(async (req, res) => {
  const watchlist = await assertOwnedWatchlist(req.user.id, req.params.id);
  const { symbol, exchange = 'NSE' } = req.body || {};
  if (!symbol || typeof symbol !== 'string') {
    throw new ApiError('A stock symbol is required.', 422, 'VALIDATION_ERROR');
  }

  const instrument = findInstrument(symbol, exchange);
  if (!instrument) {
    throw new ApiError(
      `"${symbol}" is not in MarkPulse's supported stock universe yet.`,
      404,
      'INSTRUMENT_NOT_SUPPORTED'
    );
  }

  const [existing] = await pool.query(
    'SELECT id FROM watchlist_items WHERE watchlist_id = :watchlistId AND symbol = :symbol AND exchange = :exchange',
    { watchlistId: watchlist.id, symbol: instrument.symbol, exchange: instrument.exchange }
  );
  if (existing.length > 0) {
    throw new ApiError(`${instrument.symbol} is already in this watchlist.`, 409, 'DUPLICATE_ITEM');
  }

  const identifier = `${instrument.exchange}_${instrument.symbol}`;
  const [result] = await pool.query(
    `INSERT INTO watchlist_items (watchlist_id, symbol, exchange, instrument_name, instrument_identifier)
     VALUES (:watchlistId, :symbol, :exchange, :name, :identifier)`,
    {
      watchlistId: watchlist.id,
      symbol: instrument.symbol,
      exchange: instrument.exchange,
      name: instrument.name,
      identifier,
    }
  );

  return ok(
    res,
    {
      id: result.insertId,
      symbol: instrument.symbol,
      exchange: instrument.exchange,
      instrumentName: instrument.name,
      instrumentIdentifier: identifier,
    },
    'Stock added to watchlist.',
    201
  );
});

const removeItem = asyncHandler(async (req, res) => {
  const watchlist = await assertOwnedWatchlist(req.user.id, req.params.id);
  const [result] = await pool.query('DELETE FROM watchlist_items WHERE id = :itemId AND watchlist_id = :watchlistId', {
    itemId: req.params.itemId,
    watchlistId: watchlist.id,
  });
  if (result.affectedRows === 0) {
    throw new ApiError('Watchlist item not found.', 404, 'ITEM_NOT_FOUND');
  }
  return ok(res, { id: Number(req.params.itemId) }, 'Stock removed from watchlist.');
});

module.exports = {
  listWatchlists,
  createWatchlist,
  getWatchlist,
  renameWatchlist,
  deleteWatchlist,
  addItem,
  removeItem,
  assertOwnedWatchlist,
};
