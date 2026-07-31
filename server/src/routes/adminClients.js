const express = require('express');
const { PACKAGE_LABELS, INQUIRY_STAGE_LABELS, PROPOSAL_STATUS_LABELS, PROJECT_STATUS_LABELS } = require('../config/constants');
const { listAdminClients, getAdminClientById } = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../services/auth/cookies');
const { createHttpError } = require('../utils/normalize');
const { toIsoUtc, formatMoney } = require('../lib/format');

const router = express.Router();

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
  const packageSlug = row.package_slug || null;
  const projectStatus = row.project_status || null;
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    status: row.status,
    statusLabel: PROPOSAL_STATUS_LABELS[row.status] || row.status,
    designAmountCents: row.design_amount_cents,
    designAmountLabel: formatMoney(row.design_amount_cents, row.currency),
    currency: row.currency,
    packageSlug,
    packageLabel: packageSlug ? PACKAGE_LABELS[packageSlug] || packageSlug : null,
    clientName: row.inquiry_name || null,
    businessName: row.inquiry_business_name || null,
    projectStatus,
    projectStatusLabel: projectStatus
      ? PROJECT_STATUS_LABELS[projectStatus] || projectStatus
      : null,
    sentAt: toIsoUtc(row.sent_at),
    acceptedAt: toIsoUtc(row.accepted_at),
    declinedAt: toIsoUtc(row.declined_at),
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
  };
}

function mapClientProject(row) {
  const packageSlug = row.proposal_package_slug || null;
  return {
    id: row.id,
    name: row.name || null,
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[row.status] || row.status,
    proposalId: row.proposal_id || null,
    inquiryId: row.inquiry_id || null,
    clientName: row.client_name || null,
    clientBusinessName: row.inquiry_business_name || row.client_business_name || null,
    packageSlug,
    packageLabel: packageSlug ? PACKAGE_LABELS[packageSlug] || packageSlug : null,
    kickoffDate: row.proposal_kickoff_date || null,
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
