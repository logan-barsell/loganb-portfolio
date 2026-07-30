const { randomUUID } = require('crypto');
const { getDb } = require('./client');
const { createHttpError } = require('../utils/normalize');
const { escapeLike } = require('./helpers');
const { syncInquiryPipeline } = require('./inquiries');
const { createProject, getProjectByProposalId } = require('./projects');
const { issuePortalSetupToken } = require('./portal');

const PROPOSAL_SORT_COLUMNS = {
  created_at: 'p.created_at',
  sent_at: 'p.sent_at',
  design_amount_cents: 'p.design_amount_cents',
};

function createProposal(payload, database = getDb()) {
  const id = payload.id || randomUUID();
  database
    .prepare(
      `INSERT INTO proposals (
         id, client_id, inquiry_id, status,
         summary, scope, deliverables, exclusions, timeline_summary,
         payment_schedule, kickoff_date, revision_limit,
         design_amount_cents, hosting_monthly_cents, hosting_plan, currency
       ) VALUES (
         @id, @client_id, @inquiry_id, @status,
         @summary, @scope, @deliverables, @exclusions, @timeline_summary,
         @payment_schedule, @kickoff_date, @revision_limit,
         @design_amount_cents, @hosting_monthly_cents, @hosting_plan, @currency
       )`
    )
    .run({
      id,
      client_id: payload.clientId,
      inquiry_id: payload.inquiryId,
      status: payload.status || 'draft',
      summary: payload.summary ?? null,
      scope: payload.scope ?? null,
      deliverables: payload.deliverables ?? null,
      exclusions: payload.exclusions ?? null,
      timeline_summary: payload.timelineSummary ?? null,
      payment_schedule: payload.paymentSchedule || 'deposit_50_50',
      kickoff_date: payload.kickoffDate ?? null,
      revision_limit: payload.revisionLimit ?? null,
      design_amount_cents: payload.designAmountCents,
      hosting_monthly_cents: payload.hostingMonthlyCents ?? null,
      hosting_plan: payload.hostingPlan || 'none',
      currency: payload.currency || 'usd',
    });
  syncInquiryPipeline(payload.inquiryId, database);
  return getProposalById(id, database);
}

function updateProposal(id, patch, database = getDb()) {
  const existing = database.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  if (!existing) return null;

  const next = {
    summary: patch.summary !== undefined ? patch.summary : existing.summary,
    scope: patch.scope !== undefined ? patch.scope : existing.scope,
    deliverables: patch.deliverables !== undefined ? patch.deliverables : existing.deliverables,
    exclusions: patch.exclusions !== undefined ? patch.exclusions : existing.exclusions,
    timeline_summary:
      patch.timelineSummary !== undefined ? patch.timelineSummary : existing.timeline_summary,
    payment_schedule:
      patch.paymentSchedule !== undefined ? patch.paymentSchedule : existing.payment_schedule,
    kickoff_date: patch.kickoffDate !== undefined ? patch.kickoffDate : existing.kickoff_date,
    revision_limit:
      patch.revisionLimit !== undefined ? patch.revisionLimit : existing.revision_limit,
    design_amount_cents:
      patch.designAmountCents !== undefined
        ? patch.designAmountCents
        : existing.design_amount_cents,
    hosting_monthly_cents:
      patch.hostingMonthlyCents !== undefined
        ? patch.hostingMonthlyCents
        : existing.hosting_monthly_cents,
    hosting_plan: patch.hostingPlan !== undefined ? patch.hostingPlan : existing.hosting_plan,
    status: patch.status !== undefined ? patch.status : existing.status,
    sent_at: existing.sent_at,
  };

  if (patch.status === 'sent' && existing.status !== 'sent') {
    next.sent_at = new Date().toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
  }
  if (patch.status === 'draft' && existing.status === 'sent') {
    next.sent_at = null;
  }

  database
    .prepare(
      `UPDATE proposals SET
         summary = @summary,
         scope = @scope,
         deliverables = @deliverables,
         exclusions = @exclusions,
         timeline_summary = @timeline_summary,
         payment_schedule = @payment_schedule,
         kickoff_date = @kickoff_date,
         revision_limit = @revision_limit,
         design_amount_cents = @design_amount_cents,
         hosting_monthly_cents = @hosting_monthly_cents,
         hosting_plan = @hosting_plan,
         status = @status,
         sent_at = @sent_at,
         updated_at = datetime('now')
       WHERE id = @id`
    )
    .run({ id, ...next });

  syncInquiryPipeline(existing.inquiry_id, database);

  return getProposalById(id, database);
}

function getProposalById(id, database = getDb()) {
  const proposal = database.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  if (!proposal) return null;

  const client = database
    .prepare(
      `SELECT id, name, email, phone, business_name FROM clients WHERE id = ?`
    )
    .get(proposal.client_id);

  const inquiry = database
    .prepare(
      `SELECT id, type, name, email, business_name, package_slug, stage, website_goals,
              current_website, requested_features, inspiration_links, domain_info,
              branding_notes, content_readiness, timeline, budget, message, phone,
              created_at, client_id
       FROM inquiries WHERE id = ?`
    )
    .get(proposal.inquiry_id);

  return { ...proposal, client, inquiry };
}

/** Always set status=sent and refresh sent_at (used by send/resend). */
function markProposalSent(id, database = getDb()) {
  const existing = database.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  if (!existing) return null;

  const sentAt = new Date().toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
  database
    .prepare(
      `UPDATE proposals SET status = 'sent', sent_at = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(sentAt, id);

  syncInquiryPipeline(existing.inquiry_id, database);
  return getProposalById(id, database);
}

function listProposalsByInquiryId(inquiryId, database = getDb()) {
  return database
    .prepare(
      `SELECT id, status, design_amount_cents, currency, sent_at, created_at
       FROM proposals
       WHERE inquiry_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(inquiryId);
}

function listAdminProposals({
  search = '',
  status = '',
  sort = 'created_at',
  dir = 'desc',
  page = 1,
  pageSize = 20,
} = {}) {
  const database = getDb();
  const where = [];
  const params = {};

  const q = String(search || '').trim();
  if (q) {
    where.push(
      `(c.name LIKE @search ESCAPE '\\' OR c.business_name LIKE @search ESCAPE '\\' OR c.email LIKE @search ESCAPE '\\')`
    );
    params.search = `%${escapeLike(q)}%`;
  }

  if (
    status === 'draft' ||
    status === 'sent' ||
    status === 'revision_requested' ||
    status === 'accepted' ||
    status === 'declined'
  ) {
    where.push('p.status = @status');
    params.status = status;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortColumn = PROPOSAL_SORT_COLUMNS[sort] || PROPOSAL_SORT_COLUMNS.created_at;
  const sortDir = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const total = database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM proposals p
       INNER JOIN clients c ON c.id = p.client_id
       ${whereSql}`
    )
    .get(params).count;

  const rows = database
    .prepare(
      `SELECT
         p.id, p.status, p.design_amount_cents, p.hosting_monthly_cents,
         p.currency, p.sent_at, p.created_at, p.updated_at, p.inquiry_id, p.client_id,
         c.name AS client_name, c.business_name AS client_business_name, c.email AS client_email,
         i.stage AS inquiry_stage,
         i.type AS inquiry_type,
         i.package_slug AS inquiry_package_slug
       FROM proposals p
       INNER JOIN clients c ON c.id = p.client_id
       INNER JOIN inquiries i ON i.id = p.inquiry_id
       ${whereSql}
       ORDER BY ${sortColumn} ${sortDir}, p.id ${sortDir}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: safePageSize, offset });

  return {
    rows,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

function listRevisionRequestsForProposal(proposalId, database = getDb()) {
  return database
    .prepare(
      `SELECT id, proposal_id, message, created_at
       FROM proposal_revision_requests
       WHERE proposal_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(proposalId);
}

function projectNameFromProposal(proposal) {
  const business =
    proposal.client?.business_name ||
    proposal.inquiry?.business_name ||
    proposal.client?.name ||
    proposal.inquiry?.name;
  return business ? `${business} Website` : 'Website Project';
}

/**
 * Accept proposal: set accepted, create or reactivate project as on_hold,
 * seed domain, create invoices, then maybe activate.
 */
function acceptProposal(proposalId, database = getDb()) {
  const existing = getProposalById(proposalId, database);
  if (!existing) return null;
  if (existing.status === 'draft') {
    throw createHttpError(400, 'This proposal has not been sent yet.', 'INVALID_STATUS');
  }
  if (existing.status === 'accepted') {
    return { proposal: existing, project: getProjectByProposalId(proposalId, database), already: true };
  }

  const {
    createInvoiceRowsForProject,
    maybeActivateProject,
    recomputeProjectBillingStatus,
  } = require('../services/billing/invoices');

  const run = database.transaction(() => {
    database
      .prepare(
        `UPDATE proposals
         SET status = 'accepted', decline_reason = NULL, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(proposalId);

    const inquiry = existing.inquiry_id
      ? database.prepare('SELECT * FROM inquiries WHERE id = ?').get(existing.inquiry_id)
      : null;
    const domainName = inquiry?.domain_name || null;
    const domainStatus = domainName ? 'client_owns' : 'unknown';

    let project = getProjectByProposalId(proposalId, database);
    if (project) {
      database
        .prepare(
          `UPDATE projects SET
             status = 'on_hold',
             domain_name = COALESCE(?, domain_name),
             domain_status = CASE WHEN ? IS NOT NULL THEN ? ELSE domain_status END,
             design_payment_status = 'unpaid',
             hosting_status = 'none',
             started_at = NULL,
             started_by = NULL,
             updated_at = datetime('now')
           WHERE id = ?`
        )
        .run(domainName, domainName, domainStatus, project.id);
      project = database.prepare(`SELECT * FROM projects WHERE id = ?`).get(project.id);
    } else {
      project = createProject(
        {
          clientId: existing.client_id,
          proposalId: existing.id,
          inquiryId: existing.inquiry_id,
          status: 'on_hold',
          name: projectNameFromProposal(existing),
          domainName,
          domainStatus,
        },
        database
      );
    }

    // Void prior open invoices if re-accepting a cancelled project path
    database
      .prepare(
        `UPDATE invoices SET status = 'void', updated_at = datetime('now')
         WHERE project_id = ? AND status = 'due'`
      )
      .run(project.id);

    createInvoiceRowsForProject(
      {
        projectId: project.id,
        clientId: existing.client_id,
        proposalId: existing.id,
        paymentSchedule: existing.payment_schedule,
        designAmountCents: existing.design_amount_cents,
        hostingPlan: existing.hosting_plan,
      },
      database
    );

    recomputeProjectBillingStatus(project.id, database);
    maybeActivateProject(project.id, database);

    syncInquiryPipeline(existing.inquiry_id, database);
    const updatedProject = getProjectByProposalId(proposalId, database);
    let portalSetup = null;
    if (updatedProject && !updatedProject.portal_password_hash) {
      portalSetup = issuePortalSetupToken(updatedProject.id, { resetPassword: false }, database);
    }
    return {
      proposal: getProposalById(proposalId, database),
      project: updatedProject,
      already: false,
      portalSetup,
    };
  });

  return run();
}

/**
 * Decline proposal: set declined, cancel linked project if any.
 */
function declineProposal(proposalId, reason = null, database = getDb()) {
  const existing = getProposalById(proposalId, database);
  if (!existing) return null;
  if (existing.status === 'draft') {
    throw createHttpError(400, 'This proposal has not been sent yet.', 'INVALID_STATUS');
  }
  if (existing.status === 'declined') {
    return { proposal: existing, project: getProjectByProposalId(proposalId, database), already: true };
  }

  const run = database.transaction(() => {
    database
      .prepare(
        `UPDATE proposals
         SET status = 'declined', decline_reason = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(reason || null, proposalId);

    const project = getProjectByProposalId(proposalId, database);
    if (project && project.status !== 'cancelled') {
      database
        .prepare(
          `UPDATE projects SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`
        )
        .run(project.id);
    }

    syncInquiryPipeline(existing.inquiry_id, database);
    return {
      proposal: getProposalById(proposalId, database),
      project: getProjectByProposalId(proposalId, database),
      already: false,
    };
  });

  return run();
}

/**
 * Append a revision request and mark proposal revision_requested.
 */
function requestProposalRevision(proposalId, message, database = getDb()) {
  const existing = getProposalById(proposalId, database);
  if (!existing) return null;
  if (existing.status === 'draft') {
    throw createHttpError(400, 'This proposal has not been sent yet.', 'INVALID_STATUS');
  }

  const trimmed = String(message || '').trim();
  if (!trimmed) {
    throw createHttpError(400, 'Please describe what you would like revised.', 'VALIDATION_ERROR', {
      message: 'Please describe what you would like revised.',
    });
  }

  const run = database.transaction(() => {
    const id = randomUUID();
    database
      .prepare(
        `INSERT INTO proposal_revision_requests (id, proposal_id, message)
         VALUES (?, ?, ?)`
      )
      .run(id, proposalId, trimmed);

    database
      .prepare(
        `UPDATE proposals
         SET status = 'revision_requested', updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(proposalId);

    syncInquiryPipeline(existing.inquiry_id, database);

    return {
      proposal: getProposalById(proposalId, database),
      revision: database
        .prepare(`SELECT id, proposal_id, message, created_at FROM proposal_revision_requests WHERE id = ?`)
        .get(id),
      revisions: listRevisionRequestsForProposal(proposalId, database),
    };
  });

  return run();
}

module.exports = {
  createProposal,
  updateProposal,
  getProposalById,
  markProposalSent,
  listProposalsByInquiryId,
  listAdminProposals,
  listRevisionRequestsForProposal,
  acceptProposal,
  declineProposal,
  requestProposalRevision,
};
