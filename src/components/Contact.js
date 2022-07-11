import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import MailIcon from '@mui/icons-material/Mail';

const Contact = () => {
  return (
    <Container>
      <Box sx={{ pt: { xs: 7, sm: 12 }, pb: 1 }}>
        <Typography
          variant="h3"
          component="div"
          sx={{
            color: '#d8e0f3',
            fontWeight: 700,
            textAlign: 'center',
            fontSize: {
              xs: '38px',
              sm: '48px'
            }
          }}>
          Interested?
        </Typography>
        <Button
          className="altFont"
          startIcon={<MailIcon />}
          variant="outlined"
          size="large"
          color="success"
          sx={{
            display: 'flex',
            color: '#34a92c',
            margin: '30px auto'
          }}>
          Drop me a line!
        </Button>
        {/* <LinkedInIcon sx={{ fontSize: '50px', color: '#9563bb' }} />
        <GitHubIcon sx={{ fontSize: '50px', color: '#9563bb' }} /> */}
      </Box>
    </Container>
  );
};

export default Contact;