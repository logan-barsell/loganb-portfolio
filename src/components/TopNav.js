import './TopNav.css';
import logo from '../images/navLogo.png';

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
import Link from '@mui/material/Link';
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

const TopNav = React.forwardRef((props, refs) => {
  const { window, scrollEvent } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClickCapture={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Toolbar sx={{ justifyContent: 'end', '&.MuiToolbar-root': { paddingRight: '12px' } }}>
        <IconButton
          aria-label="close drawer"
          color="success"
          sx={{ color: '#34a92c' }}
        >
          <FingerprintIcon className='fingerprint' />
        </IconButton>
      </Toolbar>
      <Divider />
      <List className="altFont" sx={{ mt: '50px' }}>
        {navItems.map((item, index) => (
          <ListItem key={item} sx={{ padding: '15px' }}>
            <ListItemButton
              onClick={() => {
                scrollEvent(index);
              }}
              sx={{ textAlign: 'center' }}
            >
              <CodeIcon sx={{ color: '#34a92c', justifyContent: 'end', marginRight: '3px' }} />
              <ListItemText className="hvr-left" primary={item} sx={{ color: '#9563bb', textAlign: 'left' }} />
            </ListItemButton>
          </ListItem>
        ))}
        <Button
          onClick={() => scrollEvent(3)}
          variant="outlined"
          size="large"
          color='success'
          sx={{
            color: '#34a92c',
            marginTop: '50px'
          }}>
          Contact Me
        </Button>
      </List>
    </Box>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <HideOnScroll>
        <AppBar component="nav" sx={{ backgroundColor: 'rgb(6, 5, 35, 0.9)' }}>
          <Toolbar sx={{ minHeight: { xs: '75px' } }}>
            <Typography
              noWrap
              variant="h6"
              sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'left' }}
            >
              <Link className="logo" href="/" height='60px'>
                <img src={logo} height='60px' alt="custom logo" />
              </Link>

            </Typography>
            <Box className="altFont navItems">
              {mobileOpen ? null :
                <>
                  {navItems.map((item, index) => (
                    <Button
                      onClick={() => scrollEvent(index)}
                      key={item}
                      sx={{ color: '#9563bb' }}
                    >
                      <CodeIcon sx={{ color: '#34a92c', marginRight: '3px' }} />
                      <div className="hvr-left">{item}</div>
                    </Button>
                  ))}
                  <Button
                    onClick={() => scrollEvent(3)}
                    variant="outlined"
                    color='success'
                    sx={{ color: '#34a92c', marginLeft: '10px' }}
                  >
                    Contact Me
                  </Button>
                </>
              }
            </Box>
            <IconButton
              className="menuIcon"
              color="success"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ color: '#34a92c' }}
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
    </Box >
  );
})

export default TopNav;
