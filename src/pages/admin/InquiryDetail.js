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
import InquiryAttachments from '../../components/admin/InquiryAttachments';
import ProposalLinkedCard from '../../components/admin/ProposalLinkedCard';
import ProjectLinkedCard from '../../components/admin/ProjectLinkedCard';
import { fetchInquiry, markInquiryContacted } from '../../api/adminClient';
import { inquiryTypeChipLabel, resolvePackageLabel, resolveStageLabel } from '../../data/adminNav';
import {
  inquiryTypeChipSx,
  packageChipSx,
  pipelineStageChipSx,
} from '../../data/statusChips';
import {
  resolveBudgetLabel,
  resolveContentReadinessLabel,
  resolveTimelineLabel,
} from '../../data/intakeOptions';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

function formatSubmitted(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
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

function ChipField({ label, chipLabel, chipSx }) {
  if (!chipLabel) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ color: colors.purple, fontSize: 13, fontWeight: 700, mb: 0.5 }}>
        {label}
      </Typography>
      <Chip label={chipLabel} size="small" sx={chipSx} />
    </Box>
  );
}

function DetailSection({ title, action, children }) {
  const content = React.Children.toArray(children).filter(Boolean);
  if (!content.length && !action) return null;
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
      {content}
    </Box>
  );
}

const InquiryDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingContacted, setMarkingContacted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchInquiry(id);
        if (!cancelled) setInquiry(data.inquiry);
      } catch (err) {
        if (!cancelled) {
          setInquiry(null);
          toast.error(err.message || 'Failed to load inquiry.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const handleMarkContacted = async () => {
    setMarkingContacted(true);
    try {
      const data = await markInquiryContacted(id);
      setInquiry(data.inquiry);
      toast.success('Marked as contacted.');
    } catch (err) {
      toast.error(err.message || 'Unable to mark as contacted.');
    } finally {
      setMarkingContacted(false);
    }
  };

  const canMarkContacted =
    inquiry &&
    inquiry.type === 'contact' &&
    inquiry.stage === 'new' &&
    !(inquiry.proposals || []).length;

  return (
    <Box sx={{ pb: 4 }}>
      <Section
        title="Inquiry Detail"
        lead={
          <Button
            component={RouterLink}
            to="/admin/inquiries"
            sx={{ color: colors.muted, textTransform: 'none', px: 0 }}
          >
            ← Back to Inquiries
          </Button>
        }
      >
        {loading ? <Typography sx={{ color: colors.muted }}>Loading…</Typography> : null}

        {inquiry ? (
          <>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3, flexWrap: 'wrap', gap: 1.5 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                <Chip
                  label={inquiryTypeChipLabel(inquiry.type, inquiry.packageLabel, inquiry.packageSlug)}
                  size="small"
                  sx={inquiryTypeChipSx(inquiry.type)}
                />
                <Chip
                  label={resolveStageLabel(inquiry.stage, inquiry.stageLabel)}
                  size="small"
                  sx={pipelineStageChipSx(inquiry.stage)}
                />
                {canMarkContacted ? (
                  <CtaButton
                    size="medium"
                    secondary
                    onClick={handleMarkContacted}
                    disabled={markingContacted}
                  >
                    {markingContacted ? 'Saving…' : 'Mark as Contacted'}
                  </CtaButton>
                ) : null}
              </Stack>
              <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                Submitted {formatSubmitted(inquiry.createdAt)}
              </Typography>
            </Stack>

            <DetailSection title="Contact">
              <Field label="Name" value={inquiry.name} />
              <Field label="Email" value={inquiry.email} />
              <Field label="Phone" value={inquiry.phone} />
              <Field label="Business Name" value={inquiry.businessName} />
              <Field label="Message" value={inquiry.message} />
              {inquiry.clientId ? (
                <Box sx={{ mb: 2 }}>
                  <CtaButton to={`/admin/clients/${inquiry.clientId}`} size="medium" secondary>
                    View Client
                  </CtaButton>
                </Box>
              ) : null}
            </DetailSection>

            {inquiry.type === 'project' ? (
              <DetailSection title="Inquiry Details">
                <ChipField
                  label="Package Selected"
                  chipLabel={resolvePackageLabel(inquiry.packageSlug, inquiry.packageLabel)}
                  chipSx={packageChipSx}
                />
                <Field label="Website Goals" value={inquiry.websiteGoals} />
                <Field label="Current Website" value={inquiry.currentWebsite} />
                <Field label="Requested Features" value={inquiry.requestedFeatures} />
                <Field label="Inspiration Links" value={inquiry.inspirationLinks} />
                <Field label="Domain Name" value={inquiry.domainName} />
                <Field label="Domain Info" value={inquiry.domainInfo} />
                <Field label="Branding Notes" value={inquiry.brandingNotes} />
                <Field
                  label="Content Readiness"
                  value={resolveContentReadinessLabel(inquiry.contentReadiness)}
                />
                <Field label="Timeline" value={resolveTimelineLabel(inquiry.timeline)} />
                <Field label="Budget" value={resolveBudgetLabel(inquiry.budget)} />
              </DetailSection>
            ) : null}

            {inquiry.type === 'project' ? (
              <DetailSection title="Attachments">
                <InquiryAttachments
                  inquiryId={inquiry.id}
                  attachments={inquiry.attachments}
                  onAttachmentsChange={(attachments) => {
                    setInquiry((prev) => (prev ? { ...prev, attachments } : prev));
                  }}
                />
              </DetailSection>
            ) : null}

            {inquiry.type === 'project' ? (
              <DetailSection title="Proposal">
                {!inquiry.clientId ? (
                  <Typography
                    sx={{ color: colors.muted, mb: (inquiry.proposals || []).length ? 2 : 0 }}
                  >
                    A linked client is required before creating a proposal.
                  </Typography>
                ) : null}
                {(inquiry.proposals || []).length === 0 ? (
                  <Typography sx={{ color: colors.muted }}>No proposals yet.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {inquiry.proposals.map((proposal) => (
                      <ProposalLinkedCard
                        key={proposal.id}
                        proposal={proposal}
                        fallbackName={inquiry.name}
                        fallbackBusinessName={inquiry.businessName}
                      />
                    ))}
                  </Stack>
                )}
              </DetailSection>
            ) : null}

            {inquiry.type === 'project' && inquiry.project ? (
              <DetailSection title="Project">
                <ProjectLinkedCard
                  project={inquiry.project}
                  fallbackName={inquiry.name}
                  fallbackBusinessName={inquiry.businessName}
                />
              </DetailSection>
            ) : null}

            {inquiry.type === 'project' && inquiry.clientId && !(inquiry.proposals || []).length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 1 }}>
                <CtaButton
                  to={`/admin/proposals/new?inquiryId=${encodeURIComponent(inquiry.id)}`}
                  size="large"
                  sx={{ px: { xs: 3, sm: 5 }, py: 1.25, fontSize: { xs: '1rem', sm: '1.1rem' } }}
                >
                  Create a Proposal
                </CtaButton>
              </Box>
            ) : null}
          </>
        ) : null}
      </Section>
    </Box>
  );
};

export default InquiryDetail;
