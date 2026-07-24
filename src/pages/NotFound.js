import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CodeIcon from '@mui/icons-material/Code';
import CtaButton from '../components/CtaButton';
import { colors } from '../theme/colors';

const NotFound = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Page Not Found | Logan Barsell';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <Box sx={{ pb: 6, pt: { xs: 7, sm: 10 } }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 600,
          color: colors.text,
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' },
          mb: 3,
        }}
      >
        <CodeIcon
          sx={{
            fontSize: { xs: '30px', sm: '42px', md: '50px' },
            color: colors.purple,
            flexShrink: 0,
          }}
        />
        Page Not Found
      </Typography>
      <Typography
        variant="h5"
        sx={{
          color: colors.text,
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        }}
      >
        Oops!
      </Typography>
      <Typography sx={{ color: colors.muted, mb: 4, maxWidth: 560 }}>
        That URL doesn&apos;t match anything on this site. It may have moved, or the link could be
        mistyped.
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <CtaButton to="/">Back to Home</CtaButton>
        <CtaButton to="/contact" secondary>
          Contact
        </CtaButton>
      </Stack>
    </Box>
  );
};

export default NotFound;
