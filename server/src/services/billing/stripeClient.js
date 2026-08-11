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

/** Already-normalized app errors keep their status/code. */
function isAppHttpError(err) {
  return Boolean(err && typeof err.status === 'number' && err.code);
}

/**
 * Log Stripe failure context and throw a stable HTTP error for the API layer.
 * Does not put Stripe internals in the client payload (log only).
 */
function throwMappedStripeError(err, context = {}) {
  if (isAppHttpError(err)) throw err;

  const stripeType = err?.type || null;
  const stripeCode = err?.code || null;
  const requestId = err?.requestId || err?.raw?.requestId || null;
  const stripeMessage = err?.message || String(err);

  console.error(
    '[stripe]',
    context.op || 'request',
    `project=${context.projectId || '-'}`,
    `invoice=${context.invoiceId || '-'}`,
    `client=${context.clientId || '-'}`,
    `type=${stripeType || '-'}`,
    `code=${stripeCode || '-'}`,
    `req=${requestId || '-'}`,
    stripeMessage
  );

  throw createHttpError(
    502,
    'Unable to start checkout with Stripe. Please try again.',
    'STRIPE_REQUEST_FAILED'
  );
}

async function getOrCreateStripeCustomer(clientRow, database = getDb(), context = {}) {
  const stripe = getStripe();
  if (clientRow.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(clientRow.stripe_customer_id);
      if (!existing.deleted) return existing;
    } catch {
      // recreate below
    }
  }

  try {
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
  } catch (err) {
    throwMappedStripeError(err, {
      op: 'customers.create',
      clientId: clientRow.id,
      projectId: context.projectId,
      invoiceId: context.invoiceId,
    });
  }
}

function billingReturnUrls(projectId) {
  const base = config.publicAppUrl;
  return {
    successUrl: `${base}/project/${projectId}?billing=success`,
    cancelUrl: `${base}/project/${projectId}?billing=cancel`,
  };
}

async function createDesignCheckoutSession({ invoice, client, projectId }) {
  const ctx = { projectId, invoiceId: invoice.id, clientId: client.id };
  try {
    const stripe = getStripe();
    const customer = await getOrCreateStripeCustomer(client, getDb(), ctx);
    const { successUrl, cancelUrl } = billingReturnUrls(projectId);

    return await stripe.checkout.sessions.create({
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
  } catch (err) {
    throwMappedStripeError(err, { ...ctx, op: 'checkout.sessions.create.design' });
  }
}

async function createHostingCheckoutSession({ projectId, client, priceId, invoiceId }) {
  const ctx = { projectId, invoiceId, clientId: client.id };
  try {
    const stripe = getStripe();
    const customer = await getOrCreateStripeCustomer(client, getDb(), ctx);
    const { successUrl, cancelUrl } = billingReturnUrls(projectId);

    return await stripe.checkout.sessions.create({
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
  } catch (err) {
    throwMappedStripeError(err, { ...ctx, op: 'checkout.sessions.create.hosting' });
  }
}

async function createBillingPortalSession(client, projectId) {
  const ctx = { projectId, clientId: client.id };
  try {
    const stripe = getStripe();
    const customer = await getOrCreateStripeCustomer(client, getDb(), ctx);
    return await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${config.publicAppUrl}/project/${projectId}`,
    });
  } catch (err) {
    throwMappedStripeError(err, { ...ctx, op: 'billingPortal.sessions.create' });
  }
}

module.exports = {
  getStripe,
  isStripeEnabled,
  getOrCreateStripeCustomer,
  createDesignCheckoutSession,
  createHostingCheckoutSession,
  createBillingPortalSession,
};
