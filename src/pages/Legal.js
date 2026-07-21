import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Section from '../components/Section';
import { colors } from '../theme/colors';

const PlaceholderLegal = ({ title }) => {
  return (
    <Box sx={{ pb: 8 }}>
      <Section title={title}>
        <Typography sx={{ color: colors.muted, maxWidth: 720 }}>
          This page is a placeholder. Full {title.toLowerCase()} content will be published here
          soon. For questions, email{' '}
          <a href="mailto:contact@loganbarsell.com" style={{ color: colors.green }}>
            contact@loganbarsell.com
          </a>
          .
        </Typography>
      </Section>
    </Box>
  );
};

export const Privacy = () => <PlaceholderLegal title="Privacy" />;
export const Terms = () => <PlaceholderLegal title="Terms" />;
