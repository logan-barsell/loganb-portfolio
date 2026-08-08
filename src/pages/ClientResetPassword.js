import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CtaButton from '../components/CtaButton';
import Section from '../components/Section';
import SeoNoIndex from '../components/SeoNoIndex';
import { fieldSx } from '../components/forms/formStyles';
import { resetPassword, validatePasswordReset } from '../api/clientAuth';
import { useToast } from '../toast/ToastProvider';
import { usePortalNav } from '../auth/PortalNavProvider';
import { colors } from '../theme/colors';

const ClientResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh } = usePortalNav();
  const [mode, setMode] = useState('loading');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    validatePasswordReset(token)
      .then(() => {
        if (!cancelled) setMode('form');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'This password reset link is invalid or has expired.');
        setMode('error');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await resetPassword(token, password, confirmPassword);
      await refresh();
      navigate('/client/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      toast.error(err.message || 'Could not reset your password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'loading') return null;

  if (mode === 'error') {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', py: { xs: 4, sm: 6 } }}>
        <SeoNoIndex title="Reset Password | Logan Barsell" />
        <Section title="Reset Password">
          <Stack spacing={2.5}>
            <Typography sx={{ color: colors.text }}>{error}</Typography>
            <CtaButton to="/client/forgot-password">Request a New Link</CtaButton>
          </Stack>
        </Section>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto', py: { xs: 4, sm: 6 } }}>
      <SeoNoIndex title="Reset Password | Logan Barsell" />
      <Section title="Reset Password" lead="Choose a new password for your client account.">
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="New Password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              fullWidth
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              helperText="10–256 characters."
              sx={fieldSx}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              fullWidth
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              sx={fieldSx}
            />
            <CtaButton type="submit" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset Password'}
            </CtaButton>
          </Stack>
        </Box>
      </Section>
    </Box>
  );
};

export default ClientResetPassword;
