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
        sx={{ backgroundColor: 'rgb(6, 5, 35, 0.9)', height: '80px', '.MuiBottomNavigationAction-label': { color: '#808dcb', fontSize: { xs: '15px', sm: '20px' } } }}
      >
        <BottomNavigationAction label="Email" icon={<MailIcon sx={{ color: '#9563bb', fontSize: '50px' }} />} />
        <BottomNavigationAction label="LinkedIn" icon={<LinkedInIcon sx={{ color: '#9563bb', fontSize: '50px' }} />} />
        <BottomNavigationAction label="GitHub" icon={<GitHubIcon sx={{ color: '#9563bb', fontSize: '50px' }} />} />
      </BottomNavigation>
    </Box>
  );
}

export default BottomNav;