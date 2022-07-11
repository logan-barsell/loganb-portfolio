import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ProjectCard from './ProjectCard';
import { projects } from './projects';


const Portfolio = () => {

  const renderProjects = projects.map((project, index) => (
    <Grid key={index} item xs={12} sm={6}>
      <ProjectCard project={project} />
    </Grid>
  ));


  return (
    <Container>
      <Box>
        <Grid container spacing={2}>
          {renderProjects}
        </Grid>
      </Box>
    </Container>
  );
};

export default Portfolio;