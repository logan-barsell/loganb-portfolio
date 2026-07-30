const express = require('express');
const { config } = require('../config');
const { getStripe } = require('../services/billing/stripeClient');
const { handleStripeWebhookEvent } = require('../services/webhooks');

const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!config.stripeWebhookSecret || !config.stripeSecretKey) {
      return res.status(503).send('Stripe webhook not configured.');
    }

    const stripe = getStripe();
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        config.stripeWebhookSecret
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    let result;
    try {
      result = await handleStripeWebhookEvent(event);
    } catch {
      return res.status(500).json({ ok: false });
    }

    if (result.duplicate) {
      return res.json({ received: true, duplicate: true });
    }

    return res.json({ received: true });
  }
);

module.exports = router;
