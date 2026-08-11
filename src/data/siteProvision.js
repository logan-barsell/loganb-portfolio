/** Site provision statuses — keep aligned with server/src/config/constants.js */

export const SITE_PROVISION_STATUSES = [
  'none',
  'dns_waiting',
  'provisioning',
  'live',
  'failed',
];

export const SITE_PROVISION_STATUS_LABELS = {
  none: 'Not Provisioned',
  dns_waiting: 'DNS Waiting',
  provisioning: 'Provisioning',
  live: 'Live',
  failed: 'Failed',
};
