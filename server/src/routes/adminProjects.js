const express = require('express');
const { PROJECT_STATUS_LABELS, INQUIRY_STAGE_LABELS } = require('../constants');
const { listAdminProjects } = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../auth/cookies');

const router = express.Router();

function toIsoUtc(sqliteDatetime) {
  if (!sqliteDatetime) return null;
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(sqliteDatetime)
    ? sqliteDatetime
    : `${String(sqliteDatetime).replace(' ', 'T')}Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
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
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
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

module.exports = router;
