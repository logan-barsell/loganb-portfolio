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
  starter: 'Starter Website',
  business: 'Growth Website',
  growth: 'Custom Web Applications',
  hosting: 'Managed Hosting + Support',
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
  '1500-2500': '$1,500–$3,000',
  '2500-plus': '$3,000+',
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
  revision_requested: 'Revision Requested',
  accepted: 'Accepted',
  declined: 'Declined',
};

const PAYMENT_SCHEDULES = ['deposit_50_50', 'full_upfront', 'full_before_launch'];

const PAYMENT_SCHEDULE_LABELS = {
  deposit_50_50: '50% deposit to begin; 50% before launch',
  full_upfront: '100% due before work begins',
  full_before_launch: '100% due before launch',
};

const DEFAULT_PAYMENT_SCHEDULE = 'deposit_50_50';

function paymentScheduleLabel(schedule) {
  if (!schedule) return null;
  return PAYMENT_SCHEDULE_LABELS[schedule] || schedule;
}

function billingLineItemsForSchedule(schedule, designCents) {
  if (designCents === null || designCents === undefined) return [];
  const total = Number(designCents);
  if (!Number.isFinite(total) || total < 0) return [];

  if (schedule === 'deposit_50_50') {
    const deposit = Math.round(total / 2);
    return [
      { key: 'deposit', label: 'Deposit', amountCents: deposit },
      { key: 'balance', label: 'Remaining Balance', amountCents: total - deposit },
    ];
  }

  return [{ key: 'full', label: 'Full Amount', amountCents: total }];
}

function formatRevisionLimitLabel(limit) {
  if (limit === null || limit === undefined) return 'Unlimited';
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return 'Unlimited';
  return n === 1 ? '1 Round' : `${n} Rounds`;
}

/** Client-facing decision labels on the share page. */
const CLIENT_PROPOSAL_STATUS_LABELS = {
  sent: null,
  revision_requested: 'Revision Requested',
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
  active: 'Active Project',
  on_hold: 'On Hold Project',
  completed: 'Completed Project',
  cancelled: 'Cancelled Project',
};

const PROJECT_STATUS_TO_PIPELINE = {
  active: 'active_project',
  on_hold: 'on_hold_project',
  completed: 'completed_project',
  cancelled: 'cancelled_project',
};

const HOSTING_PLANS = ['none', 'hosting_39', 'hosting_25', 'hosting_10'];

const HOSTING_PLAN_META = {
  none: { key: 'none', label: 'No Managed Hosting', amountCents: null, defaultPriceId: null },
  hosting_39: {
    key: 'hosting_39',
    label: 'Managed Hosting + Support — $39/month',
    amountCents: 3900,
    defaultPriceId: 'price_temp_hosting_39',
  },
  hosting_25: {
    key: 'hosting_25',
    label: 'Essential Hosting — $25/month',
    amountCents: 2500,
    defaultPriceId: 'price_temp_hosting_25',
  },
  hosting_10: {
    key: 'hosting_10',
    label: 'Hosting — $10/month',
    amountCents: 1000,
    defaultPriceId: 'price_temp_hosting_10',
  },
};

const DEFAULT_HOSTING_PLAN = 'hosting_39';

const DOMAIN_STATUSES = ['unknown', 'client_owns', 'needs_purchase', 'connected'];

const DOMAIN_STATUS_LABELS = {
  unknown: 'Unknown',
  client_owns: 'Client Owns',
  needs_purchase: 'Needs Purchase',
  connected: 'Connected',
};

const DESIGN_PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

const DESIGN_PAYMENT_STATUS_LABELS = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
};

const HOSTING_STATUSES = ['none', 'active', 'overdue'];

const HOSTING_STATUS_LABELS = {
  none: 'None',
  active: 'Active',
  overdue: 'Overdue',
};

const INVOICE_KINDS = ['deposit', 'balance', 'full', 'hosting'];

const INVOICE_KIND_LABELS = {
  deposit: 'Deposit',
  balance: 'Remaining Balance',
  full: 'Full Amount',
  hosting: 'Hosting Subscription',
};

const INVOICE_STATUSES = ['due', 'paid', 'void'];

const INVOICE_STATUS_LABELS = {
  due: 'Due',
  paid: 'Paid',
  void: 'Void',
};

function resolveHostingPlan(plan) {
  if (plan && HOSTING_PLAN_META[plan]) return HOSTING_PLAN_META[plan];
  return HOSTING_PLAN_META.none;
}

function hostingPlanFromCents(cents) {
  if (cents === null || cents === undefined) return 'none';
  const n = Number(cents);
  if (!Number.isFinite(n) || n <= 0) return 'none';
  if (n <= 1000) return 'hosting_10';
  if (n <= 2500) return 'hosting_25';
  return 'hosting_39';
}

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
  domainName: 255,
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
  proposalEmailSubject: 200,
  proposalEmailMessage: 5000,
  proposalRevisionMessage: 4000,
  proposalDeclineReason: 2000,
  workingBrief: 12000,
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
  PAYMENT_SCHEDULES,
  PAYMENT_SCHEDULE_LABELS,
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleLabel,
  billingLineItemsForSchedule,
  formatRevisionLimitLabel,
  CLIENT_PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_TO_PIPELINE,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TO_PIPELINE,
  HOSTING_PLANS,
  HOSTING_PLAN_META,
  DEFAULT_HOSTING_PLAN,
  resolveHostingPlan,
  hostingPlanFromCents,
  DOMAIN_STATUSES,
  DOMAIN_STATUS_LABELS,
  DESIGN_PAYMENT_STATUSES,
  DESIGN_PAYMENT_STATUS_LABELS,
  HOSTING_STATUSES,
  HOSTING_STATUS_LABELS,
  INVOICE_KINDS,
  INVOICE_KIND_LABELS,
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_UPLOAD_BYTES,
  LIMITS,
};
