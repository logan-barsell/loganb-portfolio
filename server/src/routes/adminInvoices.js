const express = require('express');
const {
  INVOICE_KIND_LABELS,
  INVOICE_STATUS_LABELS,
} = require('../constants');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../auth/cookies');
const { listAdminInvoices } = require('../billing/invoices');

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

function mapInvoiceRow(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    projectStatus: row.project_status,
    clientId: row.client_id,
    clientName: row.client_name,
    clientBusinessName: row.client_business_name,
    clientEmail: row.client_email,
    kind: row.kind,
    kindLabel: INVOICE_KIND_LABELS[row.kind] || row.kind,
    status: row.status,
    statusLabel: INVOICE_STATUS_LABELS[row.status] || row.status,
    amountCents: row.amount_cents,
    amountLabel: formatMoney(row.amount_cents, row.currency),
    currency: row.currency,
    label: row.label,
    paidAt: toIsoUtc(row.paid_at),
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
    const result = listAdminInvoices({
      search: req.query.q || '',
      status: req.query.status || '',
      kind: req.query.kind || '',
      projectId: req.query.projectId || '',
      clientId: req.query.clientId || '',
      page: req.query.page || 1,
      pageSize: req.query.pageSize || 25,
    });
    return res.status(200).json({
      ok: true,
      items: result.rows.map(mapInvoiceRow),
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
