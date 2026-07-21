import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CodeIcon from '@mui/icons-material/Code';
import { colors } from '../theme/colors';

const Section = ({ title, children, id }) => {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), 250);
        }
      });
    });

    observer.observe(element);
    return () => observer.unobserve(element);
  }, []);

  return (
    <Box
      id={id}
      ref={ref}
      className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}
      sx={{ pt: { xs: 7, sm: 10 }, pb: 6 }}
    >
      {title ? (
        <Divider
          textAlign="left"
          sx={{
            fontVariant: 'small-caps',
            marginBottom: '20px',
            overflow: 'hidden',
            '&::before, &::after': {
              borderColor: colors.text,
            },
          }}
        >
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 600,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CodeIcon sx={{ fontSize: '50px', color: colors.purple }} />
            {title}
          </Typography>
        </Divider>
      ) : null}
      {children}
    </Box>
  );
};

export default Section;
