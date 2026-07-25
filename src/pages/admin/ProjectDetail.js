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
import { fetchProject } from '../../api/adminClient';
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

function DetailBlock({ title, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{ color: colors.green, fontSize: { xs: '1.05rem', sm: '1.25rem' }, mb: 1.5 }}
      >
        {title}
      </Typography>
      <Divider sx={{ borderColor: 'rgba(149, 99, 187, 0.35)', mb: 2 }} />
      {children}
    </Box>
  );
}

const ProjectDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchProject(id);
        if (!cancelled) setProject(data.project);
      } catch (err) {
        if (!cancelled) {
          setProject(null);
          toast.error(err.message || 'Failed to load project.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  return (
    <Box sx={{ pb: 4 }}>
      <Section
        title="Project Detail"
        lead={
          <Button
            component={RouterLink}
            to="/admin/projects"
            sx={{ color: colors.muted, textTransform: 'none', px: 0 }}
          >
            ← Back to Projects
          </Button>
        }
      >
        {loading ? <Typography sx={{ color: colors.muted }}>Loading…</Typography> : null}

        {!loading && !project ? (
          <Typography sx={{ color: colors.muted }}>Project not found.</Typography>
        ) : null}

        {project ? (
          <>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3, flexWrap: 'wrap', gap: 1.5 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                {project.inquiry ? (
                  <Chip
                    label={inquiryTypeChipLabel(
                      project.inquiry.type,
                      project.inquiry.packageLabel,
                      project.inquiry.packageSlug
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
                {project.inquiry?.stage || project.inquiry?.stageLabel ? (
                  <Chip
                    label={resolveStageLabel(project.inquiry.stage, project.inquiry.stageLabel)}
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
                Created {formatDate(project.createdAt)}
              </Typography>
            </Stack>

            <DetailBlock title="Client">
              {project.client ? (
                <>
                  <Field label="Name" value={project.client.name} />
                  <Field label="Business Name" value={project.client.businessName} />
                  <Field label="Email" value={project.client.email} />
                  <Field label="Phone" value={project.client.phone} />
                  <CtaButton to={`/admin/clients/${project.client.id}`} size="medium" secondary>
                    View Client
                  </CtaButton>
                </>
              ) : (
                <Typography sx={{ color: colors.muted }}>No linked client.</Typography>
              )}
            </DetailBlock>

            <DetailBlock title="Project Overview">
              <Field label="Package" value={project.inquiry?.packageLabel} />
              <Field label="Summary" value={project.proposal?.summary} />
              <Field label="Design Price" value={project.proposal?.designAmountLabel} />
              <Field label="Hosting Monthly" value={project.proposal?.hostingMonthlyLabel} />
              <Field label="Created" value={formatDate(project.createdAt)} />

              <Stack direction="column" spacing={1.5} sx={{ mt: 1, alignItems: 'flex-start' }}>
                {project.inquiry?.id ? (
                  <CtaButton
                    to={`/admin/inquiries/${project.inquiry.id}`}
                    size="medium"
                    secondary
                  >
                    View Inquiry
                  </CtaButton>
                ) : null}
                {project.proposal?.id ? (
                  <CtaButton
                    to={`/admin/proposals/${project.proposal.id}`}
                    size="medium"
                    secondary
                  >
                    View Proposal
                  </CtaButton>
                ) : null}
              </Stack>
            </DetailBlock>

            <DetailBlock title="Attachments">
              <InquiryAttachments
                inquiryId={project.inquiryId || project.inquiry?.id}
                attachments={project.attachments}
              />
            </DetailBlock>
          </>
        ) : null}
      </Section>
    </Box>
  );
};

export default ProjectDetail;
