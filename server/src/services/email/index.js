const { buildEmail, sendInquiryNotification } = require('./templates/inquiryNotify');
const { sendInquiryConfirmation } = require('./templates/inquiryConfirm');
const { sendProposalShareEmail } = require('./templates/proposalShare');
const { sendProposalRevisedEmail } = require('./templates/proposalRevised');
const { sendProposalAcceptedEmails } = require('./templates/proposalAccepted');
const { sendPortalAccessEmail } = require('./templates/portalAccess');
const { sendProposalRevisionEmails } = require('./templates/proposalRevision');
const { sendProposalDeclinedEmails } = require('./templates/proposalDeclined');
const { sendProjectStartedEmail } = require('./templates/projectStarted');
const { sendProjectCompletedEmail } = require('./templates/projectCompleted');
const { sendProjectReadyForLaunchEmail } = require('./templates/projectReadyForLaunch');
const { wrapEmailHtml } = require('./layout');

module.exports = {
  sendInquiryNotification,
  sendInquiryConfirmation,
  sendProposalShareEmail,
  sendProposalRevisedEmail,
  sendProposalAcceptedEmails,
  sendPortalAccessEmail,
  sendProposalRevisionEmails,
  sendProposalDeclinedEmails,
  sendProjectStartedEmail,
  sendProjectCompletedEmail,
  sendProjectReadyForLaunchEmail,
  buildEmail,
  wrapEmailHtml,
};
