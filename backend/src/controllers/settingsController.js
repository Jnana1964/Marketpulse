const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const { ApiError } = require('../middleware/errorMiddleware');

const VALID_SENSITIVITY = ['LOW', 'MEDIUM', 'HIGH'];
const VALID_INTERVALS = [30, 60];

const getSettings = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM user_settings WHERE user_id = :userId', { userId: req.user.id });
  const settings = rows[0] || {
    user_id: req.user.id,
    auto_refresh: 1,
    refresh_interval_seconds: 30,
    change_sensitivity: 'MEDIUM',
  };
  return ok(res, {
    autoRefresh: Boolean(settings.auto_refresh),
    refreshIntervalSeconds: settings.refresh_interval_seconds,
    changeSensitivity: settings.change_sensitivity,
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const { autoRefresh, refreshIntervalSeconds, changeSensitivity } = req.body || {};

  if (refreshIntervalSeconds !== undefined && !VALID_INTERVALS.includes(refreshIntervalSeconds)) {
    throw new ApiError('refreshIntervalSeconds must be 30 or 60.', 422, 'VALIDATION_ERROR');
  }
  if (changeSensitivity !== undefined && !VALID_SENSITIVITY.includes(changeSensitivity)) {
    throw new ApiError('changeSensitivity must be LOW, MEDIUM, or HIGH.', 422, 'VALIDATION_ERROR');
  }

  await pool.query(
    `INSERT INTO user_settings (user_id, auto_refresh, refresh_interval_seconds, change_sensitivity)
     VALUES (:userId, :autoRefresh, :refreshIntervalSeconds, :changeSensitivity)
     ON DUPLICATE KEY UPDATE
       auto_refresh = VALUES(auto_refresh),
       refresh_interval_seconds = VALUES(refresh_interval_seconds),
       change_sensitivity = VALUES(change_sensitivity)`,
    {
      userId: req.user.id,
      autoRefresh: autoRefresh === undefined ? 1 : autoRefresh ? 1 : 0,
      refreshIntervalSeconds: refreshIntervalSeconds || 30,
      changeSensitivity: changeSensitivity || 'MEDIUM',
    }
  );

  return ok(res, null, 'Settings updated.');
});

module.exports = { getSettings, updateSettings };
