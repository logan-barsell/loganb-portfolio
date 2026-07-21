import './Hero.css';

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grow from '@mui/material/Grow';
import Stack from '@mui/material/Stack';
import CtaButton from '../CtaButton';
import { colors } from '../../theme/colors';

const Hero = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Grow in={!loading} timeout={500}>
      <Box sx={{ minHeight: { xs: '70vh', md: '75vh' }, display: 'grid', alignContent: 'center' }}>
        <Box sx={{ my: { xs: 4, sm: 6 }, px: { sm: 2, xs: 0 } }}>
          <Typography
            sx={{
              color: colors.text,
              fontWeight: 600,
              fontSize: { xs: '42px', sm: '64px', md: '70px' },
              fontVariant: 'all-small-caps',
              lineHeight: 1,
              marginBottom: '12px',
            }}
            variant="h1"
            component="h1"
          >
            Logan Barsell
          </Typography>
          <Typography
            sx={{
              color: colors.muted,
              fontWeight: 600,
              fontSize: { xs: '22px', sm: '30px' },
              lineHeight: 1.1,
            }}
            variant="h2"
            component="p"
          >
            Web Designer &amp; Developer
          </Typography>
        </Box>
        <Box sx={{ mb: 8, px: { sm: 2, xs: 0 } }}>
          <Typography
            sx={{
              color: colors.muted,
              fontWeight: 600,
              fontSize: { xs: '1.6rem', sm: '2.4rem' },
              lineHeight: 1.25,
              maxWidth: 800,
            }}
            variant="h3"
            component="p"
          >
            I design and build <span>fast</span>, <span>professional</span> websites for{' '}
            <span>small businesses</span>.
          </Typography>
          <Typography
            sx={{ color: colors.muted, mt: 2, maxWidth: 640, fontSize: { xs: '1rem', sm: '1.1rem' } }}
          >
            From planning and design to launch and ongoing hosting, I handle the full website
            process so you can focus on running your business.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mt: 4 }}
          >
            <CtaButton
              to="/start"
              sx={{
                fontVariant: 'small-caps',
                fontSize: '20px',
                px: { sm: 3, xs: 2 },
                py: { sm: 1.5, xs: 1 },
              }}
            >
              Start a Project
            </CtaButton>
            <CtaButton
              secondary
              to="/work"
              sx={{
                fontVariant: 'small-caps',
                fontSize: '20px',
                px: { sm: 3, xs: 2 },
                py: { sm: 1.5, xs: 1 },
              }}
            >
              View My Work
            </CtaButton>
          </Stack>
        </Box>
      </Box>
    </Grow>
  );
};

export default Hero;
