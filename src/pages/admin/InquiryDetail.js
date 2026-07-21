import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Section from '../../components/Section';
import FormStatus from '../../components/forms/FormStatus';
import {
  attachmentDownloadUrl,
  fetchAttachmentPreview,
  fetchInquiry,
} from '../../api/adminClient';
import { colors } from '../../theme/colors';

const previewableMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

function formatSubmitted(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Field({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ color: colors.purple, fontSize: 13, fontWeight: 700, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function DetailSection({ title, children }) {
  const content = React.Children.toArray(children).filter(Boolean);
  if (!content.length) return null;
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{ color: colors.green, mb: 1.5, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}
      >
        {title}
      </Typography>
      <Divider sx={{ borderColor: 'rgba(149, 99, 187, 0.35)', mb: 2 }} />
      {content}
    </Box>
  );
}

const InquiryDetail = () => {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchInquiry(id);
        if (!cancelled) setInquiry(data.inquiry);
      } catch (err) {
        if (!cancelled) {
          setInquiry(null);
          setError(err.message || 'Failed to load inquiry.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const openPreview = async (file) => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview({ file, loading: true, error: '', url: '', text: '' });

    try {
      const blob = await fetchAttachmentPreview(inquiry.id, file.id);
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
    }
  };

  useEffect(
    () => () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    },
    [preview?.url]
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Section title="Inquiry Detail">
        <Button
          component={RouterLink}
          to="/admin/inquiries"
          sx={{ color: colors.muted, textTransform: 'none', mb: 2, px: 0 }}
        >
          ← Back to inquiries
        </Button>

        {loading ? <Typography sx={{ color: colors.muted }}>Loading…</Typography> : null}
        {error ? <FormStatus status="error" message={error} /> : null}

        {inquiry ? (
          <>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
              <Chip
                label={
                  inquiry.type === 'contact' ? 'Contact' : inquiry.packageLabel || 'Project'
                }
                size="small"
                sx={{
                  color: colors.purple,
                  border: `1px solid ${colors.purple}`,
                  backgroundColor: 'rgba(149, 99, 187, 0.12)',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={inquiry.stageLabel}
                size="small"
                sx={{
                  color: colors.green,
                  border: `1px solid ${colors.green}`,
                  backgroundColor: colors.greenSoft,
                  fontWeight: 600,
                }}
              />
            </Stack>

            <DetailSection title="Contact">
              <Field label="Name" value={inquiry.name} />
              <Field label="Email" value={inquiry.email} />
              <Field label="Phone" value={inquiry.phone} />
              <Field label="Business name" value={inquiry.businessName} />
              <Field label="Message" value={inquiry.message} />
            </DetailSection>

            {inquiry.type === 'project' ? (
              <DetailSection title="Project Requirements">
                <Field label="Package" value={inquiry.packageLabel} />
                <Field label="Website goals" value={inquiry.websiteGoals} />
                <Field label="Current website" value={inquiry.currentWebsite} />
                <Field label="Requested features" value={inquiry.requestedFeatures} />
                <Field label="Inspiration links" value={inquiry.inspirationLinks} />
                <Field label="Domain info" value={inquiry.domainInfo} />
                <Field label="Branding notes" value={inquiry.brandingNotes} />
                <Field label="Content readiness" value={inquiry.contentReadiness} />
                <Field label="Timeline" value={inquiry.timeline} />
                <Field label="Budget" value={inquiry.budget} />
              </DetailSection>
            ) : null}

            <DetailSection title="Submission Metadata">
              <Field label="Submitted" value={formatSubmitted(inquiry.createdAt)} />
              <Field label="Notification status" value={inquiry.notificationStatus} />
              <Field label="Notification error" value={inquiry.notificationError} />
              <Field label="Inquiry ID" value={inquiry.id} />
            </DetailSection>

            {inquiry.type === 'project' ? (
              <DetailSection title="Attachments">
                {(inquiry.attachments || []).length === 0 ? (
                  <Typography sx={{ color: colors.muted }}>No attachments.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {inquiry.attachments.map((file) => (
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
                          href={attachmentDownloadUrl(inquiry.id, file.id)}
                          sx={{ color: colors.green, textTransform: 'none' }}
                        >
                          Download
                        </Button>
                      </Stack>
                    </Box>
                    ))}
                  </Stack>
                )}
              </DetailSection>
            ) : null}
          </>
        ) : null}
      </Section>

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
          <IconButton onClick={closePreview} aria-label="Close preview" sx={{ color: colors.green }}>
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
          {preview?.error ? <FormStatus status="error" message={preview.error} /> : null}
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
    </Box>
  );
};

export default InquiryDetail;
