import isurveyu from '../../images/portfolio/iSurveyU.png';
import jbook from '../../images/portfolio/jsnote-tn.png';
import yesdevil from '../../images/portfolio/ydpictn2.png';
import fhs from '../../images/portfolio/fhssitetn.png';
import bcsite from '../../images/portfolio/bcpictn.png';
import tc6 from '../../images/portfolio/colorsixtn.png';
import logan1 from '../../images/portfolio/portfoliov1.png';
import portfolio2 from '../../images/portfolio/portfolio2.png';

export const projects = [
  {
    title: 'Yes Devil',
    type: 'Band Website',
    img: yesdevil,
    desc: 'Website for a band to showcase music, events, photos, and  videos. Includes an online store to sell merchandise.',
    buildList: [
      'React/Redux',
      'Bootstrap, CSS',
      'Node.js, Express, MongoDB',
      'Stripe API',
      'Microsoft OAuth Authentication',
      'GitHub Actions',
    ],
    hosted: 'DigitalOcean',
    github: 'https://github.com/logan-barsell/yesdevil-react',
    link: 'https://yesdevil.com/',
  },
  {
    title: 'iSurveyU',
    type: 'Feedback Application',
    img: isurveyu,
    desc: 'Users can send email surveys to a list of recipients and view the statistics in their dashboard.',
    buildList: [
      'React/Redux, MaterializeCSS',
      'Node.js, Express, MongoDB',
      'Google API, Stripe API',
      'Google OAuth Authentication',
    ],
    hosted: 'Heroku',
    github: 'https://github.com/logan-barsell/emaily-app',
  },
  {
    title: 'JBook',
    type: 'Coding Environment',
    img: jbook,
    desc: 'An interactive browser-based coding environment.',
    buildList: [
      'React/Redux, TypeScript',
      'Bulma CSS',
      'Node.js, Express',
      'Compiling/Bundling',
    ],
    hosted: 'NPM',
    github: 'https://github.com/logan-barsell/jbook',
    link: 'https://github.com/logan-barsell/jbook',
  },
  {
    title: 'Logan Barsell (V2)',
    type: 'Personal Website',
    img: portfolio2,
    desc: 'Portfolio website for a Web Developer to showcase skills and projects.',
    buildList: ['React, Material UI', 'Node.js, Express', 'GitHub Actions'],
    hosted: 'DigitalOcean',
    github: 'https://github.com/logan-barsell/loganb-portfolio',
    link: 'https://loganbarsell.com/',
  },
  {
    title: 'Fawkes Home Solutions',
    type: 'Business Website',
    img: fhs,
    desc: 'Website for a home-buying business in the Bay Area',
    buildList: ['HTML, CSS, jQuery', 'Bootstrap, SCSS', 'Gulp.js'],
    hosted: 'DigitalOcean',
    github: 'https://github.com/logan-barsell/FawkesHomeSolutions',
    link: 'https://www.fawkeshomesolutions.com/',
  },
  {
    title: 'Barsell Construction',
    type: 'Business Website',
    img: bcsite,
    desc: 'Website for a construction business in the Bay Area',
    buildList: ['HTML, CSS, jQuery', 'Materialize CSS'],
    hosted: 'DigitalOcean',
    github: 'https://github.com/logan-barsell/barsell-construction',
    link: 'https://barsellconstruction.com/',
  },
  {
    title: 'The Color Six',
    type: 'Band Website',
    img: tc6,
    desc: 'Website for a band to showcase music, events, photos, and  videos.',
    buildList: ['HTML, CSS, jQuery', 'Materialize CSS', 'Node.js, Express'],
    hosted: 'Heroku',
    github: 'https://github.com/logan-barsell/barsell-construction',
    // link: 'https://the-color-six.herokuapp.com/'
  },
  {
    title: 'Logan Barsell (V1)',
    type: 'Personal Website',
    img: logan1,
    desc: 'Portfolio website for a Web Developer to showcase skills and projects.',
    buildList: ['HTML, CSS, jQuery', 'Bootstrap', 'Node.js, Express'],
    hosted: 'Heroku',
    github: 'https://github.com/logan-barsell/portfolio-site',
    // link: 'https://loganbarsell-v1.herokuapp.com/'
  },
];

export default { projects };
