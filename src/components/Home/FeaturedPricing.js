import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Section from '../Section';
import CtaButton from '../CtaButton';
import { sitePackages } from '../../data/pricing';
import { colors } from '../../theme/colors';

const FeaturedPricing = () => {
  return (
    <Section title="Pricing">
      <Typography sx={{ color: colors.muted, mb: 3, maxWidth: 720 }}>
        Every project receives a personalized scope and final proposal.
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '48px',
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: '24px',
          }}
        >
          {sitePackages.map((pkg) => (
            <Box
              key={pkg.id}
              sx={{
                p: 3,
                backgroundColor: colors.cardBg,
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
                {pkg.price}+
              </Typography>
              <Typography sx={{ color: colors.muted }}>{pkg.description}</Typography>
            </Box>
          ))}
        </Box>
        <CtaButton to="/pricing">View Pricing</CtaButton>
      </Box>
    </Section>
  );
};

export default FeaturedPricing;
