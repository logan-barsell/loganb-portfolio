import * as React from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CodeIcon from '@mui/icons-material/Code';

const Section = ({ title, children }) => {
  return (
    <Box sx={{ pt: { xs: 7, sm: 12 }, pb: 4 }}>
      <Divider
        textAlign='left'
        sx={{
          fontVariant: 'small-caps',
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
            color: ' #d8e0f3',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <CodeIcon sx={{ fontSize: '50px', color: '#9563bb' }} />
          {title}
        </Typography>
      </Divider>
      {children}
    </Box>
  );
};

export default Section;