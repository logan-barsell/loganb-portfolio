const express = require('express');
const {
  INVOICE_KIND_LABELS,
  INVOICE_STATUS_LABELS,
} = require('../config/constants');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../services/auth/cookies');
const { listAdminInvoices } = require('../services/billing/invoices');
const { toIsoUtc, formatMoney } = require('../lib/format');

const router = express.Router();

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
