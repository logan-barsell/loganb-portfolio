import './TopNav.css';

import * as React from 'react';
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

function HideOnScroll(props) {
  const { children, window } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const drawerWidth = 240;
const navItems = ['Who Am I?', 'Experience', 'Projects'];

function TopNav(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Toolbar sx={{ justifyContent: 'end' }}>
        <IconButton
          aria-label="close drawer"
          color="success"
          sx={{ mr: 2, color: '#34a92c' }}
        >
          <FingerprintIcon className='fingerprint' />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item} >
            <ListItemButton sx={{ textAlign: 'center' }}>

              <CodeIcon sx={{ color: '#34a92c', justifyContent: 'end', marginRight: '3px' }} />

              <ListItemText className="hvr-left" primary={item} sx={{ color: '#9563bb', textAlign: 'left' }} />
            </ListItemButton>
          </ListItem>
        ))}
        <Button variant="outlined" size="large" color='success' sx={{ color: '#34a92c', marginTop: '35px' }}>Contact Me</Button>
      </List>
    </Box>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <HideOnScroll>
        <AppBar component="nav" sx={{ backgroundColor: "#060523" }}>
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, display: { sm: 'block' } }}
            >
              LB
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              {mobileOpen ? null :
                navItems.map((item) => (
                  <Button key={item} sx={{ color: '#9563bb' }}>
                    <CodeIcon sx={{ color: '#34a92c', marginRight: '3px' }} />
                    <div className="hvr-left">{item}</div>
                  </Button>
                ))
              }
            </Box>
            <IconButton
              color="success"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' }, color: '#34a92c' }}
            >
              <FingerprintIcon className='fingerprint' />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Box component="nav">
        <Drawer
          anchor="right"
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: "#060523" },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </Box>
  );
}

export default TopNav;
