import React from 'react';
import Alert from '@mui/material/Alert';
import { colors } from '../../theme/colors';

const FormStatus = ({ status, message }) => {
  if (!status || !message) return null;

  const severity = status === 'success' ? 'success' : 'error';

  return (
    <Alert
      severity={severity}
      sx={{
        backgroundColor: severity === 'success' ? colors.greenSoft : 'rgba(240, 113, 120, 0.15)',
        color: colors.text,
        border: `1px solid ${severity === 'success' ? colors.green : '#f07178'}`,
        '& .MuiAlert-icon': {
          color: severity === 'success' ? colors.green : '#f07178',
        },
      }}
    >
      {message}
    </Alert>
  );
};

export default FormStatus;
