import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Section from '../../components/Section';
import { colors } from '../../theme/colors';

const Projects = () => (
  <Box sx={{ pb: 4 }}>
    <Section title="Projects">
      <Typography sx={{ color: colors.muted, maxWidth: 720 }}>
        Projects will appear here after a proposal is accepted. This section is a protected
        placeholder for now—no project records are created yet.
      </Typography>
    </Section>
  </Box>
);

export default Projects;
