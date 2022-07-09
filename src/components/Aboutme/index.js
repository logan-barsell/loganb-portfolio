import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Bio from './Bio';
import Headshot from './Headshot';

const Aboutme = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={8}>
          <Bio />
        </Grid>
        <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <Headshot />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Aboutme;