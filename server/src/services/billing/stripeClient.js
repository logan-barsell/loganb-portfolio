const Stripe = require('stripe');
const { config } = require('../../config');
const { getDb } = require('../../db');
const { createHttpError } = require('../../utils/normalize');

let stripeClient = null;

function getStripe() {
  if (!config.stripeSecretKey) {
    throw createHttpError(503, 'Stripe is not configured.', 'STRIPE_NOT_CONFIGURED');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey);
  }
  return stripeClient;
}

function isStripeEnabled() {
  return Boolean(config.stripeSecretKey);
}

async function getOrCreateStripeCustomer(clientRow, database = getDb()) {
  const stripe = getStripe();
  if (clientRow.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(clientRow.stripe_customer_id);
      if (!existing.deleted) return existing;
    } catch {
      // recreate below
    }
  }

  const customer = await stripe.customers.create({
    email: clientRow.email || undefined,
    name: clientRow.business_name || clientRow.name || undefined,
    metadata: { clientId: clientRow.id },
  });

  database
    .prepare(
      `UPDATE clients SET stripe_customer_id = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(customer.id, clientRow.id);

  return customer;
}

function billingReturnUrls(projectId) {
  const base = config.publicAppUrl;
  return {
    successUrl: `${base}/project/${projectId}?billing=success`,
    cancelUrl: `${base}/project/${projectId}?billing=cancel`,
  };
}

async function createDesignCheckoutSession({ invoice, client, projectId }) {
  const stripe = getStripe();
  const customer = await getOrCreateStripeCustomer(client);
  const { successUrl, cancelUrl } = billingReturnUrls(projectId);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customer.id,
    client_reference_id: invoice.id,
    metadata: {
      invoiceId: invoice.id,
      projectId,
      kind: invoice.kind,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: invoice.currency || 'usd',
          unit_amount: invoice.amount_cents,
          product_data: {
            name: invoice.label || invoice.kind,
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

async function createHostingCheckoutSession({ projectId, client, priceId, invoiceId }) {
  const stripe = getStripe();
  const customer = await getOrCreateStripeCustomer(client);
  const { successUrl, cancelUrl } = billingReturnUrls(projectId);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    client_reference_id: invoiceId || projectId,
    metadata: {
      projectId,
      invoiceId: invoiceId || '',
      kind: 'hosting',
    },
    subscription_data: {
      metadata: {
        projectId,
        invoiceId: invoiceId || '',
        kind: 'hosting',
      },
    },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

async function createBillingPortalSession(client, projectId) {
  const stripe = getStripe();
  const customer = await getOrCreateStripeCustomer(client);
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${config.publicAppUrl}/project/${projectId}`,
  });
  return session;
}

module.exports = {
  getStripe,
  isStripeEnabled,
  getOrCreateStripeCustomer,
  createDesignCheckoutSession,
  createHostingCheckoutSession,
  createBillingPortalSession,
};
