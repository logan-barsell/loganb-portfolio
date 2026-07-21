import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Section from '../Section';
import CtaButton from '../CtaButton';
import { sitePackages } from '../../data/pricing';
import { colors } from '../../theme/colors';

const FeaturedPricing = () => {
  return (
    <Section title="Starting Prices">
      <Typography sx={{ color: colors.muted, mb: 3, maxWidth: 720 }}>
        Every project receives a personalized scope and final proposal.
      </Typography>
      <Grid container columnSpacing={3} rowSpacing={3} alignItems="stretch">
        {sitePackages.map((pkg) => (
          <Grid item xs={12} md={4} key={pkg.id}>
            <Box
              sx={{
                p: 3,
                backgroundColor: colors.cardBg,
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600 }}>
                {pkg.name}
              </Typography>
              <Typography
                className="altFont"
                sx={{ color: colors.green, fontSize: '1.6rem', fontWeight: 600, my: 1.5 }}
              >
                Starting at {pkg.price}
              </Typography>
              <Typography sx={{ color: colors.muted }}>{pkg.description}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
        <CtaButton to="/pricing">View Pricing</CtaButton>
      </Box>
    </Section>
  );
};

export default FeaturedPricing;
