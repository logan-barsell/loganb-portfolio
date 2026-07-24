import React from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fade from '@mui/material/Fade';
import TopNav from './TopNav';
import SiteFooter from './SiteFooter';
import useFooterReady from '../hooks/useFooterReady';

const AppLayout = () => {
  const footerReady = useFooterReady();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 10, sm: 11 } }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
      <Fade in={footerReady} appear timeout={{ enter: 1000, exit: 0 }} unmountOnExit>
        <Box sx={{ flexShrink: 0 }}>
          <SiteFooter />
        </Box>
      </Fade>
    </Box>
  );
};

export default AppLayout;
