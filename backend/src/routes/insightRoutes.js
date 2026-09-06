const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getDashboard, getStockInsight, getChanges, getHistory, getHistoryDetail } = require('../controllers/insightController');

const router = express.Router();
router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.get('/stock/:symbol', getStockInsight);
router.get('/changes', getChanges);
router.get('/history', getHistory);
router.get('/history/:snapshotTime', getHistoryDetail);

module.exports = router;
