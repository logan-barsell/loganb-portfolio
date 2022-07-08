import './App.css';

import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TopNav from './components/TopNav';
import Intro from './components/Intro';

const App = () => {
  return (
    <>
      <TopNav />
      <Container>
        <Box height="2000px" sx={{ my: 10 }}>
          <Intro />
        </Box>
      </Container>
    </>
  );
};

export default App;

