import * as React from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import MailIcon from '@mui/icons-material/Mail';

const BottomNav = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <BottomNavigation
        className="altFont"
        showLabels
        sx={{
          backgroundColor: 'rgb(6, 5, 35, 0.9)',
          height: '80px',
          '.MuiBottomNavigationAction-label': {
            color: '#808dcb',
            fontSize: { xs: '15px', sm: '20px' }
          },
          '.MuiButtonBase-root.MuiBottomNavigationAction-root:hover': {
            backgroundColor: 'rgb(0, 0, 0, 0.3)'
          }
        }}
      >
        <BottomNavigationAction
          href="mailto:contact@loganbarsell.com"
          target="_blank"
          label="Email"
          icon={<MailIcon className="hvr-icon" sx={{ color: '#9563bb', fontSize: '50px' }} />}
        />
        <BottomNavigationAction
          href="https://www.linkedin.com/in/logan-barsell/"
          target="_blank"
          label="LinkedIn"
          icon={<LinkedInIcon className="hvr-icon" sx={{ color: '#9563bb', fontSize: '50px' }} />}
        />
        <BottomNavigationAction
          href="https://github.com/logan-barsell"
          target="_blank"
          label="GitHub"
          icon={<GitHubIcon className="hvr-icon" sx={{ color: '#9563bb', fontSize: '50px' }} />}
        />
      </BottomNavigation>
    </Box>
  );
}

export default BottomNav;