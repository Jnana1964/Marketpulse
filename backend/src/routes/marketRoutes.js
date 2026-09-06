const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { testConnection, getQuote, getWatchlistMarketData, getStock, getHistory } = require('../controllers/marketController');

const router = express.Router();

// Unauthenticated on purpose — see controller doc comment (Phase 4 setup check).
router.get('/test', testConnection);

router.use(requireAuth);
router.get('/quote/:symbol', getQuote);
router.get('/watchlist/:watchlistId', getWatchlistMarketData);
router.get('/stock/:symbol', getStock);
router.get('/history/:symbol', getHistory);

module.exports = router;
