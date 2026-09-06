const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const { notFoundMiddleware, errorMiddleware } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const marketRoutes = require('./routes/marketRoutes');
const stockRoutes = require('./routes/stockRoutes');
const insightRoutes = require('./routes/insightRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsAllowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ success: true, message: 'MarkPulse API is running.' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/watchlists', watchlistRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/stocks', stockRoutes);
  app.use('/api/insights', insightRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

module.exports = createApp;
