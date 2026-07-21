import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Section from '../components/Section';
import CtaButton from '../components/CtaButton';
import { colors } from '../theme/colors';

const fieldSx = {
  '& .MuiInputBase-root': { color: colors.text },
  '& .MuiInputLabel-root': { color: colors.muted },
  '& .MuiInputLabel-root.Mui-focused': { color: colors.green },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.purple },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.green,
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.green,
  },
  '& .MuiOutlinedInput-input:-webkit-autofill': {
    WebkitBoxShadow: `0 0 0 1000px ${colors.bg} inset`,
    WebkitTextFillColor: colors.text,
    caretColor: colors.text,
    transition: 'background-color 99999s ease-in-out 0s',
  },
  '& .MuiOutlinedInput-input:-webkit-autofill:hover': {
    WebkitBoxShadow: `0 0 0 1000px ${colors.bg} inset`,
    WebkitTextFillColor: colors.text,
  },
  '& .MuiOutlinedInput-input:-webkit-autofill:focus': {
    WebkitBoxShadow: `0 0 0 1000px ${colors.bg} inset`,
    WebkitTextFillColor: colors.text,
  },
};

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const mailtoHref = `mailto:contact@loganbarsell.com?subject=${encodeURIComponent(
    `General inquiry from ${name || 'website visitor'}`
  )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;

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

        <Stack spacing={2} sx={{ maxWidth: 560 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            minRows={4}
            sx={fieldSx}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CtaButton href={mailtoHref}>Send Message</CtaButton>
          </Box>
          <Typography variant="body2" sx={{ color: colors.muted, textAlign: 'center' }}>
            Or email directly:{' '}
            <a href="mailto:contact@loganbarsell.com" style={{ color: colors.green }}>
              contact@loganbarsell.com
            </a>
          </Typography>
        </Stack>
      </Section>
    </Box>
  );
};

export default Contact;
