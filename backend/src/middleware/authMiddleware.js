const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { ApiError } = require('./errorMiddleware');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verifies the Bearer JWT and attaches { id, email, name } to req.user.
 * The user id ALWAYS comes from the verified token — every downstream
 * controller must use req.user.id, never a client-supplied user id.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError('Missing or invalid authorization header.', 401, 'AUTH_TOKEN_MISSING');
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError('Session expired. Please sign in again.', 401, 'AUTH_TOKEN_EXPIRED');
    }
    throw new ApiError('Invalid authentication token.', 401, 'AUTH_TOKEN_INVALID');
  }
});

module.exports = { requireAuth };
