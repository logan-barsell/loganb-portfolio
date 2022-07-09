import './Headshot.css';
import headshot from '../../images/headshot.JPG';

import * as React from 'react';
import Box from '@mui/material/Box';

const Headshot = () => {
  return (

    <Box
      className="box"
      sx={{
        padding: '25px',
        maxWidth: '100%'
      }}>
      <div className="overlay">
        <img src={headshot} style={{ maxWidth: '100%', height: '100%', border: '1px solid #34a92c', opacity: 0.8 }} />
      </div>
    </Box>
  );
};

export default Headshot;