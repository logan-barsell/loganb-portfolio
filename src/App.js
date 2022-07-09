import './App.css';

import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TopNav from './components/TopNav';
import Intro from './components/Intro';
import Section from './components/Section';
import Aboutme from './components/Aboutme';
import Work from './components/Work';

const App = () => {
  return (
    <>
      <TopNav />
      <Container>
        <Box height="2000px" sx={{ my: 10 }}>
          <Intro />
          <Section title='Who Am I?'>
            <Aboutme />
          </Section>
          <Section title='Work Experience'>
            <Work />
          </Section>
        </Box>
      </Container>
    </>
  );
};

export default App;

