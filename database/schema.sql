-- MarkPulse database schema (MySQL 8+)
-- Run with: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS markpulse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE markpulse;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- watchlists  (a user can have multiple; a default "My Watchlist" is
-- created automatically on signup)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(120) NOT NULL DEFAULT 'My Watchlist',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_watchlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_watchlists_user_id (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- watchlist_items
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  watchlist_id INT NOT NULL,
  symbol VARCHAR(40) NOT NULL,
  exchange VARCHAR(10) NOT NULL DEFAULT 'NSE',
  instrument_name VARCHAR(160) NOT NULL,
  instrument_identifier VARCHAR(80) NOT NULL, -- e.g. "NSE_RELIANCE", used for Groww lookups
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_watchlist_items_watchlist FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
  UNIQUE KEY uq_watchlist_symbol (watchlist_id, symbol, exchange),
  KEY idx_watchlist_items_watchlist_id (watchlist_id),
  KEY idx_watchlist_items_symbol (symbol)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- market_snapshots
--
-- The core of "since you last checked": a snapshot is written whenever a
-- user actually observes a stock's state (see services/snapshotService.js
-- and the compare-then-advance ordering in changeDetectionService.js).
-- Comparisons are always against the user's OWN previous snapshot for
-- that item, never only against the stock's daily previous_close.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  watchlist_item_id INT NOT NULL,
  symbol VARCHAR(40) NOT NULL,
  exchange VARCHAR(10) NOT NULL DEFAULT 'NSE',
  price DECIMAL(12,4) NOT NULL,
  open DECIMAL(12,4) NULL,
  high DECIMAL(12,4) NULL,
  low DECIMAL(12,4) NULL,
  previous_close DECIMAL(12,4) NULL,
  volume BIGINT NULL,
  snapshot_time DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_snapshots_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_snapshots_item FOREIGN KEY (watchlist_item_id) REFERENCES watchlist_items(id) ON DELETE CASCADE,
  KEY idx_snapshots_user_id (user_id),
  KEY idx_snapshots_item_time (watchlist_item_id, snapshot_time)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- user_sessions
--
-- One logical row per user tracking when they last actively used the app
-- and, critically, `last_market_check_at` — the timestamp the "since you
-- last checked" comparison is anchored to. Updated only AFTER a
-- comparison completes (see PHASE 8 ordering in changeDetectionService.js).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  last_active_at DATETIME NULL,
  last_market_check_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_sessions_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- change_events
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS change_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  watchlist_item_id INT NOT NULL,
  event_type ENUM('PRICE_MOVEMENT','DAILY_HIGH','DAILY_LOW','VOLUME_SPIKE','VOLATILITY','GAP_FROM_OPEN','STALE_DATA') NOT NULL,
  previous_value DECIMAL(14,4) NULL,
  current_value DECIMAL(14,4) NULL,
  change_percentage DECIMAL(8,4) NULL,
  importance_score INT NOT NULL DEFAULT 0,
  message VARCHAR(255) NOT NULL,
  detected_at DATETIME NOT NULL,
  CONSTRAINT fk_change_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_change_events_item FOREIGN KEY (watchlist_item_id) REFERENCES watchlist_items(id) ON DELETE CASCADE,
  KEY idx_change_events_user_id (user_id),
  KEY idx_change_events_item_id (watchlist_item_id),
  KEY idx_change_events_detected_at (detected_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- notifications  (lightweight in-app notices; not push/email)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(255) NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'INFO',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_notifications_user_id (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- user_settings (Settings page: refresh + sensitivity preferences)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT NOT NULL PRIMARY KEY,
  auto_refresh TINYINT(1) NOT NULL DEFAULT 1,
  refresh_interval_seconds INT NOT NULL DEFAULT 30,
  change_sensitivity ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
