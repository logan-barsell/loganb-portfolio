import React, { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import WorkCard from './WorkCard';
import { colors } from '../../theme/colors';

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 780, md: 900, lg: 1200, xl: 1536 },
  },
});

const WorkGrid = ({ items, perPage = 2, showPagination = true }) => {
  const [page, setPage] = useState(1);
  const count = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(page, count);

  const start = (currentPage - 1) * perPage;
  const visible = showPagination ? items.slice(start, start + perPage) : items;

  return (
    <Box my={4}>
      {showPagination && items.length > perPage ? (
        <Pagination
          count={count}
          page={currentPage}
          shape="rounded"
          onChange={(_, value) => setPage(value)}
          sx={{
            my: 2,
            '.MuiPaginationItem-root': { color: colors.muted },
            '.MuiPaginationItem-root:hover': { backgroundColor: colors.greenSoft },
            '.MuiPagination-ul': { justifyContent: 'center' },
            '.MuiPaginationItem-root.Mui-selected': {
              backgroundColor: colors.greenSelected,
              color: colors.green,
            },
            '.MuiPaginationItem-root.Mui-selected:hover': {
              backgroundColor: colors.greenSelected,
            },
          }}
        />
      ) : null}
      <ThemeProvider theme={theme}>
        <Grid container spacing={3} alignItems="flex-start">
          {visible.map((item) => (
            <Grid key={item.id} item xs={12} sm={6} my={1}>
              <WorkCard item={item} />
            </Grid>
          ))}
        </Grid>
      </ThemeProvider>
    </Box>
  );
};

export default WorkGrid;
