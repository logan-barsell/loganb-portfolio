const fs = require('fs');
const path = require('path');
const express = require('express');
const { config } = require('../config');
const { PACKAGE_LABELS, INQUIRY_STAGE_LABELS } = require('../constants');
const { listAdminInquiries, getAdminInquiryById, getAdminAttachment } = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../auth/cookies');
const { createHttpError } = require('../utils/normalize');

const router = express.Router();

function toIsoUtc(sqliteDatetime) {
  if (!sqliteDatetime) return null;
  // SQLite CURRENT_TIMESTAMP is UTC without timezone suffix.
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(sqliteDatetime)
    ? sqliteDatetime
    : `${String(sqliteDatetime).replace(' ', 'T')}Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function sanitizeDownloadName(name) {
  const base = path.basename(String(name || 'download')).replace(/[\r\n"]/g, '');
  return base || 'download';
}

function mapListRow(row) {
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

function mapAttachmentMeta(row) {
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: toIsoUtc(row.created_at),
  };
}

function mapInquiryDetail(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    email: row.email,
    message: row.message,
    phone: row.phone,
    businessName: row.business_name,
    packageSlug: row.package_slug,
    packageLabel: row.package_slug ? PACKAGE_LABELS[row.package_slug] || row.package_slug : null,
    websiteGoals: row.website_goals,
    currentWebsite: row.current_website,
    requestedFeatures: row.requested_features,
    inspirationLinks: row.inspiration_links,
    domainInfo: row.domain_info,
    brandingNotes: row.branding_notes,
    contentReadiness: row.content_readiness,
    timeline: row.timeline,
    budget: row.budget,
    stage: row.stage,
    stageLabel: INQUIRY_STAGE_LABELS[row.stage] || row.stage,
    notificationStatus: row.notification_status,
    notificationError: row.notification_error,
    createdAt: toIsoUtc(row.created_at),
    attachments: (row.attachments || []).map(mapAttachmentMeta),
  };
}

function resolveUploadPath(storedName) {
  const uploadRoot = path.resolve(config.uploadPath);
  const resolved = path.resolve(uploadRoot, storedName);
  if (resolved !== uploadRoot && !resolved.startsWith(`${uploadRoot}${path.sep}`)) {
    return null;
  }
  return resolved;
}

const PREVIEWABLE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

router.use(requireAdmin);
router.use((_req, res, next) => {
  setNoStore(res);
  next();
});

router.get('/', (req, res, next) => {
  try {
    const result = listAdminInquiries({
      search: req.query.q || '',
      type: req.query.type || '',
      stage: req.query.stage || '',
      sort: req.query.sort || 'created_at',
      dir: req.query.dir || 'desc',
      page: req.query.page || 1,
      pageSize: 20,
    });

    return res.status(200).json({
      ok: true,
      items: result.rows.map(mapListRow),
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
    const inquiry = getAdminInquiryById(req.params.id);
    if (!inquiry) {
      throw createHttpError(404, 'Inquiry not found.', 'NOT_FOUND');
    }
    return res.status(200).json({ ok: true, inquiry: mapInquiryDetail(inquiry) });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/attachments/:attachmentId', (req, res, next) => {
  try {
    const attachment = getAdminAttachment(req.params.id, req.params.attachmentId);
    if (!attachment) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const filePath = resolveUploadPath(attachment.stored_name);
    if (!filePath || !fs.existsSync(filePath)) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const downloadName = sanitizeDownloadName(attachment.original_name);
    const shouldPreview =
      req.query.preview === '1' && PREVIEWABLE_MIME_TYPES.has(attachment.mime_type);
    res.set('Content-Type', attachment.mime_type || 'application/octet-stream');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    if (shouldPreview) {
      res.set('Content-Security-Policy', 'sandbox');
    }
    res.set(
      'Content-Disposition',
      `${shouldPreview ? 'inline' : 'attachment'}; filename="${downloadName.replace(/"/g, '')}"`
    );
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
