import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Section from '../Section';
import { processSteps } from '../../data/processSteps';
import { colors } from '../../theme/colors';

const ProcessSteps = () => {
  return (
    <Section title="How It Works">
      <Grid container spacing={3}>
        {processSteps.map((step) => (
          <Grid item xs={12} sm={6} key={step.step}>
            <Box sx={{ p: 2 }}>
              <Typography
                className="altFont"
                sx={{ color: colors.green, fontWeight: 700, fontSize: '1.2rem', mb: 1 }}
              >
                {String(step.step).padStart(2, '0')}
              </Typography>
              <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600, mb: 1 }}>
                {step.title}
              </Typography>
              <Typography sx={{ color: colors.muted }}>{step.description}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
};

export default ProcessSteps;
