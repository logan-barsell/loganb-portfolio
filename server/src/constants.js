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
  starter: 'Starter',
  business: 'Standard',
  growth: 'Premium',
  hosting: 'Managed Hosting & Support',
  redesign: 'Website Redesign',
  custom: 'Custom Site',
  'not-sure': 'Not sure',
};

const INQUIRY_STAGES = [
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'converted',
  'closed',
];

const INQUIRY_STAGE_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  converted: 'Converted',
  closed: 'Closed',
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
};

module.exports = {
  PACKAGE_SLUGS,
  PACKAGE_LABELS,
  INQUIRY_STAGES,
  INQUIRY_STAGE_LABELS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_UPLOAD_BYTES,
  LIMITS,
};
