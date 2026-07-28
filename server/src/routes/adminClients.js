const express = require('express');
const { PACKAGE_LABELS, INQUIRY_STAGE_LABELS, PROPOSAL_STATUS_LABELS, PROJECT_STATUS_LABELS } = require('../constants');
const { listAdminClients, getAdminClientById } = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../auth/cookies');
const { createHttpError } = require('../utils/normalize');

const router = express.Router();

function toIsoUtc(sqliteDatetime) {
  if (!sqliteDatetime) return null;
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(sqliteDatetime)
    ? sqliteDatetime
    : `${String(sqliteDatetime).replace(' ', 'T')}Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function formatMoney(cents, currency = 'usd') {
  if (cents === null || cents === undefined) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'usd').toUpperCase(),
    }).format(Number(cents) / 100);
  } catch {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  }
}

function mapClientListRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    businessName: row.business_name,
    stage: row.latest_stage || null,
    stageLabel: row.latest_stage
      ? INQUIRY_STAGE_LABELS[row.latest_stage] || row.latest_stage
      : null,
  };
}

function mapClientInquiry(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    email: row.email,
    businessName: row.business_name,
    packageSlug: row.package_slug,
    packageLabel: row.package_slug ? PACKAGE_LABELS[row.package_slug] || row.package_slug : null,
    stage: row.stage,
    stageLabel: INQUIRY_STAGE_LABELS[row.stage] || row.stage,
    createdAt: toIsoUtc(row.created_at),
  };
}

function mapClientProposal(row) {
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    status: row.status,
    statusLabel: PROPOSAL_STATUS_LABELS[row.status] || row.status,
    designAmountCents: row.design_amount_cents,
    designAmountLabel: formatMoney(row.design_amount_cents, row.currency),
    currency: row.currency,
    sentAt: toIsoUtc(row.sent_at),
    createdAt: toIsoUtc(row.created_at),
  };
}

function mapClientProject(row) {
  return {
    id: row.id,
    name: row.name || null,
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[row.status] || row.status,
    proposalId: row.proposal_id || null,
    inquiryId: row.inquiry_id || null,
    createdAt: toIsoUtc(row.created_at),
  };
}

router.use(requireAdmin);
router.use((_req, res, next) => {
  setNoStore(res);
  next();
});

router.get('/', (req, res, next) => {
  try {
    const result = listAdminClients({
      search: req.query.q || '',
      sort: req.query.sort || 'name',
      dir: req.query.dir || 'asc',
      page: req.query.page || 1,
      pageSize: 20,
    });

    return res.status(200).json({
      ok: true,
      items: result.rows.map(mapClientListRow),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const client = getAdminClientById(req.params.id);
    if (!client) {
      throw createHttpError(404, 'Client not found.', 'NOT_FOUND');
    }

    return res.status(200).json({
      ok: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        businessName: client.business_name,
        createdAt: toIsoUtc(client.created_at),
        updatedAt: toIsoUtc(client.updated_at),
        inquiries: (client.inquiries || []).map(mapClientInquiry),
        proposals: (client.proposals || []).map(mapClientProposal),
        projects: (client.projects || []).map(mapClientProject),
        invoices: [],
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
