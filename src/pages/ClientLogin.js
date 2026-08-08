import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import CtaButton from '../components/CtaButton';
import Section from '../components/Section';
import SeoNoIndex from '../components/SeoNoIndex';
import { fieldSx } from '../components/forms/formStyles';
import { usePortalNav } from '../auth/PortalNavProvider';
import { useToast } from '../toast/ToastProvider';

function destinationForProjects(projects) {
  return projects.length === 1 ? `/project/${projects[0].id}` : '/client/projects';
}

const ClientLogin = () => {
  const { isAuthenticated, loading, projects, login } = usePortalNav();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.passwordReset) {
      toast.success('Password reset successfully. You can now sign in.');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, toast]);

  if (!loading && isAuthenticated) {
    return <Navigate to={destinationForProjects(projects)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      navigate(destinationForProjects(data.projects || []), { replace: true });
    } catch (error) {
      toast.error(
        error.message ||
          'Invalid email or password. If you have not set a password yet, use the setup link from your email.'
      );
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
      <SeoNoIndex title="Client Login | Logan Barsell" />
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Section title="Client Login">
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
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
                sx={fieldSx}
              />
              <CtaButton type="submit" disabled={submitting || loading}>
                {submitting ? 'Signing In…' : 'Sign In'}
              </CtaButton>
              <CtaButton
                to="/client/forgot-password"
                secondary
                size="medium"
                sx={{ alignSelf: 'center' }}
              >
                Forgot Password?
              </CtaButton>
            </Stack>
          </Box>
        </Section>
      </Box>
    </Box>
  );
};

export default ClientLogin;
