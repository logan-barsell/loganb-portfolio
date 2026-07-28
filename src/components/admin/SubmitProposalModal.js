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

function defaultSubject(proposal) {
  const who =
    proposal?.client?.businessName || proposal?.client?.name || proposal?.inquiry?.businessName;
  return who ? `Website proposal for ${who}` : 'Website proposal';
}

function defaultMessage() {
  return `Thank you for sharing your project details. I put together a proposal for you to review. Use the button in this email to open it — you can accept, request a revision, or decline from that page.\n\nLooking forward to hearing from you.`;
}

const SubmitProposalModal = ({ open, onClose, proposal, onSent }) => {
  const toast = useToast();
  const isResend = proposal?.status && proposal.status !== 'draft';
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
    setSubject(defaultSubject(proposal));
    setMessage(defaultMessage());
    setFieldErrors({});
  }, [open, proposal]);

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
      toast.success(isResend ? 'Proposal resent.' : 'Proposal sent.');
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
        {isResend ? 'Resend Proposal' : 'Submit Proposal'}
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
          Review the email details, then send a secure link for the client to view the proposal.
          Links expire after 14 days.
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
              {sending ? 'Sending…' : isResend ? 'Resend Proposal' : 'Send Proposal'}
            </CtaButton>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitProposalModal;
