import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MailIcon from '@mui/icons-material/Mail';

const Contact = React.forwardRef((props, refs) => {
  return (
    <Container>
      <Box
        ref={(el) => { refs.current[3] = el }}
        sx={{ pt: { xs: 7, sm: 12 }, pb: 1 }}
      >
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
          href="mailto:contact@loganbarsell.com"
          target="_blank"
          className="altFont"
          startIcon={<MailIcon />}
          variant="outlined"
          size="large"
          color="success"
          sx={{
            display: 'flex',
            width: 'fit-content',
            color: '#34a92c',
            margin: '30px auto',
            textAlign: 'center'
          }}>
          Drop me a line!
        </Button>
      </Box>
    </Container>
  );
});

export default Contact;