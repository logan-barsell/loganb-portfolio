import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CtaButton from '../CtaButton';
import { fieldSx } from '../forms/formStyles';
import { sendProposal } from '../../api/adminClient';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

function engagementWho(proposal) {
  return (
    proposal?.inquiry?.businessName ||
    proposal?.client?.businessName ||
    proposal?.client?.name ||
    null
  );
}

function defaultSubject(proposal, isRevised) {
  const who = engagementWho(proposal);
  if (isRevised) {
    return who ? `Updated website proposal for ${who}` : 'Updated website proposal';
  }
  return who ? `Website proposal for ${who}` : 'Website proposal';
}

function defaultMessage(isRevised) {
  if (isRevised) {
    return `I updated your proposal based on our latest discussion. Use the button in this email to review the revised version — you can accept, request another revision, or decline from that page.\n\nLooking forward to hearing from you.`;
  }
  return `Thank you for sharing your project details. I put together a proposal for you to review. Use the button in this email to open it — you can accept, request a revision, or decline from that page.\n\nLooking forward to hearing from you.`;
}

const SubmitProposalModal = ({ open, onClose, proposal, onSent }) => {
  const toast = useToast();
  const isRevised = Boolean(proposal?.contentChangedSinceSend);
  const isResend = Boolean(proposal?.hasBeenSent) || (proposal?.status && proposal.status !== 'draft');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !proposal) return;
    setTo(proposal.client?.email || '');
    setCc('');
    setSubject(defaultSubject(proposal, isRevised));
    setMessage(defaultMessage(isRevised));
    setFieldErrors({});
  }, [open, proposal, isRevised]);

  const handleClose = () => {
    if (sending) return;
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!proposal?.id || sending) return;

    setSending(true);
    setFieldErrors({});
    try {
      const data = await sendProposal(proposal.id, {
        to: to.trim(),
        cc: cc.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      const revised = Boolean(data.revised);
      toast.success(
        revised ? 'Revised proposal sent.' : isResend ? 'Proposal resent.' : 'Proposal sent.'
      );
      onSent?.(data.proposal);
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Failed to send proposal.');
      if (err.details && typeof err.details === 'object') {
        setFieldErrors(err.details);
      }
    } finally {
      setSending(false);
    }
  };

  const title = isRevised ? 'Resend Revised Proposal' : isResend ? 'Resend Proposal' : 'Submit Proposal';
  const submitLabel = sending
    ? 'Sending…'
    : isRevised
      ? 'Resend Revised Proposal'
      : isResend
        ? 'Resend Proposal'
        : 'Send Proposal';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: colors.navSolid,
          color: colors.text,
          border: `1px solid rgba(149, 99, 187, 0.5)`,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: colors.text,
          pr: 1,
        }}
      >
        {title}
        <IconButton
          aria-label="Close"
          onClick={handleClose}
          disabled={sending}
          sx={{
            color: colors.muted,
            '&.Mui-disabled': {
              opacity: 1,
              color: colors.muted,
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: colors.muted, mb: 2.5, fontSize: 14 }}>
          {isRevised
            ? 'Content changed since the last send. This will email a revised proposal link. Links expire after 14 days.'
            : 'Review the email details, then send a secure link for the client to view the proposal. Links expire after 14 days.'}
        </Typography>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            fullWidth
            size="small"
            sx={fieldSx}
            error={Boolean(fieldErrors.to)}
            helperText={fieldErrors.to || ''}
            disabled={sending}
          />
          <TextField
            label="CC"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            fullWidth
            size="small"
            sx={fieldSx}
            error={Boolean(fieldErrors.cc)}
            helperText={fieldErrors.cc || 'Optional. Separate multiple emails with commas.'}
            disabled={sending}
          />
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            fullWidth
            size="small"
            sx={fieldSx}
            error={Boolean(fieldErrors.subject)}
            helperText={fieldErrors.subject || ''}
            disabled={sending}
          />
          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            fullWidth
            multiline
            minRows={5}
            size="small"
            sx={fieldSx}
            error={Boolean(fieldErrors.message)}
            helperText={fieldErrors.message || ''}
            disabled={sending}
          />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
            <CtaButton type="button" secondary disabled={sending} onClick={handleClose}>
              Cancel
            </CtaButton>
            <CtaButton type="submit" disabled={sending}>
              {submitLabel}
            </CtaButton>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitProposalModal;
