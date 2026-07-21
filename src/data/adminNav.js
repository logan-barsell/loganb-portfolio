export const adminNav = [
  { label: 'Inquiries', path: '/admin/inquiries', matchPrefix: '/admin/inquiries' },
  { label: 'Projects', path: '/admin/projects', matchPrefix: '/admin/projects' },
  { label: 'Invoices', path: '/admin/invoices', matchPrefix: '/admin/invoices' },
];

export const inquiryStageOptions = [
  { value: '', label: 'All stages' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
];

export const inquiryTypeOptions = [
  { value: '', label: 'All types' },
  { value: 'contact', label: 'Contact' },
  { value: 'project', label: 'Project' },
];

export const inquirySortOptions = [
  { value: 'created_at', label: 'Submitted' },
  { value: 'name', label: 'Name' },
  { value: 'package_slug', label: 'Package' },
  { value: 'stage', label: 'Stage' },
];
