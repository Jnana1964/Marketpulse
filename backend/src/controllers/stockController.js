const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const { searchInstruments } = require('../config/instrumentUniverse');

/**
 * Searches MarkPulse's supported stock universe (see config/instrumentUniverse.js
 * for why this isn't a live search against Groww — that endpoint doesn't exist).
 */
const search = asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  const results = searchInstruments(query);
  return ok(res, { results, universeLimited: true });
});

module.exports = { search };
