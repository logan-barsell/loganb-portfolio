import { colors } from '../../theme/colors';

/** Shared cell styles for admin list tables. */
export const adminListCellSx = {
  color: colors.text,
  borderColor: 'rgba(149, 99, 187, 0.25)',
  whiteSpace: 'nowrap',
};
export const adminListCenteredCellSx = { ...adminListCellSx, textAlign: 'center' };
export const adminListActionsCellSx = { ...adminListCellSx, width: 120, textAlign: 'right' };

export const adminListTableContainerSx = {
  border: `1px solid rgba(149, 99, 187, 0.35)`,
  borderRadius: 1,
  overflowX: 'auto',
};

export const adminListHeaderCellSx = {
  color: colors.purple,
  fontWeight: 700,
};

export const adminListCompactCardSx = {
  backgroundColor: colors.cardBg,
  border: `1px solid rgba(149, 99, 187, 0.35)`,
};

export const adminListViewLinkSx = {
  color: colors.green,
  textTransform: 'none',
};

export const adminListPaginationSx = {
  '& .MuiPaginationItem-root': { color: colors.text },
  '& .Mui-selected': {
    backgroundColor: `${colors.greenSoft} !important`,
    color: colors.green,
  },
};
