import './App.css';

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import Grow from '@mui/material/Grow';
import TopNav from './components/TopNav';
import { Intro, Section, Aboutme, Work, Portfolio, Contact, BottomNav, Loading } from './components';
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

  if (window.history.scrollRestoration) {
    window.history.scrollRestoration = 'manual';
  } else {
    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    }
  }

  const LazyContainer = lazy(() => import('@mui/material/Container'));


  return (
    <Grow in={!loading} timeout={500}>
      <div>
        <TopNav ref={refs} scrollEvent={scrollToEl} />
        <Suspense fallback={<Loading />}>
          <LazyContainer>
            <Box sx={{ mb: 10, mt: 2 }}>
              <Intro ref={refs} scrollEvent={scrollToEl} />
              <Section title='Who Am I?' domRef={0} ref={refs}>
                <Aboutme ref={refs} />
              </Section>
              <Section title='Work History' domRef={1} ref={refs}>
                <Work ref={refs} />
              </Section>
              <Section title="Portfolio" domRef={2} ref={refs}>
                <Portfolio ref={refs} />
              </Section>
              <Contact ref={refs} />
            </Box>
          </LazyContainer>
        </Suspense>
        <BottomNav />
      </div>
    </Grow>

  );
};

export default App;

