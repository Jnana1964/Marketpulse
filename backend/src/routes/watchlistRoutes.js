const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  listWatchlists,
  createWatchlist,
  getWatchlist,
  renameWatchlist,
  deleteWatchlist,
  addItem,
  removeItem,
} = require('../controllers/watchlistController');

const router = express.Router();
router.use(requireAuth);

router.get('/', listWatchlists);
router.post('/', createWatchlist);
router.get('/:id', getWatchlist);
router.put('/:id', renameWatchlist);
router.delete('/:id', deleteWatchlist);

router.post('/:id/items', addItem);
router.delete('/:id/items/:itemId', removeItem);

module.exports = router;
