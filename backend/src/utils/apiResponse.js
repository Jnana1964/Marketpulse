/**
 * Consistent API response envelope used by every route.
 */
function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, message = 'Something went wrong', status = 400, error = null, code = undefined) {
  const body = { success: false, message, error: error || null };
  if (code) body.code = code;
  return res.status(status).json(body);
}

module.exports = { ok, fail };
