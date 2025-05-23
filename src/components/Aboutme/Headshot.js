import './Headshot.css';
import headshot from '../../images/HEADSHOT_LOGAN.jpeg';

import * as React from 'react';
import Box from '@mui/material/Box';

const Headshot = () => {
  return (
    <Box
      className='box'
      sx={{
        padding: '20px',
        margin: '10px',
        position: 'relative',
        maxWidth: '100%',
        height: 'auto',
      }}
    >
      <img
        src={headshot}
        style={{
          width: '100%',
          maxWidth: '270px',
          border: '1px solid #34a92c',
          opacity: 0.8,
        }}
      />
      <div
        className='overlay'
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: '0px',
          left: '0px',
          zIndex: '100',
          backgroundColor: '#34a92c',
          opacity: 0.1,
        }}
      ></div>
    </Box>
  );
};

export default Headshot;
