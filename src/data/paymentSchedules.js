/** Payment schedule options for proposals (drives portal billing CTAs). */

export const PAYMENT_SCHEDULES = ['deposit_50_50', 'full_upfront', 'full_before_launch'];

export const PAYMENT_SCHEDULE_LABELS = {
  deposit_50_50: '50% deposit to begin; 50% before launch',
  full_upfront: '100% due before work begins',
  full_before_launch: '100% due before launch',
};

export const paymentScheduleOptions = PAYMENT_SCHEDULES.map((value) => ({
  value,
  label: PAYMENT_SCHEDULE_LABELS[value],
}));

export const DEFAULT_PAYMENT_SCHEDULE = 'deposit_50_50';

export function resolvePaymentScheduleLabel(schedule) {
  if (!schedule) return null;
  return PAYMENT_SCHEDULE_LABELS[schedule] || schedule;
}

/** Revision limit select: positive ints, or empty string for Unlimited (null in API). */
export const revisionLimitOptions = [
  { value: '1', label: '1 Round' },
  { value: '2', label: '2 Rounds' },
  { value: '3', label: '3 Rounds' },
  { value: '', label: 'Unlimited' },
];

export function formatRevisionLimit(limit) {
  if (limit === null || limit === undefined) return 'Unlimited';
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return 'Unlimited';
  return n === 1 ? '1 Round' : `${n} Rounds`;
}

/**
 * Split design cents into portal billing line items for a schedule.
 * @returns {Array<{ key: string, label: string, amountCents: number }>}
 */
export function billingLineItemsForSchedule(schedule, designCents) {
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
