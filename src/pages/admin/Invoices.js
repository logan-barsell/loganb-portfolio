import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Section from '../../components/Section';
import { colors } from '../../theme/colors';

const Invoices = () => (
  <Box sx={{ pb: 4 }}>
    <Section title="Invoices">
      <Typography sx={{ color: colors.muted, maxWidth: 720 }}>
        Invoicing and billing workflows will live here in a later phase. This page is a protected
        placeholder only.
      </Typography>
    </Section>
  </Box>
);

export default Invoices;
