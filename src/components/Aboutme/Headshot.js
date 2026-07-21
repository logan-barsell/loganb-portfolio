import './Headshot.css';
import headshot from '../../images/HEADSHOT_LOGAN.jpeg';

import * as React from 'react';
import Box from '@mui/material/Box';

const Headshot = () => {
  return (
    <Box
      className="box"
      sx={{
        padding: '20px',
        margin: '10px',
        position: 'relative',
        maxWidth: '100%',
        height: 'auto',
      }}
    >
      <Box
        component="img"
        src={headshot}
        alt="Logan Barsell"
        sx={{
          width: '100%',
          maxWidth: '270px',
          border: '1px solid #34a92c',
          opacity: 0.8,
        }}
      />
      <Box
        className="overlay"
        sx={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 100,
          backgroundColor: '#34a92c',
          opacity: 0.1,
        }}
      />
    </Box>
  );
};

export default Headshot;
