import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Section from '../components/Section';
import WorkGrid from '../components/Work/WorkGrid';
import InterestedCta from '../components/InterestedCta';
import { workItems, workCategories } from '../data/workItems';
import { colors } from '../theme/colors';

const Work = () => {
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    if (category === 'all') return workItems;
    return workItems.filter((item) => item.category === category);
  }, [category]);

  return (
    <Box sx={{ pb: 6 }}>
      <Section title="Work">
        <Typography sx={{ color: colors.muted, mb: 3, maxWidth: 720 }}>
          Case studies across client websites and software platforms.
        </Typography>
        <ToggleButtonGroup
          className="altFont"
          exclusive
          value={category}
          onChange={(_, value) => value && setCategory(value)}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            mb: 2,
            gap: 1,
            '& .MuiToggleButton-root': {
              color: colors.muted,
              borderColor: colors.purple,
              textTransform: 'none',
            },
            '& .Mui-selected': {
              color: `${colors.green} !important`,
              backgroundColor: `${colors.greenSoft} !important`,
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          {workCategories.map((cat) => (
            <ToggleButton key={cat.id} value={cat.id}>
              {cat.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <WorkGrid
          key={category}
          items={filtered}
          perPage={6}
          showPagination={filtered.length > 6}
        />
        <InterestedCta />
      </Section>
    </Box>
  );
};

export default Work;
