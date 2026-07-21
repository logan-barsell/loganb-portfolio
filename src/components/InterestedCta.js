import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';

const InterestedCta = ({ sx = {} }) => {
  return (
    <Box sx={{ pt: { xs: 7, sm: 12 }, pb: 1, ...sx }}>
      <Typography
        variant="h3"
        component="div"
        sx={{
          color: '#d8e0f3',
          fontWeight: 700,
          textAlign: 'center',
          fontSize: {
            xs: '38px',
            sm: '48px',
          },
        }}
      >
        Interested?
      </Typography>
      <Button
        component={RouterLink}
        to="/start"
        className="altFont"
        variant="outlined"
        size="large"
        color="success"
        sx={{
          display: 'flex',
          width: 'fit-content',
          color: '#34a92c',
          margin: '30px auto',
          textAlign: 'center',
        }}
      >
        Start a Project
      </Button>
    </Box>
  );
};

export default InterestedCta;
