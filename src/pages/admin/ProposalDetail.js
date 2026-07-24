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
import { inquiryTypeChipLabel, resolveStageLabel } from '../../data/adminNav';
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
    paymentTerms: proposal.paymentTerms || '',
    revisionLimit: proposal.revisionLimit || '',
    designAmountDollars: centsToDollarsInput(proposal.designAmountCents),
    hostingMonthlyDollars: centsToDollarsInput(proposal.hostingMonthlyCents),
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

const ProposalDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [proposal, setProposal] = useState(null);
  const [values, setValues] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

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
                    sx={{
                      color: colors.purple,
                      border: `1px solid ${colors.purple}`,
                      backgroundColor: 'rgba(149, 99, 187, 0.12)',
                      fontWeight: 600,
                    }}
                  />
                ) : null}
                {proposal.inquiry?.stage ||
                proposal.inquiry?.stageLabel ||
                proposal.status ? (
                  <Chip
                    label={resolveStageLabel(
                      proposal.inquiry?.stage ||
                        (proposal.status === 'sent'
                          ? 'sent_proposal'
                          : proposal.status === 'declined'
                            ? 'declined_proposal'
                            : 'draft_proposal'),
                      proposal.inquiry?.stageLabel
                    )}
                    size="small"
                    sx={{
                      color: colors.green,
                      border: `1px solid ${colors.green}`,
                      backgroundColor: colors.greenSoft,
                      fontWeight: 600,
                    }}
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
                    <CtaButton type="button" secondary disabled>
                      Submit Proposal
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
                  <Field label="Revision Limit" value={proposal.revisionLimit} />
                  <Field label="Payment Terms" value={proposal.paymentTerms} />
                  <Field label="Design Price" value={proposal.designAmountLabel} />
                  <Field label="Hosting Monthly" value={proposal.hostingMonthlyLabel} />
                  <Box sx={{ mt: 1 }}>
                    <CtaButton type="button" secondary disabled>
                      Submit Proposal
                    </CtaButton>
                  </Box>
                </>
              )}
            </DetailBlock>
          </>
        ) : null}
      </Section>
    </Box>
  );
};

export default ProposalDetail;
