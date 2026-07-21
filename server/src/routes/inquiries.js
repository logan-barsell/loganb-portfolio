const express = require('express');
const { randomUUID } = require('crypto');
const { validateContact, validateProject } = require('../validation/inquiries');
const {
  insertInquiry,
  insertAttachments,
  updateNotificationStatus,
  getInquiryWithAttachments,
} = require('../db');
const { sendInquiryNotification } = require('../email');
const { upload, mapUploadedFiles, removeFiles } = require('../utils/uploads');
const { inquiryLimiter } = require('../middleware/rateLimit');

const router = express.Router();

function spamAck(res) {
  // Acknowledge bots without storing or emailing.
  return res.status(200).json({ ok: true });
}

async function notifyAndRespond(res, inquiryId) {
  const record = getInquiryWithAttachments(inquiryId);
  try {
    await sendInquiryNotification(record, record.attachments);
    updateNotificationStatus(inquiryId, 'sent', null);
  } catch (error) {
    console.error(`Notification failed for inquiry ${inquiryId}:`, error.message);
    updateNotificationStatus(inquiryId, 'failed', error.message.slice(0, 500));
  }

  return res.status(201).json({
    ok: true,
    id: inquiryId,
    message: 'Thanks — your message was received. I will get back to you soon.',
  });
}

router.post('/contact', inquiryLimiter, express.json({ limit: '32kb' }), async (req, res, next) => {
  try {
    const data = validateContact(req.body || {});
    if (data.isSpam) return spamAck(res);

    const id = randomUUID();
    insertInquiry({
      id,
      type: 'contact',
      name: data.name,
      email: data.email,
      message: data.message,
      notificationStatus: 'pending',
    });

    return notifyAndRespond(res, id);
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/project',
  inquiryLimiter,
  upload.array('files', 5),
  async (req, res, next) => {
    let mappedFiles = [];
    try {
      mappedFiles = mapUploadedFiles(req.files || []);
      const data = validateProject(req.body || {});

      if (data.isSpam) {
        removeFiles(mappedFiles);
        return spamAck(res);
      }

      const id = randomUUID();
      insertInquiry({
        id,
        type: 'project',
        name: data.name,
        email: data.email,
        message: data.message,
        phone: data.phone,
        businessName: data.businessName,
        packageSlug: data.packageSlug,
        websiteGoals: data.websiteGoals,
        currentWebsite: data.currentWebsite,
        requestedFeatures: data.requestedFeatures,
        inspirationLinks: data.inspirationLinks,
        domainInfo: data.domainInfo,
        brandingNotes: data.brandingNotes,
        contentReadiness: data.contentReadiness,
        timeline: data.timeline,
        budget: data.budget,
        notificationStatus: 'pending',
      });

      insertAttachments(id, mappedFiles);
      return notifyAndRespond(res, id);
    } catch (error) {
      removeFiles(mappedFiles.length ? mappedFiles : req.files || []);
      return next(error);
    }
  }
);

module.exports = router;
