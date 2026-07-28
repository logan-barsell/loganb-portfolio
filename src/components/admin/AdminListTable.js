import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  adminListActionsCellSx,
  adminListCenteredCellSx,
  adminListCellSx,
  adminListHeaderCellSx,
  adminListTableContainerSx,
} from './adminListStyles';

/**
 * Desktop admin list table shell.
 * @param {{ id: string, label: string, align?: 'left'|'center'|'right', width?: number|string }[]} columns
 * @param {React.ReactNode} children — TableRow elements
 */
export default function AdminListTable({ columns = [], minWidth = 720, children, size = 'small' }) {
  return (
    <TableContainer sx={adminListTableContainerSx}>
      <Table size={size} sx={{ minWidth }}>
        <TableHead>
          <TableRow>
            {columns.map((col) => {
              const align = col.align || (col.id === 'actions' || col.label === '' ? 'right' : 'left');
              const baseSx =
                align === 'center'
                  ? adminListCenteredCellSx
                  : align === 'right'
                    ? adminListActionsCellSx
                    : adminListCellSx;
              return (
                <TableCell
                  key={col.id || col.label || 'actions'}
                  sx={{
                    ...baseSx,
                    ...adminListHeaderCellSx,
                    ...(col.width != null ? { width: col.width } : null),
                    ...(col.sx || null),
                  }}
                >
                  {col.label}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
