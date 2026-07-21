const express = require('express');
const helmet = require('helmet');
const { config } = require('./config');
const healthRouter = require('./routes/health');
const inquiriesRouter = require('./routes/inquiries');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(express.urlencoded({ extended: false, limit: '32kb' }));

  app.use('/api', healthRouter);
  app.use('/api/inquiries', inquiriesRouter);

  app.use((_req, res) => {
    res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Not found.' });
  });

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
