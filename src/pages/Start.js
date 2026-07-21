import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useSearchParams } from 'react-router-dom';
import Section from '../components/Section';
import CtaButton from '../components/CtaButton';
import { sitePackages, hostingPlans } from '../data/pricing';
import { colors } from '../theme/colors';

const packageLabels = {
  ...Object.fromEntries(sitePackages.map((pkg) => [pkg.id, pkg.name])),
  ...Object.fromEntries(hostingPlans.map((plan) => [plan.id, plan.name])),
  hosting: 'Managed Hosting',
  custom: 'Custom Site',
};

const Start = () => {
  const [params] = useSearchParams();
  const packageSlug = params.get('package');
  const selectedLabel = packageSlug ? packageLabels[packageSlug] : null;

  return (
    <Box sx={{ pb: 6 }}>
      <Section title="Start Your Website Project">
        <Typography sx={{ color: colors.muted, mb: 2, maxWidth: 720 }}>
          Share a few details about your business, goals, and content. You&apos;ll be able to upload
          logos, photos, and supporting files as part of the process.
        </Typography>
        {selectedLabel ? (
          <Typography className="altFont" sx={{ color: colors.green, mb: 3 }}>
            Selected package: {selectedLabel}
          </Typography>
        ) : null}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: colors.cardBg,
            maxWidth: 640,
            borderLeft: `3px solid ${colors.purple}`,
          }}
        >
          <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600, mb: 1 }}>
            Intake form coming soon
          </Typography>
          <Typography sx={{ color: colors.muted, mb: 3 }}>
            The branded project intake form is next. In the meantime, email a short overview of your
            business, goals, and timeline—and I&apos;ll follow up with next steps
            {selectedLabel ? ` for the ${selectedLabel} package` : ''}.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <CtaButton
              href={`mailto:contact@loganbarsell.com?subject=${encodeURIComponent(
                selectedLabel
                  ? `New project inquiry — ${selectedLabel}`
                  : 'New website project inquiry'
              )}`}
            >
              Email Project Details
            </CtaButton>
            <CtaButton secondary to="/pricing">Review Pricing</CtaButton>
          </Stack>
        </Box>
      </Section>
    </Box>
  );
};

export default Start;
