import '../TopNav.css';
import logo from '../../images/navLogo.png';

import React, { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CodeIcon from '@mui/icons-material/Code';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { adminNav } from '../../data/adminNav';
import { useAuth } from '../../auth/AuthProvider';
import CtaButton from '../CtaButton';
import SeoNoIndex from '../SeoNoIndex';
import SiteFooter from '../SiteFooter';
import { colors } from '../../theme/colors';

const drawerWidth = 260;

function isActive(pathname, item) {
  return pathname === item.path || pathname.startsWith(`${item.matchPrefix}/`);
}

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleDrawerToggle = () => setMobileOpen((open) => !open);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navButtons = (
    <>
      {adminNav.map((item) => (
        <Button
          key={item.path}
          component={RouterLink}
          to={item.path}
          sx={{
            color: isActive(location.pathname, item) ? colors.green : colors.purple,
          }}
        >
          <CodeIcon sx={{ color: colors.green, marginRight: '3px' }} />
          <div className="hvr-left">{item.label}</div>
        </Button>
      ))}
      <CtaButton onClick={handleLogout} sx={{ marginLeft: '10px' }}>
        Log Out
      </CtaButton>
    </>
  );

  const drawer = (
    <Box onClickCapture={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Toolbar sx={{ justifyContent: 'end', '&.MuiToolbar-root': { paddingRight: '12px' } }}>
        <IconButton aria-label="close drawer" sx={{ color: colors.green }}>
          <FingerprintIcon className="fingerprint" />
        </IconButton>
      </Toolbar>
      <Divider />
      <List className="altFont" sx={{ mt: '30px' }}>
        {adminNav.map((item) => (
          <ListItem key={item.path} sx={{ padding: '8px 15px' }}>
            <ListItemButton component={RouterLink} to={item.path} sx={{ textAlign: 'center' }}>
              <CodeIcon sx={{ color: colors.green, marginRight: '3px' }} />
              <ListItemText
                className="hvr-left"
                primary={item.label}
                sx={{
                  color: isActive(location.pathname, item) ? colors.green : colors.purple,
                  textAlign: 'left',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        <Box sx={{ mt: 4, px: 2 }}>
          <CtaButton onClick={handleLogout} fullWidth>
            Log Out
          </CtaButton>
        </Box>
      </List>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: colors.bg }}>
      <SeoNoIndex title="Admin | Logan Barsell" />
      <AppBar component="nav" position="sticky" sx={{ backgroundColor: colors.nav }}>
        <Toolbar sx={{ minHeight: { xs: '75px' } }}>
          <Typography
            noWrap
            variant="h6"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
          >
            <RouterLink className="logo" to="/admin/inquiries" style={{ height: 60 }}>
              <img src={logo} height="60px" alt="Logan Barsell Admin" />
            </RouterLink>
          </Typography>
          <Box
            className="altFont navItems"
            sx={{
              display: 'none',
              alignItems: 'center',
              gap: 0.5,
              '@media (min-width: 900px)': {
                display: 'flex',
              },
            }}
          >
            {navButtons}
          </Box>
          <IconButton
            className="menuIcon"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerToggle}
            sx={{
              color: colors.green,
              display: 'inline-flex',
              '@media (min-width: 900px)': {
                display: 'none',
              },
            }}
          >
            <FingerprintIcon className="fingerprint" />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: colors.navSolid,
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
      <SiteFooter
        navItems={adminNav}
        actionLabel="Log Out"
        actionTo={null}
        onAction={handleLogout}
      />
    </Box>
  );
};

export default AdminLayout;
