import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Section from '../Section';
import CtaButton from '../CtaButton';
import { colors } from '../../theme/colors';

const FinalCta = () => {
  return (
    <Section>
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography
          variant="h3"
          component="h2"
          sx={{
            color: colors.text,
            fontWeight: 700,
            fontSize: { xs: '32px', sm: '42px' },
            mb: 2,
          }}
        >
          Ready to start your website?
        </Typography>
        <Typography sx={{ color: colors.muted, maxWidth: 640, mx: 'auto', mb: 3 }}>
          Tell me about your business, goals, and timeline. I&apos;ll review the details and prepare
          a personalized proposal.
        </Typography>
        <Stack
          direction="column"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <CtaButton to="/start">Start a Project</CtaButton>
          <CtaButton secondary to="/contact">Have a question? Contact Me</CtaButton>
        </Stack>
      </Box>
    </Section>
  );
};

export default FinalCta;
