import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CtaButton from '../components/CtaButton';
import Section from '../components/Section';
import SeoNoIndex from '../components/SeoNoIndex';
import { fieldSx } from '../components/forms/formStyles';
import {
  acceptProposalShare,
  declineProposalShare,
  fetchProposalShare,
  reviseProposalShare,
} from '../api/adminClient';
import {
  resolveBudgetLabel,
  resolveContentReadinessLabel,
  resolveTimelineLabel,
} from '../data/intakeOptions';
import { useToast } from '../toast/ToastProvider';
import { colors } from '../theme/colors';

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Field({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        sx={{
          color: colors.muted,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function Block({ title, children }) {
  const content = React.Children.toArray(children).filter(Boolean);
  if (!content.length) return null;
  return (
    <Box sx={{ mb: 5 }}>
      <Typography
        variant="h5"
        sx={{
          color: colors.green,
          fontWeight: 600,
          mb: 1.5,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        }}
      >
        {title}
      </Typography>
      <Divider sx={{ borderColor: 'rgba(149, 99, 187, 0.35)', mb: 2.5 }} />
      {content}
    </Box>
  );
}

const dialogPaperSx = {
  backgroundColor: colors.navSolid,
  color: colors.text,
  border: `1px solid rgba(149, 99, 187, 0.5)`,
};

const ProposalShare = () => {
  const { token } = useParams();
  const toast = useToast();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [revisionText, setRevisionText] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProposalShare(token);
        if (!cancelled) setShare(data.share);
      } catch (err) {
        if (!cancelled) {
          setShare(null);
          setError(err.message || 'This proposal link is invalid or has expired.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const client = share?.client;
  const inquiry = share?.inquiry;
  const proposal = share?.proposal;
  const displayName = client?.businessName || client?.name || inquiry?.businessName || inquiry?.name;
  const greetName = (client?.name || inquiry?.name || '').trim().split(/\s+/)[0];
  const status = proposal?.status;
  const decided = status === 'accepted' || status === 'declined';
  const acceptDisabled = status === 'accepted' || submitting;
  const declineDisabled = status === 'declined' || submitting;

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setRevisionText('');
    setDeclineReason('');
  };

  const clearModal = () => {
    setModal(null);
    setRevisionText('');
    setDeclineReason('');
  };

  const applyShare = (nextShare) => {
    if (nextShare) setShare(nextShare);
  };

  const handleAccept = async () => {
    if (acceptDisabled) return;
    setSubmitting(true);
    try {
      const data = await acceptProposalShare(token);
      applyShare(data.share);
      toast.success(data.already ? 'Proposal already approved.' : 'Proposal approved.');
      clearModal();
    } catch (err) {
      toast.error(err.message || 'Unable to accept proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevise = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const message = revisionText.trim();
    if (!message) {
      toast.error('Please describe what you would like revised.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await reviseProposalShare(token, { message });
      applyShare(data.share);
      toast.success('Revision request sent.');
      clearModal();
    } catch (err) {
      toast.error(err.message || 'Unable to send revision request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (event) => {
    event.preventDefault();
    if (declineDisabled) return;
    setSubmitting(true);
    try {
      const data = await declineProposalShare(token, {
        reason: declineReason.trim() || undefined,
      });
      applyShare(data.share);
      toast.success(data.already ? 'Proposal already declined.' : 'Proposal declined.');
      clearModal();
    } catch (err) {
      toast.error(err.message || 'Unable to decline proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <SeoNoIndex title={displayName ? `Proposal — ${displayName}` : 'Proposal'} />
      <Section title="Your Proposal">
        {loading ? (
          <Typography sx={{ color: colors.muted }}>Loading your proposal…</Typography>
        ) : null}

        {!loading && error ? (
          <Typography sx={{ color: colors.muted, maxWidth: 560 }}>{error}</Typography>
        ) : null}

        {!loading && share ? (
          <>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
            >
              {proposal?.clientStatusLabel ? (
                <Chip
                  label={proposal.clientStatusLabel}
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

            <Typography sx={{ color: colors.muted, mb: 4, maxWidth: 640 }}>
              Hi{greetName ? ` ${greetName}` : ''}
              {displayName ? ` — here is the proposal for ${displayName}` : ''}. Review the details
              below, then choose how you would like to proceed.
            </Typography>

            <Block title="Your Project">
              <Field label="Name" value={inquiry?.name} />
              <Field label="Business" value={inquiry?.businessName || client?.businessName} />
              <Field label="Email" value={inquiry?.email || client?.email} />
              <Field label="Phone" value={inquiry?.phone} />
              <Field label="Package" value={inquiry?.packageLabel} />
              <Field label="Message" value={inquiry?.message} />
              <Field label="Website Goals" value={inquiry?.websiteGoals} />
              <Field label="Current Website" value={inquiry?.currentWebsite} />
              <Field label="Requested Features" value={inquiry?.requestedFeatures} />
              <Field label="Inspiration Links" value={inquiry?.inspirationLinks} />
              <Field label="Domain Info" value={inquiry?.domainInfo} />
              <Field label="Branding Notes" value={inquiry?.brandingNotes} />
              <Field
                label="Content Readiness"
                value={resolveContentReadinessLabel(inquiry?.contentReadiness)}
              />
              <Field label="Timeline" value={resolveTimelineLabel(inquiry?.timeline)} />
              <Field label="Budget" value={resolveBudgetLabel(inquiry?.budget)} />
              <Field label="Submitted" value={formatDate(inquiry?.createdAt)} />
            </Block>

            <Block title="Proposal">
              <Field label="Summary" value={proposal?.summary} />
              <Field label="Scope" value={proposal?.scope} />
              <Field label="Deliverables" value={proposal?.deliverables} />
              <Field label="Exclusions" value={proposal?.exclusions} />
              <Field label="Timeline" value={proposal?.timelineSummary} />
              <Field label="Revision Limit" value={proposal?.revisionLimit} />
              <Field label="Payment Terms" value={proposal?.paymentTerms} />
              <Field label="Design Price" value={proposal?.designAmountLabel} />
              <Field label="Hosting Monthly" value={proposal?.hostingMonthlyLabel} />
            </Block>

            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography
                sx={{
                  color: colors.muted,
                  textAlign: 'center',
                  mb: 2.5,
                  fontSize: 14,
                }}
              >
                {decided ? 'Change your mind?' : 'Ready to decide?'}
              </Typography>
              <Stack spacing={1.5} alignItems="center">
                <CtaButton
                  type="button"
                  size="large"
                  disabled={acceptDisabled}
                  onClick={() => setModal('accept')}
                >
                  Accept Proposal
                </CtaButton>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="center"
                  alignItems="center"
                >
                  <CtaButton
                    type="button"
                    size="large"
                    secondary
                    disabled={submitting}
                    onClick={() => setModal('revise')}
                  >
                    Request Revision
                  </CtaButton>
                  <CtaButton
                    type="button"
                    size="large"
                    secondary
                    disabled={declineDisabled}
                    onClick={() => setModal('decline')}
                    sx={{
                      color: '#e57373',
                      '&:hover': {
                        opacity: 1,
                        backgroundColor: 'rgba(229, 115, 115, 0.12)',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(229, 115, 115, 0.4)',
                      },
                    }}
                  >
                    Decline Proposal
                  </CtaButton>
                </Stack>
              </Stack>
            </Box>
          </>
        ) : null}
      </Section>

      <Dialog open={modal === 'accept'} onClose={closeModal} fullWidth maxWidth="xs" PaperProps={{ sx: dialogPaperSx }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          Accept Proposal
          <IconButton aria-label="Close" onClick={closeModal} disabled={submitting} sx={{ color: colors.muted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.muted, mb: 3 }}>
            Confirm you want to accept this proposal
            {displayName ? ` for ${displayName}` : ''}. I will email you next steps shortly.
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <CtaButton type="button" secondary disabled={submitting} onClick={closeModal}>
              Cancel
            </CtaButton>
            <CtaButton type="button" disabled={submitting} onClick={handleAccept}>
              {submitting ? 'Accepting…' : 'Accept Proposal'}
            </CtaButton>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'revise'} onClose={closeModal} fullWidth maxWidth="sm" PaperProps={{ sx: dialogPaperSx }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          Request Revision
          <IconButton aria-label="Close" onClick={closeModal} disabled={submitting} sx={{ color: colors.muted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.muted, mb: 2 }}>
            Tell me what you would like changed. I will review and follow up with an updated proposal.
          </Typography>
          <Stack component="form" spacing={2} onSubmit={handleRevise}>
            <TextField
              label="Revision notes"
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              required
              fullWidth
              multiline
              minRows={4}
              size="small"
              sx={fieldSx}
              disabled={submitting}
            />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <CtaButton type="button" secondary disabled={submitting} onClick={closeModal}>
                Cancel
              </CtaButton>
              <CtaButton type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Request'}
              </CtaButton>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'decline'} onClose={closeModal} fullWidth maxWidth="sm" PaperProps={{ sx: dialogPaperSx }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          Decline Proposal
          <IconButton aria-label="Close" onClick={closeModal} disabled={submitting} sx={{ color: colors.muted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.muted, mb: 2 }}>
            Confirm you want to decline this proposal
            {displayName ? ` for ${displayName}` : ''}. You can optionally share a reason.
          </Typography>
          <Stack component="form" spacing={2} onSubmit={handleDecline}>
            <TextField
              label="Reason (optional)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              size="small"
              sx={fieldSx}
              disabled={submitting}
            />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <CtaButton type="button" secondary disabled={submitting} onClick={closeModal}>
                Cancel
              </CtaButton>
              <CtaButton
                type="submit"
                disabled={submitting}
                sx={{
                  color: '#e57373',
                  borderColor: 'rgba(229, 115, 115, 0.65)',
                  '&:hover': {
                    borderColor: '#e57373',
                    backgroundColor: 'rgba(229, 115, 115, 0.12)',
                  },
                }}
              >
                {submitting ? 'Declining…' : 'Decline Proposal'}
              </CtaButton>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProposalShare;
