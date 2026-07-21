import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Section from '../components/Section';
import { colors } from '../theme/colors';

const paragraphSx = { color: colors.muted, maxWidth: 720 };

export const Privacy = () => {
  return (
    <Box sx={{ pb: 8 }}>
      <Section title="Privacy">
        <Stack spacing={2}>
          <Typography sx={paragraphSx}>
            This page explains how Logan Barsell Web Services handles information submitted through
            the Contact and Start a Project forms on loganbarsell.com.
          </Typography>

          <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600 }}>
            What is collected
          </Typography>
          <Typography sx={paragraphSx}>
            Contact submissions may include your name, email address, and message. Project intake
            submissions may also include phone number, business name, selected package or service,
            website goals, current website, requested features, inspiration links, domain details,
            branding notes, content readiness, timeline, budget, and any files you choose to upload
            (such as logos, photos, or documents).
          </Typography>

          <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600 }}>
            How it is used
          </Typography>
          <Typography sx={paragraphSx}>
            Submitted information is used only to respond to your inquiry, prepare proposals, and
            deliver related services. It is not sold or shared for marketing lists.
          </Typography>

          <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600 }}>
            Storage and email delivery
          </Typography>
          <Typography sx={paragraphSx}>
            Inquiries are stored in a private database on the hosting server used for this website.
            Uploaded files are stored privately on the same server and are not publicly accessible.
            Email notifications about new inquiries are sent through Resend to{' '}
            <a href="mailto:contact@loganbarsell.com" style={{ color: colors.green }}>
              contact@loganbarsell.com
            </a>
            . The visitor&apos;s email address is used as the reply-to address so responses can go
            directly back to you.
          </Typography>

          <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600 }}>
            Access and retention
          </Typography>
          <Typography sx={paragraphSx}>
            Inquiry data is accessible to Logan Barsell for business follow-up. Records and files
            are kept as long as needed to handle the inquiry and related work, then may be removed
            during routine cleanup.
          </Typography>

          <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600 }}>
            Deletion requests
          </Typography>
          <Typography sx={paragraphSx}>
            To request deletion of an inquiry or uploaded files, email{' '}
            <a href="mailto:contact@loganbarsell.com" style={{ color: colors.green }}>
              contact@loganbarsell.com
            </a>{' '}
            with enough detail to locate the submission.
          </Typography>
        </Stack>
      </Section>
    </Box>
  );
};

export const Terms = () => {
  return (
    <Box sx={{ pb: 8 }}>
      <Section title="Terms">
        <Typography sx={paragraphSx}>
          This page is a placeholder. Full terms content will be published here soon. For questions,
          email{' '}
          <a href="mailto:contact@loganbarsell.com" style={{ color: colors.green }}>
            contact@loganbarsell.com
          </a>
          .
        </Typography>
      </Section>
    </Box>
  );
};
