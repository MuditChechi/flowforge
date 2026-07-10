const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const taskRoutes = require('./routes/tasks');
const analyticsRoutes = require('./routes/analytics');

// Throttle credential-guessing on the auth endpoints. Disabled under test so
// the suite isn't rate-limited.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts, please try again later' }
});

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'FlowForge API running' }));

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/analytics', analyticsRoutes);

  app.use((req, res) => res.status(404).json({ message: 'Not found' }));

  // Centralized error handler. Never leak internals to the client in production.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err.stack || err);
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }
    const body = { message: 'Something went wrong' };
    if (process.env.NODE_ENV !== 'production') body.error = err.message;
    res.status(err.status || 500).json(body);
  });

  return app;
};

module.exports = { createApp };
