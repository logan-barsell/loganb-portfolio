import './Intro.css'

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const Intro = () => {
  return (
    <div sx={{ marginTop: '100px' }}>
      <Box sx={{ my: 10, px: { sm: 5, xs: 0 } }}>
        <Typography
          sx={{
            color: '#d8e0f3',
            fontWeight: 600,
            fontSize: {
              xs: '50px',
              sm: '60px',
              md: '70px'
            },
            fontVariant: 'all-small-caps',
            lineHeight: '30px',
            marginBottom: '20px'
          }}
          variant="h2"
          component="div">
          Logan Barsell
        </Typography>
        <Typography
          sx={{
            color: '#808dcb',
            fontWeight: 600,
            fontSize: {
              sm: '27px',
              md: '34px'
            }
          }}
          variant="h4"
          component="div">
          Web Developer
        </Typography>
      </Box>
      <Box sx={{ my: 12, px: { sm: 5, xs: 0 } }}>
        <Typography
          sx={{
            color: '#808dcb',
            fontWeight: 600,
            textAlign: 'right',
            fontSize: {
              xs: '2rem',
              sm: '3rem'
            }
          }}
          variant="h3"
          component="h3">
          I <span>DESIGN</span>, <span>DEVELOP</span>, and <span>DEPLOY</span> things to the web.
        </Typography>
        <Button
          className="altFont"
          variant="outlined"
          size="large"
          color='success'
          sx={{
            color: '#34a92c',
            margin: {
              xs: '35px 0px',
              sm: '35px'
            },
            padding: {
              sm: '15px 20px',
              xs: '10px 15px'
            },
            float: 'right'
          }}>
          Stuff Like This!
        </Button>
      </Box>
    </div>
  );
};

export default Intro;