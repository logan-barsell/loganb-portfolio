import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SignalWifi3BarIcon from '@mui/icons-material/SignalWifi3Bar';
import Button from '@mui/material/Button';
import { experience } from '../../data/experience';
import { colors } from '../../theme/colors';

const StyledTab = styled((props) => <Tab {...props} />)(() => ({
  color: colors.muted,
  '&.Mui-selected': {
    color: colors.purple,
  },
}));

const ExperienceTabs = () => {
  const [value, setValue] = useState(0);
  const { title, dates, summary, link } = experience[value];

  return (
    <Box
      sx={{
        flexGrow: 1,
        color: colors.muted,
        mx: { sm: 3, xs: 0 },
      }}
    >
      <Tabs
        className="altFont"
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        aria-label="Work experience"
        sx={{
          [`& .${tabsClasses.scrollButtons}`]: {
            '&.Mui-disabled': { opacity: 0.3 },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: colors.purple,
          },
          my: 3,
        }}
      >
        {experience.map((item) => (
          <StyledTab label={item.company} key={item.id} />
        ))}
      </Tabs>
      <Container>
        <Box>
          <Typography variant="button" component="div" color={colors.text}>
            {title}
          </Typography>
          <Typography className="altFont" variant="subtitle2" component="div">
            {dates}
          </Typography>
          <ul style={{ listStyleType: 'none', paddingLeft: 16 }}>
            {summary.map((listItem) => (
              <Typography variant="body2" gutterBottom component="li" key={listItem}>
                <SignalWifi3BarIcon
                  sx={{ fontSize: '11px', mr: 1, ml: -2, color: colors.purple }}
                />
                {listItem}
              </Typography>
            ))}
          </ul>
          {link ? (
            <Button
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="altFont"
              variant="outlined"
              size="large"
              color="success"
              sx={{ color: colors.green, display: 'table', margin: '30px auto' }}
            >
              Visit Website
            </Button>
          ) : null}
        </Box>
      </Container>
    </Box>
  );
};

export default ExperienceTabs;
