import React from 'react';
import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CtaButton from '../components/CtaButton';
import Section from '../components/Section';
import SeoNoIndex from '../components/SeoNoIndex';
import { usePortalNav } from '../auth/PortalNavProvider';
import { pipelineStageChipSx } from '../data/statusChips';
import { colors } from '../theme/colors';

const ClientProjects = () => {
  const { isAuthenticated, loading, projects } = usePortalNav();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/client/login" replace />;
  if (projects.length === 1) {
    return <Navigate to={`/project/${projects[0].id}`} replace />;
  }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', py: { xs: 4, sm: 6 } }}>
      <SeoNoIndex title="Your Projects | Logan Barsell" />
      <Section
        title="Your Projects"
        lead="Choose the project you would like to view or manage."
      >
        {projects.length ? (
          <Stack spacing={2}>
            {projects.map((project) => (
              <Box
                key={project.id}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  border: '1px solid rgba(149, 99, 187, 0.35)',
                  borderRadius: 1,
                  backgroundColor: colors.cardBg,
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ color: colors.text, mb: 1 }}>
                    {project.businessName || project.name}
                  </Typography>
                  <Chip
                    label={project.statusLabel}
                    size="small"
                    sx={pipelineStageChipSx(`${project.status}_project`)}
                  />
                </Box>
                <CtaButton to={`/project/${project.id}`} size="medium">
                  View Project
                </CtaButton>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography sx={{ color: colors.muted }}>
            There are no projects available in your portal right now.
          </Typography>
        )}
      </Section>
    </Box>
  );
};

export default ClientProjects;
