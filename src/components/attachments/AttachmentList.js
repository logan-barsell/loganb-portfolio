import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';
import AttachmentPreviewDialog from './AttachmentPreviewDialog';
import { formatBytes, previewableMimeTypes } from './attachmentUtils';

/**
 * Shared attachment list + preview (admin + client portal).
 * @param {{
 *   attachments?: Array<{ id: string, originalName: string, mimeType: string, sizeBytes: number }>,
 *   emptyMessage?: string,
 *   fetchPreview: (file: object) => Promise<Blob>,
 *   downloadUrl: (file: object) => string,
 *   renderActions?: (file: object) => React.ReactNode,
 * }} props
 */
const AttachmentList = ({
  attachments = [],
  emptyMessage = 'No attachments.',
  fetchPreview,
  downloadUrl,
  renderActions,
}) => {
  const toast = useToast();
  const [preview, setPreview] = useState(null);

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const openPreview = async (file) => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview({ file, loading: true, error: '', url: '', text: '' });

    try {
      const blob = await fetchPreview(file);
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
        <Typography sx={{ color: colors.muted }}>{emptyMessage}</Typography>
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
                  href={downloadUrl(file)}
                  sx={{ color: colors.green, textTransform: 'none' }}
                >
                  Download
                </Button>
                {renderActions ? renderActions(file) : null}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <AttachmentPreviewDialog preview={preview} onClose={closePreview} />
    </>
  );
};

export default AttachmentList;
