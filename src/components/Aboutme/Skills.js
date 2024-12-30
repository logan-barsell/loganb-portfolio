import './Skills.css';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

const Skills = () => {
  return (
    <Box
      className='altFont'
      sx={{
        background: 'rgba(0, 0, 0, 0.4)',
        maxWidth: '500px',
        padding: '20px',
        margin: '10px auto',
        color: '#34a92c',
      }}
    >
      <Typography
        className='skills'
        variant='h5'
        component='div'
        sx={{ fontWeight: 600 }}
      >
        Skills
      </Typography>
      <Container>
        <Typography
          variant='body1'
          component='div'
        >
          <b>Frontend:</b>
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          HTML, CSS, JavaScript, TypeScript
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          React, Redux, Next.js, Tailwind, Bootstrap
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          MaterializeCSS, Material UI, jQuery
        </Typography>
        <br />
        <Typography
          variant='body1'
          component='div'
        >
          <b>Backend:</b>
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          Node.js, Express, GraphQL, RESTful APIs
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          Microservices, MongoDB, MySQL, Postgres
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          SQLite, Redis, Prisma
        </Typography>
        <br />
        <Typography
          variant='body1'
          component='div'
        >
          <b>Cloud & Hosting:</b>
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          Domains, Hosting, DNS Configuration, Docker
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          Kubernetes, GitHub, CI/CD, AWS
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          Microsoft Azure, Google Cloud Platform
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          Firebase, DigitalOcean
        </Typography>
        <br />
        <Typography
          variant='body1'
          component='div'
        >
          <b>Tools:</b>
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          Git, GitHub Actions, Zapier, HubSpot, Cypress
        </Typography>
        <Typography
          variant='body1'
          component='div'
        >
          Jest, Postman, Microfrontends
        </Typography>
      </Container>
    </Box>
  );
};

export default Skills;
