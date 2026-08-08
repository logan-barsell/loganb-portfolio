import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fade from '@mui/material/Fade';
import TopNav from './TopNav';
import SiteFooter from './SiteFooter';
import useFooterReady from '../hooks/useFooterReady';
import { usePortalNav } from '../auth/PortalNavProvider';
import { useToast } from '../toast/ToastProvider';

const AppLayout = () => {
  const footerReady = useFooterReady();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated, loggingOut, logout, projects } = usePortalNav();
  const isClientArea =
    location.pathname.startsWith('/project/') || location.pathname.startsWith('/client/');
  const showClientLogout = isAuthenticated && isClientArea;
  const clientPortalPath =
    projects.length === 1 ? `/project/${projects[0].id}` : '/client/projects';

  const handleClientLogout = async () => {
    if (loggingOut) return;
    try {
      await logout();
    } catch (error) {
      toast.error(error.message || 'Could not log out.');
    }
  };

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
          <SiteFooter
            actionLabel={
              showClientLogout
                ? loggingOut
                  ? 'Signing Out…'
                  : 'Log Out'
                : isAuthenticated
                  ? 'Client Portal'
                  : 'Client Login'
            }
            actionTo={
              showClientLogout ? null : isAuthenticated ? clientPortalPath : '/client/login'
            }
            onAction={showClientLogout ? handleClientLogout : undefined}
          />
        </Box>
      </Fade>
    </Box>
  );
};

export default AppLayout;
