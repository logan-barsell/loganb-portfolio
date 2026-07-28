import React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { fieldSx } from '../forms/formStyles';
import {
  paymentScheduleOptions,
  revisionLimitOptions,
} from '../../data/paymentSchedules';
import { hostingPlanOptions } from '../../data/hostingPlans';
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
        helperText={fieldErrors.summary || 'Short pitch: outcome and who it’s for.'}
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
        helperText={fieldErrors.scope || 'What work you’re doing (the engagement).'}
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
        helperText={
          fieldErrors.deliverables ||
          'Concrete outputs the client receives (one item per line).'
        }
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
        helperText={
          fieldErrors.exclusions ||
          'Explicitly not included—even if someone might assume it is.'
        }
        sx={fieldSx}
      />
      <TextField
        label="Timeline"
        value={values.timelineSummary}
        onChange={update('timelineSummary')}
        fullWidth
        disabled={disabled}
        error={Boolean(fieldErrors.timelineSummary)}
        helperText={
          fieldErrors.timelineSummary ||
          'Delivery duration after kickoff (e.g. 3–4 weeks after content).'
        }
        sx={fieldSx}
      />
      <TextField
        label="Target Kickoff Date"
        type="date"
        value={values.kickoffDate || ''}
        onChange={update('kickoffDate')}
        fullWidth
        disabled={disabled}
        InputLabelProps={{ shrink: true }}
        error={Boolean(fieldErrors.kickoffDate)}
        helperText={
          fieldErrors.kickoffDate ||
          'Earliest you’ll start; deposit can be paid earlier. Leave blank if flexible.'
        }
        sx={fieldSx}
      />
      <TextField
        select
        label="Revision Limit"
        value={values.revisionLimit === null || values.revisionLimit === undefined
          ? ''
          : String(values.revisionLimit)}
        onChange={update('revisionLimit')}
        fullWidth
        disabled={disabled}
        error={Boolean(fieldErrors.revisionLimit)}
        helperText={fieldErrors.revisionLimit || 'Included design/dev revision rounds.'}
        sx={fieldSx}
      >
        {revisionLimitOptions.map((opt) => (
          <MenuItem key={opt.label} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Payment Terms"
        value={values.paymentSchedule || ''}
        onChange={update('paymentSchedule')}
        fullWidth
        disabled={disabled}
        error={Boolean(fieldErrors.paymentSchedule)}
        helperText={fieldErrors.paymentSchedule || 'Drives portal payment buttons.'}
        sx={fieldSx}
      >
        {paymentScheduleOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
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
          select
          label="Hosting Plan"
          value={values.hostingPlan || 'none'}
          onChange={update('hostingPlan')}
          fullWidth
          disabled={disabled}
          error={Boolean(fieldErrors.hostingPlan)}
          helperText={fieldErrors.hostingPlan || 'Stripe subscription catalog'}
          sx={fieldSx}
        >
          {hostingPlanOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Typography sx={{ color: colors.muted, fontSize: 13 }}>
        Design price is stored in cents. Hosting uses a fixed Stripe Price ID per plan.
      </Typography>
    </Stack>
  );
};

export default ProposalFormFields;
