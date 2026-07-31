import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import AttachmentList from '../attachments/AttachmentList';
import { formatBytes } from '../attachments/attachmentUtils';
import CtaButton from '../CtaButton';
import {
  attachmentDownloadUrl,
  deleteInquiryAttachment,
  fetchAttachmentPreview,
  updateInquiryAttachmentVisibility,
  uploadInquiryAttachments,
} from '../../api/adminClient';
import { packageChipSx, pipelineStageChipSx } from '../../data/statusChips';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function buildPendingItems(fileList) {
  return Array.from(fileList || []).map((file) => ({
    file,
    previewUrl: IMAGE_MIME.has(file.type) ? URL.createObjectURL(file) : null,
  }));
}

function revokePendingItems(items) {
  (items || []).forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
}

/**
 * List + manage inquiry attachments (admin upload / visibility / delete).
 * @param {{
 *   inquiryId: string,
 *   attachments?: Array,
 *   onAttachmentsChange?: (attachments: Array) => void,
 * }} props
 */
const InquiryAttachments = ({ inquiryId, attachments = [], onAttachmentsChange }) => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const [clientVisible, setClientVisible] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!inquiryId) {
    return <Typography sx={{ color: colors.muted }}>No linked inquiry.</Typography>;
  }

  const notifyChange = (next) => {
    if (typeof onAttachmentsChange === 'function') {
      onAttachmentsChange(next);
    }
  };

  const clearPending = () => {
    setPendingItems((prev) => {
      revokePendingItems(prev);
      return [];
    });
    setClientVisible(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilePick = (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    setPendingItems((prev) => {
      revokePendingItems(prev);
      return buildPendingItems(files);
    });
    setClientVisible(true);
  };

  const closeUploadModal = () => {
    if (uploading) return;
    clearPending();
  };

  const confirmUpload = async () => {
    if (uploading || !pendingItems.length) return;
    setUploading(true);
    try {
      const files = pendingItems.map((item) => item.file);
      const data = await uploadInquiryAttachments(inquiryId, files, { clientVisible });
      notifyChange(data.attachments || []);
      toast.success('Files uploaded.');
      clearPending();
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleVisibility = async (file) => {
    if (busyId || deleting) return;
    setBusyId(file.id);
    try {
      const data = await updateInquiryAttachmentVisibility(
        inquiryId,
        file.id,
        !file.clientVisible
      );
      notifyChange(data.attachments || []);
      toast.success(file.clientVisible ? 'Hidden from client portal.' : 'Shown on client portal.');
    } catch (err) {
      toast.error(err.message || 'Could not update visibility.');
    } finally {
      setBusyId(null);
    }
  };

  const openDeleteModal = (file) => {
    if (busyId || deleting) return;
    setPendingDelete(file);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const data = await deleteInquiryAttachment(inquiryId, pendingDelete.id);
      notifyChange(data.attachments || []);
      toast.success('Attachment removed.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message || 'Could not remove attachment.');
    } finally {
      setDeleting(false);
    }
  };

  const uploadOpen = pendingItems.length > 0;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <CtaButton
          type="button"
          size="medium"
          secondary
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Files
        </CtaButton>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          multiple
          onChange={handleFilePick}
        />
        <Typography sx={{ color: colors.muted, fontSize: 13 }}>
          Logos, content, sitemaps, designs (max 5 at a time).
        </Typography>
      </Stack>

      <AttachmentList
        attachments={attachments}
        emptyMessage="No attachments."
        fetchPreview={(file) => fetchAttachmentPreview(inquiryId, file.id)}
        downloadUrl={(file) => attachmentDownloadUrl(inquiryId, file.id)}
        renderMeta={(file) => (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
            <Chip
              label={file.uploadedBy === 'admin' ? 'Admin' : 'Client'}
              size="small"
              sx={file.uploadedBy === 'admin' ? packageChipSx : pipelineStageChipSx('new')}
            />
            {!file.clientVisible ? (
              <Chip
                label="Hidden"
                size="small"
                sx={{
                  color: colors.muted,
                  border: `1px solid ${colors.muted}`,
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                }}
              />
            ) : null}
          </Stack>
        )}
        renderActions={(file) => (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              onClick={() => handleToggleVisibility(file)}
              disabled={busyId === file.id}
              sx={{ color: colors.purple, textTransform: 'none' }}
            >
              {file.clientVisible ? 'Hide' : 'Show'}
            </Button>
            <Button
              onClick={() => openDeleteModal(file)}
              disabled={busyId === file.id || deleting}
              sx={{ color: colors.muted, textTransform: 'none' }}
            >
              Remove
            </Button>
          </Box>
        )}
      />

      <Dialog
        open={uploadOpen}
        onClose={closeUploadModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
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
            color: colors.text,
            pr: 1,
          }}
        >
          Upload Files
          <IconButton
            aria-label="Close"
            onClick={closeUploadModal}
            disabled={uploading}
            sx={{
              color: colors.muted,
              '&.Mui-disabled': {
                opacity: 1,
                color: colors.muted,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.muted, mb: 2, fontSize: 14 }}>
            Review the selected files, then choose whether clients can see them on the portal.
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            {pendingItems.map(({ file, previewUrl }) => (
              <Box
                key={`${file.name}-${file.size}-${file.lastModified}`}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 1,
                  border: `1px solid rgba(149, 99, 187, 0.35)`,
                  backgroundColor: colors.cardBg,
                }}
              >
                {previewUrl ? (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt=""
                    sx={{
                      width: 48,
                      height: 48,
                      objectFit: 'cover',
                      borderRadius: 0.75,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 0.75,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(149, 99, 187, 0.15)',
                      color: colors.purple,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    FILE
                  </Box>
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: colors.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                    {file.type || 'unknown'} · {formatBytes(file.size)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={clientVisible}
                onChange={(e) => setClientVisible(e.target.checked)}
                disabled={uploading}
                sx={{ color: colors.purple, '&.Mui-checked': { color: colors.purple } }}
              />
            }
            label={
              <Typography sx={{ color: colors.text, fontSize: 14 }}>
                Show on Client Portal
              </Typography>
            }
            sx={{ mb: 3, ml: 0 }}
          />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              onClick={closeUploadModal}
              disabled={uploading}
              sx={{
                color: colors.muted,
                textTransform: 'none',
                '&.Mui-disabled': {
                  opacity: 1,
                  color: colors.muted,
                  WebkitTextFillColor: colors.muted,
                },
              }}
            >
              Cancel
            </Button>
            <CtaButton size="medium" onClick={confirmUpload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </CtaButton>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={closeDeleteModal}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
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
            color: colors.text,
            pr: 1,
          }}
        >
          Remove Attachment?
          <IconButton
            aria-label="Close"
            onClick={closeDeleteModal}
            disabled={deleting}
            sx={{
              color: colors.muted,
              '&.Mui-disabled': {
                opacity: 1,
                color: colors.muted,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.muted, mb: 3, fontSize: 14 }}>
            {pendingDelete
              ? `Remove “${pendingDelete.originalName}”? This can’t be undone.`
              : 'This can’t be undone.'}
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              onClick={closeDeleteModal}
              disabled={deleting}
              sx={{
                color: colors.muted,
                textTransform: 'none',
                '&.Mui-disabled': {
                  opacity: 1,
                  color: colors.muted,
                  WebkitTextFillColor: colors.muted,
                },
              }}
            >
              Cancel
            </Button>
            <CtaButton size="medium" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Removing…' : 'Remove'}
            </CtaButton>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default InquiryAttachments;
