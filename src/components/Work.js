import * as React from 'react';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SignalWifi3BarIcon from '@mui/icons-material/SignalWifi3Bar';
import Button from '@mui/material/Button';
import { workHistory } from './workHistory';

const Work = () => {

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const { title, dates, summary, link } = workHistory[value];

  const renderSummary = summary.map((listItem, index) => (
    <Typography variant="body2" gutterBottom key={index}>
      <SignalWifi3BarIcon sx={{ fontSize: '11px', mr: 1, ml: -2, color: '#9563bb' }} />
      {listItem}
    </Typography>
  ));

  const StyledTabs = styled(Tabs)({
    '& .MuiTabs-indicator': {
      backgroundColor: '#9563bb',
    },
  });

  const StyledTab = styled((props) => <Tab {...props} />)(
    ({ theme }) => ({
      color: '#808dcb',
      '&.Mui-selected': {
        color: '#9563bb',
      }
    }),
  );

  const renderTabs = workHistory.map(({ company, id }) => (
    <StyledTab label={company} key={id} />
  ));

  return (
    <Box
      sx={{
        flexGrow: 1,
        color: '#808dcb',
        mx: { sm: 7, xs: 0 }
      }}
    >
      <StyledTabs
        className="altFont"
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        aria-label="visible arrows tabs example"
        sx={{
          [`& .${tabsClasses.scrollButtons}`]: {
            '&.Mui-disabled': { opacity: 0.3 }
          },
          my: 3
        }}
      >
        {renderTabs}
      </StyledTabs>
      <Container>
        <Box>
          <Typography variant='button' component='div' color="#d8e0f3">{title}</Typography>
          <Typography className="altFont" variant='subtitle2' component='div' >{dates}</Typography>
          <ul style={{ listStyleType: 'none' }}>
            {renderSummary}
          </ul>
          <Button
            href={link}
            target="_blank"
            className="altFont"
            variant="outlined"
            size="large"
            color='success'
            sx={{ color: '#34a92c', display: 'table', margin: '30px auto' }}
          >
            See Website
          </Button>
        </Box>
      </Container>

    </Box >
  );
};

export default Work;