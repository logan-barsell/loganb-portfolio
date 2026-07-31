import { colors } from '../../theme/colors';
import { fieldSx } from './formStyles';

const dateFieldSx = {
  ...fieldSx,
  '& .MuiInputAdornment-root .MuiIconButton-root': {
    color: '#fff',
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: '#fff',
  },
};

/** Shared MUI X DatePicker look for admin forms. */
export const datePickerSlotProps = {
  textField: {
    fullWidth: true,
    InputLabelProps: { shrink: true },
    sx: dateFieldSx,
  },
  inputAdornment: {
    position: 'start',
  },
  openPickerButton: {
    sx: { color: '#fff' },
  },
  openPickerIcon: {
    sx: { color: '#fff' },
  },
  desktopPaper: {
    sx: {
      backgroundColor: colors.navSolid,
      color: colors.text,
      border: `1px solid ${colors.purple}`,
      backgroundImage: 'none',
      '& .MuiPickersCalendarHeader-label': { color: colors.text },
      '& .MuiPickersArrowSwitcher-button': { color: colors.muted },
      '& .MuiDayCalendar-weekDayLabel': { color: colors.muted },
      '& .MuiPickersYear-yearButton': { color: colors.text },
      '& .MuiPickersYear-yearButton.Mui-selected': {
        backgroundColor: colors.green,
        color: colors.text,
      },
      '& .MuiPickersMonth-monthButton': { color: colors.text },
      '& .MuiPickersMonth-monthButton.Mui-selected': {
        backgroundColor: colors.green,
        color: colors.text,
      },
    },
  },
  layout: {
    sx: {
      backgroundColor: colors.navSolid,
      color: colors.text,
      backgroundImage: 'none',
    },
  },
  day: {
    sx: {
      color: colors.text,
      '&.MuiPickersDay-today': {
        borderColor: colors.purple,
      },
      '&.Mui-selected': {
        backgroundColor: `${colors.green} !important`,
        color: colors.text,
      },
      '&.Mui-selected:hover': {
        backgroundColor: colors.green,
      },
      '&:hover': {
        backgroundColor: colors.purpleSoft,
      },
    },
  },
  actionBar: {
    sx: {
      backgroundColor: colors.navSolid,
      '& .MuiButton-root': { color: colors.green },
    },
  },
};

