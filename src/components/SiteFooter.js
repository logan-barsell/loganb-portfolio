import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import MailIcon from '@mui/icons-material/Mail';
import { Link as RouterLink } from 'react-router-dom';
import { footerNav, socialLinks } from '../data/nav';
import { colors } from '../theme/colors';
import CtaButton from './CtaButton';

const iconMap = {
  Email: MailIcon,
  LinkedIn: LinkedInIcon,
  GitHub: GitHubIcon,
};

const SiteFooter = ({
  navItems = footerNav,
  actionLabel = 'Start a Project',
  actionTo = '/start',
  onAction,
}) => {
  return (
    <Box
      component="footer"
      className="altFont"
      sx={{
        backgroundColor: colors.nav,
        color: colors.muted,
        pt: 6,
        pb: 4,
        mt: 4,
      }}
    >
      <Container>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600, mb: 1 }}>
              Logan Barsell Web Services
            </Typography>
            <Typography variant="body2">
              Design, development, launch, and hosting for small businesses.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" sx={{ color: colors.text, mb: 1 }}>
              Navigate
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  underline="hover"
                  sx={{ color: colors.muted, '&:hover': { color: colors.green } }}
                >
                  {item.label}
                </Link>
              ))}
              <CtaButton to={actionTo} onClick={onAction} size="small" sx={{ mt: 1.5 }}>
                {actionLabel}
              </CtaButton>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" sx={{ color: colors.text, mb: 1 }}>
              Connect
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {socialLinks.map((item) => {
                const Icon = iconMap[item.label];
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{
                      color: colors.muted,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': { color: colors.green },
                    }}
                  >
                    {Icon ? <Icon className="hvr-icon" sx={{ color: colors.purple }} /> : null}
                    {item.label}
                  </Link>
                );
              })}
            </Box>
          </Grid>
        </Grid>
        <Box
          sx={{
            mt: 5,
            pt: 3,
            borderTop: `1px solid ${colors.purple}33`,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="body2">© 2026 Logan Barsell</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link component={RouterLink} to="/privacy" underline="hover" sx={{ color: colors.muted }}>
              Privacy
            </Link>
            <Link component={RouterLink} to="/terms" underline="hover" sx={{ color: colors.muted }}>
              Terms
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default SiteFooter;
