import React, { useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import Link from '@mui/material/Link';
import Section from '../components/Section';
import CtaButton from '../components/CtaButton';
import FormStatus from '../components/forms/FormStatus';
import { fieldSx, selectMenuProps } from '../components/forms/formStyles';
import { postFormData } from '../api/client';
import {
  packageOptions,
  packageLabels,
  timelineOptions,
  budgetOptions,
  contentReadinessOptions,
} from '../data/intakeOptions';
import { colors } from '../theme/colors';

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 15 * 1024 * 1024;

const initialValues = {
  name: '',
  email: '',
  phone: '',
  businessName: '',
  packageSlug: '',
  websiteGoals: '',
  currentWebsite: '',
  requestedFeatures: '',
  inspirationLinks: '',
  domainInfo: '',
  brandingNotes: '',
  contentReadiness: '',
  timeline: '',
  budget: '',
  companyWebsite: '',
};

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Start = () => {
  const [params] = useSearchParams();
  const fileInputRef = useRef(null);
  const packageFromUrl = params.get('package');
  const validPackage = packageOptions.some((option) => option.value === packageFromUrl)
    ? packageFromUrl
    : '';

  const [values, setValues] = useState({
    ...initialValues,
    packageSlug: validPackage,
  });
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedLabel = useMemo(
    () => (values.packageSlug ? packageLabels[values.packageSlug] : null),
    [values.packageSlug]
  );

  const totalBytes = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  const updateField = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;

    setFiles((existing) => {
      const existingKeys = new Set(existing.map(fileKey));
      const additions = [];
      let nextError = '';

      for (const file of selected) {
        if (existingKeys.has(fileKey(file))) continue;
        if (file.size > MAX_FILE_SIZE_BYTES) {
          nextError = `"${file.name}" exceeds the 5 MB per-file limit.`;
          continue;
        }
        if (existing.length + additions.length >= MAX_FILES) {
          nextError = `You can upload up to ${MAX_FILES} files.`;
          break;
        }
        const nextTotal =
          existing.reduce((sum, item) => sum + item.size, 0) +
          additions.reduce((sum, item) => sum + item.size, 0) +
          file.size;
        if (nextTotal > MAX_TOTAL_UPLOAD_BYTES) {
          nextError = 'Total upload size exceeds 15 MB.';
          break;
        }
        additions.push(file);
        existingKeys.add(fileKey(file));
      }

      setFileError(nextError);
      return additions.length ? [...existing, ...additions] : existing;
    });
  };

  const removeFile = (target) => {
    setFiles((existing) => existing.filter((file) => fileKey(file) !== fileKey(target)));
    setFileError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setStatus(null);
    setStatusMessage('');
    setFieldErrors({});
    setFileError('');

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      files.forEach((file) => formData.append('files', file));

      const result = await postFormData('/api/inquiries/project', formData);
      setStatus('success');
      setStatusMessage(result.message || 'Thanks — your project inquiry was received.');
      setValues({ ...initialValues, packageSlug: validPackage });
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      event.target.reset();
    } catch (error) {
      if (error.details && typeof error.details === 'object') {
        setFieldErrors(error.details);
      }
      setStatus('error');
      setStatusMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Section title="Start a Project">
        <Typography sx={{ color: colors.muted, mb: 2, maxWidth: 720 }}>
          Share a few details about your business and goals. Required fields are marked. Everything
          else is optional and helps me prepare a clearer proposal.
        </Typography>
        {selectedLabel ? (
          <Typography className="altFont" sx={{ color: colors.green, mb: 3 }}>
            Selected package: {selectedLabel}
          </Typography>
        ) : null}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 720 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600, mb: 2 }}>
                Contact &amp; business
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Your name"
                  name="name"
                  value={values.name}
                  onChange={updateField('name')}
                  required
                  fullWidth
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name}
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={updateField('email')}
                  required
                  fullWidth
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  label="Phone (optional)"
                  name="phone"
                  value={values.phone}
                  onChange={updateField('phone')}
                  fullWidth
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  label="Business name"
                  name="businessName"
                  value={values.businessName}
                  onChange={updateField('businessName')}
                  required
                  fullWidth
                  error={Boolean(fieldErrors.businessName)}
                  helperText={fieldErrors.businessName}
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  select
                  label="Package / service"
                  name="packageSlug"
                  value={values.packageSlug}
                  onChange={updateField('packageSlug')}
                  required
                  fullWidth
                  error={Boolean(fieldErrors.packageSlug)}
                  helperText={fieldErrors.packageSlug || 'Choose the closest fit—or Not sure yet.'}
                  sx={fieldSx}
                  disabled={submitting}
                  SelectProps={{ MenuProps: selectMenuProps }}
                >
                  {packageOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600, mb: 2 }}>
                Project goals
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Website goals"
                  name="websiteGoals"
                  value={values.websiteGoals}
                  onChange={updateField('websiteGoals')}
                  required
                  fullWidth
                  multiline
                  minRows={4}
                  error={Boolean(fieldErrors.websiteGoals)}
                  helperText={
                    fieldErrors.websiteGoals ||
                    'What should the site help customers do? (book, call, learn, buy, etc.)'
                  }
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  label="Requested features (optional)"
                  name="requestedFeatures"
                  value={values.requestedFeatures}
                  onChange={updateField('requestedFeatures')}
                  fullWidth
                  multiline
                  minRows={3}
                  helperText="Forms, galleries, booking, blogs, integrations, etc."
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  label="Inspiration links (optional)"
                  name="inspirationLinks"
                  value={values.inspirationLinks}
                  onChange={updateField('inspirationLinks')}
                  fullWidth
                  multiline
                  minRows={2}
                  helperText="Sites you like, or competitors worth comparing."
                  sx={fieldSx}
                  disabled={submitting}
                />
              </Stack>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: colors.text, fontWeight: 600, mb: 2 }}>
                Optional details
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Current website (optional)"
                  name="currentWebsite"
                  value={values.currentWebsite}
                  onChange={updateField('currentWebsite')}
                  fullWidth
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  label="Domain information (optional)"
                  name="domainInfo"
                  value={values.domainInfo}
                  onChange={updateField('domainInfo')}
                  fullWidth
                  helperText="Do you already own a domain? Where is it registered?"
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  label="Branding notes (optional)"
                  name="brandingNotes"
                  value={values.brandingNotes}
                  onChange={updateField('brandingNotes')}
                  fullWidth
                  multiline
                  minRows={2}
                  helperText="Colors, fonts, tone, or anything to match."
                  sx={fieldSx}
                  disabled={submitting}
                />
                <TextField
                  select
                  label="Content readiness (optional)"
                  name="contentReadiness"
                  value={values.contentReadiness}
                  onChange={updateField('contentReadiness')}
                  fullWidth
                  sx={fieldSx}
                  disabled={submitting}
                  SelectProps={{ MenuProps: selectMenuProps }}
                >
                  <MenuItem value="">
                    <em>Select one</em>
                  </MenuItem>
                  {contentReadinessOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Desired timeline (optional)"
                  name="timeline"
                  value={values.timeline}
                  onChange={updateField('timeline')}
                  fullWidth
                  sx={fieldSx}
                  disabled={submitting}
                  SelectProps={{ MenuProps: selectMenuProps }}
                >
                  <MenuItem value="">
                    <em>Select one</em>
                  </MenuItem>
                  {timelineOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Approximate budget (optional)"
                  name="budget"
                  value={values.budget}
                  onChange={updateField('budget')}
                  fullWidth
                  sx={fieldSx}
                  disabled={submitting}
                  SelectProps={{ MenuProps: selectMenuProps }}
                >
                  <MenuItem value="">
                    <em>Select one</em>
                  </MenuItem>
                  {budgetOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Box>
                  <Typography sx={{ color: colors.text, fontWeight: 600, mb: 1 }}>
                    Logo &amp; media files (optional)
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.muted, mb: 1.5 }}>
                    Up to 5 files, 5 MB each (15 MB total). Images, PDF, Word, or plain text.
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="files"
                    multiple
                    onChange={handleFiles}
                    disabled={submitting || files.length >= MAX_FILES}
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.txt,image/*,application/pdf"
                    style={{
                      position: 'absolute',
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: 'hidden',
                      clip: 'rect(0, 0, 0, 0)',
                      whiteSpace: 'nowrap',
                      border: 0,
                    }}
                  />
                  <CtaButton
                    type="button"
                    secondary
                    disabled={submitting || files.length >= MAX_FILES}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {files.length ? 'Add More Files' : 'Add Files'}
                  </CtaButton>
                  {files.length ? (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {files.map((file) => (
                        <Box
                          key={fileKey(file)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 1.5,
                            py: 1,
                            backgroundColor: colors.cardBg,
                            borderLeft: `3px solid ${colors.green}`,
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              sx={{
                                color: colors.text,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {file.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.muted }}>
                              {formatFileSize(file.size)}
                            </Typography>
                          </Box>
                          <IconButton
                            aria-label={`Remove ${file.name}`}
                            onClick={() => removeFile(file)}
                            disabled={submitting}
                            size="small"
                            sx={{
                              color: colors.muted,
                              '&:hover': { color: colors.text, backgroundColor: colors.greenSoft },
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Typography variant="body2" sx={{ color: colors.muted }}>
                        {files.length} of {MAX_FILES} files · {formatFileSize(totalBytes)} of 15 MB
                      </Typography>
                    </Stack>
                  ) : null}
                  {fileError ? (
                    <Typography variant="body2" sx={{ color: '#f07178', mt: 1 }}>
                      {fileError}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>
            </Box>

            <Box
              aria-hidden="true"
              sx={{ position: 'absolute', left: '-10000px', height: 0, overflow: 'hidden' }}
            >
              <TextField
                label="Company website"
                name="companyWebsite"
                tabIndex={-1}
                autoComplete="off"
                value={values.companyWebsite}
                onChange={updateField('companyWebsite')}
              />
            </Box>

            <FormStatus status={status} message={statusMessage} />

            <Typography variant="body2" sx={{ color: colors.muted }}>
              By submitting, you agree to the storage of your inquiry details and any uploaded files
              as described in the{' '}
              <Link component={RouterLink} to="/privacy" sx={{ color: colors.green }}>
                Privacy
              </Link>{' '}
              page.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <CtaButton type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit Project Inquiry'}
              </CtaButton>
              <CtaButton secondary to="/pricing" disabled={submitting}>
                Review Pricing
              </CtaButton>
            </Stack>
          </Stack>
        </Box>
      </Section>
    </Box>
  );
};

export default Start;
