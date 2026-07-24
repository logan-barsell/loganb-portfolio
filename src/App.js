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
import Proposals from './pages/admin/Proposals';
import ProposalNew from './pages/admin/ProposalNew';
import ProposalDetail from './pages/admin/ProposalDetail';
import Clients from './pages/admin/Clients';
import ClientDetail from './pages/admin/ClientDetail';
import Invoices from './pages/admin/Invoices';
import { Privacy, Terms } from './pages/Legal';
import NotFound from './pages/NotFound';
import { AuthProvider } from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import { ToastProvider } from './toast/ToastProvider';
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
      <ToastProvider>
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
              <Route path="proposals" element={<Proposals />} />
              <Route path="proposals/new" element={<ProposalNew />} />
              <Route path="proposals/:id" element={<ProposalDetail />} />
              <Route path="projects" element={<Projects />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="*" element={<NotFound />} />
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
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
