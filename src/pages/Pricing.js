import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Section from '../components/Section';
import CtaButton from '../components/CtaButton';
import InterestedCta from '../components/InterestedCta';
import {
  sitePackages,
  hostingPlans,
  pricingFaqs,
  paymentScheduleNote,
} from '../data/pricing';
import { colors } from '../theme/colors';

const Pricing = () => {
  return (
    <Box sx={{ pb: 6 }}>
      <Section title="Pricing">
        <Typography sx={{ color: colors.muted, mb: 4, maxWidth: 720 }}>
          Transparent starting prices. Every project receives a personalized scope and final
          proposal.
        </Typography>
        <Grid container spacing={3}>
          {sitePackages.map((pkg) => (
            <Grid item xs={12} md={4} key={pkg.id}>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: colors.cardBg,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600 }}>
                  {pkg.name}
                </Typography>
                <Typography
                  className="altFont"
                  sx={{ color: colors.green, fontSize: '1.8rem', fontWeight: 600, my: 1.5 }}
                >
                  {pkg.price}+
                </Typography>
                <Typography sx={{ color: colors.muted, mb: 2 }}>{pkg.description}</Typography>
                <Box component="ul" sx={{ color: colors.muted, pl: 3, mb: 1 }}>
                  {pkg.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.muted,
                    mt: 'auto',
                    pt: 1.5,
                  }}
                >
                  {pkg.helperText}
                </Typography>
                <CtaButton to={`/start?package=${pkg.id}`} sx={{ mt: 2, alignSelf: 'flex-start' }}>
                  Start with {pkg.name}
                </CtaButton>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section title="Hosting Options">
        <Grid container spacing={3}>
          {hostingPlans.map((plan) => (
            <Grid item xs={12} sm={6} key={plan.id}>
              <Box sx={{ p: 3, backgroundColor: colors.cardBg, height: '100%' }}>
                <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600 }}>
                  {plan.name}
                </Typography>
                <Typography className="altFont" sx={{ color: colors.green, my: 1, fontWeight: 600 }}>
                  {plan.price.includes('/month')
                    ? plan.price.replace('/month', '+/month')
                    : plan.price}
                </Typography>
                <Typography sx={{ color: colors.muted }}>{plan.description}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section title="Custom Projects">
        <Typography sx={{ color: colors.muted, mb: 3, maxWidth: 720 }}>
          Need something outside these packages? Share your goals and I&apos;ll prepare a custom
          estimate. {paymentScheduleNote}
        </Typography>
        <CtaButton to="/start?package=custom">Start with Custom Site</CtaButton>
      </Section>

      <Section title="FAQ">
        {pricingFaqs.map((faq) => (
          <Accordion
            key={faq.question}
            disableGutters
            sx={{
              backgroundColor: colors.cardBg,
              color: colors.muted,
              mb: 1,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.green }} />}>
              <Typography sx={{ color: colors.text, fontWeight: 600 }}>{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
        <InterestedCta />
      </Section>
    </Box>
  );
};

export default Pricing;
