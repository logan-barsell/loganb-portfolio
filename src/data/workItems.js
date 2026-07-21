import fhs from '../images/portfolio/fhssitetn.png';
import barsellConstructionImg from '../images/portfolio/barsellconstruction-og.png';
import barsellElectricalImg from '../images/portfolio/barsell-electrical-og.png';
import bandsyteLogo from '../images/portfolio/BANDSYTE_PAGE_LOGO.PNG';
import envoyLogo from '../images/portfolio/envoy-white-logo.webp';
import corecareLogo from '../images/portfolio/corecare.webp';

export const workItems = [
  {
    id: 'bandsyte',
    title: 'Bandsyte',
    category: 'software',
    categoryLabel: 'Software',
    type: 'Multi-tenant SaaS Platform',
    role: 'Founder & Full-Stack Engineer',
    clientType: 'DIY Site Builder for bands',
    services: ['Product design', 'Full-stack development', 'Billing', 'Hosting & ops'],
    problem:
      'A DIY website platform for bands—create a professional site, connect a custom domain, and manage shows, releases, merch, and fan communication from one place.',
    solution:
      'Built a production-ready multi-tenant SaaS platform where bands can create and manage professional websites, connect custom domains, promote releases and events, sell merchandise, and grow an owned audience.',
    outcome:
      'A live platform with secure authentication, Stripe subscriptions, custom domains, tenant isolation, and ongoing product development.',
    highlights: [
      'Multi-tenant SaaS architecture',
      'Secure auth with JWT, refresh tokens, 2FA, and CSRF protection',
      'Stripe subscriptions and webhook automation',
      'Custom domains and tenant isolation',
      'Newsletter and audience management',
      'Production deployments with Docker, Railway, and Vercel',
    ],
    tech: [
      'React',
      'TypeScript',
      'Node.js',
      'Express',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Stripe',
      'Railway',
      'Vercel',
    ],
    img: bandsyteLogo,
    imgFit: 'contain',
    link: 'https://bandsyte.com/',
    featured: true,
  },
  {
    id: 'barsell-electrical',
    title: 'Barsell Electrical Services',
    category: 'client',
    categoryLabel: 'Client websites',
    type: 'Small Business Website',
    role: 'Web Designer & Developer',
    clientType: 'Local electrical contractor',
    services: ['Website design', 'Development', 'Hosting setup'],
    problem:
      'A local electrical contractor needed a professional online presence so potential customers could learn about services and request work.',
    solution:
      'Designed and built a clean, modern, mobile-first React site with services, about, reviews, and clear Call Now / Email CTAs, branded from the client logo and business card.',
    outcome:
      'A fast, credible static website with review integrations and multiple ways for customers to get in touch.',
    highlights: [
      'Responsive landing, about, services, and reviews pages',
      'Review carousel with Google, Yelp, and Nextdoor integrations',
      'Clear calls-to-action throughout',
      'SEO-friendly structure and fast load times',
      'Deployed with GitHub Actions, DigitalOcean, and Nginx',
    ],
    tech: ['React', 'JavaScript', 'Material UI', 'Emotion', 'CSS', 'GitHub Actions', 'DigitalOcean', 'Nginx'],
    img: barsellElectricalImg,
    link: 'https://barsellelectrical.com/',
    featured: true,
  },
  {
    id: 'barsell-construction',
    title: 'Barsell Construction',
    category: 'client',
    categoryLabel: 'Client websites',
    type: 'Business Website',
    role: 'Web Designer & Developer',
    clientType: 'Bay Area construction company',
    services: ['Website design', 'Development', 'Branding support', 'Hosting'],
    problem:
      'A construction business needed a professional site that clearly presented services and built local trust.',
    solution:
      'Built a fully responsive website with custom branding, mission messaging, and locality mapping, then deployed it on DigitalOcean.',
    outcome:
      'A live business website that presents the company professionally and helps customers find and contact them.',
    highlights: [
      'Responsive HTML/CSS/jQuery site',
      'Custom logo and brand-aligned UI',
      'Google Maps integration',
      'Image optimization for faster loads',
    ],
    tech: ['HTML', 'CSS', 'JavaScript', 'jQuery', 'Materialize CSS', 'DigitalOcean', 'Nginx'],
    img: barsellConstructionImg,
    link: 'https://barsellconstruction.com/',
    featured: true,
  },
  {
    id: 'fawkes',
    title: 'Fawkes Home Solutions',
    category: 'client',
    categoryLabel: 'Client websites',
    type: 'Business Website',
    role: 'Web Designer & Developer',
    clientType: 'Bay Area home-buying business',
    services: ['Website design', 'Development', 'Deployment'],
    problem:
      'A home-buying business needed a mobile-friendly site that highlighted brand focus points and made contact easy.',
    solution:
      'Designed and developed a responsive marketing site with clear messaging and interactive features.',
    outcome:
      'A polished business website that supports the company’s local presence and customer outreach.',
    highlights: [
      'Mobile-friendly layouts',
      'Brand-focused design',
      'Deployed with Nginx on DigitalOcean',
    ],
    tech: ['HTML', 'CSS', 'jQuery', 'Bootstrap', 'SCSS', 'Gulp.js', 'DigitalOcean'],
    img: fhs,
    link: 'https://www.fawkeshomesolutions.com/',
    featured: true,
  },
  {
    id: 'corecare',
    title: 'CoreCare',
    category: 'software',
    categoryLabel: 'Software',
    type: 'Healthcare Workflow Application',
    role: 'Fullstack Engineer',
    clientType: 'Long-term care technology platform',
    services: ['Backend architecture', 'Secure feature development'],
    problem:
      'Long-term care facilities needed reliable, HIPAA-conscious digital workflows for Medicaid and insurance processes.',
    solution:
      'Contributed to a mobile web application with scalable backend architecture, strong privacy controls, and collaborative delivery across product and UX.',
    outcome:
      'Improved application performance, security posture, and usability for care professionals.',
    highlights: [
      'HIPAA-conscious development practices',
      'Mobile-optimized backend architecture',
      'Cross-team collaboration with product and UX',
    ],
    tech: ['JavaScript', 'AWS', 'Cloud architecture'],
    img: corecareLogo,
    imgBg: '#fbfaf9',
    imgFit: 'contain',
    link: 'https://corecare.ai/',
    featured: false,
  },
  {
    id: 'envoy',
    title: 'Envoy',
    category: 'software',
    categoryLabel: 'Software',
    type: 'EV Car-Sharing Platform',
    role: 'Fullstack Engineer',
    clientType: 'Electric car share for residential and commercial properties',
    services: [
      'Full-stack platform development',
      'Customer and admin portals',
      'Third-party integrations',
    ],
    problem:
      'Envoy needed a reliable EV car-sharing platform for property residents and guests—covering reservations, vehicle access, payments, and day-to-day fleet operations.',
    solution:
      'Worked on a development team to build and ship core platform features across the customer portal, admin portal, and backend APIs. Led the customer-facing portal while also contributing reservation, authentication, tracking, keyless entry, and payment work, plus integrations with Stripe, Google Maps, Twilio, HubSpot, and SendGrid.',
    outcome:
      'A more complete, maintainable platform experience spanning rider-facing flows, admin operations, and third-party services—delivered through agile collaboration, TypeScript refactoring, and strong QA practices.',
    highlights: [
      'Team contributor on an EV car-sharing platform for reservations, payments, and auth',
      'Led customer-facing portal development in React, TypeScript, and Node.js',
      'Admin portal frontend and backend improvements for operations teams',
      'Real-time vehicle tracking, keyless entry, and Stripe payment flows',
      'Twilio, HubSpot, and SendGrid integrations',
      'TypeScript refactoring, performance work, code reviews, and unit testing',
    ],
    tech: [
      'React',
      'TypeScript',
      'Node.js',
      'Express',
      'Stripe',
      'Google Maps API',
      'Twilio',
      'HubSpot',
      'SendGrid',
    ],
    img: envoyLogo,
    imgBg: '#0c1b47',
    imgFit: 'contain',
    link: 'https://www.envoythere.com/',
    featured: false,
  },
];

export const featuredWork = workItems.filter((item) => item.featured);

export const workCategories = [
  { id: 'client', label: 'Client Websites' },
  { id: 'software', label: 'Software' },
];
