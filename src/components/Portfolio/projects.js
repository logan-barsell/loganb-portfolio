import indiluv from '../../images/portfolio/indiluv.png';
import isurveyu from '../../images/portfolio/iSurveyU.png';
import spotifyapp from '../../images/portfolio/spotifyapp-tn.png';
import jbook from '../../images/portfolio/jsnote-tn.png';
import yesdevil from '../../images/portfolio/ydpictn2.png';
import marketingui from '../../images/portfolio/marketingui-tn.png';
import fhs from '../../images/portfolio/fhssitetn.png';
import bcsite from '../../images/portfolio/bcpictn.png';
import tc6 from '../../images/portfolio/colorsixtn.png';
import logan1 from '../../images/portfolio/portfoliov1.png';
import portfolio2 from '../../images/portfolio/portfolio2.png';
import audioplayer from '../../images/portfolio/audioplayer.png';


export const projects = [
  {
    title: 'indiLuv',
    type: 'eCommerce Website',
    img: indiluv,
    desc: 'Online Retail Store with dynamic shopping cart functionality and secure payments with Stripe API',
    buildList: [
      'React/Redux',
      'Styled Components, Material UI',
      'Node.js, Express, MongoDB',
      'Stripe API',
      'Email/Pass Authentication',
      'Firestore'
    ],
    hosted: 'Firebase',
    github: 'https://github.com/logan-barsell/MERN-eCommerce',
    link: 'https://indiluv-95c92.web.app/'
  },
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
      'GitHub Actions'
    ],
    hosted: 'DigitalOcean',
    github: 'https://github.com/logan-barsell/yesdevil-react',
    link: 'https://yesdevil.com/'
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
      'Google OAuth Authentication'
    ],
    hosted: 'Heroku',
    github: 'https://github.com/logan-barsell/emaily-app',
    link: 'https://shielded-scrubland-86500.herokuapp.com/'
  },
  {
    title: 'Spotify Profile',
    type: 'Spotify Connected App',
    img: spotifyapp,
    desc: 'Web app for visualizing personalized Spotify data.',
    buildList: [
      'React/Redux, Styled Components',
      'Node.js, Express',
      'Spotify API',
      'Spotify OAuth Authentication'
    ],
    hosted: 'Heroku',
    github: 'https://github.com/logan-barsell/newline-spotify-app',
    link: 'https://my-spotify-profile-app.herokuapp.com/'
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
      'Compiling/Bundling'
    ],
    hosted: 'NPM',
    github: 'https://github.com/logan-barsell/jbook',
    link: 'https://github.com/logan-barsell/jbook'
  },
  {
    title: 'Logan Barsell (V2)',
    type: 'Personal Website',
    img: portfolio2,
    desc: 'Portfolio website for a Web Developer to showcase skills and projects.',
    buildList: [
      'React, Material UI',
      'Node.js, Express',
      'GitHub Actions'
    ],
    hosted: 'DigitalOcean',
    github: 'https://github.com/logan-barsell/loganb-portfolio',
    link: 'https://loganbarsell.com/'
  },
  {
    title: 'Marketing.UI',
    type: 'Microfrontend',
    img: marketingui,
    desc: 'Mock business website implementing a microfrontend architecture',
    buildList: [
      'React, Material-UI',
      'Vue, PrimeVue, PrimeFlex',
      'Webpack bundling',
      'GitHub Actions'
    ],
    hosted: 'AWS Cloudfront',
    github: 'https://github.com/logan-barsell/mfp-react',
    link: 'https://d3jl9zfd971fgt.cloudfront.net/'
  },
  {
    title: 'Fawkes Home Solutions',
    type: 'Business Website',
    img: fhs,
    desc: 'Website for a home-buying business in the Bay Area',
    buildList: [
      'HTML, CSS, jQuery',
      'Bootstrap, SCSS',
      'Gulp.js'
    ],
    hosted: 'DigitalOcean',
    github: 'https://github.com/logan-barsell/FawkesHomeSolutions',
    link: 'https://www.fawkeshomesolutions.com/'
  },
  {
    title: 'Barsell Construction',
    type: 'Business Website',
    img: bcsite,
    desc: 'Website for a construction business in the Bay Area',
    buildList: [
      'HTML, CSS, jQuery',
      'Materialize CSS'
    ],
    hosted: 'DigitalOcean',
    github: 'https://github.com/logan-barsell/barsell-construction',
    link: 'https://barsellconstruction.com/'
  },
  {
    title: 'The Color Six',
    type: 'Band Website',
    img: tc6,
    desc: 'Website for a band to showcase music, events, photos, and  videos.',
    buildList: [
      'HTML, CSS, jQuery',
      'Materialize CSS',
      'Node.js, Express'
    ],
    hosted: 'Heroku',
    github: 'https://github.com/logan-barsell/barsell-construction',
    link: 'https://the-color-six.herokuapp.com/'
  },
  {
    title: 'Logan Barsell (V1)',
    type: 'Personal Website',
    img: logan1,
    desc: 'Portfolio website for a Web Developer to showcase skills and projects.',
    buildList: [
      'HTML, CSS, jQuery',
      'Bootstrap',
      'Node.js, Express'
    ],
    hosted: 'Heroku',
    github: 'https://github.com/logan-barsell/portfolio-site',
    link: 'https://loganbarsell-v1.herokuapp.com/'
  },
  {
    title: 'Custom Audio Player',
    type: 'React Component',
    img: audioplayer,
    desc: 'Dynamic music player with a song list and album art display.',
    buildList: [
      'React',
      'Bootstrap, CSS',
      'React H5 Audio Player'
    ],
    hosted: 'Netlify',
    github: 'https://github.com/logan-barsell/audio-player',
    link: 'https://audioplayer-react.netlify.app/'
  }
];

export default { projects };