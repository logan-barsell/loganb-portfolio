import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CtaButton from '../components/CtaButton';
import Section from '../components/Section';
import SeoNoIndex from '../components/SeoNoIndex';
import { fieldSx } from '../components/forms/formStyles';
import { requestPasswordReset } from '../api/clientAuth';
import { useToast } from '../toast/ToastProvider';
import { colors } from '../theme/colors';

const dialogPaperSx = {
  backgroundColor: colors.navSolid,
  border: `1px solid ${colors.purple}`,
  color: colors.text,
};

const ClientForgotPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setComplete(true);
    } catch (error) {
      toast.error(error.message || 'Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Box sx={{ maxWidth: 440, mx: 'auto', py: { xs: 4, sm: 6 } }}>
        <SeoNoIndex title="Forgot Password | Logan Barsell" />
        <Section
          title="Forgot Password"
          lead="Enter your email and I’ll send password reset instructions if a client account exists."
        >
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                required
                fullWidth
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                sx={fieldSx}
              />
              <CtaButton type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Reset Link'}
              </CtaButton>
              <CtaButton to="/client/login" secondary>
                Back to Client Login
              </CtaButton>
            </Stack>
          </Box>
        </Section>
      </Box>

      <Dialog
        open={complete}
        onClose={() => navigate('/client/login')}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle>Check Your Email</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.text }}>
            If an account exists for that email, a password reset link will arrive shortly.
          </Typography>
        </DialogContent>
        <DialogActions>
          <CtaButton onClick={() => navigate('/client/login')}>Back to Client Login</CtaButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClientForgotPassword;
