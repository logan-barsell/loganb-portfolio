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

/** Canonical inquiry pipeline (cached on inquiries.stage). */
const INQUIRY_STAGES = [
  'new',
  'contacted',
  'draft_proposal',
  'sent_proposal',
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
  declined_proposal: 4,
  active_project: 5,
  on_hold_project: 6,
  completed_project: 7,
  cancelled_project: 8,
};

const PROPOSAL_STATUSES = ['draft', 'sent', 'declined'];

const PROPOSAL_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  declined: 'Declined',
};

const PROPOSAL_STATUS_TO_PIPELINE = {
  draft: 'draft_proposal',
  sent: 'sent_proposal',
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
};

module.exports = {
  PACKAGE_SLUGS,
  PACKAGE_LABELS,
  INQUIRY_STAGES,
  INQUIRY_STAGE_LABELS,
  PIPELINE_SORT_ORDER,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS,
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
