const createApp = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const marketSnapshotJob = require('./jobs/marketSnapshotJob');
const pool = require('./config/db');

if (require.main === module) {
  const app = createApp();
  const pool = require('./config/db'); // adjust path if needed

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();

    console.log('✅ MySQL database connected successfully');

    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testDatabaseConnection();
  app.listen(config.port, () => {
    logger.info(`MarkPulse API listening on port ${config.port} (${config.env})`);
    logger.info(`Market data mode: ${config.marketDataMode}${config.groww.authToken ? '' : ' (no Groww token configured)'}`);
    if (config.enableBackgroundJob) {
      marketSnapshotJob.start();
    }
  });
}

module.exports = createApp;
