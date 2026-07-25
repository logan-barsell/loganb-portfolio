import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { attachmentDownloadUrl, fetchAttachmentPreview } from '../../api/adminClient';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

const previewableMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * List + preview/download for inquiry attachments (admin only).
 * @param {{ inquiryId: string, attachments?: Array }} props
 */
const InquiryAttachments = ({ inquiryId, attachments = [] }) => {
  const toast = useToast();
  const [preview, setPreview] = useState(null);

  if (!inquiryId) {
    return <Typography sx={{ color: colors.muted }}>No linked inquiry.</Typography>;
  }

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const openPreview = async (file) => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview({ file, loading: true, error: '', url: '', text: '' });

    try {
      const blob = await fetchAttachmentPreview(inquiryId, file.id);
      if (file.mimeType === 'text/plain') {
        const text = await blob.text();
        setPreview({ file, loading: false, error: '', url: '', text });
      } else {
        const url = URL.createObjectURL(blob);
        setPreview({ file, loading: false, error: '', url, text: '' });
      }
    } catch (err) {
      setPreview({
        file,
        loading: false,
        error: err.message || 'Unable to preview attachment.',
        url: '',
        text: '',
      });
      toast.error(err.message || 'Unable to preview attachment.');
    }
  };

  return (
    <>
      {(attachments || []).length === 0 ? (
        <Typography sx={{ color: colors.muted }}>No attachments.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {attachments.map((file) => (
            <Box
              key={file.id}
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                borderRadius: 1,
                border: `1px solid rgba(149, 99, 187, 0.35)`,
                backgroundColor: colors.cardBg,
              }}
            >
              <Box>
                <Typography sx={{ color: colors.text }}>{file.originalName}</Typography>
                <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                  {file.mimeType} · {formatBytes(file.sizeBytes)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {previewableMimeTypes.has(file.mimeType) ? (
                  <Button
                    onClick={() => openPreview(file)}
                    sx={{ color: colors.purple, textTransform: 'none' }}
                  >
                    View
                  </Button>
                ) : null}
                <Button
                  component="a"
                  href={attachmentDownloadUrl(inquiryId, file.id)}
                  sx={{ color: colors.green, textTransform: 'none' }}
                >
                  Download
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Dialog
        open={Boolean(preview)}
        onClose={closePreview}
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
            {preview?.file?.originalName || 'Attachment preview'}
          </Typography>
          <IconButton onClick={closePreview} aria-label="Close Preview" sx={{ color: colors.green }}>
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
          {preview?.url && preview.file.mimeType.startsWith('image/') ? (
            <Box
              component="img"
              src={preview.url}
              alt={preview.file.originalName}
              sx={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : null}
          {preview?.url && preview.file.mimeType === 'application/pdf' ? (
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
    </>
  );
};

export default InquiryAttachments;
