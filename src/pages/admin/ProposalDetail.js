import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CtaButton from '../../components/CtaButton';
import Section from '../../components/Section';
import ProposalFormFields, {
  centsToDollarsInput,
  dollarsToCents,
} from '../../components/admin/ProposalFormFields';
import { fetchProposal, updateProposal } from '../../api/adminClient';
import SubmitProposalModal from '../../components/admin/SubmitProposalModal';
import InquiryAttachments from '../../components/admin/InquiryAttachments';
import { inquiryTypeChipLabel, resolveStageLabel } from '../../data/adminNav';
import { inquiryTypeChipSx, pipelineStageChipSx } from '../../data/statusChips';
import {
  DEFAULT_PAYMENT_SCHEDULE,
  formatRevisionLimit,
  resolvePaymentScheduleLabel,
} from '../../data/paymentSchedules';
import { DEFAULT_HOSTING_PLAN, resolveHostingPlan } from '../../data/hostingPlans';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatKickoffDate(ymd) {
  if (!ymd) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
      new Date(`${ymd}T00:00:00`)
    );
  } catch {
    return ymd;
  }
}

function proposalToPipelineStage(proposal) {
  if (proposal?.inquiry?.stage) return proposal.inquiry.stage;
  if (proposal?.status === 'sent') return 'sent_proposal';
  if (proposal?.status === 'revision_requested') return 'revision_proposal';
  if (proposal?.status === 'accepted') return 'active_project';
  if (proposal?.status === 'declined') return 'declined_proposal';
  return 'draft_proposal';
}

function Field({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ color: colors.purple, fontSize: 13, fontWeight: 700, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function DetailBlock({ title, action, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 1.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: colors.green, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}
        >
          {title}
        </Typography>
        {action || null}
      </Box>
      <Divider sx={{ borderColor: 'rgba(149, 99, 187, 0.35)', mb: 2 }} />
      {children}
    </Box>
  );
}

function proposalToForm(proposal) {
  return {
    summary: proposal.summary || '',
    scope: proposal.scope || '',
    deliverables: proposal.deliverables || '',
    exclusions: proposal.exclusions || '',
    timelineSummary: proposal.timelineSummary || '',
    kickoffDate: proposal.kickoffDate || '',
    paymentSchedule: proposal.paymentSchedule || DEFAULT_PAYMENT_SCHEDULE,
    revisionLimit:
      proposal.revisionLimit === null || proposal.revisionLimit === undefined
        ? ''
        : String(proposal.revisionLimit),
    designAmountDollars: centsToDollarsInput(proposal.designAmountCents),
    hostingPlan: proposal.hostingPlan || DEFAULT_HOSTING_PLAN,
  };
}

function buildPayload(values) {
  const designAmountCents = dollarsToCents(values.designAmountDollars);
  const hostingPlan = values.hostingPlan || 'none';
  const fieldErrors = {};

  if (designAmountCents === null || Number.isNaN(designAmountCents) || designAmountCents <= 0) {
    fieldErrors.designAmountCents = 'Enter a valid design price greater than zero.';
  }
  if (!hostingPlan) {
    fieldErrors.hostingPlan = 'Choose a hosting plan.';
  }
  if (!values.paymentSchedule) {
    fieldErrors.paymentSchedule = 'Choose a payment schedule.';
  }

  const revisionRaw = String(values.revisionLimit ?? '').trim();
  let revisionLimit = null;
  if (revisionRaw !== '') {
    revisionLimit = Number(revisionRaw);
    if (!Number.isInteger(revisionLimit) || revisionLimit < 1) {
      fieldErrors.revisionLimit = 'Choose a valid revision limit.';
    }
  }

  const plan = resolveHostingPlan(hostingPlan);

  return {
    fieldErrors,
    body: {
      summary: values.summary.trim() || null,
      scope: values.scope.trim() || null,
      deliverables: values.deliverables.trim() || null,
      exclusions: values.exclusions.trim() || null,
      timelineSummary: values.timelineSummary.trim() || null,
      kickoffDate: values.kickoffDate?.trim() || null,
      paymentSchedule: values.paymentSchedule || DEFAULT_PAYMENT_SCHEDULE,
      revisionLimit,
      designAmountCents,
      hostingPlan,
      hostingMonthlyCents: plan.amountCents,
    },
  };
}

const ProposalDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [proposal, setProposal] = useState(null);
  const [values, setValues] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setEditing(false);
      try {
        const data = await fetchProposal(id);
        if (cancelled) return;
        setProposal(data.proposal);
        setValues(proposalToForm(data.proposal));
      } catch (err) {
        if (!cancelled) {
          setProposal(null);
          setValues(null);
          toast.error(err.message || 'Failed to load proposal.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const startEditing = () => {
    if (!proposal) return;
    setValues(proposalToForm(proposal));
    setFieldErrors({});
    setEditing(true);
  };

  const cancelEditing = () => {
    if (proposal) setValues(proposalToForm(proposal));
    setFieldErrors({});
    setEditing(false);
  };

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (
      fieldErrors[field] ||
      fieldErrors.designAmountCents ||
      fieldErrors.hostingPlan ||
      fieldErrors.paymentSchedule ||
      fieldErrors.revisionLimit ||
      fieldErrors.kickoffDate
    ) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (field === 'designAmountDollars') delete next.designAmountCents;
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!values) return;

    const { fieldErrors: localErrors, body } = buildPayload(values);
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const data = await updateProposal(id, body);
      setProposal(data.proposal);
      setValues(proposalToForm(data.proposal));
      setEditing(false);
      toast.success('Saved.');
    } catch (err) {
      toast.error(err.message || 'Failed to save proposal.');
      if (err.details && typeof err.details === 'object') {
        setFieldErrors(err.details);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Section
        title="Proposal Detail"
        lead={
          <Button
            component={RouterLink}
            to="/admin/proposals"
            sx={{ color: colors.muted, textTransform: 'none', px: 0 }}
          >
            ← Back to Proposals
          </Button>
        }
      >
        {loading ? <Typography sx={{ color: colors.muted }}>Loading…</Typography> : null}

        {proposal && values ? (
          <>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3, flexWrap: 'wrap', gap: 1.5 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                {proposal.inquiry ? (
                  <Chip
                    label={inquiryTypeChipLabel(
                      proposal.inquiry.type,
                      proposal.inquiry.packageLabel,
                      proposal.inquiry.packageSlug
                    )}
                    size="small"
                    sx={inquiryTypeChipSx(proposal.inquiry.type)}
                  />
                ) : null}
                {proposal.inquiry?.stage ||
                proposal.inquiry?.stageLabel ||
                proposal.status ? (
                  <Chip
                    label={resolveStageLabel(
                      proposalToPipelineStage(proposal),
                      proposal.inquiry?.stageLabel
                    )}
                    size="small"
                    sx={pipelineStageChipSx(proposalToPipelineStage(proposal))}
                  />
                ) : null}
              </Stack>
              <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                {proposal.status === 'sent' && proposal.sentAt
                  ? `Sent ${formatDate(proposal.sentAt)}`
                  : `Created ${formatDate(proposal.createdAt)}`}
              </Typography>
            </Stack>

            <DetailBlock title="Client">
              {proposal.client ? (
                <>
                  <Field label="Name" value={proposal.client.name} />
                  <Field label="Business Name" value={proposal.client.businessName} />
                  <Field label="Email" value={proposal.client.email} />
                  <Field label="Phone" value={proposal.client.phone} />
                  <CtaButton to={`/admin/clients/${proposal.client.id}`} size="medium" secondary>
                    View Client
                  </CtaButton>
                </>
              ) : (
                <Typography sx={{ color: colors.muted }}>No linked client.</Typography>
              )}
            </DetailBlock>

            <DetailBlock title="Inquiry">
              {proposal.inquiry ? (
                <>
                  <Field label="Website Goals" value={proposal.inquiry.websiteGoals} />
                  <Field label="Submitted" value={formatDate(proposal.inquiry.createdAt)} />
                  <CtaButton
                    to={`/admin/inquiries/${proposal.inquiry.id}`}
                    size="medium"
                    secondary
                  >
                    View Inquiry
                  </CtaButton>
                </>
              ) : (
                <Typography sx={{ color: colors.muted }}>No linked inquiry.</Typography>
              )}
            </DetailBlock>

            <DetailBlock
              title="Proposal"
              action={
                !editing ? (
                  <CtaButton type="button" size="medium" onClick={startEditing}>
                    Edit
                  </CtaButton>
                ) : null
              }
            >
              {editing ? (
                <Box component="form" onSubmit={handleSubmit}>
                  <ProposalFormFields
                    values={values}
                    fieldErrors={fieldErrors}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ mt: 3 }}
                  >
                    <CtaButton type="submit" disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </CtaButton>
                    <CtaButton type="button" secondary disabled={saving} onClick={cancelEditing}>
                      Cancel
                    </CtaButton>
                  </Stack>
                </Box>
              ) : (
                <>
                  <Field label="Summary" value={proposal.summary} />
                  <Field label="Scope" value={proposal.scope} />
                  <Field label="Deliverables" value={proposal.deliverables} />
                  <Field label="Exclusions" value={proposal.exclusions} />
                  <Field label="Timeline" value={proposal.timelineSummary} />
                  <Field label="Target Kickoff Date" value={formatKickoffDate(proposal.kickoffDate)} />
                  <Field
                    label="Revision Limit"
                    value={
                      proposal.revisionLimitLabel || formatRevisionLimit(proposal.revisionLimit)
                    }
                  />
                  <Field
                    label="Payment Terms"
                    value={
                      proposal.paymentTermsLabel ||
                      resolvePaymentScheduleLabel(proposal.paymentSchedule) ||
                      proposal.paymentTerms
                    }
                  />
                  <Field label="Design Price" value={proposal.designAmountLabel} />
                  <Field
                    label="Hosting"
                    value={proposal.hostingPlanLabel || proposal.hostingMonthlyLabel}
                  />
                  {proposal.status === 'declined' ? (
                    <Field label="Decline Reason" value={proposal.declineReason} />
                  ) : null}
                </>
              )}
            </DetailBlock>

            {proposal.revisions?.length ? (
              <DetailBlock title="Revision Notes">
                <Stack spacing={2.5}>
                  {proposal.revisions.map((note) => (
                    <Box key={note.id}>
                      <Typography sx={{ color: colors.muted, fontSize: 13, mb: 0.75 }}>
                        {formatDate(note.createdAt)}
                      </Typography>
                      <Typography
                        sx={{ color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {note.message}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </DetailBlock>
            ) : null}

            <DetailBlock title="Attachments">
              <InquiryAttachments
                inquiryId={proposal.inquiryId || proposal.inquiry?.id}
                attachments={proposal.attachments}
              />
            </DetailBlock>

            {!editing ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 1 }}>
                <CtaButton
                  type="button"
                  size="large"
                  onClick={() => setSubmitOpen(true)}
                  sx={{ px: { xs: 3, sm: 5 }, py: 1.25, fontSize: { xs: '1rem', sm: '1.1rem' } }}
                >
                  {proposal.status === 'draft' ? 'Submit Proposal' : 'Resend Proposal'}
                </CtaButton>
              </Box>
            ) : null}
          </>
        ) : null}
      </Section>

      <SubmitProposalModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        proposal={proposal}
        onSent={(next) => {
          setProposal(next);
          setValues(proposalToForm(next));
        }}
      />
    </Box>
  );
};

export default ProposalDetail;
