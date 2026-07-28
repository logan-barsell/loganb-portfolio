import React from 'react';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { colors } from '../theme/colors';

const baseSx = {
  textTransform: 'none',
  fontWeight: 600,
};

/** Visible on dark bg — MUI’s default disabled opacity (~0.38) washes green out. */
const disabledSx = {
  opacity: 1,
  color: colors.greenMuted,
  borderColor: colors.greenMuted,
  WebkitTextFillColor: colors.greenMuted,
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
  const { '&.Mui-disabled': disabledOverride, ...restSx } = sx;

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
      ...restSx,
      '&.Mui-disabled': {
        ...disabledSx,
        ...(secondary ? { borderColor: 'transparent' } : {}),
        ...disabledOverride,
      },
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

  if (href) {
    return (
      <Button href={href} {...sharedProps}>
        {children}
      </Button>
    );
  }

  return <Button {...sharedProps}>{children}</Button>;
};

export default CtaButton;
