import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Section from '../components/Section';
import CtaButton from '../components/CtaButton';
import FormStatus from '../components/forms/FormStatus';
import { fieldSx } from '../components/forms/formStyles';
import { postJson } from '../api/client';
import { colors } from '../theme/colors';

const initialValues = {
  name: '',
  email: '',
  message: '',
  companyWebsite: '',
};

const Contact = () => {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setStatus(null);
    setStatusMessage('');
    setFieldErrors({});

    try {
      const result = await postJson('/api/inquiries/contact', values);
      setStatus('success');
      setStatusMessage(result.message || 'Thanks — your message was received.');
      setValues(initialValues);
    } catch (error) {
      if (error.details && typeof error.details === 'object') {
        setFieldErrors(error.details);
      }
      setStatus('error');
      setStatusMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Section title="Contact">
        <Typography sx={{ color: colors.muted, mb: 2, maxWidth: 720 }}>
          Use this page for general questions, existing client support, partnerships, or networking
          inquiries.
        </Typography>
        <Typography sx={{ color: colors.muted, mb: 4, maxWidth: 720 }}>
          Ready to build a website?{' '}
          <Link component={RouterLink} to="/start" sx={{ color: colors.green }}>
            Start a Project
          </Link>{' '}
          instead—that intake is built for new website work.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 560 }}>
          <Stack spacing={2}>
            <TextField
              label="Name"
              name="name"
              value={values.name}
              onChange={updateField('name')}
              required
              fullWidth
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              sx={fieldSx}
              disabled={submitting}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={updateField('email')}
              required
              fullWidth
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              sx={fieldSx}
              disabled={submitting}
            />
            <TextField
              label="Message"
              name="message"
              value={values.message}
              onChange={updateField('message')}
              required
              fullWidth
              multiline
              minRows={4}
              error={Boolean(fieldErrors.message)}
              helperText={fieldErrors.message}
              sx={fieldSx}
              disabled={submitting}
            />
            <Box
              aria-hidden="true"
              sx={{ position: 'absolute', left: '-10000px', height: 0, overflow: 'hidden' }}
            >
              <TextField
                label="Company website"
                name="companyWebsite"
                tabIndex={-1}
                autoComplete="off"
                value={values.companyWebsite}
                onChange={updateField('companyWebsite')}
              />
            </Box>
            <FormStatus status={status} message={statusMessage} />
            <Typography variant="body2" sx={{ color: colors.muted }}>
              By submitting, you agree to the storage of your inquiry details as described in the{' '}
              <Link component={RouterLink} to="/privacy" sx={{ color: colors.green }}>
                Privacy
              </Link>{' '}
              page.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CtaButton type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Message'}
              </CtaButton>
            </Box>
            <Typography variant="body2" sx={{ color: colors.muted, textAlign: 'center' }}>
              Or email directly:{' '}
              <a href="mailto:contact@loganbarsell.com" style={{ color: colors.green }}>
                contact@loganbarsell.com
              </a>
            </Typography>
          </Stack>
        </Box>
      </Section>
    </Box>
  );
};

export default Contact;
