import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { fetchInvoices } from '../../api/adminClient';
import { invoiceStatusChipSx } from '../../data/statusChips';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';
import AdminListPagination from './AdminListPagination';
import AdminListTable from './AdminListTable';
import {
  adminListActionsCellSx,
  adminListCellSx,
  adminListCenteredCellSx,
  adminListCompactCardSx,
  adminListViewLinkSx,
} from './adminListStyles';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ClientCell({ item }) {
  return (
    <>
      <Typography sx={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>
        {item.clientName || '—'}
      </Typography>
      {item.clientBusinessName ? (
        <Typography sx={{ color: colors.muted, fontSize: 13 }}>
          {item.clientBusinessName}
        </Typography>
      ) : null}
    </>
  );
}

/**
 * Paginated invoices list for admin pages.
 * @param {'full'|'client'|'project'} variant
 *   full — Client, Email, Kind, Amount, Status, Paid, View Project
 *   client — Kind, Amount, Status, Paid, View Project (no client cols)
 *   project — Kind, Amount, Status, Paid (already on project)
 */
export default function AdminInvoicesSection({
  variant = 'full',
  clientId = '',
  projectId = '',
  q = '',
  status = '',
  kind = '',
  pageSize = 25,
  /** When true, page is controlled via props (full Invoices page with URL params). */
  controlled = false,
  page: controlledPage,
  onPageChange,
  items: controlledItems,
  pagination: controlledPagination,
  loading: controlledLoading,
}) {
  const toast = useToast();
  const isCompact = useMediaQuery('(max-width:900px)');
  const [internalPage, setInternalPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(!controlled);

  const page = controlled ? controlledPage || 1 : internalPage;

  useEffect(() => {
    if (controlled) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchInvoices({
          q,
          status,
          kind,
          clientId,
          projectId,
          page,
          pageSize,
        });
        if (cancelled) return;
        setItems(data.items || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        setPagination({ page: 1, totalPages: 1, total: 0 });
        toast.error(err.message || 'Failed to load invoices.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [controlled, q, status, kind, clientId, projectId, page, pageSize, toast]);

  const displayItems = controlled ? controlledItems || [] : items;
  const displayPagination = controlled
    ? controlledPagination || { page: 1, totalPages: 1, total: 0 }
    : pagination;
  const displayLoading = controlled ? Boolean(controlledLoading) : loading;

  const handlePageChange = (next) => {
    if (controlled) onPageChange?.(next);
    else setInternalPage(next);
  };

  const showClient = variant === 'full';
  const showEmail = variant === 'full';
  const showViewProject = variant !== 'project';

  const columns = [
    ...(showClient ? [{ id: 'client', label: 'Client' }] : []),
    ...(showEmail ? [{ id: 'email', label: 'Email' }] : []),
    { id: 'kind', label: 'Kind' },
    { id: 'amount', label: 'Amount' },
    { id: 'status', label: 'Status', align: 'center' },
    { id: 'paid', label: 'Paid' },
    ...(showViewProject ? [{ id: 'actions', label: '', align: 'right' }] : []),
  ];

  const minWidth = variant === 'full' ? 880 : variant === 'client' ? 720 : 560;

  if (displayLoading && displayItems.length === 0) {
    return <Typography sx={{ color: colors.muted }}>Loading invoices…</Typography>;
  }

  if (!displayLoading && displayItems.length === 0) {
    return <Typography sx={{ color: colors.muted }}>No invoices found.</Typography>;
  }

  return (
    <Box>
      {isCompact ? (
        <Stack spacing={2}>
          {displayItems.map((item) => (
            <Card key={item.id} sx={adminListCompactCardSx}>
              <CardContent>
                {showClient ? (
                  <>
                    <Typography sx={{ color: colors.text, fontWeight: 600 }}>
                      {item.clientName || '—'}
                    </Typography>
                    {item.clientBusinessName ? (
                      <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                        {item.clientBusinessName}
                      </Typography>
                    ) : null}
                  </>
                ) : null}
                {showEmail ? (
                  <Typography sx={{ color: colors.muted, fontSize: 13, mt: showClient ? 0.5 : 0 }}>
                    {item.clientEmail || '—'}
                  </Typography>
                ) : null}
                <Typography
                  sx={{
                    color: colors.text,
                    fontWeight: showClient ? 500 : 600,
                    mt: showClient || showEmail ? 1 : 0,
                  }}
                >
                  {item.kindLabel} · {item.amountLabel}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={item.statusLabel || item.status}
                    size="small"
                    sx={invoiceStatusChipSx(item.status)}
                  />
                </Stack>
                <Typography sx={{ color: colors.muted, fontSize: 13, mt: 1 }}>
                  {item.paidAt ? `Paid ${formatDate(item.paidAt)}` : 'Not paid'}
                </Typography>
                {showViewProject ? (
                  <Button
                    component={RouterLink}
                    to={`/admin/projects/${item.projectId}`}
                    size="small"
                    sx={{ ...adminListViewLinkSx, mt: 1.5, px: 0 }}
                  >
                    View Project
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <AdminListTable columns={columns} minWidth={minWidth}>
          {displayItems.map((item) => (
            <TableRow key={item.id} hover>
              {showClient ? (
                <TableCell sx={adminListCellSx}>
                  <ClientCell item={item} />
                </TableCell>
              ) : null}
              {showEmail ? (
                <TableCell sx={adminListCellSx}>{item.clientEmail || '—'}</TableCell>
              ) : null}
              <TableCell sx={adminListCellSx}>{item.kindLabel}</TableCell>
              <TableCell sx={adminListCellSx}>{item.amountLabel}</TableCell>
              <TableCell sx={adminListCenteredCellSx}>
                <Chip
                  label={item.statusLabel || item.status}
                  size="small"
                  sx={invoiceStatusChipSx(item.status)}
                />
              </TableCell>
              <TableCell sx={{ ...adminListCellSx, color: colors.muted, fontSize: 13 }}>
                {item.paidAt ? formatDate(item.paidAt) : '—'}
              </TableCell>
              {showViewProject ? (
                <TableCell sx={adminListActionsCellSx}>
                  <Button
                    component={RouterLink}
                    to={`/admin/projects/${item.projectId}`}
                    size="small"
                    sx={adminListViewLinkSx}
                  >
                    View Project
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </AdminListTable>
      )}

      <AdminListPagination
        page={displayPagination.page}
        totalPages={displayPagination.totalPages}
        total={displayPagination.total}
        loading={displayLoading}
        onPageChange={handlePageChange}
      />
    </Box>
  );
}
