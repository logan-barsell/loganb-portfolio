import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import ProjectCard from './ProjectCard';
import { projects } from './projects';


const Portfolio = React.forwardRef((props, refs) => {

  const [page, setPage] = React.useState(1);

  const handleChange = (event, value) => {
    setPage(value);
  };

  const count = Math.ceil(projects.length / 2);

  const renderProjects = projects.map((project, index) => (
    index === (page * 2) - 1 || index === (page * 2) - 2
      ?
      <Grid key={index} item xs={12} sm={6} my={2}>
        <ProjectCard project={project} />
      </Grid>
      : null
  ));


  return (
    <Container ref={(el) => { refs.current[2] = el }}>
      <Box
        my={6}
      >
        <Pagination
          count={count}
          page={page}
          shape="rounded"
          onChange={handleChange}
          sx={{
            my: 2,
            '.MuiPaginationItem-root': { color: '#808dcb' },
            '.MuiPaginationItem-root:hover': { backgroundColor: 'rgba(39, 170, 68, 0.2)' },
            '.MuiPagination-ul': { justifyContent: 'center' },
            '.MuiPaginationItem-root.Mui-selected': { backgroundColor: 'rgba(39, 170, 68, 0.4)', color: '#34a92c' },
            '.MuiPaginationItem-root.Mui-selected:hover': { backgroundColor: 'rgba(39, 170, 68, 0.4)' }
          }}
        />
        <Grid
          container
          spacing={3}
        >
          {renderProjects}
        </Grid>
      </Box>
    </Container>
  );
});

export default Portfolio;