import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Section from '../../components/Section';
import { fetchClient } from '../../api/adminClient';
import { inquiryTypeChipLabel, resolveStageLabel } from '../../data/adminNav';
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

function PlaceholderSection({ title, message }) {
  return (
    <DetailSection title={title}>
      <Typography sx={{ color: colors.muted }}>{message}</Typography>
    </DetailSection>
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
                    <Box
                      key={inquiry.id}
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 1,
                        border: `1px solid rgba(149, 99, 187, 0.35)`,
                        backgroundColor: colors.cardBg,
                      }}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 0.75, flexWrap: 'wrap' }}>
                          <Chip
                            label={inquiryTypeChipLabel(
                              inquiry.type,
                              inquiry.packageLabel,
                              inquiry.packageSlug
                            )}
                            size="small"
                            sx={{
                              color: colors.purple,
                              border: `1px solid ${colors.purple}`,
                              backgroundColor: 'rgba(149, 99, 187, 0.12)',
                              fontWeight: 600,
                            }}
                          />
                          <Chip
                            label={resolveStageLabel(inquiry.stage, inquiry.stageLabel)}
                            size="small"
                            sx={{
                              color: colors.green,
                              border: `1px solid ${colors.green}`,
                              backgroundColor: colors.greenSoft,
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                        <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                          {formatSubmitted(inquiry.createdAt)}
                        </Typography>
                      </Box>
                      <Button
                        component={RouterLink}
                        to={`/admin/inquiries/${inquiry.id}`}
                        sx={{ color: colors.green, textTransform: 'none' }}
                      >
                        View Inquiry
                      </Button>
                    </Box>
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
                    <Box
                      key={proposal.id}
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 1,
                        border: `1px solid rgba(149, 99, 187, 0.35)`,
                        backgroundColor: colors.cardBg,
                      }}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 0.75, flexWrap: 'wrap' }}>
                          <Chip
                            label={proposal.statusLabel}
                            size="small"
                            sx={{
                              color:
                                proposal.status === 'sent' ? colors.green : colors.purple,
                              border: `1px solid ${
                                proposal.status === 'sent' ? colors.green : colors.purple
                              }`,
                              backgroundColor:
                                proposal.status === 'sent'
                                  ? colors.greenSoft
                                  : 'rgba(149, 99, 187, 0.12)',
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                        <Typography sx={{ color: colors.text, fontSize: 14 }}>
                          {proposal.designAmountLabel || '—'}
                        </Typography>
                        <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                          {formatSubmitted(proposal.sentAt || proposal.createdAt)}
                        </Typography>
                      </Box>
                      <Button
                        component={RouterLink}
                        to={`/admin/proposals/${proposal.id}`}
                        sx={{ color: colors.green, textTransform: 'none' }}
                      >
                        View Proposal
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}
            </DetailSection>

            <PlaceholderSection
              title="Projects"
              message="Accepted proposals will create projects shown here later."
            />
            <PlaceholderSection
              title="Invoices"
              message="Billing records for this client will appear here later."
            />
          </>
        ) : null}
      </Section>
    </Box>
  );
};

export default ClientDetail;
