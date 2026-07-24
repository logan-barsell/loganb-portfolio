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
  centsToDollarsInput,
  dollarsToCents,
} from '../../components/admin/ProposalFormFields';
import { createProposal, fetchClient, fetchInquiry } from '../../api/adminClient';
import { inquiryTypeChipLabel, resolveStageLabel } from '../../data/adminNav';
import { sitePackages } from '../../data/pricing';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

const PACKAGE_CENTS = {
  starter: 90000,
  business: 150000,
  growth: 250000,
};

const emptyForm = {
  summary: '',
  scope: '',
  deliverables: '',
  exclusions: '',
  timelineSummary: '',
  paymentTerms: '50% deposit to begin; balance due before launch.',
  revisionLimit: '2 rounds of revisions',
  designAmountDollars: '',
  hostingMonthlyDollars: '39',
};

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

function seedFromInquiry(inquiry) {
  const pkg = sitePackages.find((p) => p.id === inquiry.packageSlug);
  const packageLabel = inquiry.packageLabel || pkg?.name || '';
  const designCents = PACKAGE_CENTS[inquiry.packageSlug] || null;

  return {
    ...emptyForm,
    summary: packageLabel
      ? `${packageLabel} website proposal for ${inquiry.businessName || inquiry.name}.`
      : `Website proposal for ${inquiry.businessName || inquiry.name}.`,
    scope: inquiry.websiteGoals || '',
    deliverables: pkg?.highlights?.join('\n') || '',
    timelineSummary: inquiry.timeline || '',
    designAmountDollars: designCents ? centsToDollarsInput(designCents) : '',
  };
}

function buildPayload(values) {
  const designAmountCents = dollarsToCents(values.designAmountDollars);
  const hostingMonthlyCents = dollarsToCents(values.hostingMonthlyDollars);
  const fieldErrors = {};

  if (designAmountCents === null || Number.isNaN(designAmountCents) || designAmountCents <= 0) {
    fieldErrors.designAmountCents = 'Enter a valid design price greater than zero.';
  }
  if (
    values.hostingMonthlyDollars.trim() !== '' &&
    (Number.isNaN(hostingMonthlyCents) || hostingMonthlyCents < 0)
  ) {
    fieldErrors.hostingMonthlyCents = 'Enter a valid hosting amount (0 or more).';
  }

  return {
    fieldErrors,
    body: {
      summary: values.summary.trim() || null,
      scope: values.scope.trim() || null,
      deliverables: values.deliverables.trim() || null,
      exclusions: values.exclusions.trim() || null,
      timelineSummary: values.timelineSummary.trim() || null,
      paymentTerms: values.paymentTerms.trim() || null,
      revisionLimit: values.revisionLimit.trim() || null,
      designAmountCents,
      hostingMonthlyCents:
        values.hostingMonthlyDollars.trim() === '' ? null : hostingMonthlyCents,
    },
  };
}

const typeChipSx = {
  color: colors.purple,
  border: `1px solid ${colors.purple}`,
  backgroundColor: 'rgba(149, 99, 187, 0.12)',
  fontWeight: 600,
};

const stageChipSx = {
  color: colors.green,
  border: `1px solid ${colors.green}`,
  backgroundColor: colors.greenSoft,
  fontWeight: 600,
};

const ProposalNew = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inquiryId = searchParams.get('inquiryId') || '';

  const [inquiry, setInquiry] = useState(null);
  const [client, setClient] = useState(null);
  const [values, setValues] = useState(emptyForm);
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
        setValues(seedFromInquiry(next));
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
  }, [inquiryId, toast]);

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field] || fieldErrors.designAmountCents || fieldErrors.hostingMonthlyCents) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (field === 'designAmountDollars') delete next.designAmountCents;
        if (field === 'hostingMonthlyDollars') delete next.hostingMonthlyCents;
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
                sx={typeChipSx}
              />
              <Chip
                label={resolveStageLabel(inquiry.stage, inquiry.stageLabel)}
                size="small"
                sx={stageChipSx}
              />
            </Stack>

            <DetailBlock title="Client">
              {client ? (
                <>
                  <Field label="Name" value={client.name} />
                  <Field label="Business Name" value={client.businessName} />
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
              <Field label="Message" value={inquiry.message} />
              {inquiry.type === 'project' ? (
                <>
                  <Field label="Website Goals" value={inquiry.websiteGoals} />
                  <Field label="Current Website" value={inquiry.currentWebsite} />
                  <Field label="Requested Features" value={inquiry.requestedFeatures} />
                  <Field label="Inspiration Links" value={inquiry.inspirationLinks} />
                  <Field label="Domain Info" value={inquiry.domainInfo} />
                  <Field label="Branding Notes" value={inquiry.brandingNotes} />
                  <Field label="Content Readiness" value={inquiry.contentReadiness} />
                  <Field label="Timeline" value={inquiry.timeline} />
                  <Field label="Budget" value={inquiry.budget} />
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
