const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.db.host,
  port: Number(config.db.port),
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  namedPlaceholders: true,
  dateStrings: true,

  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
