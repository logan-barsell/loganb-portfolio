import React from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '../../theme/colors';

/**
 * Shared attachment preview dialog (admin + client portal).
 * @param {{
 *   preview: null | {
 *     file?: { originalName?: string, mimeType?: string },
 *     loading?: boolean,
 *     error?: string,
 *     url?: string,
 *     text?: string,
 *   },
 *   onClose: () => void,
 * }} props
 */
const AttachmentPreviewDialog = ({ preview, onClose }) => (
  <Dialog
    open={Boolean(preview)}
    onClose={onClose}
    fullWidth
    maxWidth="lg"
    PaperProps={{
      sx: {
        height: { xs: '92vh', sm: '88vh' },
        backgroundColor: colors.navSolid,
        color: colors.text,
        border: `1px solid rgba(149, 99, 187, 0.5)`,
      },
    }}
  >
    <DialogTitle
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        borderBottom: `1px solid rgba(149, 99, 187, 0.35)`,
      }}
    >
      <Typography component="span" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
        {preview?.file?.originalName || 'Attachment Preview'}
      </Typography>
      <IconButton onClick={onClose} aria-label="Close Preview" sx={{ color: colors.green }}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent
      sx={{
        p: { xs: 1, sm: 2 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
      }}
    >
      {preview?.loading ? (
        <Typography sx={{ color: colors.muted }}>Loading preview…</Typography>
      ) : null}
      {preview?.error ? (
        <Typography sx={{ color: colors.muted }}>{preview.error}</Typography>
      ) : null}
      {preview?.url && preview.file?.mimeType?.startsWith('image/') ? (
        <Box
          component="img"
          src={preview.url}
          alt={preview.file.originalName}
          sx={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      ) : null}
      {preview?.url && preview.file?.mimeType === 'application/pdf' ? (
        <Box
          component="iframe"
          src={preview.url}
          title={preview.file.originalName}
          sx={{ width: '100%', height: '100%', border: 0, backgroundColor: '#fff' }}
        />
      ) : null}
      {!preview?.loading && !preview?.error && preview?.file?.mimeType === 'text/plain' ? (
        <Box
          component="pre"
          sx={{
            alignSelf: 'stretch',
            width: '100%',
            m: 0,
            p: 2,
            boxSizing: 'border-box',
            color: colors.text,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
          }}
        >
          {preview.text}
        </Box>
      ) : null}
    </DialogContent>
  </Dialog>
);

export default AttachmentPreviewDialog;
