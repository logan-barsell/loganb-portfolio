import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Section from '../Section';
import CtaButton from '../CtaButton';
import WorkGrid from '../Work/WorkGrid';
import { workItems } from '../../data/workItems';
import { colors } from '../../theme/colors';

const FeaturedWork = () => {
  return (
    <Section title="Featured Work">
      <Typography sx={{ color: colors.muted, mb: 1, maxWidth: 720 }}>
        Real projects for small businesses and products—framed around the problem, the build, and
        the result.
      </Typography>
      <WorkGrid items={workItems} perPage={2} />
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CtaButton to="/work">View All Work</CtaButton>
      </Box>
    </Section>
  );
};

export default FeaturedWork;
