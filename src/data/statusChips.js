import { colors } from '../theme/colors';

function chipSx(accent, soft) {
  return {
    color: accent,
    border: `1px solid ${accent}`,
    backgroundColor: soft,
    fontWeight: 600,
  };
}

const TONE = {
  awaitingYou: chipSx(colors.amber, colors.amberSoft),
  awaitingClient: chipSx(colors.blue, colors.blueSoft),
  active: chipSx(colors.green, colors.greenSoft),
  completed: chipSx(colors.greenMuted, colors.greenMutedSoft),
  dead: chipSx(colors.red, colors.redSoft),
  projectType: chipSx(colors.purple, colors.purpleSoft),
  contactType: chipSx(colors.purpleMuted, colors.purpleMutedSoft),
};

const PIPELINE_TONE = {
  new: 'awaitingYou',
  draft_proposal: 'awaitingYou',
  revision_proposal: 'awaitingYou',
  on_hold_project: 'awaitingYou',
  contacted: 'awaitingClient',
  sent_proposal: 'awaitingClient',
  active_project: 'active',
  completed_project: 'completed',
  declined_proposal: 'dead',
  cancelled_project: 'dead',
};

const PROPOSAL_STATUS_TONE = {
  draft: 'awaitingYou',
  revision_requested: 'awaitingYou',
  sent: 'awaitingClient',
  accepted: 'active',
  declined: 'dead',
};

const PROJECT_STATUS_TONE = {
  active: 'active',
  on_hold: 'awaitingYou',
  completed: 'completed',
  cancelled: 'dead',
};

/** Inquiry pipeline stage chip (`new`, `sent_proposal`, …). */
export function pipelineStageChipSx(stage) {
  const tone = PIPELINE_TONE[stage] || 'awaitingYou';
  return TONE[tone];
}

/** Proposal row status chip (`draft`, `sent`, …). */
export function proposalStatusChipSx(status) {
  const tone = PROPOSAL_STATUS_TONE[status] || 'awaitingYou';
  return TONE[tone];
}

/** Project row status chip (`active`, `cancelled`, …). */
export function projectStatusChipSx(status) {
  const tone = PROJECT_STATUS_TONE[status] || 'awaitingYou';
  return TONE[tone];
}

/** Inquiry type / package chip — contact muted purple, project package purple. */
export function inquiryTypeChipSx(type) {
  return type === 'contact' ? TONE.contactType : TONE.projectType;
}

/** Shared package chip style (admin linked cards, detail ChipFields, portal). */
export const packageChipSx = TONE.projectType;

/** Design payment status (`unpaid` | `partial` | `paid`). */
export function designPaymentChipSx(status) {
  if (status === 'paid') return TONE.active;
  if (status === 'partial') return TONE.awaitingClient;
  return TONE.awaitingYou;
}

/** Hosting status (`none` | `active` | `overdue`). */
export function hostingStatusChipSx(status) {
  if (status === 'active') return TONE.active;
  if (status === 'overdue') return TONE.dead;
  return TONE.awaitingYou;
}

/** Site provision (`none` | `dns_waiting` | `provisioning` | `live` | `failed`). */
export function siteProvisionStatusChipSx(status) {
  if (status === 'live') return TONE.active;
  if (status === 'failed') return TONE.dead;
  if (status === 'provisioning' || status === 'dns_waiting') return TONE.awaitingYou;
  return TONE.awaitingClient;
}

/** Invoice status (`due` | `paid` | `void`). */
export function invoiceStatusChipSx(status) {
  if (status === 'paid') return TONE.active;
  if (status === 'void') return TONE.completed;
  return TONE.awaitingYou;
}

export { TONE as statusChipTones };
