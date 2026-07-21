import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Section from '../Section';
import { colors } from '../../theme/colors';

const points = [
  'Custom design',
  'Mobile-friendly development',
  'Clear project pricing',
  'Managed launch and hosting',
  'One point of contact from start to finish',
];

const ValueProposition = () => {
  return (
    <Section title="A simpler way to get your business online">
      <Typography sx={{ color: colors.muted, mb: 3, maxWidth: 720 }}>
        Working with Logan Barsell Web Services means one person handles planning, design,
        development, launch, and support—so your site gets built without the agency runaround.
      </Typography>
      <Grid container spacing={2}>
        {points.map((point) => (
          <Grid item xs={12} sm={6} key={point}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <CheckCircleOutlineIcon sx={{ color: colors.green, mt: 0.3 }} />
              <Typography sx={{ color: colors.text, fontWeight: 500 }}>{point}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
};

export default ValueProposition;
