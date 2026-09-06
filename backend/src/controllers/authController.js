const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const config = require('../config/env');
const { ApiError } = require('../middleware/errorMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

const SALT_ROUNDS = 10;
const DEFAULT_WATCHLIST_NAME = 'My Watchlist';

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new ApiError('Please enter your name.', 422, 'VALIDATION_ERROR');
  }
  if (!isValidEmail(email)) {
    throw new ApiError('Please enter a valid email address.', 422, 'VALIDATION_ERROR');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new ApiError('Password must be at least 8 characters.', 422, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await pool.query('SELECT id FROM users WHERE email = :email', { email: normalizedEmail });
  if (existing.length > 0) {
    throw new ApiError('An account with this email already exists.', 409, 'EMAIL_IN_USE');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :passwordHash)',
      { name: name.trim(), email: normalizedEmail, passwordHash }
    );
    const userId = userResult.insertId;

    await connection.query(
      'INSERT INTO watchlists (user_id, name) VALUES (:userId, :name)',
      { userId, name: DEFAULT_WATCHLIST_NAME }
    );

    await connection.query(
      'INSERT INTO user_sessions (user_id, last_active_at, last_market_check_at) VALUES (:userId, NOW(), NULL)',
      { userId }
    );

    await connection.query(
      'INSERT INTO user_settings (user_id) VALUES (:userId)',
      { userId }
    );

    await connection.commit();

    const user = { id: userId, name: name.trim(), email: normalizedEmail, created_at: new Date() };
    const token = signToken(user);
    return ok(res, { token, user: toPublicUser(user) }, 'Account created.', 201);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || !password) {
    throw new ApiError('Please enter a valid email and password.', 422, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [rows] = await pool.query('SELECT * FROM users WHERE email = :email', { email: normalizedEmail });
  const user = rows[0];

  // Same error for "no such user" and "wrong password" — never reveal which.
  const invalidCredentialsError = () => new ApiError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');

  if (!user) throw invalidCredentialsError();

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) throw invalidCredentialsError();

  await pool.query('UPDATE user_sessions SET last_active_at = NOW() WHERE user_id = :userId', { userId: user.id });

  const token = signToken(user);
  return ok(res, { token, user: toPublicUser(user) }, 'Signed in.');
});

const me = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = :id', { id: req.user.id });
  const user = rows[0];
  if (!user) throw new ApiError('User not found.', 404, 'USER_NOT_FOUND');
  return ok(res, { user: toPublicUser(user) });
});

module.exports = { signup, login, me };
