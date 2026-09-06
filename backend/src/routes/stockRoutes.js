const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { search } = require('../controllers/stockController');

const router = express.Router();
router.use(requireAuth);

router.get('/search', search);

module.exports = router;
