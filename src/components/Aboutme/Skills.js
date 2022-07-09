import './Skills.css';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

const Skills = () => {
  return (
    <Box
      className="altFont"
      sx={{
        background: 'rgba(0, 0, 0, 0.4)',
        maxWidth: '500px',
        padding: '20px',
        margin: '10px auto',
        color: '#34a92c'
      }}
    >
      <Typography
        className="skills"
        variant="h5"
        component="div"
        sx={{ fontWeight: 600 }}
      >
        Skills
      </Typography>
      <Container>
        <Typography
          variant='body1'
          component='div'
        >HTML, CSS, JavaScript, TypeScript
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >React/Redux, Node.js, Express, MongoDB
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >Bootstrap, MaterializeCSS, Material UI, jQuery
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >GitHub, CI/CD, Domains, DNS Configuration
        </Typography>
      </Container>
    </Box>
  );
};

export default Skills;