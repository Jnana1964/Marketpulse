const logger = require('../utils/logger');
const { fail } = require('../utils/apiResponse');

/** Thrown by services/controllers for expected, well-typed failures. */
class ApiError extends Error {
  constructor(message, status = 400, code = undefined) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function notFoundMiddleware(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, null, 'ROUTE_NOT_FOUND');
}

/**
 * Centralized error handler. Always logs the full error server-side, but
 * only ever sends a safe message + code to the client — never a stack
 * trace, a raw DB error, or credential material.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} failed`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status} ${err.message}`);
  }

  const clientMessage = status >= 500 ? 'Something went wrong. Please try again.' : err.message;
  return fail(res, clientMessage, status, null, code);
}

module.exports = { ApiError, notFoundMiddleware, errorMiddleware };
