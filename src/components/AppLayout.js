import React from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TopNav from './TopNav';
import SiteFooter from './SiteFooter';

const AppLayout = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 10, sm: 11 } }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
      <SiteFooter />
    </Box>
  );
};

export default AppLayout;
