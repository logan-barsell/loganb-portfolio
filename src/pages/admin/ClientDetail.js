import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Section from '../../components/Section';
import LinkedRecordCard from '../../components/admin/LinkedRecordCard';
import AdminInvoicesSection from '../../components/admin/AdminInvoicesSection';
import { fetchClient } from '../../api/adminClient';
import { inquiryTypeChipLabel, resolveStageLabel } from '../../data/adminNav';
import {
  inquiryTypeChipSx,
  pipelineStageChipSx,
  projectStatusChipSx,
  proposalStatusChipSx,
} from '../../data/statusChips';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

function formatSubmitted(iso) {
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

function DetailSection({ title, children }) {
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

const ClientDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchClient(id);
        if (!cancelled) setClient(data.client);
      } catch (err) {
        if (!cancelled) {
          setClient(null);
          toast.error(err.message || 'Failed to load client.');
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
        title="Client Detail"
        lead={
          <Button
            component={RouterLink}
            to="/admin/clients"
            sx={{ color: colors.muted, textTransform: 'none', px: 0 }}
          >
            ← Back to Clients
          </Button>
        }
      >
        {loading ? <Typography sx={{ color: colors.muted }}>Loading…</Typography> : null}

        {client ? (
          <>
            <DetailSection title="Client Details">
              <Field label="Name" value={client.name} />
              <Field label="Business Name" value={client.businessName} />
              <Field label="Email" value={client.email} />
              <Field label="Phone" value={client.phone} />
            </DetailSection>

            <DetailSection title="Inquiries">
              {(client.inquiries || []).length === 0 ? (
                <Typography sx={{ color: colors.muted }}>No linked inquiries.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {client.inquiries.map((inquiry) => (
                    <LinkedRecordCard
                      key={inquiry.id}
                      chips={[
                        {
                          label: inquiryTypeChipLabel(
                            inquiry.type,
                            inquiry.packageLabel,
                            inquiry.packageSlug
                          ),
                          sx: inquiryTypeChipSx(inquiry.type),
                        },
                        {
                          label: resolveStageLabel(inquiry.stage, inquiry.stageLabel),
                          sx: pipelineStageChipSx(inquiry.stage),
                        },
                      ]}
                      dateLabel={formatSubmitted(inquiry.createdAt)}
                      viewTo={`/admin/inquiries/${inquiry.id}`}
                      viewLabel="View Inquiry"
                    />
                  ))}
                </Stack>
              )}
            </DetailSection>

            <DetailSection title="Proposals">
              {(client.proposals || []).length === 0 ? (
                <Typography sx={{ color: colors.muted }}>No proposals yet.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {client.proposals.map((proposal) => (
                    <LinkedRecordCard
                      key={proposal.id}
                      chips={[
                        {
                          label: proposal.statusLabel,
                          sx: proposalStatusChipSx(proposal.status),
                        },
                      ]}
                      dateLabel={formatSubmitted(proposal.sentAt || proposal.createdAt)}
                      viewTo={`/admin/proposals/${proposal.id}`}
                      viewLabel="View Proposal"
                    />
                  ))}
                </Stack>
              )}
            </DetailSection>

            <DetailSection title="Projects">
              {(client.projects || []).length === 0 ? (
                <Typography sx={{ color: colors.muted }}>
                  Accepted proposals will create projects shown here.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {client.projects.map((project) => (
                    <LinkedRecordCard
                      key={project.id}
                      chips={[
                        {
                          label: project.statusLabel || project.status,
                          sx: projectStatusChipSx(project.status),
                        },
                      ]}
                      dateLabel={`Created ${formatSubmitted(project.createdAt)}`}
                      viewTo={`/admin/projects/${project.id}`}
                      viewLabel="View Project"
                    />
                  ))}
                </Stack>
              )}
            </DetailSection>

            <DetailSection title="Invoices">
              <AdminInvoicesSection variant="client" clientId={client.id} pageSize={10} />
            </DetailSection>
          </>
        ) : null}
      </Section>
    </Box>
  );
};

export default ClientDetail;
