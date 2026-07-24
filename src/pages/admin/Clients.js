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
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CtaButton from '../../components/CtaButton';
import Section from '../../components/Section';
import { fieldSx, selectMenuProps } from '../../components/forms/formStyles';
import { fetchClients } from '../../api/adminClient';
import { clientSortOptions, resolveStageLabel } from '../../data/adminNav';
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
    <Chip
      label={label}
      size="small"
      sx={{
        color: colors.green,
        border: `1px solid ${colors.green}`,
        backgroundColor: colors.greenSoft,
        fontWeight: 600,
      }}
    />
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
  }, [params]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateParams({ q: draftQ.trim() }, { resetPage: true });
  };

  const cellSx = {
    color: colors.text,
    borderColor: 'rgba(149, 99, 187, 0.25)',
    whiteSpace: 'nowrap',
  };
  const centeredCellSx = { ...cellSx, textAlign: 'center' };

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
          <TableContainer
            sx={{
              border: `1px solid rgba(149, 99, 187, 0.35)`,
              borderRadius: 1,
              overflowX: 'auto',
            }}
          >
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  {['Name', 'Email', 'Stage', ''].map((label) => (
                    <TableCell
                      key={label || 'actions'}
                      sx={{
                        ...(label === 'Stage' ? centeredCellSx : cellSx),
                        color: colors.purple,
                        fontWeight: 700,
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={cellSx}>
                      <Typography sx={{ color: colors.text, fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      {item.businessName ? (
                        <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                          {item.businessName}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell sx={cellSx}>{item.email}</TableCell>
                    <TableCell sx={centeredCellSx}>
                      {stageChip(item.stage, item.stageLabel)}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Button
                        component={RouterLink}
                        to={`/admin/clients/${item.id}`}
                        size="small"
                        sx={{ color: colors.green, textTransform: 'none' }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}

        {pagination.totalPages > 1 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_e, page) => updateParams({ page })}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': { color: colors.text },
                '& .Mui-selected': {
                  backgroundColor: `${colors.greenSoft} !important`,
                  color: colors.green,
                },
              }}
            />
          </Box>
        ) : null}

        {!loading && pagination.total > 0 ? (
          <Typography sx={{ color: colors.muted, mt: 2, fontSize: 13 }}>
            {pagination.total} total · page {pagination.page} of {pagination.totalPages}
          </Typography>
        ) : null}
      </Section>
    </Box>
  );
};

export default Clients;
