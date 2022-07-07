import './App.css';

import React from 'react';
import TopNav from './components/TopNav';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

const App = () => {
  return (
    <>
      <TopNav />
      <Container>
        <Box height="2000px" sx={{ my: 2 }}>

        </Box>
      </Container>
    </>
  );
};

export default App;

