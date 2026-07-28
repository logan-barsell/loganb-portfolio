/** Hosting subscription catalog — Stripe Price IDs must be pre-created (temp placeholders OK). */

export const HOSTING_PLANS = ['none', 'hosting_39', 'hosting_25', 'hosting_10'];

export const HOSTING_PLAN_META = {
  none: {
    key: 'none',
    label: 'No Managed Hosting',
    amountCents: null,
    envKey: null,
  },
  hosting_39: {
    key: 'hosting_39',
    label: 'Managed Hosting — $39/month',
    amountCents: 3900,
    envKey: 'STRIPE_HOSTING_PRICE_ID_39',
    defaultPriceId: 'price_temp_hosting_39',
  },
  hosting_25: {
    key: 'hosting_25',
    label: 'Managed Hosting — $25/month',
    amountCents: 2500,
    envKey: 'STRIPE_HOSTING_PRICE_ID_25',
    defaultPriceId: 'price_temp_hosting_25',
  },
  hosting_10: {
    key: 'hosting_10',
    label: 'Managed Hosting — $10/month',
    amountCents: 1000,
    envKey: 'STRIPE_HOSTING_PRICE_ID_10',
    defaultPriceId: 'price_temp_hosting_10',
  },
};

export const hostingPlanOptions = HOSTING_PLANS.map((key) => ({
  value: key,
  label: HOSTING_PLAN_META[key].label,
}));

export const DEFAULT_HOSTING_PLAN = 'hosting_39';

export function resolveHostingPlan(plan) {
  if (plan && HOSTING_PLAN_META[plan]) return HOSTING_PLAN_META[plan];
  return HOSTING_PLAN_META.none;
}

export function hostingPlanFromCents(cents) {
  if (cents === null || cents === undefined) return 'none';
  const n = Number(cents);
  if (!Number.isFinite(n) || n <= 0) return 'none';
  if (n <= 1000) return 'hosting_10';
  if (n <= 2500) return 'hosting_25';
  return 'hosting_39';
}

/** Map a Stripe Price ID to plan key using known env default IDs (client-side hint only). */
export function hostingPlanFromPriceId(priceId, priceIdByPlan = {}) {
  if (!priceId) return null;
  for (const [key, id] of Object.entries(priceIdByPlan)) {
    if (id && id === priceId) return key;
  }
  for (const key of HOSTING_PLANS) {
    if (key === 'none') continue;
    if (HOSTING_PLAN_META[key].defaultPriceId === priceId) return key;
  }
  return null;
}
