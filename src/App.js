import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import TopNav from './components/TopNav';
import Intro from './components/Intro';
import Section from './components/Section';
import Aboutme from './components/Aboutme';
import Work from './components/Work';
import Portfolio from './components/Portfolio';
import Contact from './components/Contact';
import BottomNav from './components/BottomNav';
import smoothscroll from 'smoothscroll-polyfill';

smoothscroll.polyfill();

const App = () => {

  const refs = useRef([]);

  const scrollToEl = n => {
    refs.current[n].parentElement.scrollIntoView();
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Fade in={!loading}>
      <div>
        <TopNav ref={refs} scrollEvent={scrollToEl} />
        <Container>
          <Box sx={{ my: 10 }}>
            <Intro ref={refs} scrollEvent={scrollToEl} />
            <Section title='Who Am I?'>
              <Aboutme ref={refs} />
            </Section>
            <Section title='Work Experience'>
              <Work ref={refs} />
            </Section>
            <Section title="Portfolio">
              <Portfolio ref={refs} />
            </Section>
            <Contact ref={refs} />
          </Box>
        </Container>
        <BottomNav />
      </div>
    </Fade>

  );
};

export default App;

