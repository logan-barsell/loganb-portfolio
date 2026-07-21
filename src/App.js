import './App.css';

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import Pricing from './pages/Pricing';
import Work from './pages/Work';
import About from './pages/About';
import Contact from './pages/Contact';
import Start from './pages/Start';
import { Privacy, Terms } from './pages/Legal';
import smoothscroll from 'smoothscroll-polyfill';

smoothscroll.polyfill();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  useEffect(() => {
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/work" element={<Work />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/start" element={<Start />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
