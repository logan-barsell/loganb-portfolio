import React from 'react';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { colors } from '../theme/colors';

const baseSx = {
  textTransform: 'none',
  fontWeight: 600,
};

const CtaButton = ({
  to,
  href,
  children,
  secondary = false,
  variant,
  size = 'large',
  sx = {},
  ...rest
}) => {
  const sharedProps = {
    className: 'altFont',
    variant: variant ?? (secondary ? 'text' : 'outlined'),
    size,
    color: 'success',
    sx: {
      ...baseSx,
      color: colors.green,
      ...(secondary
        ? {
            opacity: 0.85,
            '&:hover': {
              opacity: 1,
              backgroundColor: colors.greenSoft,
            },
          }
        : {}),
      ...sx,
    },
    ...rest,
  };

  if (to) {
    return (
      <Button component={RouterLink} to={to} {...sharedProps}>
        {children}
      </Button>
    );
  }

  return (
    <Button href={href} {...sharedProps}>
      {children}
    </Button>
  );
};

export default CtaButton;
