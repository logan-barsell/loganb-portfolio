const { config } = require('../config');
const { resolveHostingPlan, HOSTING_PLANS } = require('../constants');
const { getDb } = require('../db');
const {
  findHostingInvoiceForProject,
  recomputeProjectBillingStatus,
  stripePriceIdForPlan,
} = require('./invoices');

function toIsoSqliteFromUnix(seconds) {
  if (!seconds && seconds !== 0) return null;
  const ms = Number(seconds) * 1000;
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

function toIsoSqliteNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

/** Reverse-map a Stripe Price ID to our hosting_plan key. */
function hostingPlanFromPriceId(priceId) {
  if (!priceId) return null;
  const entries = Object.entries(config.stripeHostingPriceIds || {});
  for (const [planKey, id] of entries) {
    if (id && id === priceId && HOSTING_PLANS.includes(planKey)) return planKey;
  }
  // Fall back to defaultPriceId placeholders from constants
  for (const planKey of HOSTING_PLANS) {
    if (planKey === 'none') continue;
    const meta = resolveHostingPlan(planKey);
    if (meta.defaultPriceId && meta.defaultPriceId === priceId) return planKey;
  }
  return null;
}

function extractSubscriptionPriceId(subscription) {
  const item = subscription?.items?.data?.[0];
  if (!item) return null;
  if (typeof item.price === 'string') return item.price;
  return item.price?.id || null;
}

function hostingStatusFromStripeSubscription(subscription) {
  if (!subscription) return 'none';
  const status = subscription.status;
  if (status === 'canceled' || status === 'incomplete_expired') return 'none';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'overdue';
  if (status === 'active' || status === 'trialing' || status === 'paused') return 'active';
  return 'none';
}

/**
 * Claim a Stripe event for processing. Returns false if already processed.
 */
function claimWebhookEvent(eventId, type, database = getDb()) {
  if (!eventId) return true;
  try {
    database
      .prepare(
        `INSERT INTO stripe_webhook_events (event_id, type, processed_at)
         VALUES (?, ?, datetime('now'))`
      )
      .run(eventId, type || 'unknown');
    return true;
  } catch (err) {
    if (
      err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
      err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      String(err.message || '').includes('UNIQUE')
    ) {
      return false;
    }
    throw err;
  }
}

function findProjectBySubscriptionId(subscriptionId, database = getDb()) {
  if (!subscriptionId) return null;
  return database
    .prepare('SELECT * FROM projects WHERE stripe_subscription_id = ?')
    .get(subscriptionId);
}

function findProjectByStripeCustomerId(customerId, database = getDb()) {
  if (!customerId) return null;
  const client = database
    .prepare('SELECT id FROM clients WHERE stripe_customer_id = ?')
    .get(customerId);
  if (!client) return null;
  return database
    .prepare(
      `SELECT * FROM projects
       WHERE client_id = ?
       ORDER BY
         CASE WHEN stripe_subscription_id IS NOT NULL THEN 0 ELSE 1 END,
         updated_at DESC
       LIMIT 1`
    )
    .get(client.id);
}

/**
 * Resolve project for a Stripe subscription using metadata → sub id → customer.
 */
function findProjectForSubscription(subscription, database = getDb()) {
  const metaProjectId = subscription?.metadata?.projectId;
  if (metaProjectId) {
    const byMeta = database.prepare('SELECT * FROM projects WHERE id = ?').get(metaProjectId);
    if (byMeta) return byMeta;
  }
  const bySub = findProjectBySubscriptionId(subscription?.id, database);
  if (bySub) return bySub;
  const customerId =
    typeof subscription?.customer === 'string'
      ? subscription.customer
      : subscription?.customer?.id;
  return findProjectByStripeCustomerId(customerId, database);
}

function updateHostingInvoiceForPlan(projectId, planKey, priceId, database = getDb()) {
  const plan = resolveHostingPlan(planKey);
  if (plan.key === 'none') return;

  const hostingInv = findHostingInvoiceForProject(projectId, database);
  if (!hostingInv) return;

  database
    .prepare(
      `UPDATE invoices SET
         amount_cents = ?,
         label = ?,
         stripe_price_id = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(
      plan.amountCents,
      plan.label,
      priceId || stripePriceIdForPlan(plan.key),
      hostingInv.id
    );
}

/**
 * Mirror a Stripe Subscription onto the project (+ proposal plan when Price matches catalog).
 * Pass subscription=null to clear hosting subscription state.
 */
function syncProjectFromStripeSubscription(projectId, subscription, database = getDb()) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  if (!subscription) {
    database
      .prepare(
        `UPDATE projects SET
           stripe_subscription_id = NULL,
           stripe_hosting_price_id = NULL,
           hosting_cancel_at_period_end = 0,
           hosting_current_period_end = NULL,
           hosting_canceled_at = COALESCE(hosting_canceled_at, ?),
           hosting_status = 'none',
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(toIsoSqliteNow(), projectId);
    recomputeProjectBillingStatus(projectId, database);
    return database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  }

  const priceId = extractSubscriptionPriceId(subscription);
  const planKey = hostingPlanFromPriceId(priceId);
  const hostingStatus = hostingStatusFromStripeSubscription(subscription);
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  const periodEnd = toIsoSqliteFromUnix(subscription.current_period_end);
  const canceledAt =
    hostingStatus === 'none'
      ? toIsoSqliteFromUnix(subscription.canceled_at) || toIsoSqliteNow()
      : null;
  const subscriptionId =
    hostingStatus === 'none' ? null : subscription.id || project.stripe_subscription_id;

  database
    .prepare(
      `UPDATE projects SET
         stripe_subscription_id = ?,
         stripe_hosting_price_id = ?,
         hosting_cancel_at_period_end = ?,
         hosting_current_period_end = ?,
         hosting_canceled_at = ?,
         hosting_status = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(
      subscriptionId,
      priceId || null,
      cancelAtPeriodEnd ? 1 : 0,
      periodEnd,
      canceledAt,
      hostingStatus,
      projectId
    );

  if (planKey && planKey !== 'none' && project.proposal_id) {
    const plan = resolveHostingPlan(planKey);
    database
      .prepare(
        `UPDATE proposals SET
           hosting_plan = ?,
           hosting_monthly_cents = ?,
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(plan.key, plan.amountCents, project.proposal_id);
    updateHostingInvoiceForPlan(projectId, plan.key, priceId, database);
  }

  // Design payment cache only — hosting_status already set from Stripe
  recomputeProjectBillingStatus(projectId, database, { preserveHostingStatus: true });

  return database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
}

function isPlaceholderPriceId(priceId) {
  return !priceId || String(priceId).startsWith('price_temp_');
}

function assertRealHostingPriceId(priceId) {
  if (config.env === 'production' && isPlaceholderPriceId(priceId)) {
    const err = new Error('Hosting Stripe Price ID is not configured for production.');
    err.code = 'STRIPE_PRICE_NOT_CONFIGURED';
    err.status = 503;
    throw err;
  }
}

module.exports = {
  hostingPlanFromPriceId,
  extractSubscriptionPriceId,
  hostingStatusFromStripeSubscription,
  claimWebhookEvent,
  findProjectBySubscriptionId,
  findProjectByStripeCustomerId,
  findProjectForSubscription,
  syncProjectFromStripeSubscription,
  isPlaceholderPriceId,
  assertRealHostingPriceId,
  toIsoSqliteFromUnix,
};
