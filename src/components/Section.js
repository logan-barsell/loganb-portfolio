import * as React from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

const Section = ({ title, children }) => {
  return (
    <Box sx={{ py: { xs: 7, sm: 12 } }}>
      <Divider
        textAlign='left'
        sx={{
          marginBottom: '20px',
          '&::before, &::after': {
            borderColor: '#d8e0f3'
          }
        }}
      >
        <Typography
          variant="h4"
          componenet="div"
          sx={{
            fontWeight: 600,
            color: ' #d8e0f3'
          }}
        >
          {title}
        </Typography>
      </Divider>
      {children}
    </Box>
  );
};

export default Section;