const express = require('express');
const {
  PROJECT_STATUS_LABELS,
  INQUIRY_STAGE_LABELS,
  PACKAGE_LABELS,
  PROPOSAL_STATUS_LABELS,
} = require('../constants');
const { listAdminProjects, getAdminProjectById, listAttachmentsForInquiry } = require('../db');
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

function mapProjectListRow(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[row.status] || row.status,
    proposalId: row.proposal_id,
    inquiryId: row.inquiry_id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientBusinessName: row.client_business_name,
    clientEmail: row.client_email,
    inquiryStage: row.inquiry_stage || null,
    inquiryStageLabel: row.inquiry_stage
      ? INQUIRY_STAGE_LABELS[row.inquiry_stage] || row.inquiry_stage
      : null,
    inquiryType: row.inquiry_type || null,
    packageSlug: row.inquiry_package_slug || null,
    packageLabel: row.inquiry_package_slug
      ? PACKAGE_LABELS[row.inquiry_package_slug] || row.inquiry_package_slug
      : null,
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
  };
}

function mapAttachmentMeta(row) {
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: toIsoUtc(row.created_at),
  };
}

function mapProjectDetail(row) {
  const attachments = listAttachmentsForInquiry(row.inquiry_id).map(mapAttachmentMeta);

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[row.status] || row.status,
    proposalId: row.proposal_id,
    inquiryId: row.inquiry_id,
    clientId: row.client_id,
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
    attachments,
    client: {
      id: row.client_id,
      name: row.client_name,
      businessName: row.client_business_name,
      email: row.client_email,
      phone: row.client_phone || null,
    },
    inquiry: row.inquiry_id
      ? {
          id: row.inquiry_id,
          type: row.inquiry_type || null,
          name: row.inquiry_name || null,
          businessName: row.inquiry_business_name || null,
          email: row.inquiry_email || null,
          packageSlug: row.inquiry_package_slug || null,
          packageLabel: row.inquiry_package_slug
            ? PACKAGE_LABELS[row.inquiry_package_slug] || row.inquiry_package_slug
            : null,
          stage: row.inquiry_stage || null,
          stageLabel: row.inquiry_stage
            ? INQUIRY_STAGE_LABELS[row.inquiry_stage] || row.inquiry_stage
            : null,
          createdAt: toIsoUtc(row.inquiry_created_at),
        }
      : null,
    proposal: row.proposal_id
      ? {
          id: row.proposal_id,
          status: row.proposal_status || null,
          statusLabel: row.proposal_status
            ? PROPOSAL_STATUS_LABELS[row.proposal_status] || row.proposal_status
            : null,
          summary: row.proposal_summary || null,
          designAmountCents: row.design_amount_cents,
          designAmountLabel: formatMoney(row.design_amount_cents, row.proposal_currency),
          hostingMonthlyCents: row.hosting_monthly_cents,
          hostingMonthlyLabel: formatMoney(row.hosting_monthly_cents, row.proposal_currency),
          currency: row.proposal_currency || 'usd',
          sentAt: toIsoUtc(row.proposal_sent_at),
          createdAt: toIsoUtc(row.proposal_created_at),
        }
      : null,
  };
}

router.use(requireAdmin);
router.use((_req, res, next) => {
  setNoStore(res);
  next();
});

router.get('/', (req, res, next) => {
  try {
    const result = listAdminProjects({
      search: req.query.q || '',
      status: req.query.status || '',
      sort: req.query.sort || 'created_at',
      dir: req.query.dir || 'desc',
      page: req.query.page || 1,
      pageSize: 20,
    });

    return res.status(200).json({
      ok: true,
      items: result.rows.map(mapProjectListRow),
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
    const row = getAdminProjectById(req.params.id);
    if (!row) {
      throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
    }
    return res.status(200).json({ ok: true, project: mapProjectDetail(row) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
