import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Section from '../components/Section';
import CtaButton from '../components/CtaButton';
import FormStatus from '../components/forms/FormStatus';
import SeoNoIndex from '../components/SeoNoIndex';
import { fieldSx } from '../components/forms/formStyles';
import { useAuth } from '../auth/AuthProvider';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/admin/inquiries';

  if (!loading && isAuthenticated) {
    return <Navigate to={from.startsWith('/admin') ? from : '/admin/inquiries'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(from.startsWith('/admin') ? from : '/admin/inquiries', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: { xs: '55vh', sm: '65vh' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SeoNoIndex title="Admin Login | Logan Barsell" />
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Section title="Admin Login">
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                name="email"
                autoComplete="username"
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={fieldSx}
              />
              <TextField
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={fieldSx}
              />
              {error ? <FormStatus status="error" message={error} /> : null}
              <CtaButton
                type="submit"
                disabled={submitting || loading}
                sx={{ alignSelf: 'flex-start' }}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </CtaButton>
            </Stack>
          </Box>
        </Section>
      </Box>
    </Box>
  );
};

export default Login;
