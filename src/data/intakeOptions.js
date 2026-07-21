import { sitePackages, hostingPlans } from './pricing';

const managedHosting = hostingPlans.find((plan) => plan.id === 'hosting');

export const packageOptions = [
  ...sitePackages.map((pkg) => ({ value: pkg.id, label: pkg.name })),
  { value: 'redesign', label: 'Website Redesign' },
  ...(managedHosting
    ? [{ value: managedHosting.id, label: managedHosting.name }]
    : []),
  { value: 'custom', label: 'Custom Site' },
  { value: 'not-sure', label: 'Not sure yet' },
];

export const packageLabels = Object.fromEntries(
  packageOptions.map((option) => [option.value, option.label])
);

export const timelineOptions = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1-2-months', label: '1–2 months' },
  { value: '3-plus-months', label: '3+ months' },
  { value: 'flexible', label: 'Flexible / not sure' },
];

export const budgetOptions = [
  { value: 'under-900', label: 'Under $900' },
  { value: '900-1500', label: '$900–$1,500' },
  { value: '1500-2500', label: '$1,500–$2,500' },
  { value: '2500-plus', label: '$2,500+' },
  { value: 'not-sure', label: 'Not sure yet' },
];

export const contentReadinessOptions = [
  { value: 'ready', label: 'I have most of the content ready' },
  { value: 'partial', label: 'I have some content' },
  { value: 'need-help', label: 'I need help with content' },
  { value: 'not-sure', label: 'Not sure yet' },
];
