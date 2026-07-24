import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { fieldSx } from '../forms/formStyles';
import { colors } from '../../theme/colors';

/** Convert dollar input string to integer cents, or null if empty/invalid. */
export function dollarsToCents(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return NaN;
  return Math.round(num * 100);
}

export function centsToDollarsInput(cents) {
  if (cents === null || cents === undefined) return '';
  return (Number(cents) / 100).toFixed(2).replace(/\.00$/, '');
}

const ProposalFormFields = ({ values, fieldErrors = {}, onChange, disabled = false }) => {
  const update = (field) => (event) => onChange(field, event.target.value);

  return (
    <Stack spacing={2.5}>
      <TextField
        label="Summary"
        value={values.summary}
        onChange={update('summary')}
        fullWidth
        multiline
        minRows={2}
        disabled={disabled}
        error={Boolean(fieldErrors.summary)}
        helperText={fieldErrors.summary}
        sx={fieldSx}
      />
      <TextField
        label="Scope"
        value={values.scope}
        onChange={update('scope')}
        fullWidth
        multiline
        minRows={4}
        disabled={disabled}
        error={Boolean(fieldErrors.scope)}
        helperText={fieldErrors.scope}
        sx={fieldSx}
      />
      <TextField
        label="Deliverables"
        value={values.deliverables}
        onChange={update('deliverables')}
        fullWidth
        multiline
        minRows={3}
        disabled={disabled}
        error={Boolean(fieldErrors.deliverables)}
        helperText={fieldErrors.deliverables || 'One item per line is fine.'}
        sx={fieldSx}
      />
      <TextField
        label="Exclusions"
        value={values.exclusions}
        onChange={update('exclusions')}
        fullWidth
        multiline
        minRows={2}
        disabled={disabled}
        error={Boolean(fieldErrors.exclusions)}
        helperText={fieldErrors.exclusions}
        sx={fieldSx}
      />
      <TextField
        label="Timeline"
        value={values.timelineSummary}
        onChange={update('timelineSummary')}
        fullWidth
        disabled={disabled}
        error={Boolean(fieldErrors.timelineSummary)}
        helperText={fieldErrors.timelineSummary}
        sx={fieldSx}
      />
      <TextField
        label="Revision Limit"
        value={values.revisionLimit}
        onChange={update('revisionLimit')}
        fullWidth
        disabled={disabled}
        placeholder="e.g. 2 rounds of revisions"
        error={Boolean(fieldErrors.revisionLimit)}
        helperText={fieldErrors.revisionLimit}
        sx={fieldSx}
      />
      <TextField
        label="Payment Terms"
        value={values.paymentTerms}
        onChange={update('paymentTerms')}
        fullWidth
        multiline
        minRows={2}
        disabled={disabled}
        error={Boolean(fieldErrors.paymentTerms)}
        helperText={fieldErrors.paymentTerms}
        sx={fieldSx}
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        }}
      >
        <TextField
          label="Design Price (USD)"
          value={values.designAmountDollars}
          onChange={update('designAmountDollars')}
          required
          fullWidth
          disabled={disabled}
          inputProps={{ inputMode: 'decimal' }}
          error={Boolean(fieldErrors.designAmountCents)}
          helperText={fieldErrors.designAmountCents || 'Example: 1500 or 1500.00'}
          sx={fieldSx}
        />
        <TextField
          label="Hosting Monthly (USD)"
          value={values.hostingMonthlyDollars}
          onChange={update('hostingMonthlyDollars')}
          fullWidth
          disabled={disabled}
          inputProps={{ inputMode: 'decimal' }}
          error={Boolean(fieldErrors.hostingMonthlyCents)}
          helperText={fieldErrors.hostingMonthlyCents || 'Optional'}
          sx={fieldSx}
        />
      </Box>
      <Typography sx={{ color: colors.muted, fontSize: 13 }}>
        Amounts are stored in cents on the server. Currency is USD.
      </Typography>
    </Stack>
  );
};

export default ProposalFormFields;
