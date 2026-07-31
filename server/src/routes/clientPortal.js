const fs = require('fs');
const path = require('path');
const express = require('express');
const { DOMAIN_STATUSES, LIMITS } = require('../config/constants');
const { config } = require('../config');
const {
  getProjectById,
  getPortalProjectBundle,
  insertAttachments,
  deleteAttachmentById,
  listClientVisibleAttachmentsForInquiry,
  getAdminAttachment,
  updateProjectDomain,
} = require('../db');
const { runActivationTickIfNeeded } = require('../services/billing/activationTick');
const { maybeActivateAndNotify } = require('../services/projects');
const {
  mapPortalOverview,
  displayNameForProject,
  loadSetupTarget,
  completePortalSetup,
  loginToPortal,
  startDesignCheckout,
  startHostingCheckout,
  startBillingPortal,
} = require('../services/portal');
const { trimToNull, enforceMaxLength, createHttpError } = require('../utils/normalize');
const { getValidClientSession, destroyClientSession } = require('../services/auth/clientSessions');
const {
  getClientSessionToken,
  setClientSessionCookie,
  clearClientSessionCookie,
} = require('../services/auth/clientCookies');
const { setNoStore, requireSameOrigin } = require('../services/auth/cookies');
const { requireClientProject } = require('../middleware/requireClientProject');
const { clientPortalAuthLimiter } = require('../middleware/rateLimit');
const { upload, mapUploadedFiles, removeFiles } = require('../utils/uploads');
const { mapAttachmentMeta } = require('../lib/format');

const router = express.Router();

const PREVIEWABLE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

function sanitizeDownloadName(name) {
  const base = path.basename(String(name || 'download')).replace(/[\r\n"]/g, '');
  return base || 'download';
}

function resolveUploadPath(storedName) {
  const uploadRoot = path.resolve(config.uploadPath);
  const resolved = path.resolve(uploadRoot, storedName);
  if (resolved !== uploadRoot && !resolved.startsWith(`${uploadRoot}${path.sep}`)) {
    return null;
  }
  return resolved;
}

router.use((_req, res, next) => {
  setNoStore(res);
  next();
});

router.get('/:id/setup/:token', (req, res, next) => {
  try {
    const result = loadSetupTarget(req.params.id, req.params.token);
    return res.status(200).json({
      ok: true,
      needsPassword: true,
      project: {
        id: result.project.id,
        businessName: displayNameForProject(result.project.id),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/:id/setup/:token',
  clientPortalAuthLimiter,
  requireSameOrigin,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      const { session, project } = await completePortalSetup(req.params.id, req.params.token, {
        password: req.body?.password,
        confirmPassword: req.body?.confirmPassword,
      });
      setClientSessionCookie(res, session.token, session.expiresAt);

      return res.status(200).json({ ok: true, project });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/login',
  clientPortalAuthLimiter,
  requireSameOrigin,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      const { session, project } = await loginToPortal(req.params.id, req.body?.password);
      setClientSessionCookie(res, session.token, session.expiresAt);

      return res.status(200).json({ ok: true, project });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/:id/logout', requireSameOrigin, express.json({ limit: '8kb' }), (req, res, next) => {
  try {
    const token = getClientSessionToken(req);
    destroyClientSession(token);
    clearClientSessionCookie(res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/session', (req, res, next) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
    }

    const token = getClientSessionToken(req);
    const session = getValidClientSession(token);
    const authenticated = Boolean(session && session.project_id === project.id);

    return res.status(200).json({
      ok: true,
      authenticated,
      mustSetPassword: !project.portal_password_hash,
      project: {
        id: project.id,
        businessName: displayNameForProject(project.id),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', requireClientProject, async (req, res, next) => {
  try {
    runActivationTickIfNeeded();
    await maybeActivateAndNotify(req.params.id);
    const bundle = getPortalProjectBundle(req.params.id);
    if (!bundle) {
      throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
    }
    return res.status(200).json({ ok: true, project: mapPortalOverview(bundle) });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/:id/checkout',
  requireClientProject,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      const { url } = await startDesignCheckout(req.params.id, trimToNull(req.body?.invoiceId));
      return res.status(200).json({ ok: true, url });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/hosting/checkout',
  requireClientProject,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      const { url } = await startHostingCheckout(req.params.id);
      return res.status(200).json({ ok: true, url });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/hosting/portal',
  requireClientProject,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      const { url } = await startBillingPortal(req.params.id);
      return res.status(200).json({ ok: true, url });
    } catch (error) {
      return next(error);
    }
  }
);

router.patch(
  '/:id/domain',
  requireClientProject,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  (req, res, next) => {
    try {
      const errors = {};
      let domainName;
      let domainStatus;

      if (req.body?.domainName !== undefined) {
        domainName = enforceMaxLength(trimToNull(req.body.domainName), LIMITS.domainName);
      }
      if (req.body?.domainStatus !== undefined) {
        domainStatus = trimToNull(req.body.domainStatus) || 'unknown';
        if (!DOMAIN_STATUSES.includes(domainStatus)) {
          errors.domainStatus = 'Choose a valid domain status.';
        }
      }

      if (Object.keys(errors).length) {
        throw createHttpError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', errors);
      }

      const updated = updateProjectDomain(req.params.id, { domainName, domainStatus });
      if (!updated) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }

      const bundle = getPortalProjectBundle(req.params.id);
      return res.status(200).json({ ok: true, project: mapPortalOverview(bundle) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/attachments',
  requireClientProject,
  (req, res, next) => {
    upload.array('files', 5)(req, res, (err) => {
      if (err) return next(err);
      return next();
    });
  },
  (req, res, next) => {
    let mapped = [];
    try {
      const bundle = getPortalProjectBundle(req.params.id);
      if (!bundle?.project?.inquiry_id) {
        throw createHttpError(400, 'This project has no linked inquiry for uploads.', 'BAD_REQUEST');
      }

      mapped = mapUploadedFiles(req.files || []);
      if (!mapped.length) {
        throw createHttpError(400, 'Choose at least one file to upload.', 'VALIDATION_ERROR');
      }

      insertAttachments(bundle.project.inquiry_id, mapped, {
        uploadedBy: 'client',
        clientVisible: true,
      });
      const attachments = listClientVisibleAttachmentsForInquiry(bundle.project.inquiry_id).map(
        mapAttachmentMeta
      );
      return res.status(200).json({ ok: true, attachments });
    } catch (error) {
      removeFiles(mapped.length ? mapped : req.files || []);
      return next(error);
    }
  }
);

router.delete('/:id/attachments/:attachmentId', requireClientProject, (req, res, next) => {
  try {
    const bundle = getPortalProjectBundle(req.params.id);
    if (!bundle?.project?.inquiry_id) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const attachment = getAdminAttachment(bundle.project.inquiry_id, req.params.attachmentId);
    if (
      !attachment ||
      !attachment.client_visible ||
      attachment.uploaded_by === 'admin'
    ) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const deleted = deleteAttachmentById(attachment.id);
    if (deleted?.stored_name) {
      removeFiles([{ storedName: deleted.stored_name }]);
    }

    const attachments = listClientVisibleAttachmentsForInquiry(bundle.project.inquiry_id).map(
      mapAttachmentMeta
    );
    return res.status(200).json({ ok: true, attachments });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/attachments/:attachmentId', requireClientProject, (req, res, next) => {
  try {
    const bundle = getPortalProjectBundle(req.params.id);
    if (!bundle?.project?.inquiry_id) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const attachment = getAdminAttachment(bundle.project.inquiry_id, req.params.attachmentId);
    if (!attachment || !attachment.client_visible) {
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
      `${shouldPreview ? 'inline' : 'attachment'}; filename="${downloadName}"`
    );
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
