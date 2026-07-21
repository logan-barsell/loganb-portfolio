import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Section from '../components/Section';
import Headshot from '../components/Aboutme/Headshot';
import SkillsSnippet from '../components/About/SkillsSnippet';
import ExperienceTabs from '../components/About/ExperienceTabs';
import InterestedCta from '../components/InterestedCta';
import { colors } from '../theme/colors';

const About = () => {
  return (
    <Box sx={{ pb: 6 }}>
      <Section title="About Logan">
        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <Headshot />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ color: colors.text, mb: 2, fontWeight: 600 }}>
              I&apos;m just your friendly neighborhood Computer-Man.
            </Typography>
            <Typography sx={{ color: colors.muted, mb: 2 }}>
              My interest in coding and software development began in 2017 when I traveled to
              Amsterdam to study at{' '}
              <Link
                href="https://www.coursereport.com/schools/new-york-code-design-academy"
                target="_blank"
                rel="noopener noreferrer"
                color={colors.green}
              >
                New York Code &amp; Design Academy
              </Link>
              . That is where I knew the life of a developer was for me.
            </Typography>
            <Typography sx={{ color: colors.muted, mb: 2 }}>
              Today I run Logan Barsell Web Services—helping small businesses get online with clear
              pricing, custom design, and reliable hosting. I also build full-stack products and
              have shipped software for teams like Envoy and CoreCare.
            </Typography>
            <Typography sx={{ color: colors.muted }}>
              Whether you need a first website, a redesign, or ongoing support, you work directly
              with me from kickoff through launch.
            </Typography>
          </Grid>
        </Grid>
      </Section>

      <Section title="My Approach">
        <Typography sx={{ color: colors.muted, maxWidth: 720, mb: 2 }}>
          Keep the process simple: understand your business, propose a clear scope, design and build
          with feedback along the way, then launch and support. No agency layers—just one point of
          contact focused on getting your site live and working.
        </Typography>
        <Typography sx={{ color: colors.muted, maxWidth: 720 }}>
          I prioritize mobile-friendly layouts, fast load times, clear calls to action, and branding
          that feels like your business—not a generic template.
        </Typography>
      </Section>

      <Section title="Skills & Technologies">
        <SkillsSnippet />
      </Section>

      <Section title="Work history">
        <ExperienceTabs />
      </Section>

      <Section title="Working style">
        <Typography sx={{ color: colors.muted, maxWidth: 720, mb: 1 }}>
          Direct communication, transparent pricing, and practical recommendations. I would rather
          ship something useful on time than overcomplicate the stack.
        </Typography>
        <InterestedCta />
      </Section>
    </Box>
  );
};

export default About;
