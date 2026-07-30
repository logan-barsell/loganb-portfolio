const { getInquiryWithAttachments, updateNotificationStatus } = require('../db');
const { sendInquiryNotification, sendInquiryConfirmation } = require('./email');

async function notifyAndRespond(inquiryId) {
  const record = getInquiryWithAttachments(inquiryId);
  try {
    await sendInquiryNotification(record, record.attachments);
    updateNotificationStatus(inquiryId, 'sent', null);
  } catch (error) {
    console.error(`Notification failed for inquiry ${inquiryId}:`, error.message);
    updateNotificationStatus(inquiryId, 'failed', error.message.slice(0, 500));
  }

  try {
    await sendInquiryConfirmation(record);
  } catch (error) {
    console.error(`Confirmation email failed for inquiry ${inquiryId}:`, error.message);
  }

  return {
    status: 201,
    body: {
      ok: true,
      id: inquiryId,
      message: 'Thanks — your message was received. I will get back to you soon.',
    },
  };
}

module.exports = {
  notifyAndRespond,
};
