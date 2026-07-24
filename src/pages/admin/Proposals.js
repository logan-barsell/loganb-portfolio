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
import { fetchProposals } from '../../api/adminClient';
import {
  inquiryTypeChipLabel,
  proposalSortOptions,
  proposalStatusOptions,
  resolveStageLabel,
} from '../../data/adminNav';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

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

function readParams(searchParams) {
  return {
    q: searchParams.get('q') || '',
    status: searchParams.get('status') || '',
    sort: searchParams.get('sort') || 'created_at',
    dir: searchParams.get('dir') || 'desc',
    page: Number(searchParams.get('page') || 1) || 1,
  };
}

/** Prefer inquiry pipeline; fall back from local proposal status if API omits stage. */
function proposalPipelineStage(item) {
  if (item.inquiryStage) return item.inquiryStage;
  if (item.status === 'sent') return 'sent_proposal';
  if (item.status === 'declined') return 'declined_proposal';
  if (item.status === 'draft') return 'draft_proposal';
  return null;
}

const pipelineChip = (item) => {
  const stage = proposalPipelineStage(item);
  const label = resolveStageLabel(stage, item.inquiryStageLabel);
  if (!label) return null;
  return (
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
  );
};

const typeChip = (item) => (
  <Chip
    label={inquiryTypeChipLabel(item.inquiryType, item.packageLabel, item.packageSlug)}
    size="small"
    sx={{
      color: colors.purple,
      border: `1px solid ${colors.purple}`,
      backgroundColor: 'rgba(149, 99, 187, 0.12)',
      fontWeight: 600,
    }}
  />
);

const Proposals = () => {
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
      if (next.status) sp.set('status', next.status);
      if (next.sort && next.sort !== 'created_at') sp.set('sort', next.sort);
      if (next.dir && next.dir !== 'desc') sp.set('dir', next.dir);
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
        const data = await fetchProposals(params);
        if (cancelled) return;
        setItems(data.items || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        toast.error(err.message || 'Failed to load proposals.');
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
  const actionsCellSx = { ...cellSx, textAlign: 'right', width: '1%' };

  return (
    <Box sx={{ pb: 4 }}>
      <Section title="Proposals">
        <Typography sx={{ color: colors.muted, mb: 3, maxWidth: 720 }}>
          Draft and send scoped offers from linked inquiries. Create a proposal from an inquiry
          detail page when a client is attached.
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
              md: '2fr 1fr 1fr 1fr auto',
            },
            alignItems: 'center',
          }}
        >
          <TextField
            label="Search Client Name, Business, Email"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            sx={fieldSx}
            size="small"
          />
          <FormControl size="small" sx={fieldSx}>
            <InputLabel id="proposal-status-label">Proposal Status</InputLabel>
            <Select
              labelId="proposal-status-label"
              label="Proposal Status"
              value={params.status}
              MenuProps={selectMenuProps}
              onChange={(e) => updateParams({ status: e.target.value }, { resetPage: true })}
            >
              {proposalStatusOptions.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={fieldSx}>
            <InputLabel id="proposal-sort-label">Sort</InputLabel>
            <Select
              labelId="proposal-sort-label"
              label="Sort"
              value={params.sort}
              MenuProps={selectMenuProps}
              onChange={(e) => updateParams({ sort: e.target.value }, { resetPage: true })}
            >
              {proposalSortOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={fieldSx}>
            <InputLabel id="proposal-dir-label">Direction</InputLabel>
            <Select
              labelId="proposal-dir-label"
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

        {loading ? <Typography sx={{ color: colors.muted }}>Loading proposals…</Typography> : null}
        {!loading && items.length === 0 ? (
          <Typography sx={{ color: colors.muted }}>No proposals match these filters.</Typography>
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
                  <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                    {typeChip(item)}
                    {pipelineChip(item)}
                  </Stack>
                  <Typography sx={{ color: colors.text, fontWeight: 600 }}>
                    {item.clientName}
                  </Typography>
                  <Typography sx={{ color: colors.muted, fontSize: 14 }}>
                    {item.clientBusinessName || item.clientEmail} · {item.designAmountLabel}
                  </Typography>
                  <Typography sx={{ color: colors.muted, fontSize: 13, mt: 0.5 }}>
                    {item.sentAt ? `Sent ${formatDate(item.sentAt)}` : `Created ${formatDate(item.createdAt)}`}
                  </Typography>
                  <Button
                    component={RouterLink}
                    to={`/admin/proposals/${item.id}`}
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
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {['Client', 'Type', 'Stage', 'Design', 'Sent / Created', ''].map((label) => (
                    <TableCell
                      key={label || 'actions'}
                      sx={{
                        ...(label === ''
                          ? actionsCellSx
                          : ['Type', 'Stage'].includes(label)
                            ? centeredCellSx
                            : cellSx),
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
                        {item.clientName}
                      </Typography>
                      <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                        {item.clientBusinessName || item.clientEmail}
                      </Typography>
                    </TableCell>
                    <TableCell sx={centeredCellSx}>{typeChip(item)}</TableCell>
                    <TableCell sx={centeredCellSx}>
                      {pipelineChip(item) || '—'}
                    </TableCell>
                    <TableCell sx={cellSx}>{item.designAmountLabel}</TableCell>
                    <TableCell sx={cellSx}>
                      {item.sentAt ? formatDate(item.sentAt) : formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell sx={actionsCellSx}>
                      <Button
                        component={RouterLink}
                        to={`/admin/proposals/${item.id}`}
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

export default Proposals;
