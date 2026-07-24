import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { colors } from '../theme/colors';

const ToastContext = createContext(null);

const MAX_TOASTS = 3;
const DEFAULT_DURATION = {
  success: 4000,
  error: 6000,
  info: 4000,
};

const alertSx = (severity) => {
  if (severity === 'error') {
    return {
      width: '100%',
      maxWidth: 420,
      backgroundColor: 'rgba(240, 113, 120, 0.15)',
      color: colors.text,
      border: '1px solid #f07178',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
      '& .MuiAlert-icon': { color: '#f07178' },
      '& .MuiAlert-action': { color: colors.muted },
    };
  }

  const accent = severity === 'info' ? colors.purple : colors.green;
  const soft = severity === 'info' ? 'rgba(149, 99, 187, 0.18)' : colors.greenSoft;

  return {
    width: '100%',
    maxWidth: 420,
    backgroundColor: soft,
    color: colors.text,
    border: `1px solid ${accent}`,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    '& .MuiAlert-icon': { color: accent },
    '& .MuiAlert-action': { color: colors.muted },
  };
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((severity, message, options = {}) => {
    const text = String(message || '').trim();
    if (!text) return;

    const id = createId();
    const next = {
      id,
      severity,
      message: text,
      autoHideDuration:
        options.autoHideDuration ?? DEFAULT_DURATION[severity] ?? DEFAULT_DURATION.info,
    };

    setToasts((prev) => [...prev, next].slice(-MAX_TOASTS));
  }, []);

  const api = useMemo(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      info: (message, options) => push('info', message, options),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={toast.autoHideDuration}
          onClose={(_event, reason) => {
            if (reason === 'clickaway') return;
            dismiss(toast.id);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            bottom: { xs: 24 + index * 72, sm: 24 + index * 72 },
            right: { xs: 16, sm: 24 },
          }}
        >
          <Alert
            severity={toast.severity === 'info' ? 'info' : toast.severity}
            variant="outlined"
            onClose={() => dismiss(toast.id)}
            sx={alertSx(toast.severity)}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider.');
  }
  return ctx;
}
