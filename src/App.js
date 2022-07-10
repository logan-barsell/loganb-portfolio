import './App.css';

import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TopNav from './components/TopNav';
import Intro from './components/Intro';
import Section from './components/Section';
import Aboutme from './components/Aboutme';
import Work from './components/Work';
import Contact from './components/Contact';
import BottomNav from './components/BottomNav';

const App = () => {
  return (
    <>
      <TopNav />
      <Container>
        <Box sx={{ my: 10 }}>
          <Intro />
          <Section title='Who Am I?'>
            <Aboutme />
          </Section>
          <Section title='Work Experience'>
            <Work />
          </Section>
          <Contact />
        </Box>
      </Container>
      <BottomNav />
    </>
  );
};

export default App;

