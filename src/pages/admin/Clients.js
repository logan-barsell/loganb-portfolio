import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import AdminListPagination from '../../components/admin/AdminListPagination';
import AdminListTable from '../../components/admin/AdminListTable';
import {
  adminListActionsCellSx,
  adminListCellSx,
  adminListCenteredCellSx,
  adminListViewLinkSx,
} from '../../components/admin/adminListStyles';
import CtaButton from '../../components/CtaButton';
import Section from '../../components/Section';
import { fieldSx, selectMenuProps } from '../../components/forms/formStyles';
import { fetchClients } from '../../api/adminClient';
import { clientSortOptions, resolveStageLabel } from '../../data/adminNav';
import { pipelineStageChipSx } from '../../data/statusChips';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

function readParams(searchParams) {
  return {
    q: searchParams.get('q') || '',
    sort: searchParams.get('sort') || 'name',
    dir: searchParams.get('dir') || 'asc',
    page: Number(searchParams.get('page') || 1) || 1,
  };
}

const stageChip = (stage, apiLabel) => {
  const label = resolveStageLabel(stage, apiLabel);
  return label ? (
    <Chip label={label} size="small" sx={pipelineStageChipSx(stage)} />
  ) : (
    '—'
  );
};

const Clients = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => readParams(searchParams), [searchParams]);
  const [draftQ, setDraftQ] = useState(params.q);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const isCompact = useMediaQuery('(max-width:900px)');

  useEffect(() => {
    setDraftQ(params.q);
  }, [params.q]);

  const updateParams = useCallback(
    (patch, { resetPage = false } = {}) => {
      const next = { ...params, ...patch };
      if (resetPage) next.page = 1;
      const sp = new URLSearchParams();
      if (next.q) sp.set('q', next.q);
      if (next.sort && next.sort !== 'name') sp.set('sort', next.sort);
      if (next.dir && next.dir !== 'asc') sp.set('dir', next.dir);
      if (next.page > 1) sp.set('page', String(next.page));
      setSearchParams(sp, { replace: true });
    },
    [params, setSearchParams]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchClients(params);
        if (cancelled) return;
        setItems(data.items || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        toast.error(err.message || 'Failed to load clients.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, toast]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateParams({ q: draftQ.trim() }, { resetPage: true });
  };

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'stage', label: 'Stage', align: 'center' },
    { id: 'actions', label: '', align: 'right' },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      <Section title="Clients">
        <Typography sx={{ color: colors.muted, mb: 3, maxWidth: 720 }}>
          Clients are created from Start a Project intakes. Contact messages link when the email
          already matches.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: 'grid',
            gap: 2,
            mb: 3,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '2fr 1fr 1fr auto',
            },
            alignItems: 'center',
          }}
        >
          <TextField
            label="Search Name, Business, Email"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            sx={fieldSx}
            size="small"
          />
          <FormControl size="small" sx={fieldSx}>
            <InputLabel id="client-sort-label">Sort</InputLabel>
            <Select
              labelId="client-sort-label"
              label="Sort"
              value={params.sort}
              MenuProps={selectMenuProps}
              onChange={(e) => updateParams({ sort: e.target.value }, { resetPage: true })}
            >
              {clientSortOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={fieldSx}>
            <InputLabel id="client-dir-label">Direction</InputLabel>
            <Select
              labelId="client-dir-label"
              label="Direction"
              value={params.dir}
              MenuProps={selectMenuProps}
              onChange={(e) => updateParams({ dir: e.target.value }, { resetPage: true })}
            >
              <MenuItem value="asc">Asc</MenuItem>
              <MenuItem value="desc">Desc</MenuItem>
            </Select>
          </FormControl>
          <CtaButton type="submit" size="medium" sx={{ height: 40 }}>
            Search
          </CtaButton>
        </Box>

        {loading ? <Typography sx={{ color: colors.muted }}>Loading clients…</Typography> : null}
        {!loading && items.length === 0 ? (
          <Typography sx={{ color: colors.muted }}>No clients match these filters.</Typography>
        ) : null}

        {!loading && items.length > 0 && isCompact ? (
          <Stack spacing={2}>
            {items.map((item) => (
              <Card
                key={item.id}
                sx={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid rgba(149, 99, 187, 0.35)`,
                }}
              >
                <CardContent>
                  <Typography sx={{ color: colors.text, fontWeight: 600 }}>{item.name}</Typography>
                  {item.businessName ? (
                    <Typography sx={{ color: colors.muted, fontSize: 14 }}>
                      {item.businessName}
                    </Typography>
                  ) : null}
                  <Typography sx={{ color: colors.muted, fontSize: 14 }}>
                    {item.email}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    {stageChip(item.stage, item.stageLabel)}
                  </Stack>
                  <Button
                    component={RouterLink}
                    to={`/admin/clients/${item.id}`}
                    sx={{ mt: 1.5, color: colors.green, textTransform: 'none', px: 0 }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : null}

        {!loading && items.length > 0 && !isCompact ? (
          <AdminListTable columns={columns} minWidth={720}>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={adminListCellSx}>
                  <Typography sx={{ color: colors.text, fontWeight: 600 }}>
                    {item.name}
                  </Typography>
                  {item.businessName ? (
                    <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                      {item.businessName}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell sx={adminListCellSx}>{item.email}</TableCell>
                <TableCell sx={adminListCenteredCellSx}>
                  {stageChip(item.stage, item.stageLabel)}
                </TableCell>
                <TableCell sx={adminListActionsCellSx}>
                  <Button
                    component={RouterLink}
                    to={`/admin/clients/${item.id}`}
                    size="small"
                    sx={adminListViewLinkSx}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </AdminListTable>
        ) : null}

        <AdminListPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          loading={loading}
          onPageChange={(page) => updateParams({ page })}
        />
      </Section>
    </Box>
  );
};

export default Clients;
