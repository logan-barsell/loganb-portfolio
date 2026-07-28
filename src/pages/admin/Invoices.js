import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import CtaButton from '../../components/CtaButton';
import Section from '../../components/Section';
import AdminInvoicesSection from '../../components/admin/AdminInvoicesSection';
import { fieldSx, selectMenuProps } from '../../components/forms/formStyles';
import { fetchInvoices } from '../../api/adminClient';
import { useToast } from '../../toast/ToastProvider';

function readParams(searchParams) {
  return {
    q: searchParams.get('q') || '',
    status: searchParams.get('status') || '',
    kind: searchParams.get('kind') || '',
    clientId: searchParams.get('clientId') || '',
    projectId: searchParams.get('projectId') || '',
    page: Number(searchParams.get('page') || 1) || 1,
  };
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'due', label: 'Due' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
];

const kindOptions = [
  { value: '', label: 'All Kinds' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'balance', label: 'Balance' },
  { value: 'full', label: 'Full' },
  { value: 'hosting', label: 'Hosting' },
];

const Invoices = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => readParams(searchParams), [searchParams]);
  const [draftQ, setDraftQ] = useState(params.q);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

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
      if (next.kind) sp.set('kind', next.kind);
      if (next.clientId) sp.set('clientId', next.clientId);
      if (next.projectId) sp.set('projectId', next.projectId);
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
        const data = await fetchInvoices(params);
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
  }, [params, toast]);

  return (
    <Box sx={{ pb: 4 }}>
      <Section title="Invoices">
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ q: draftQ }, { resetPage: true });
          }}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 3,
            alignItems: 'center',
          }}
        >
          <TextField
            label="Search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            size="small"
            sx={{ ...fieldSx, minWidth: 200, flex: '1 1 180px' }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={params.status}
              onChange={(e) => updateParams({ status: e.target.value }, { resetPage: true })}
              MenuProps={selectMenuProps}
              sx={fieldSx}
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Kind</InputLabel>
            <Select
              label="Kind"
              value={params.kind}
              onChange={(e) => updateParams({ kind: e.target.value }, { resetPage: true })}
              MenuProps={selectMenuProps}
              sx={fieldSx}
            >
              {kindOptions.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <CtaButton type="submit" size="medium" sx={{ height: 40 }}>
            Search
          </CtaButton>
        </Box>

        <AdminInvoicesSection
          variant="full"
          controlled
          page={params.page}
          onPageChange={(page) => updateParams({ page })}
          items={items}
          pagination={pagination}
          loading={loading}
        />
      </Section>
    </Box>
  );
};

export default Invoices;
