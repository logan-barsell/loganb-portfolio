import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Section from '../components/Section';
import CtaButton from '../components/CtaButton';
import { services } from '../data/services';
import { colors } from '../theme/colors';

const Services = () => {
  return (
    <Box sx={{ pb: 6 }}>
      <Section title="Services">
        <Typography sx={{ color: colors.muted, mb: 4, maxWidth: 720 }}>
          Clear offerings for small businesses—whether you need a new site, a redesign, hosting, or
          custom features.
        </Typography>
        <Grid container spacing={4}>
          {services.map((service) => (
            <Grid item xs={12} key={service.id}>
              <Box
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  backgroundColor: colors.cardBg,
                  borderLeft: `3px solid ${colors.green}`,
                }}
              >
                <Typography variant="h5" sx={{ color: colors.text, fontWeight: 600, mb: 1 }}>
                  {service.title}
                </Typography>
                <Typography className="altFont" sx={{ color: colors.green, mb: 2 }}>
                  Starting at {service.startingPrice}
                </Typography>
                <Typography sx={{ color: colors.muted, mb: 2 }}>
                  <strong style={{ color: colors.text }}>Who it is for:</strong> {service.whoFor}
                </Typography>
                <Typography sx={{ color: colors.text, fontWeight: 600, mb: 1 }}>
                  What is included
                </Typography>
                <Box component="ul" sx={{ color: colors.muted, mt: 0, mb: 2, pl: 3 }}>
                  {service.included.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </Box>
                <Typography sx={{ color: colors.muted, mb: 3 }}>
                  <strong style={{ color: colors.text }}>Typical outcome:</strong>{' '}
                  {service.outcome}
                </Typography>
                <CtaButton to={`/start?package=${service.packageSlug}`}>
                  Start a Project
                </CtaButton>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>
    </Box>
  );
};

export default Services;
