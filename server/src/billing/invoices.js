const { randomUUID } = require('crypto');
const {
  billingLineItemsForSchedule,
  DEFAULT_PAYMENT_SCHEDULE,
  resolveHostingPlan,
  INVOICE_KIND_LABELS,
} = require('../constants');
const { config } = require('../config');
const { getDb } = require('../db');

function toIsoSqliteNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

function todayUtcYmd() {
  return new Date().toISOString().slice(0, 10);
}

function stripePriceIdForPlan(planKey) {
  if (!planKey || planKey === 'none') return null;
  return config.stripeHostingPriceIds[planKey] || resolveHostingPlan(planKey).defaultPriceId;
}

function isStripeConfigured() {
  return Boolean(config.stripeSecretKey && !config.stripeSecretKey.startsWith('sk_test_replace'));
}

function listInvoicesForProject(projectId, database = getDb()) {
  return database
    .prepare(
      `SELECT * FROM invoices
       WHERE project_id = ? AND status != 'void'
       ORDER BY
         CASE kind
           WHEN 'deposit' THEN 1
           WHEN 'full' THEN 2
           WHEN 'balance' THEN 3
           WHEN 'hosting' THEN 4
           ELSE 5
         END,
         created_at ASC`
    )
    .all(projectId);
}

function getInvoiceById(id, database = getDb()) {
  return database.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
}

function createInvoiceRowsForProject(
  { projectId, clientId, proposalId, paymentSchedule, designAmountCents, hostingPlan },
  database = getDb()
) {
  const schedule = paymentSchedule || DEFAULT_PAYMENT_SCHEDULE;
  const lineItems = billingLineItemsForSchedule(schedule, designAmountCents);
  const insert = database.prepare(
    `INSERT INTO invoices (
       id, project_id, client_id, proposal_id, kind, status,
       amount_cents, currency, label, stripe_price_id
     ) VALUES (?, ?, ?, ?, ?, 'due', ?, 'usd', ?, ?)`
  );

  for (const item of lineItems) {
    insert.run(
      randomUUID(),
      projectId,
      clientId,
      proposalId || null,
      item.key,
      item.amountCents,
      item.label || INVOICE_KIND_LABELS[item.key] || item.key,
      null
    );
  }

  const plan = resolveHostingPlan(hostingPlan);
  if (plan.key !== 'none' && plan.amountCents != null) {
    insert.run(
      randomUUID(),
      projectId,
      clientId,
      proposalId || null,
      'hosting',
      plan.amountCents,
      plan.label,
      stripePriceIdForPlan(plan.key)
    );
  }

  return listInvoicesForProject(projectId, database);
}

function markInvoicePaid(invoiceId, stripeMeta = {}, database = getDb()) {
  const existing = getInvoiceById(invoiceId, database);
  if (!existing) return null;
  if (existing.status === 'paid') return existing;

  const paidAt = toIsoSqliteNow();
  database
    .prepare(
      `UPDATE invoices SET
         status = 'paid',
         paid_at = ?,
         stripe_checkout_session_id = COALESCE(?, stripe_checkout_session_id),
         stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id),
         stripe_invoice_id = COALESCE(?, stripe_invoice_id),
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(
      paidAt,
      stripeMeta.checkoutSessionId || null,
      stripeMeta.paymentIntentId || null,
      stripeMeta.stripeInvoiceId || null,
      invoiceId
    );

  return getInvoiceById(invoiceId, database);
}

function markInvoiceCheckoutSession(invoiceId, sessionId, database = getDb()) {
  database
    .prepare(
      `UPDATE invoices SET
         stripe_checkout_session_id = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(sessionId, invoiceId);
}

function paymentOkForActivation(schedule, invoices) {
  const byKind = Object.fromEntries((invoices || []).map((inv) => [inv.kind, inv]));
  if (schedule === 'full_before_launch') return true;
  if (schedule === 'full_upfront') {
    return byKind.full?.status === 'paid';
  }
  // deposit_50_50
  return byKind.deposit?.status === 'paid';
}

function dateOkForActivation(kickoffDateYmd) {
  if (!kickoffDateYmd) return true;
  return String(kickoffDateYmd) <= todayUtcYmd();
}

function recomputeProjectBillingStatus(projectId, database = getDb(), options = {}) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  const proposal = project.proposal_id
    ? database.prepare('SELECT * FROM proposals WHERE id = ?').get(project.proposal_id)
    : null;
  const invoices = listInvoicesForProject(projectId, database);
  const designKinds =
    (proposal?.payment_schedule || DEFAULT_PAYMENT_SCHEDULE) === 'deposit_50_50'
      ? ['deposit', 'balance']
      : ['full'];
  const designInvoices = invoices.filter((inv) => designKinds.includes(inv.kind));
  const paidDesign = designInvoices.filter((inv) => inv.status === 'paid');

  let designPaymentStatus = 'unpaid';
  if (designInvoices.length === 0) {
    designPaymentStatus = 'unpaid';
  } else if (paidDesign.length === designInvoices.length) {
    designPaymentStatus = 'paid';
  } else if (paidDesign.length > 0) {
    designPaymentStatus = 'partial';
  }

  // Hosting status is owned by Stripe subscription sync. Only derive a coarse
  // default when we have no subscription mirror and weren't asked to preserve.
  let hostingStatus = project.hosting_status || 'none';
  if (!options.preserveHostingStatus) {
    if (!project.stripe_subscription_id) {
      hostingStatus = 'none';
    } else if (project.hosting_status === 'overdue') {
      hostingStatus = 'overdue';
    } else if (project.hosting_status === 'active') {
      hostingStatus = 'active';
    } else {
      // Sub exists but status not yet set — treat as active until Stripe says otherwise
      hostingStatus = 'active';
    }
  }

  database
    .prepare(
      `UPDATE projects SET
         design_payment_status = ?,
         hosting_status = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(designPaymentStatus, hostingStatus, projectId);

  return database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
}

function setHostingStatus(projectId, hostingStatus, database = getDb()) {
  database
    .prepare(
      `UPDATE projects SET hosting_status = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(hostingStatus, projectId);
}

function setProjectSubscription(projectId, subscriptionId, database = getDb()) {
  database
    .prepare(
      `UPDATE projects SET
         stripe_subscription_id = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(subscriptionId || null, projectId);
}

/**
 * Activate on_hold project when payment + kickoff rules pass.
 * Admin mark-started bypasses via started_by=admin elsewhere.
 */
function maybeActivateProject(projectId, database = getDb()) {
  const { syncInquiryPipeline } = require('../db');
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project || project.status !== 'on_hold') return project;

  const proposal = project.proposal_id
    ? database.prepare('SELECT * FROM proposals WHERE id = ?').get(project.proposal_id)
    : null;
  const schedule = proposal?.payment_schedule || DEFAULT_PAYMENT_SCHEDULE;
  const invoices = listInvoicesForProject(projectId, database);
  const paymentOk = paymentOkForActivation(schedule, invoices);
  const dateOk = dateOkForActivation(proposal?.kickoff_date);

  if (!paymentOk || !dateOk) {
    recomputeProjectBillingStatus(projectId, database);
    return database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  }

  const startedAt = toIsoSqliteNow();
  database
    .prepare(
      `UPDATE projects SET
         status = 'active',
         started_at = COALESCE(started_at, ?),
         started_by = COALESCE(started_by, 'system'),
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(startedAt, projectId);

  if (project.inquiry_id) {
    syncInquiryPipeline(project.inquiry_id, database);
  }

  recomputeProjectBillingStatus(projectId, database);
  return database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
}

function markProjectStartedByAdmin(projectId, database = getDb()) {
  const { syncInquiryPipeline } = require('../db');
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  const startedAt = toIsoSqliteNow();
  database
    .prepare(
      `UPDATE projects SET
         status = 'active',
         started_at = ?,
         started_by = 'admin',
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(startedAt, projectId);

  if (project.inquiry_id) {
    syncInquiryPipeline(project.inquiry_id, database);
  }

  recomputeProjectBillingStatus(projectId, database);
  return database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
}

function setProjectReadyForLaunch(projectId, ready, database = getDb()) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  if (ready) {
    database
      .prepare(
        `UPDATE projects SET
           ready_for_launch_at = COALESCE(ready_for_launch_at, ?),
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(toIsoSqliteNow(), projectId);
  } else {
    database
      .prepare(
        `UPDATE projects SET
           ready_for_launch_at = NULL,
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(projectId);
  }

  return database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
}

function activationBlockReason(project, proposal, invoices) {
  if (!project || project.status !== 'on_hold') return null;
  const schedule = proposal?.payment_schedule || DEFAULT_PAYMENT_SCHEDULE;
  const paymentOk = paymentOkForActivation(schedule, invoices);
  const dateOk = dateOkForActivation(proposal?.kickoff_date);
  const parts = [];
  if (!paymentOk) {
    if (schedule === 'full_upfront') parts.push('Full payment is still due before work begins.');
    else parts.push('Deposit payment is still due before work begins.');
  }
  if (!dateOk) {
    parts.push(`Kickoff is scheduled for ${proposal.kickoff_date} (work starts on or after that date).`);
  }
  return parts.length ? parts.join(' ') : null;
}

function listAdminInvoices(filters = {}, database = getDb()) {
  const where = [];
  const params = [];

  if (filters.status) {
    where.push('inv.status = ?');
    params.push(filters.status);
  }
  if (filters.kind) {
    where.push('inv.kind = ?');
    params.push(filters.kind);
  }
  if (filters.projectId) {
    where.push('inv.project_id = ?');
    params.push(filters.projectId);
  }
  if (filters.clientId) {
    where.push('inv.client_id = ?');
    params.push(filters.clientId);
  }
  if (filters.search) {
    where.push(
      `(c.name LIKE ? OR c.business_name LIKE ? OR c.email LIKE ? OR p.name LIKE ? OR inv.label LIKE ?)`
    );
    const q = `%${filters.search}%`;
    params.push(q, q, q, q, q);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const total = database
    .prepare(
      `SELECT COUNT(*) AS n
       FROM invoices inv
       INNER JOIN clients c ON c.id = inv.client_id
       INNER JOIN projects p ON p.id = inv.project_id
       ${whereSql}`
    )
    .get(...params).n;

  const rows = database
    .prepare(
      `SELECT inv.*,
              c.name AS client_name, c.business_name AS client_business_name, c.email AS client_email,
              p.name AS project_name, p.status AS project_status
       FROM invoices inv
       INNER JOIN clients c ON c.id = inv.client_id
       INNER JOIN projects p ON p.id = inv.project_id
       ${whereSql}
       ORDER BY inv.created_at DESC, inv.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset);

  return {
    rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

function findInvoiceByCheckoutSession(sessionId, database = getDb()) {
  if (!sessionId) return null;
  return database
    .prepare('SELECT * FROM invoices WHERE stripe_checkout_session_id = ?')
    .get(sessionId);
}

function findHostingInvoiceForProject(projectId, database = getDb()) {
  return database
    .prepare(
      `SELECT * FROM invoices
       WHERE project_id = ? AND kind = 'hosting' AND status != 'void'
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(projectId);
}

module.exports = {
  isStripeConfigured,
  stripePriceIdForPlan,
  listInvoicesForProject,
  getInvoiceById,
  createInvoiceRowsForProject,
  markInvoicePaid,
  markInvoiceCheckoutSession,
  recomputeProjectBillingStatus,
  maybeActivateProject,
  markProjectStartedByAdmin,
  setProjectReadyForLaunch,
  activationBlockReason,
  paymentOkForActivation,
  dateOkForActivation,
  listAdminInvoices,
  findInvoiceByCheckoutSession,
  findHostingInvoiceForProject,
  setHostingStatus,
  setProjectSubscription,
};
