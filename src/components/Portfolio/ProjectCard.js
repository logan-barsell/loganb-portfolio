import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkIcon from '@mui/icons-material/Link';


const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));



const ProjectCard = ({ project }) => {

  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const { title, type, img, desc, buildList, hosted, github, link } = project;

  const renderBuildList = buildList.map((listItem, index) => (
    <Typography key={index} paragraph>{listItem}</Typography>
  ));

  return (
    <Card sx={{ maxWidth: 450, backgroundColor: 'rgba(0, 0, 0, 0.4)', margin: 'auto' }}>
      <CardHeader
        sx={{ color: '#d8e0f3', fontWeight: 600, '.MuiCardHeader-title': { fontWeight: 600 }, '.MuiCardHeader-subheader': { color: '#34a92c', opacity: 0.7, fontWeight: 600 } }}
        action={
          <IconButton href={link} target="_blank" aria-label="settings">
            <LinkIcon className="hvr-icon" sx={{ fontSize: '30px', color: '#808dcb' }} />
          </IconButton>
        }
        title={title}
        subheader={type}
      />
      <CardMedia
        sx={{ opacity: 0.8, my: 1 }}
        component="img"
        height="300"
        image={img}
        alt="Project Thumbnail"
      />
      {/* <CardContent>
        <Typography variant="body2" color="#808dcb" sx={{ fontSize: '15px' }}>
          {desc}
        </Typography>
      </CardContent> */}
      <CardActions disableSpacing>
        <IconButton href={github} target="_blank" aria-label="See code on GitHub">
          <GitHubIcon className="hvr-icon" sx={{ fontSize: '40px', color: '#34a92c' }} />
        </IconButton>
        <ExpandMore
          className="hvr-icon"
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon sx={{ fontSize: '30px', color: '#d8e0f3' }} />
        </ExpandMore>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent className="altFont" sx={{ color: '#34a92c', textAlign: 'center' }}>
          <Typography paragraph sx={{ fontSize: '22px', fontWeight: 600 }} >BUILT WITH</Typography>
          {renderBuildList}
          <Typography sx={{ fontVariant: 'small-caps', fontSize: '22px', fontWeight: '600', mt: 3 }}>
            Hosted on {hosted}
          </Typography>
          <Button href={link} target="_blank" variant="outlined" color="success" sx={{ color: '#34a92c', my: 1 }}>Visit Project</Button>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default ProjectCard;