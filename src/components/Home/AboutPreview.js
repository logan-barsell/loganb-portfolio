import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Section from '../Section';
import CtaButton from '../CtaButton';
import Headshot from '../Aboutme/Headshot';
import { colors } from '../../theme/colors';

const AboutPreview = () => {
  return (
    <Section title="About">
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={4}>
          <Headshot />
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ color: colors.text, mb: 2 }}>
            I&apos;m just your friendly neighborhood Computer-Man.
          </Typography>
          <Typography sx={{ color: colors.muted, mb: 2 }}>
            I&apos;m Logan, a web designer and developer focused on helping small businesses
            establish a professional online presence. I handle the process from planning and design
            through development, deployment, and ongoing support.
          </Typography>
          <Typography sx={{ color: colors.muted, mb: 3 }}>
            Whether you need a first website or a redesign, you get one clear point of contact and a
            site built to look sharp, load fast, and help customers reach you.
          </Typography>
          <CtaButton to="/about">More About Me</CtaButton>
        </Grid>
      </Grid>
    </Section>
  );
};

export default AboutPreview;
