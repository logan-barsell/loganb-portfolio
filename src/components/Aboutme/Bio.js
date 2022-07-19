import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

const Bio = () => {
  return (
    <Box sx={{ color: '#808dcb' }}>
      <Typography
        variant='h6'
        gutterBottom
        component='div'
      >I'm just your friendly neighborhood Computer-Man.
      </Typography>
      <Typography
        variant='body1'
        component='div'
        gutterBottom>
        <strong>My interest</strong> in coding and web development began in 2017
        when I traveled to Amsterdam to study at&nbsp;
        <Link href="https://www.coursereport.com/schools/new-york-code-design-academy" target="_blank" color="#34a92c">New York Code &amp; Design Academy</Link>.
        There in the Netherlands is where I started to dream my dream,
        and I knew that the life of a developer was for me!
      </Typography>
      <Typography
        variant='body1'
        component='div'
        gutterBottom>
        <strong>Today</strong>, I spend my time doing freelance work, staying on the cutting edge
        of technology by enrolling in courses on&nbsp;
        <Link href="https://www.udemy.com/" target="_blank" color="#34a92c">Udemy</Link>
        , and reading up on the latest
        web trends.
      </Typography>
    </Box>
  );
};

export default Bio;