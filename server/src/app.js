const express = require('express');
const helmet = require('helmet');
const { config } = require('./config');
const healthRouter = require('./routes/health');
const inquiriesRouter = require('./routes/inquiries');
const authRouter = require('./routes/auth');
const adminInquiriesRouter = require('./routes/adminInquiries');
const adminClientsRouter = require('./routes/adminClients');
const adminProposalsRouter = require('./routes/adminProposals');
const adminProjectsRouter = require('./routes/adminProjects');
const adminInvoicesRouter = require('./routes/adminInvoices');
const proposalSharesRouter = require('./routes/proposalShares');
const clientPortalRouter = require('./routes/clientPortal');
const stripeWebhooksRouter = require('./routes/stripeWebhooks');
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

  // Stripe webhooks need the raw body — mount before any json parser on this path.
  app.use('/api/stripe/webhook', stripeWebhooksRouter);

  app.use(express.urlencoded({ extended: false, limit: '32kb' }));

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin/inquiries', adminInquiriesRouter);
  app.use('/api/admin/clients', adminClientsRouter);
  app.use('/api/admin/proposals', adminProposalsRouter);
  app.use('/api/admin/projects', adminProjectsRouter);
  app.use('/api/admin/invoices', adminInvoicesRouter);
  app.use('/api/proposals/share', proposalSharesRouter);
  app.use('/api/projects', clientPortalRouter);
  app.use('/api/inquiries', inquiriesRouter);

  app.use((_req, res) => {
    res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Not found.' });
  });

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
