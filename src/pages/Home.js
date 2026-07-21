import React from 'react';
import Hero from '../components/Home/Hero';
import ValueProposition from '../components/Home/ValueProposition';
import ServicesOverview from '../components/Home/ServicesOverview';
import FeaturedPricing from '../components/Home/FeaturedPricing';
import FeaturedWork from '../components/Home/FeaturedWork';
import ProcessSteps from '../components/Home/ProcessSteps';
import AboutPreview from '../components/Home/AboutPreview';
import FinalCta from '../components/Home/FinalCta';

const Home = () => {
  return (
    <>
      <Hero />
      <ValueProposition />
      <ServicesOverview />
      <FeaturedPricing />
      <FeaturedWork />
      <ProcessSteps />
      <AboutPreview />
      <FinalCta />
    </>
  );
};

export default Home;
