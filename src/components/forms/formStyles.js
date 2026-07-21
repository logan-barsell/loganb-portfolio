import { colors } from '../../theme/colors';

export const fieldSx = {
  '& .MuiInputBase-root': { color: colors.text },
  '& .MuiInputLabel-root': { color: colors.muted },
  '& .MuiInputLabel-root.Mui-focused': { color: colors.green },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.purple },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.green,
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.green,
  },
  '& .MuiOutlinedInput-input:-webkit-autofill': {
    WebkitBoxShadow: `0 0 0 1000px ${colors.bg} inset`,
    WebkitTextFillColor: colors.text,
    caretColor: colors.text,
    transition: 'background-color 99999s ease-in-out 0s',
  },
  '& .MuiOutlinedInput-input:-webkit-autofill:hover': {
    WebkitBoxShadow: `0 0 0 1000px ${colors.bg} inset`,
    WebkitTextFillColor: colors.text,
  },
  '& .MuiOutlinedInput-input:-webkit-autofill:focus': {
    WebkitBoxShadow: `0 0 0 1000px ${colors.bg} inset`,
    WebkitTextFillColor: colors.text,
  },
  '& .MuiFormHelperText-root': { color: colors.muted },
  '& .MuiFormHelperText-root.Mui-error': { color: '#f07178' },
  '& .MuiSelect-icon': { color: colors.muted },
};

export const selectMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: colors.navSolid,
      color: colors.text,
      border: `1px solid ${colors.purple}`,
    },
  },
};
