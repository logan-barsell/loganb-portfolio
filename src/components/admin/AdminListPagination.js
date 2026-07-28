import React from 'react';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { colors } from '../../theme/colors';
import { adminListPaginationSx } from './adminListStyles';

/**
 * Shared admin list pagination + total count footer.
 */
export default function AdminListPagination({
  page = 1,
  totalPages = 1,
  total = 0,
  loading = false,
  onPageChange,
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.min(Math.max(1, Number(page) || 1), safeTotalPages);
  const safeTotal = Number(total) || 0;

  return (
    <>
      {safeTotalPages > 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={safeTotalPages}
            page={safePage}
            onChange={(_e, next) => onPageChange?.(next)}
            color="primary"
            sx={adminListPaginationSx}
          />
        </Box>
      ) : null}

      {!loading && safeTotal > 0 ? (
        <Typography sx={{ color: colors.muted, mt: 2, fontSize: 13 }}>
          {safeTotal} total · page {safePage} of {safeTotalPages}
        </Typography>
      ) : null}
    </>
  );
}
