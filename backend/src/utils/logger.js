/**
 * Minimal structured logger.
 *
 * Never logs secrets (passwords, tokens) or raw stack traces to clients —
 * this is server-side only. Kept dependency-free on purpose: a hackathon
 * backend doesn't need a logging framework, just consistent, greppable
 * output.
 */
function timestamp() {
  return new Date().toISOString();
}

function info(message, meta) {
  console.log(`[${timestamp()}] INFO  ${message}`, meta !== undefined ? meta : '');
}

function warn(message, meta) {
  console.warn(`[${timestamp()}] WARN  ${message}`, meta !== undefined ? meta : '');
}

function error(message, err) {
  const detail = err instanceof Error ? { message: err.message, stack: err.stack } : err;
  console.error(`[${timestamp()}] ERROR ${message}`, detail !== undefined ? detail : '');
}

module.exports = { info, warn, error };
