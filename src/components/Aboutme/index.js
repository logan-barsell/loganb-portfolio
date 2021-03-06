import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Bio from './Bio';
import Headshot from './Headshot';
import Skills from './Skills';

const Aboutme = React.forwardRef((props, refs) => {

  return (
    <Box
      ref={(el) => { refs.current[0] = el }}
      sx={{ flexGrow: 1 }}
    >
      <Grid container spacing={2} sx={{ py: 3 }}>
        <Grid item xs={12} sm={6}  >
          <Bio />
        </Grid>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Headshot />
        </Grid>
      </Grid>
      <Skills />
    </Box>
  );
});

export default Aboutme;