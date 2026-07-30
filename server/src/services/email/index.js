const { buildEmail, sendInquiryNotification } = require('./templates/inquiryNotify');
const { sendInquiryConfirmation } = require('./templates/inquiryConfirm');
const { sendProposalShareEmail } = require('./templates/proposalShare');
const { sendProposalAcceptedEmails } = require('./templates/proposalAccepted');
const { sendPortalAccessEmail } = require('./templates/portalAccess');
const { sendProposalRevisionEmails } = require('./templates/proposalRevision');
const { sendProposalDeclinedEmails } = require('./templates/proposalDeclined');
const { wrapEmailHtml } = require('./layout');

module.exports = {
  sendInquiryNotification,
  sendInquiryConfirmation,
  sendProposalShareEmail,
  sendProposalAcceptedEmails,
  sendPortalAccessEmail,
  sendProposalRevisionEmails,
  sendProposalDeclinedEmails,
  buildEmail,
  wrapEmailHtml,
};
