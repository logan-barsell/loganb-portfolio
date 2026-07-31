import { packageLabels } from './intakeOptions';

export const adminNav = [
  { label: 'Inquiries', path: '/admin/inquiries', matchPrefix: '/admin/inquiries' },
  { label: 'Proposals', path: '/admin/proposals', matchPrefix: '/admin/proposals' },
  { label: 'Projects', path: '/admin/projects', matchPrefix: '/admin/projects' },
  { label: 'Clients', path: '/admin/clients', matchPrefix: '/admin/clients' },
  { label: 'Invoices', path: '/admin/invoices', matchPrefix: '/admin/invoices' },
];

export const inquiryStageOptions = [
  { value: '', label: 'All Stages' },
  { value: 'new', label: 'New Inquiry' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'draft_proposal', label: 'Drafted Proposal' },
  { value: 'sent_proposal', label: 'Sent Proposal' },
  { value: 'revision_proposal', label: 'Revision Pending' },
  { value: 'declined_proposal', label: 'Declined Proposal' },
  { value: 'active_project', label: 'Active Project' },
  { value: 'on_hold_project', label: 'On Hold Project' },
  { value: 'completed_project', label: 'Completed Project' },
  { value: 'cancelled_project', label: 'Cancelled Project' },
];

const stageLabelByValue = Object.fromEntries(
  inquiryStageOptions.filter((opt) => opt.value).map((opt) => [opt.value, opt.label])
);

/** Prefer canonical UI label; never show raw stage keys when known. */
export function resolveStageLabel(stage, apiLabel) {
  if (stage && stageLabelByValue[stage]) return stageLabelByValue[stage];
  if (apiLabel && stageLabelByValue[apiLabel]) return stageLabelByValue[apiLabel];
  if (apiLabel && !String(apiLabel).includes('_')) return apiLabel;
  return apiLabel || stage || null;
}

export function resolvePackageLabel(slug, apiLabel) {
  if (slug && packageLabels[slug]) return packageLabels[slug];
  if (apiLabel === 'Starter' || apiLabel === 'Starter Site') return 'Starter Website';
  if (apiLabel === 'Standard' || apiLabel === 'Standard Site') return 'Growth Website';
  if (apiLabel === 'Premium' || apiLabel === 'Premium Site') return 'Custom Web Applications';
  if (apiLabel === 'Not Sure') return 'Not Sure Yet';
  return apiLabel || (slug ? packageLabels[slug] : null) || null;
}

export const inquiryTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'contact', label: 'Contact Message' },
  { value: 'project', label: 'Project Inquiry' },
];

/** Type chip: Contact Message, or package name (Starter Website…), or Project Inquiry. */
export function inquiryTypeChipLabel(type, packageLabel, packageSlug) {
  if (type === 'contact') return 'Contact Message';
  return resolvePackageLabel(packageSlug, packageLabel) || 'Project Inquiry';
}

export const inquirySortOptions = [
  { value: 'stage', label: 'Stage' },
  { value: 'created_at', label: 'Submitted' },
  { value: 'name', label: 'Name' },
  { value: 'package_slug', label: 'Package' },
];

export const clientSortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'business_name', label: 'Business' },
  { value: 'email', label: 'Email' },
];

export const proposalStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'revision_requested', label: 'Revision Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

export const proposalSortOptions = [
  { value: 'created_at', label: 'Created' },
  { value: 'sent_at', label: 'Sent' },
  { value: 'design_amount_cents', label: 'Design Price' },
];

export const projectStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active Project' },
  { value: 'on_hold', label: 'On Hold Project' },
  { value: 'completed', label: 'Completed Project' },
  { value: 'cancelled', label: 'Cancelled Project' },
];
