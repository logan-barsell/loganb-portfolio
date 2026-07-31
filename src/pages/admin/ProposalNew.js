import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CtaButton from '../../components/CtaButton';
import Section from '../../components/Section';
import ProposalFormFields, {
  dollarsToCents,
} from '../../components/admin/ProposalFormFields';
import { createProposal, fetchClient, fetchInquiry } from '../../api/adminClient';
import { inquiryTypeChipLabel, resolveStageLabel } from '../../data/adminNav';
import { inquiryTypeChipSx, pipelineStageChipSx } from '../../data/statusChips';
import {
  resolveBudgetLabel,
  resolveContentReadinessLabel,
  resolveTimelineLabel,
} from '../../data/intakeOptions';
import { DEFAULT_PAYMENT_SCHEDULE } from '../../data/paymentSchedules';
import { DEFAULT_HOSTING_PLAN, resolveHostingPlan } from '../../data/hostingPlans';
import { seedProposalFormFromInquiry, todayYmd } from '../../data/proposalDefaults';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

function createEmptyForm() {
  return {
    summary: '',
    scope: '',
    deliverables: '',
    exclusions: '',
    timelineSummary: '',
    kickoffDate: todayYmd(),
    packageSlug: '',
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    revisionLimit: '2',
    designAmountDollars: '',
    hostingPlan: DEFAULT_HOSTING_PLAN,
  };
}

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

function DetailBlock({ title, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{ color: colors.green, mb: 1.5, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}
      >
        {title}
      </Typography>
      <Divider sx={{ borderColor: 'rgba(149, 99, 187, 0.35)', mb: 2 }} />
      {children}
    </Box>
  );
}

function buildPayload(values) {
  const designAmountCents = dollarsToCents(values.designAmountDollars);
  const hostingPlan = values.hostingPlan || 'none';
  const fieldErrors = {};

  if (designAmountCents === null || Number.isNaN(designAmountCents) || designAmountCents <= 0) {
    fieldErrors.designAmountCents = 'Enter a valid design price greater than zero.';
  }
  if (!resolveHostingPlan(hostingPlan) || !hostingPlan) {
    fieldErrors.hostingPlan = 'Choose a hosting plan.';
  }
  if (!values.paymentSchedule) {
    fieldErrors.paymentSchedule = 'Choose a payment schedule.';
  }
  if (!values.packageSlug) {
    fieldErrors.packageSlug = 'Choose a package.';
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
      packageSlug: values.packageSlug || null,
      paymentSchedule: values.paymentSchedule || DEFAULT_PAYMENT_SCHEDULE,
      revisionLimit,
      designAmountCents,
      hostingPlan,
      hostingMonthlyCents: plan.amountCents,
    },
  };
}

const ProposalNew = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inquiryId = searchParams.get('inquiryId') || '';

  const [inquiry, setInquiry] = useState(null);
  const [client, setClient] = useState(null);
  const [values, setValues] = useState(createEmptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(Boolean(inquiryId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!inquiryId) {
      setLoading(false);
      toast.error('Open Create a Proposal from an inquiry that has a linked client.');
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchInquiry(inquiryId);
        if (cancelled) return;
        const next = data.inquiry;
        if (!next?.clientId) {
          setInquiry(next);
          setClient(null);
          toast.error('A linked client is required before creating a proposal.');
          return;
        }
        if ((next.proposals || []).length > 0) {
          setInquiry(next);
          toast.error('This inquiry already has a proposal.');
          navigate(`/admin/proposals/${next.proposals[0].id}`, { replace: true });
          return;
        }
        setInquiry(next);
        setValues(seedProposalFormFromInquiry(next));
        try {
          const clientData = await fetchClient(next.clientId);
          if (!cancelled) setClient(clientData.client || null);
        } catch {
          if (!cancelled) setClient(null);
        }
      } catch (err) {
        if (!cancelled) {
          setInquiry(null);
          setClient(null);
          toast.error(err.message || 'Failed to load inquiry.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inquiryId, toast, navigate]);

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
    if (!inquiryId || !inquiry?.clientId) return;

    const { fieldErrors: localErrors, body } = buildPayload(values);
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const data = await createProposal({ inquiryId, ...body });
      toast.success('Draft proposal created.');
      navigate(`/admin/proposals/${data.proposal.id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to create proposal.');
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
        title="New Proposal"
        lead={
          <Button
            component={RouterLink}
            to={inquiryId ? `/admin/inquiries/${inquiryId}` : '/admin/proposals'}
            sx={{ color: colors.muted, textTransform: 'none', px: 0 }}
          >
            ← Back
          </Button>
        }
      >
        {loading ? <Typography sx={{ color: colors.muted }}>Loading…</Typography> : null}

        {inquiry && inquiry.clientId ? (
          <>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 3, flexWrap: 'wrap', gap: 1.5 }}
            >
              <Chip
                label={inquiryTypeChipLabel(
                  inquiry.type,
                  inquiry.packageLabel,
                  inquiry.packageSlug
                )}
                size="small"
                sx={inquiryTypeChipSx(inquiry.type)}
              />
              <Chip
                label={resolveStageLabel(inquiry.stage, inquiry.stageLabel)}
                size="small"
                sx={pipelineStageChipSx(inquiry.stage)}
              />
            </Stack>

            <DetailBlock title="Client">
              {client ? (
                <>
                  <Field label="Name" value={client.name} />
                  <Field label="Business Name" value={inquiry.businessName || client?.businessName} />
                  <Field label="Email" value={client.email} />
                  <Field label="Phone" value={client.phone} />
                  <CtaButton to={`/admin/clients/${client.id}`} size="medium" secondary>
                    View Client
                  </CtaButton>
                </>
              ) : (
                <Typography sx={{ color: colors.muted }}>
                  Client linked, but details could not be loaded.
                </Typography>
              )}
            </DetailBlock>

            <DetailBlock title="Inquiry">
              <Field label="Name" value={inquiry.name} />
              <Field label="Email" value={inquiry.email} />
              <Field label="Phone" value={inquiry.phone} />
              <Field label="Business Name" value={inquiry.businessName} />
              <Field
                label="Package Requested"
                value={inquiry.packageLabel || inquiry.packageSlug}
              />
              <Field label="Message" value={inquiry.message} />
              {inquiry.type === 'project' ? (
                <>
                  <Field label="Website Goals" value={inquiry.websiteGoals} />
                  <Field label="Current Website" value={inquiry.currentWebsite} />
                  <Field label="Requested Features" value={inquiry.requestedFeatures} />
                  <Field label="Inspiration Links" value={inquiry.inspirationLinks} />
                  <Field label="Domain Info" value={inquiry.domainInfo} />
                  <Field label="Branding Notes" value={inquiry.brandingNotes} />
                  <Field
                    label="Content Readiness"
                    value={resolveContentReadinessLabel(inquiry.contentReadiness)}
                  />
                  <Field label="Timeline" value={resolveTimelineLabel(inquiry.timeline)} />
                  <Field label="Budget" value={resolveBudgetLabel(inquiry.budget)} />
                </>
              ) : null}
              <Field label="Submitted" value={formatDate(inquiry.createdAt)} />
              <CtaButton to={`/admin/inquiries/${inquiry.id}`} size="medium" secondary>
                View Inquiry
              </CtaButton>
            </DetailBlock>

            <DetailBlock title="Proposal">
              <Box component="form" onSubmit={handleSubmit}>
                <ProposalFormFields
                  values={values}
                  fieldErrors={fieldErrors}
                  onChange={handleChange}
                  disabled={saving}
                />
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <CtaButton type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Create Draft'}
                  </CtaButton>
                </Stack>
              </Box>
            </DetailBlock>
          </>
        ) : null}
      </Section>
    </Box>
  );
};

export default ProposalNew;
