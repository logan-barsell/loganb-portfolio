import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { usePortalNav } from '../auth/PortalNavProvider';
import AttachmentList from '../components/attachments/AttachmentList';
import CtaButton from '../components/CtaButton';
import Section from '../components/Section';
import SeoNoIndex from '../components/SeoNoIndex';
import { fieldSx, selectMenuProps } from '../components/forms/formStyles';
import MenuItem from '@mui/material/MenuItem';
import {
  completePortalSetup,
  createHostingCheckout,
  createPortalCheckout,
  deletePortalAttachment,
  fetchPortalAttachmentPreview,
  fetchPortalProject,
  fetchPortalSession,
  fetchPortalSetup,
  loginPortal,
  openHostingPortal,
  portalAttachmentDownloadUrl,
  updatePortalDomain,
  uploadPortalAttachments,
} from '../api/projectClient';
import { resolvePackageLabel } from '../data/adminNav';
import {
  designPaymentChipSx,
  hostingStatusChipSx,
  invoiceStatusChipSx,
  packageChipSx,
  pipelineStageChipSx,
} from '../data/statusChips';
import {
  formatRevisionLimit,
  resolvePaymentScheduleLabel,
} from '../data/paymentSchedules';
import { useToast } from '../toast/ToastProvider';
import { colors } from '../theme/colors';

const DOMAIN_STATUS_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'client_owns', label: 'I own this domain' },
  { value: 'needs_purchase', label: 'Needs purchase' },
  { value: 'connected', label: 'Connected' },
];

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatKickoffDate(ymd) {
  if (!ymd) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
      new Date(`${ymd}T00:00:00`)
    );
  } catch {
    return ymd;
  }
}

function Field({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        sx={{
          color: colors.muted,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ color: colors.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function PackageChipField({ packageLabel, packageSlug }) {
  const label = resolvePackageLabel(packageSlug, packageLabel);
  if (!label) return null;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        sx={{
          color: colors.muted,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          mb: 0.75,
        }}
      >
        Package
      </Typography>
      <Chip label={label} size="small" sx={packageChipSx} />
    </Box>
  );
}

function Block({ title, action, children }) {
  return (
    <Box sx={{ mb: 5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 1.5,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: colors.green,
            fontWeight: 600,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          {title}
        </Typography>
        {action || null}
      </Box>
      <Divider sx={{ borderColor: 'rgba(149, 99, 187, 0.35)', mb: 2.5 }} />
      {children}
    </Box>
  );
}

function PasswordForm({ title, lead, submitLabel, onSubmit, includeConfirm }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ password, confirmPassword });
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto', py: { xs: 4, sm: 6 } }}>
      <Section title={title} lead={lead}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="Password"
              type="password"
              name="password"
              autoComplete={includeConfirm ? 'new-password' : 'current-password'}
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={fieldSx}
              helperText={includeConfirm ? '10–256 characters.' : undefined}
            />
            {includeConfirm ? (
              <TextField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={fieldSx}
              />
            ) : null}
            <CtaButton type="submit" disabled={submitting} sx={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Working…' : submitLabel}
            </CtaButton>
          </Stack>
        </Box>
      </Section>
    </Box>
  );
}

function PortalAttachments({ projectId, attachments, onChange }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const data = await uploadPortalAttachments(projectId, files);
      onChange(data.attachments || []);
      toast.success('Files uploaded.');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Remove “${file.originalName}”?`)) return;
    try {
      const data = await deletePortalAttachment(projectId, file.id);
      onChange(data.attachments || []);
      toast.success('Attachment removed.');
    } catch (err) {
      toast.error(err.message || 'Could not remove attachment.');
    }
  };

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
          {uploading ? 'Uploading…' : 'Upload Files'}
        </CtaButton>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          multiple
          onChange={handleUpload}
        />
        <Typography sx={{ color: colors.muted, fontSize: 13 }}>
          Share logos, content, or reference files (max 5 at a time).
        </Typography>
      </Stack>

      <AttachmentList
        attachments={attachments}
        fetchPreview={(file) => fetchPortalAttachmentPreview(projectId, file.id)}
        downloadUrl={(file) => portalAttachmentDownloadUrl(projectId, file.id)}
        renderActions={(file) =>
          file.uploadedBy !== 'admin' ? (
            <Button
              onClick={() => handleDelete(file)}
              sx={{ color: colors.muted, textTransform: 'none' }}
            >
              Remove
            </Button>
          ) : null
        }
      />
    </Stack>
  );
}

function Overview({ project, canSwitchProjects, onAttachmentsChange, onProjectUpdate }) {
  const toast = useToast();
  const [checkoutBusy, setCheckoutBusy] = useState(null);
  const [domainName, setDomainName] = useState(project.domainName || '');
  const [domainStatus, setDomainStatus] = useState(project.domainStatus || 'unknown');
  const [domainSaving, setDomainSaving] = useState(false);
  const [editingDomain, setEditingDomain] = useState(false);

  useEffect(() => {
    if (editingDomain) return;
    setDomainName(project.domainName || '');
    setDomainStatus(project.domainStatus || 'unknown');
  }, [project.domainName, project.domainStatus, editingDomain]);

  const startEditingDomain = () => {
    setDomainName(project.domainName || '');
    setDomainStatus(project.domainStatus || 'unknown');
    setEditingDomain(true);
  };

  const cancelEditingDomain = () => {
    if (domainSaving) return;
    setDomainName(project.domainName || '');
    setDomainStatus(project.domainStatus || 'unknown');
    setEditingDomain(false);
  };

  const billing = project.billing || {};
  const stripeEnabled = Boolean(billing.stripeEnabled);
  const headerPackageLabel = resolvePackageLabel(
    project.proposal?.packageSlug || project.inquiry?.packageSlug,
    project.proposal?.packageLabel || project.inquiry?.packageLabel
  );

  const redirectToCheckout = async (key, action) => {
    if (checkoutBusy) return;
    setCheckoutBusy(key);
    try {
      const data = await action();
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      toast.error('Checkout URL missing.');
    } catch (err) {
      toast.error(err.message || 'Unable to start checkout.');
    } finally {
      setCheckoutBusy(null);
    }
  };

  const saveDomain = async () => {
    if (domainSaving) return;
    setDomainSaving(true);
    try {
      const data = await updatePortalDomain(project.id, {
        domainName: domainName.trim() || null,
        domainStatus,
      });
      onProjectUpdate?.(data.project);
      setEditingDomain(false);
      toast.success('Domain updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update domain.');
    } finally {
      setDomainSaving(false);
    }
  };

  const payLabel = (key) => {
    if (key === 'deposit') return 'Pay Deposit';
    if (key === 'balance') return 'Pay Remaining Balance';
    return 'Pay Full Amount';
  };

  return (
    <Box sx={{ pb: 6 }}>
      <SeoNoIndex title={`${project.client?.businessName || 'Project'} Portal | Logan Barsell`} />
      <Section title={project.client?.businessName || project.name || 'Your Project'}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3, flexWrap: 'wrap', gap: 1.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            {headerPackageLabel ? (
              <Chip label={headerPackageLabel} size="small" sx={packageChipSx} />
            ) : null}
            {project.statusLabel || project.inquiry?.stageLabel ? (
              <Chip
                label={project.inquiry?.stageLabel || project.statusLabel}
                size="small"
                sx={pipelineStageChipSx(
                  project.inquiry?.stage ||
                    (project.status === 'active'
                      ? 'active_project'
                      : project.status === 'completed'
                        ? 'completed_project'
                        : project.status === 'cancelled'
                          ? 'cancelled_project'
                          : project.status === 'on_hold'
                            ? 'on_hold_project'
                            : null)
                )}
              />
            ) : null}
            {project.designPaymentStatusLabel ? (
              <Chip
                label={`Design: ${project.designPaymentStatusLabel}`}
                size="small"
                sx={designPaymentChipSx(project.designPaymentStatus)}
              />
            ) : null}
            {project.hostingStatus && project.hostingStatus !== 'none' ? (
              <Chip
                label={`Hosting: ${project.hostingStatusLabel}`}
                size="small"
                sx={hostingStatusChipSx(project.hostingStatus)}
              />
            ) : null}
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {canSwitchProjects ? (
              <CtaButton to="/client/projects" size="small" secondary>
                View All Projects
              </CtaButton>
            ) : null}
            <Typography sx={{ color: colors.muted, fontSize: 13 }}>
              Created {formatDate(project.createdAt)}
            </Typography>
          </Stack>
        </Stack>

        {project.status === 'on_hold' ? (
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: `1px solid rgba(149, 99, 187, 0.35)`,
              borderRadius: 1,
              backgroundColor: colors.cardBg,
            }}
          >
            <Typography sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}>
              Project on hold
            </Typography>
            <Typography sx={{ color: colors.muted }}>
              {project.activationBlockReason ||
                'Waiting for kickoff conditions before work begins.'}
            </Typography>
          </Box>
        ) : null}

        {project.status === 'completed' &&
        (billing.hasHosting || billing.hostingMonthlyLabel) &&
        !project.readyForLaunch ? (
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: `1px solid rgba(149, 99, 187, 0.35)`,
              borderRadius: 1,
              backgroundColor: colors.cardBg,
            }}
          >
            <Typography sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}>
              Build complete
            </Typography>
            <Typography sx={{ color: colors.muted }}>
              Launch and hosting will unlock when your site is ready to go live. Domain or DNS
              details may still need a quick check before then.
            </Typography>
          </Box>
        ) : null}

        {project.hostingStatus === 'overdue' ? (
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: `1px solid ${colors.red}`,
              borderRadius: 1,
              backgroundColor: colors.cardBg,
            }}
          >
            <Typography sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}>
              Hosting payment failed
            </Typography>
            <Typography sx={{ color: colors.muted }}>
              Update your payment method under Manage Subscription to restore hosting.
            </Typography>
          </Box>
        ) : null}

        {billing.hostingSubscriptionActive &&
        (billing.hostingCancelAtPeriodEnd || project.hostingCancelAtPeriodEnd) ? (
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: `1px solid rgba(149, 99, 187, 0.35)`,
              borderRadius: 1,
              backgroundColor: colors.cardBg,
            }}
          >
            <Typography sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}>
              Hosting cancellation scheduled
            </Typography>
            <Typography sx={{ color: colors.muted }}>
              {billing.hostingCurrentPeriodEnd || project.hostingCurrentPeriodEnd
                ? `Hosting remains active until ${formatDate(
                    billing.hostingCurrentPeriodEnd || project.hostingCurrentPeriodEnd
                  )}. You can reverse this in Manage Subscription.`
                : 'Hosting is set to cancel at the end of the current billing period.'}
            </Typography>
          </Box>
        ) : null}

        <Block title="Your Details">
          <Field label="Name" value={project.client?.name} />
          <Field label="Business Name" value={project.client?.businessName} />
          <Field label="Email" value={project.client?.email} />
          <Field label="Phone" value={project.client?.phone} />
        </Block>

        <Block
          title="Domain"
          action={
            !editingDomain ? (
              <CtaButton type="button" size="medium" onClick={startEditingDomain}>
                Edit
              </CtaButton>
            ) : null
          }
        >
          {editingDomain ? (
            <Stack spacing={2} sx={{ maxWidth: 480 }}>
              <TextField
                label="Domain Name"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                fullWidth
                helperText="e.g. example.com"
                disabled={domainSaving}
                sx={fieldSx}
              />
              <TextField
                select
                label="Domain Status"
                value={domainStatus}
                onChange={(e) => setDomainStatus(e.target.value)}
                fullWidth
                disabled={domainSaving}
                sx={fieldSx}
                SelectProps={{ MenuProps: selectMenuProps }}
              >
                {DOMAIN_STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              {project.inquiry?.domainInfo ? (
                <Field label="Domain Notes" value={project.inquiry.domainInfo} />
              ) : null}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <CtaButton size="medium" onClick={saveDomain} disabled={domainSaving}>
                  {domainSaving ? 'Saving…' : 'Save'}
                </CtaButton>
                <CtaButton
                  type="button"
                  size="medium"
                  secondary
                  onClick={cancelEditingDomain}
                  disabled={domainSaving}
                >
                  Cancel
                </CtaButton>
              </Stack>
            </Stack>
          ) : (
            <>
              <Field label="Domain Name" value={project.domainName || '—'} />
              <Field
                label="Domain Status"
                value={project.domainStatusLabel || project.domainStatus}
              />
              {project.inquiry?.domainInfo ? (
                <Field label="Domain Notes" value={project.inquiry.domainInfo} />
              ) : null}
            </>
          )}
        </Block>

        <Block title="Project Overview">
          <PackageChipField
            packageLabel={project.proposal?.packageLabel || project.inquiry?.packageLabel}
            packageSlug={project.proposal?.packageSlug || project.inquiry?.packageSlug}
          />
          <Field label="Summary" value={project.proposal?.summary} />
          <Field label="Scope" value={project.proposal?.scope} />
          <Field label="Deliverables" value={project.proposal?.deliverables} />
          <Field label="Exclusions" value={project.proposal?.exclusions} />
          <Field label="Timeline" value={project.proposal?.timelineSummary} />
          <Field
            label="Target Kickoff Date"
            value={formatKickoffDate(project.proposal?.kickoffDate)}
          />
          <Field
            label="Revision Limit"
            value={
              project.proposal
                ? project.proposal.revisionLimitLabel ||
                  formatRevisionLimit(project.proposal.revisionLimit)
                : null
            }
          />
          <Field
            label="Payment Terms"
            value={
              project.proposal
                ? project.proposal.paymentTermsLabel ||
                  resolvePaymentScheduleLabel(project.proposal.paymentSchedule) ||
                  project.proposal.paymentTerms
                : null
            }
          />
          <Field label="Design Price" value={project.proposal?.designAmountLabel} />
          <Field label="Hosting Monthly" value={project.proposal?.hostingMonthlyLabel} />
        </Block>

        <Block title="Attachments">
          <PortalAttachments
            projectId={project.id}
            attachments={project.attachments || []}
            onChange={onAttachmentsChange}
          />
        </Block>

        <Block title="Billing">
          {!stripeEnabled ? (
            <Typography sx={{ color: colors.muted, mb: 2 }}>
              Online payments are not enabled yet. Amounts below are from your proposal.
            </Typography>
          ) : null}
          {(billing.lineItems || []).map((item) => (
            <Field
              key={item.invoiceId || item.key}
              label={item.label}
              value={item.amountLabel}
            />
          ))}
          {billing.hasHosting || billing.hostingMonthlyLabel ? (
            <Field
              label="Hosting Subscription"
              value={
                billing.hostingMonthlyLabel
                  ? `${billing.hostingMonthlyLabel}/month`
                  : null
              }
            />
          ) : null}
          {(billing.hasHosting || billing.hostingMonthlyLabel) &&
          !billing.hostingSubscriptionActive &&
          !billing.hostingCheckoutAllowed ? (
            <Typography sx={{ color: colors.muted, mb: 1.5, mt: 0.5 }}>
              {project.status === 'completed'
                ? 'Hosting unlocks when launch is ready. Domain or DNS details may still need coordination before you start a subscription.'
                : 'Hosting starts when your site is ready to launch. You’ll be able to begin your subscription here once the build is complete and launch is unlocked.'}
            </Typography>
          ) : null}
          {(billing.hasHosting || billing.hostingMonthlyLabel) &&
          !billing.hostingSubscriptionActive &&
          billing.hostingCheckoutAllowed ? (
            <Typography sx={{ color: colors.muted, mb: 1.5, mt: 0.5 }}>
              Hosting is unlocked. If you still need help with domain or DNS before going live,
              reply to any project email or reach out anytime.
            </Typography>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
            {(billing.lineItems || []).map((item) => (
              <CtaButton
                key={item.invoiceId || item.key}
                size="medium"
                secondary={item.key !== 'deposit' && item.key !== 'full'}
                disabled={!stripeEnabled || !item.invoiceId || Boolean(checkoutBusy)}
                onClick={() =>
                  redirectToCheckout(item.invoiceId, () =>
                    createPortalCheckout(project.id, item.invoiceId)
                  )
                }
              >
                {checkoutBusy === item.invoiceId ? 'Redirecting…' : payLabel(item.key)}
              </CtaButton>
            ))}
            {billing.hasHosting || billing.hostingMonthlyLabel ? (
              billing.hostingSubscriptionActive ? (
                <CtaButton
                  size="medium"
                  secondary
                  disabled={!stripeEnabled || Boolean(checkoutBusy)}
                  onClick={() =>
                    redirectToCheckout('portal', () => openHostingPortal(project.id))
                  }
                >
                  {checkoutBusy === 'portal' ? 'Redirecting…' : 'Manage Subscription'}
                </CtaButton>
              ) : billing.hostingCheckoutAllowed ? (
                <CtaButton
                  size="medium"
                  secondary
                  disabled={!stripeEnabled || Boolean(checkoutBusy)}
                  onClick={() =>
                    redirectToCheckout('hosting', () => createHostingCheckout(project.id))
                  }
                >
                  {checkoutBusy === 'hosting' ? 'Redirecting…' : 'Start Hosting Subscription'}
                </CtaButton>
              ) : null
            ) : null}
          </Stack>
        </Block>

        <Block title="Invoices">
          {(project.invoices || []).length === 0 ? (
            <Typography sx={{ color: colors.muted }}>No invoices yet.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {project.invoices.map((inv) => (
                <Stack
                  key={inv.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                  <Box>
                    <Typography sx={{ color: colors.text, fontWeight: 600 }}>
                      {inv.label || inv.kindLabel}
                    </Typography>
                    <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                      {inv.amountLabel}
                      {inv.paidAt ? ` · Paid ${formatDate(inv.paidAt)}` : ''}
                    </Typography>
                  </Box>
                  <Chip
                    label={inv.statusLabel || inv.status}
                    size="small"
                    sx={invoiceStatusChipSx(inv.status)}
                  />
                </Stack>
              ))}
            </Stack>
          )}
        </Block>
      </Section>
    </Box>
  );
}

const ProjectPortal = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const {
    projects,
    refresh,
    isAuthenticated: clientAuthenticated,
    loading: clientAuthLoading,
  } = usePortalNav();
  const [mode, setMode] = useState(token ? 'setup' : 'loading');
  const [project, setProject] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'overview' && !clientAuthLoading && !clientAuthenticated) {
      setProject(null);
      setMode('login');
    }
  }, [mode, clientAuthLoading, clientAuthenticated]);

  useEffect(() => {
    const billing = searchParams.get('billing');
    if (!billing) return;
    if (billing === 'success') toast.success('Payment complete. Status will update shortly.');
    if (billing === 'cancel') toast.error('Checkout canceled.');
    const next = new URLSearchParams(searchParams);
    next.delete('billing');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (token) {
        setMode('setup');
        try {
          const data = await fetchPortalSetup(id, token);
          if (cancelled) return;
          setBusinessName(data.project?.businessName || '');
          setError('');
        } catch (err) {
          if (cancelled) return;
          setError(err.message || 'This setup link is invalid or has expired.');
          setMode('error');
        }
        return;
      }

      setMode('loading');
      try {
        const session = await fetchPortalSession(id);
        if (cancelled) return;
        setBusinessName(session.project?.businessName || '');

        if (session.authenticated) {
          const data = await fetchPortalProject(id);
          if (cancelled) return;
          setProject(data.project);
          setMode('overview');
          return;
        }

        if (session.mustSetPassword) {
          setError(
            'Portal access is not set up yet. Use the setup link from your email, or ask for a new invite.'
          );
          setMode('error');
          return;
        }

        setMode('login');
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Unable to load project portal.');
        setMode('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const enterOverview = (nextProject) => {
    setProject(nextProject);
    setMode('overview');
    if (token) {
      navigate(`/project/${id}`, { replace: true });
    }
  };

  if (mode === 'loading') {
    return (
      <Box sx={{ py: 8 }}>
        <SeoNoIndex title="Project Portal | Logan Barsell" />
        <Typography sx={{ color: colors.muted, textAlign: 'center' }}>Loading…</Typography>
      </Box>
    );
  }

  if (mode === 'error') {
    return (
      <Box sx={{ py: 8, maxWidth: 520, mx: 'auto' }}>
        <SeoNoIndex title="Project Portal | Logan Barsell" />
        <Section title="Project Portal">
          <Typography sx={{ color: colors.text }}>{error}</Typography>
        </Section>
      </Box>
    );
  }

  if (mode === 'setup') {
    return (
      <>
        <SeoNoIndex title="Set Password | Logan Barsell" />
        <PasswordForm
          title="Set Password"
          submitLabel="Save & Continue"
          includeConfirm
          onSubmit={async ({ password, confirmPassword }) => {
            const data = await completePortalSetup(id, token, { password, confirmPassword });
            await refresh();
            toast.success('Password saved.');
            enterOverview(data.project);
          }}
        />
      </>
    );
  }

  if (mode === 'login') {
    return (
      <>
        <SeoNoIndex title="Client Login | Logan Barsell" />
        <PasswordForm
          title="Client Login"
          lead={
            businessName
              ? `Enter your password for ${businessName}.`
              : 'Enter your project portal password.'
          }
          submitLabel="Sign In"
          includeConfirm={false}
          onSubmit={async ({ password }) => {
            const data = await loginPortal(id, password);
            await refresh();
            enterOverview(data.project);
          }}
        />
      </>
    );
  }

  if (mode === 'overview' && project) {
    return (
      <Overview
        project={project}
        canSwitchProjects={projects.length > 1}
        onAttachmentsChange={(attachments) => {
          setProject((prev) => (prev ? { ...prev, attachments } : prev));
        }}
        onProjectUpdate={(next) => setProject(next)}
      />
    );
  }

  return null;
};

export default ProjectPortal;
