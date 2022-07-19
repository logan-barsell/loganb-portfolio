import './Headshot.css';
import headshot from '../../images/headshot.JPG';

import * as React from 'react';
import Box from '@mui/material/Box';

const Headshot = () => {
  return (

    <Box
      className="box"
      sx={{
        padding: '20px',
        margin: '10px'
      }}>

      <img src={headshot} style={{ width: '100%', maxWidth: '350px', border: '1px solid #34a92c', opacity: 0.8 }} />
      <div className="overlay" >
      </div>
    </Box>
  );
};

export default Headshot;