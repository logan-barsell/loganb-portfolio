import './Intro.css'

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grow from '@mui/material/Grow';


const Intro = React.forwardRef(({ scrollEvent }, refs) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Grow in={!loading} timeout={500}>
      <Container sx={{ marginTop: '45px', minHeight: '80vh', display: 'grid' }}>
        <Box sx={{ my: 10, px: { sm: 2, xs: 0 } }}>
          <Typography
            sx={{
              color: '#d8e0f3',
              fontWeight: 600,
              fontSize: {
                xs: '50px',
                sm: '70px',
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
                xs: '27px',
                sm: '34px'
              },
              lineHeight: '0.9'

            }}
            variant="h4"
            component="div">
            Web Developer
          </Typography>
        </Box>
        <Box sx={{ mb: 12, mt: 10, px: { sm: 2, xs: 0 } }}>
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
            onClick={() => scrollEvent(2)}
            className="altFont"
            variant="outlined"
            size="large"
            color='success'
            sx={{
              color: '#34a92c',
              fontVariant: 'small-caps',
              fontWeight: 600,
              fontSize: '23px',
              textTransform: 'none',
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
            My Portfolio
          </Button>
        </Box>
      </Container>
    </Grow >
  );
});

export default Intro;