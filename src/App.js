import './App.css';

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import Pricing from './pages/Pricing';
import Work from './pages/Work';
import About from './pages/About';
import Contact from './pages/Contact';
import Start from './pages/Start';
import Login from './pages/Login';
import Inquiries from './pages/admin/Inquiries';
import InquiryDetail from './pages/admin/InquiryDetail';
import Projects from './pages/admin/Projects';
import Invoices from './pages/admin/Invoices';
import { Privacy, Terms } from './pages/Legal';
import { AuthProvider } from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
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
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="inquiries" replace />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="inquiries/:id" element={<InquiryDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="invoices" element={<Invoices />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/login" element={<Login />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
