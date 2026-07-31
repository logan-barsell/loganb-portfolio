import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { datePickerSlotProps } from './datePickerStyles';

function parseYmd(ymd) {
  if (!ymd) return null;
  const parsed = dayjs(`${String(ymd).slice(0, 10)}T12:00:00`);
  return parsed.isValid() ? parsed : null;
}

/**
 * Themed admin date picker. Value is a local calendar date string `YYYY-MM-DD` (or '').
 *
 * @param {{
 *   label: string,
 *   value?: string | null,
 *   onChange: (ymd: string) => void,
 *   disabled?: boolean,
 *   error?: boolean,
 *   helperText?: React.ReactNode,
 *   fullWidth?: boolean,
 *   actions?: Array<'clear' | 'today' | 'cancel' | 'accept'>,
 * }} props
 */
const ThemedDatePicker = ({
  label,
  value = '',
  onChange,
  disabled = false,
  error = false,
  helperText = null,
  fullWidth = true,
  actions = ['clear', 'today'],
}) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      label={label}
      value={parseYmd(value)}
      onChange={(next) => {
        onChange(next && next.isValid() ? next.format('YYYY-MM-DD') : '');
      }}
      disabled={disabled}
      slotProps={{
        ...datePickerSlotProps,
        textField: {
          ...datePickerSlotProps.textField,
          fullWidth,
          error,
          helperText,
        },
        actionBar: {
          ...datePickerSlotProps.actionBar,
          actions,
        },
      }}
    />
  </LocalizationProvider>
);

export default ThemedDatePicker;
