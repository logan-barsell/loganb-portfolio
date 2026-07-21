import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import Section from '../Section';
import CtaButton from '../CtaButton';
import { services } from '../../data/services';
import { colors } from '../../theme/colors';

const ServicesOverview = () => {
  return (
    <Section title="Services">
      <Typography sx={{ color: colors.muted, mb: 3, maxWidth: 720 }}>
        Everything you need to get online—or improve what you already have—under one roof.
      </Typography>
      <Grid container columnSpacing={3} rowSpacing={3}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} key={service.id}>
            <Box
              component={RouterLink}
              to="/services"
              sx={{
                display: 'block',
                textDecoration: 'none',
                p: 3,
                backgroundColor: colors.cardBg,
                borderLeft: `3px solid ${colors.green}`,
                transition: 'opacity 200ms ease',
                '&:hover': { opacity: 0.85 },
              }}
            >
              <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600, mb: 1 }}>
                {service.title}
              </Typography>
              <Typography sx={{ color: colors.muted }}>{service.short}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
        <CtaButton to="/services">Explore Services</CtaButton>
      </Box>
    </Section>
  );
};

export default ServicesOverview;
