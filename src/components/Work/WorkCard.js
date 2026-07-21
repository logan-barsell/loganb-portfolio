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
import LinkIcon from '@mui/icons-material/Link';
import Box from '@mui/material/Box';
import { colors } from '../../theme/colors';

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

const WorkCard = ({ item }) => {
  const [expanded, setExpanded] = React.useState(false);

  const {
    title,
    type,
    img,
    imgBg,
    imgFit = 'cover',
    problem,
    solution,
    outcome,
    highlights = [],
    tech = [],
    link,
    role,
    clientType,
  } = item;

  const isLogo = imgFit === 'contain';

  return (
    <Card sx={{ maxWidth: 450, backgroundColor: colors.cardBg, margin: 'auto' }}>
      <CardHeader
        sx={{
          color: colors.text,
          '.MuiCardHeader-title': { fontWeight: 600 },
          '.MuiCardHeader-subheader': {
            color: colors.green,
            opacity: 0.85,
            fontWeight: 600,
          },
        }}
        action={
          link ? (
            <IconButton href={link} target="_blank" rel="noopener noreferrer" aria-label="Visit project">
              <LinkIcon className="hvr-icon" sx={{ fontSize: '30px', color: colors.muted }} />
            </IconButton>
          ) : null
        }
        title={title}
        subheader={type}
      />
      <Box
        {...(link
          ? {
              component: 'a',
              href: link,
              target: '_blank',
              rel: 'noopener noreferrer',
              'aria-label': `View ${title} site`,
            }
          : {})}
        sx={{
          height: 240,
          my: 1,
          mx: isLogo ? 2 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: imgBg || 'transparent',
          borderRadius: isLogo ? 1 : 0,
          overflow: 'hidden',
          cursor: link ? 'pointer' : 'default',
          textDecoration: 'none',
          transition: 'opacity 200ms ease',
          ...(link ? { '&:hover': { opacity: 0.85 } } : {}),
        }}
      >
        <CardMedia
          component="img"
          image={img}
          alt={`${title} thumbnail`}
          sx={{
            height: isLogo ? '70%' : '100%',
            width: isLogo ? '80%' : '100%',
            objectFit: imgFit,
            opacity: isLogo ? 1 : 0.85,
          }}
        />
      </Box>
      <CardContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 600, mb: 1 }}>
          {role}
          {clientType ? ` · ${clientType}` : ''}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text }}>
          {problem}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <ExpandMore
          className="hvr-icon"
          expand={expanded}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon sx={{ fontSize: '30px', color: colors.text }} />
        </ExpandMore>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent className="altFont" sx={{ color: colors.green }}>
          <Typography paragraph sx={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>
            Solution
          </Typography>
          <Typography paragraph sx={{ color: colors.muted, fontSize: '14px' }}>
            {solution}
          </Typography>
          <Typography paragraph sx={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>
            Outcome
          </Typography>
          <Typography paragraph sx={{ color: colors.muted, fontSize: '14px' }}>
            {outcome}
          </Typography>
          {highlights.length > 0 ? (
            <>
              <Typography paragraph sx={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>
                Highlights
              </Typography>
              <Box component="ul" sx={{ pl: 2, color: colors.muted, m: 0 }}>
                {highlights.map((h) => (
                  <Typography component="li" key={h} variant="body2" sx={{ mb: 0.5 }}>
                    {h}
                  </Typography>
                ))}
              </Box>
            </>
          ) : null}
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: colors.text, mt: 2, mb: 1.5 }}>
            Technologies
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 3,
              justifyContent: 'center',
            }}
          >
            {tech.map((itemTech) => (
              <Box
                key={itemTech}
                component="span"
                sx={{
                  px: 1.25,
                  py: 0.5,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: colors.green,
                  border: `1px solid ${colors.green}66`,
                  backgroundColor: colors.greenSoft,
                  borderRadius: '4px',
                  letterSpacing: '0.02em',
                }}
              >
                {itemTech}
              </Box>
            ))}
          </Box>
          {link ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                color="success"
                sx={{ color: colors.green }}
              >
                View Site
              </Button>
            </Box>
          ) : null}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default WorkCard;
