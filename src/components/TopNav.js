import './TopNav.css';
import logo from '../images/navLogo.png';

import * as React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import CodeIcon from '@mui/icons-material/Code';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { primaryNav } from '../data/nav';
import { colors } from '../theme/colors';
import CtaButton from './CtaButton';

function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const drawerWidth = 260;

const TopNav = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClickCapture={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Toolbar sx={{ justifyContent: 'end', '&.MuiToolbar-root': { paddingRight: '12px' } }}>
        <IconButton aria-label="close drawer" sx={{ color: colors.green }}>
          <FingerprintIcon className="fingerprint" />
        </IconButton>
      </Toolbar>
      <Divider />
      <List className="altFont" sx={{ mt: '30px' }}>
        {primaryNav.map((item) => (
          <ListItem key={item.path} sx={{ padding: '8px 15px' }}>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              sx={{ textAlign: 'center' }}
            >
              <CodeIcon sx={{ color: colors.green, marginRight: '3px' }} />
              <ListItemText
                className="hvr-left"
                primary={item.label}
                sx={{
                  color: location.pathname === item.path ? colors.green : colors.purple,
                  textAlign: 'left',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        <Box sx={{ mt: 4, px: 2 }}>
          <CtaButton to="/start" fullWidth>
            Start a Project
          </CtaButton>
        </Box>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <HideOnScroll>
        <AppBar component="nav" sx={{ backgroundColor: colors.nav }}>
          <Toolbar sx={{ minHeight: { xs: '75px' } }}>
            <Typography
              noWrap
              variant="h6"
              sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
            >
              <RouterLink className="logo" to="/" style={{ height: 60 }}>
                <img src={logo} height="60px" alt="Logan Barsell Web Services" />
              </RouterLink>
            </Typography>
            <Box
              className="altFont navItems"
              sx={{
                display: 'none',
                alignItems: 'center',
                gap: 0.5,
                '@media (min-width: 1100px)': {
                  display: 'flex',
                },
              }}
            >
              {primaryNav.map((item) => (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  sx={{
                    color:
                      location.pathname === item.path ? colors.green : colors.purple,
                  }}
                >
                  <CodeIcon sx={{ color: colors.green, marginRight: '3px' }} />
                  <div className="hvr-left">{item.label}</div>
                </Button>
              ))}
              <CtaButton to="/start" sx={{ marginLeft: '10px' }}>
                Start a Project
              </CtaButton>
            </Box>
            <IconButton
              className="menuIcon"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{
                color: colors.green,
                display: 'inline-flex',
                '@media (min-width: 1100px)': {
                  display: 'none',
                },
              }}
            >
              <FingerprintIcon className="fingerprint" />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Box component="nav">
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
      </Box>
    </Box>
  );
};

export default TopNav;
