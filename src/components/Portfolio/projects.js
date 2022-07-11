import isurveyu from '../../images/portfolio/iSurveyU.png';
import spotifyapp from '../../images/portfolio/spotifyapp-tn.png';


export const projects = [
  {
    title: 'iSurveyU',
    type: 'Feedback Application',
    img: isurveyu,
    desc: '',
    buildList: [
      'React/Redux, MaterializeCSS',
      'Node.js, Express, MongoDB',
      'Google API, Stripe API',
      'Google OAuth Authentication'
    ],
    hosted: 'Heroku',
    link: 'https://shielded-scrubland-86500.herokuapp.com/'
  },
  {
    title: 'Spotify Profile',
    type: 'Spotify Connected App',
    img: spotifyapp,
    desc: '',
    buildList: [
      'React/Redux, Styled Components',
      'Node.js, Express',
      'Spotify API',
      'Spotify OAuth Authentication'
    ],
    hosted: 'Heroku',
    link: 'https://my-spotify-profile-app.herokuapp.com/'
  }
];

export default { projects };