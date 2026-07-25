const PACKAGE_SLUGS = [
  'starter',
  'business',
  'growth',
  'hosting',
  'redesign',
  'custom',
  'not-sure',
];

const PACKAGE_LABELS = {
  starter: 'Starter Site',
  business: 'Standard Site',
  growth: 'Premium Site',
  hosting: 'Managed Hosting & Support',
  redesign: 'Website Redesign',
  custom: 'Custom Site',
  'not-sure': 'Not Sure Yet',
};

const TIMELINE_LABELS = {
  asap: 'As soon as possible',
  '1-2-months': '1–2 Months',
  '3-plus-months': '3+ Months',
  flexible: 'Flexible / Not Sure',
};

const BUDGET_LABELS = {
  'under-900': 'Under $900',
  '900-1500': '$900–$1,500',
  '1500-2500': '$1,500–$2,500',
  '2500-plus': '$2,500+',
  'not-sure': 'Not Sure Yet',
};

const CONTENT_READINESS_LABELS = {
  ready: 'I have most of the content ready',
  partial: 'I have some content',
  'need-help': 'I need help with content',
  'not-sure': 'Not Sure Yet',
};

function intakeOptionLabel(map, value) {
  if (!value) return null;
  return map[value] || value;
}

/** Canonical inquiry pipeline (cached on inquiries.stage). */
const INQUIRY_STAGES = [
  'new',
  'contacted',
  'draft_proposal',
  'sent_proposal',
  'revision_proposal',
  'declined_proposal',
  'active_project',
  'on_hold_project',
  'completed_project',
  'cancelled_project',
];

const INQUIRY_STAGE_LABELS = {
  new: 'New Inquiry',
  contacted: 'Contacted',
  draft_proposal: 'Drafted Proposal',
  sent_proposal: 'Sent Proposal',
  revision_proposal: 'Revision Pending',
  declined_proposal: 'Declined Proposal',
  active_project: 'Active Project',
  on_hold_project: 'On Hold Project',
  completed_project: 'Completed Project',
  cancelled_project: 'Cancelled Project',
};

/** Lower rank sorts first on the inquiries list. */
const PIPELINE_SORT_ORDER = {
  new: 0,
  contacted: 1,
  draft_proposal: 2,
  sent_proposal: 3,
  revision_proposal: 4,
  declined_proposal: 5,
  active_project: 6,
  on_hold_project: 7,
  completed_project: 8,
  cancelled_project: 9,
};

const PROPOSAL_STATUSES = ['draft', 'sent', 'revision_requested', 'accepted', 'declined'];

const PROPOSAL_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  revision_requested: 'Revision Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};

/** Client-facing decision labels on the share page. */
const CLIENT_PROPOSAL_STATUS_LABELS = {
  sent: null,
  revision_requested: 'Revision Pending',
  accepted: 'Approved',
  declined: 'Declined',
};

const PROPOSAL_STATUS_TO_PIPELINE = {
  draft: 'draft_proposal',
  sent: 'sent_proposal',
  revision_requested: 'revision_proposal',
  accepted: 'active_project',
  declined: 'declined_proposal',
};

const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'cancelled'];

const PROJECT_STATUS_LABELS = {
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PROJECT_STATUS_TO_PIPELINE = {
  active: 'active_project',
  on_hold: 'on_hold_project',
  completed: 'completed_project',
  cancelled: 'cancelled_project',
};

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
]);

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB each
const MAX_TOTAL_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB total

const LIMITS = {
  name: 120,
  email: 254,
  message: 5000,
  phone: 40,
  businessName: 160,
  websiteGoals: 4000,
  currentWebsite: 300,
  requestedFeatures: 3000,
  inspirationLinks: 2000,
  domainInfo: 500,
  brandingNotes: 2000,
  contentReadiness: 80,
  timeline: 80,
  budget: 80,
  packageSlug: 40,
  honeypot: 200,
  proposalSummary: 4000,
  proposalScope: 8000,
  proposalDeliverables: 8000,
  proposalExclusions: 4000,
  proposalTimeline: 2000,
  proposalPaymentTerms: 4000,
  proposalRevisionLimit: 200,
  proposalEmailSubject: 200,
  proposalEmailMessage: 5000,
  proposalRevisionMessage: 4000,
  proposalDeclineReason: 2000,
};

module.exports = {
  PACKAGE_SLUGS,
  PACKAGE_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  CONTENT_READINESS_LABELS,
  intakeOptionLabel,
  INQUIRY_STAGES,
  INQUIRY_STAGE_LABELS,
  PIPELINE_SORT_ORDER,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS,
  CLIENT_PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_TO_PIPELINE,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TO_PIPELINE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_UPLOAD_BYTES,
  LIMITS,
};
