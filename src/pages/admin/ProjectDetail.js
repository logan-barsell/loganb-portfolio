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
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import CtaButton from '../../components/CtaButton';
import Section from '../../components/Section';
import { fieldSx, selectMenuProps } from '../../components/forms/formStyles';
import InquiryAttachments from '../../components/admin/InquiryAttachments';
import AdminInvoicesSection from '../../components/admin/AdminInvoicesSection';
import {
  fetchProject,
  markProjectStarted,
  resendPortalAccess,
  setProjectReadyForLaunch,
  updateProject,
} from '../../api/adminClient';
import {
  inquiryTypeChipLabel,
  resolvePackageLabel,
  resolveStageLabel,
} from '../../data/adminNav';
import {
  designPaymentChipSx,
  hostingStatusChipSx,
  inquiryTypeChipSx,
  pipelineStageChipSx,
} from '../../data/statusChips';
import {
  formatRevisionLimit,
  resolvePaymentScheduleLabel,
} from '../../data/paymentSchedules';
import { useToast } from '../../toast/ToastProvider';
import { colors } from '../../theme/colors';

const packageChipSx = {
  color: colors.purple,
  border: `1px solid ${colors.purple}`,
  backgroundColor: colors.purpleSoft,
  fontWeight: 600,
};

const DOMAIN_STATUS_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'client_owns', label: 'Client Owns' },
  { value: 'needs_purchase', label: 'Needs Purchase' },
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

function ChipField({ label, chipLabel, chipSx, helper, action }) {
  if (!chipLabel && !action) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ color: colors.purple, fontSize: 13, fontWeight: 700, mb: 0.5 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="space-between"
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {chipLabel ? <Chip label={chipLabel} size="small" sx={chipSx} /> : null}
          {helper ? (
            <Typography sx={{ color: colors.muted, fontSize: 13 }}>{helper}</Typography>
          ) : null}
        </Stack>
        {action || null}
      </Stack>
    </Box>
  );
}

function portalAccessChip(portal) {
  if (portal?.passwordSet) {
    return {
      label: 'Password Set',
      sx: {
        color: colors.green,
        border: `1px solid ${colors.green}`,
        backgroundColor: colors.greenSoft,
        fontWeight: 600,
      },
    };
  }
  if (portal?.setupPending) {
    return {
      label: 'Setup Pending',
      sx: packageChipSx,
    };
  }
  return {
    label: 'Not Invited',
    sx: {
      color: colors.muted,
      border: `1px solid ${colors.muted}`,
      backgroundColor: 'transparent',
      fontWeight: 600,
    },
  };
}

function DetailBlock({ title, action, children }) {
  return (
    <Box sx={{ mb: 4 }}>
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
          variant="h6"
          sx={{ color: colors.green, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}
        >
          {title}
        </Typography>
        {action || null}
      </Box>
      <Divider sx={{ borderColor: 'rgba(149, 99, 187, 0.35)', mb: 2 }} />
      {children}
    </Box>
  );
}

const ProjectDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [markStartedOpen, setMarkStartedOpen] = useState(false);
  const [markingStarted, setMarkingStarted] = useState(false);
  const [readyLaunchOpen, setReadyLaunchOpen] = useState(false);
  const [readyLaunchBusy, setReadyLaunchBusy] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [domainStatus, setDomainStatus] = useState('unknown');
  const [domainSaving, setDomainSaving] = useState(false);
  const [editingDomain, setEditingDomain] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setEditingDomain(false);
      try {
        const data = await fetchProject(id);
        if (!cancelled) setProject(data.project);
      } catch (err) {
        if (!cancelled) {
          setProject(null);
          toast.error(err.message || 'Failed to load project.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  useEffect(() => {
    if (!project || editingDomain) return;
    setDomainName(project.domainName || '');
    setDomainStatus(project.domainStatus || 'unknown');
  }, [project, editingDomain]);

  const startEditingDomain = () => {
    if (!project) return;
    setDomainName(project.domainName || '');
    setDomainStatus(project.domainStatus || 'unknown');
    setEditingDomain(true);
  };

  const cancelEditingDomain = () => {
    if (domainSaving) return;
    if (project) {
      setDomainName(project.domainName || '');
      setDomainStatus(project.domainStatus || 'unknown');
    }
    setEditingDomain(false);
  };

  const closeResendModal = () => {
    if (resending) return;
    setResendOpen(false);
  };

  const confirmResendPortal = async () => {
    if (resending) return;
    setResending(true);
    try {
      const data = await resendPortalAccess(id);
      setProject(data.project);
      toast.success(data.message || 'Portal access email sent.');
      setResendOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to send portal access email.');
    } finally {
      setResending(false);
    }
  };

  const closeMarkStartedModal = () => {
    if (markingStarted) return;
    setMarkStartedOpen(false);
  };

  const confirmMarkStarted = async () => {
    if (markingStarted) return;
    setMarkingStarted(true);
    try {
      const data = await markProjectStarted(id);
      setProject(data.project);
      toast.success('Project marked as started.');
      setMarkStartedOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to mark project as started.');
    } finally {
      setMarkingStarted(false);
    }
  };

  const closeReadyLaunchModal = () => {
    if (readyLaunchBusy) return;
    setReadyLaunchOpen(false);
  };

  const confirmReadyForLaunch = async () => {
    if (readyLaunchBusy || !project) return;
    setReadyLaunchBusy(true);
    try {
      const data = await setProjectReadyForLaunch(id, true);
      setProject(data.project);
      toast.success('Marked ready for launch.');
      setReadyLaunchOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to mark ready for launch.');
    } finally {
      setReadyLaunchBusy(false);
    }
  };

  const saveDomain = async () => {
    if (domainSaving) return;
    setDomainSaving(true);
    try {
      const data = await updateProject(id, {
        domainName: domainName.trim() || null,
        domainStatus,
      });
      setProject(data.project);
      setEditingDomain(false);
      toast.success('Domain saved.');
    } catch (err) {
      toast.error(err.message || 'Failed to save domain.');
    } finally {
      setDomainSaving(false);
    }
  };

  const packageLabel = project
    ? resolvePackageLabel(project.inquiry?.packageSlug, project.inquiry?.packageLabel)
    : null;
  const portalAccess = project ? portalAccessChip(project.portal) : null;
  const hasPortalPassword = Boolean(project?.portal?.passwordSet);
  const hasHostingPlan =
    Boolean(project?.proposal?.hostingPlan) && project.proposal.hostingPlan !== 'none';

  return (
    <Box sx={{ pb: 4 }}>
      <Section
        title="Project Detail"
        lead={
          <Button
            component={RouterLink}
            to="/admin/projects"
            sx={{ color: colors.muted, textTransform: 'none', px: 0 }}
          >
            ← Back to Projects
          </Button>
        }
      >
        {loading ? <Typography sx={{ color: colors.muted }}>Loading…</Typography> : null}

        {!loading && !project ? (
          <Typography sx={{ color: colors.muted }}>Project not found.</Typography>
        ) : null}

        {project ? (
          <>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3, flexWrap: 'wrap', gap: 1.5 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                {project.inquiry ? (
                  <Chip
                    label={inquiryTypeChipLabel(
                      project.inquiry.type,
                      project.inquiry.packageLabel,
                      project.inquiry.packageSlug
                    )}
                    size="small"
                    sx={inquiryTypeChipSx(project.inquiry.type)}
                  />
                ) : null}
                {project.inquiry?.stage || project.inquiry?.stageLabel ? (
                  <Chip
                    label={resolveStageLabel(project.inquiry.stage, project.inquiry.stageLabel)}
                    size="small"
                    sx={pipelineStageChipSx(project.inquiry.stage)}
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
              <Typography sx={{ color: colors.muted, fontSize: 13 }}>
                Created {formatDate(project.createdAt)}
              </Typography>
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
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  justifyContent="space-between"
                  sx={{ flexWrap: 'wrap', gap: 1.5 }}
                >
                  <Box>
                    <Typography sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}>
                      Project on Hold
                    </Typography>
                    <Typography sx={{ color: colors.muted }}>
                      {project.activationBlockReason ||
                        'Waiting for kickoff conditions before work begins.'}
                    </Typography>
                  </Box>
                  <CtaButton size="medium" onClick={() => setMarkStartedOpen(true)}>
                    Mark as Started
                  </CtaButton>
                </Stack>
              </Box>
            ) : null}

            {hasHostingPlan && !project.readyForLaunch ? (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  border: `1px solid rgba(149, 99, 187, 0.35)`,
                  borderRadius: 1,
                  backgroundColor: colors.cardBg,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  justifyContent="space-between"
                  sx={{ flexWrap: 'wrap', gap: 1.5 }}
                >
                  <Box>
                    <Typography sx={{ color: colors.text, fontWeight: 600, mb: 0.5 }}>
                      Ready for Launch
                    </Typography>
                    <Typography sx={{ color: colors.muted }}>
                      Mark when the site is ready so the client can start their hosting
                      subscription.
                    </Typography>
                  </Box>
                  <CtaButton size="medium" onClick={() => setReadyLaunchOpen(true)}>
                    Mark Ready for Launch
                  </CtaButton>
                </Stack>
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
                  Hosting Overdue
                </Typography>
                <Typography sx={{ color: colors.muted }}>
                  Stripe reported a failed hosting payment. Client can update their card via Manage
                  Subscription in the portal.
                </Typography>
              </Box>
            ) : null}

            {project.hostingCancelAtPeriodEnd ? (
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
                  Hosting Cancellation Scheduled
                </Typography>
                <Typography sx={{ color: colors.muted }}>
                  {project.hostingCurrentPeriodEnd
                    ? `Active until ${formatDate(project.hostingCurrentPeriodEnd)}.`
                    : 'Cancels at the end of the current billing period.'}
                </Typography>
              </Box>
            ) : null}

            <DetailBlock title="Client">
              {project.client ? (
                <>
                  <Field label="Name" value={project.client.name} />
                  <Field label="Business Name" value={project.client.businessName} />
                  <Field label="Email" value={project.client.email} />
                  <Field label="Phone" value={project.client.phone} />
                  <CtaButton to={`/admin/clients/${project.client.id}`} size="medium" secondary>
                    View Client
                  </CtaButton>
                </>
              ) : (
                <Typography sx={{ color: colors.muted }}>No linked client.</Typography>
              )}
            </DetailBlock>

            <DetailBlock title="Project Overview">
              {packageLabel ? (
                <ChipField label="Package" chipLabel={packageLabel} chipSx={packageChipSx} />
              ) : null}

              <Field label="Website Goals" value={project.inquiry?.websiteGoals} />
              <Field label="Current Website" value={project.inquiry?.currentWebsite} />
              <Field label="Requested Features" value={project.inquiry?.requestedFeatures} />
              <Field label="Inspiration Links" value={project.inquiry?.inspirationLinks} />
              <Field label="Domain Info" value={project.inquiry?.domainInfo} />
              <Field label="Branding Notes" value={project.inquiry?.brandingNotes} />
              <Field label="Content Readiness" value={project.inquiry?.contentReadiness} />
              <Field label="Timeline" value={project.inquiry?.timeline} />
              <Field label="Budget" value={project.inquiry?.budget} />
              <Field label="Message" value={project.inquiry?.message} />

              <Field label="Summary" value={project.proposal?.summary} />
              <Field label="Scope" value={project.proposal?.scope} />
              <Field label="Deliverables" value={project.proposal?.deliverables} />
              <Field label="Exclusions" value={project.proposal?.exclusions} />
              <Field label="Proposal Timeline" value={project.proposal?.timelineSummary} />
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
              <Field
                label="Hosting"
                value={
                  project.proposal?.hostingPlanLabel || project.proposal?.hostingMonthlyLabel
                }
              />
              <Field label="Decline Reason" value={project.proposal?.declineReason} />
              <Field label="Created" value={formatDate(project.createdAt)} />

              <ChipField
                label="Client Portal Access"
                chipLabel={portalAccess.label}
                chipSx={portalAccess.sx}
                action={
                  <CtaButton
                    size="medium"
                    secondary
                    onClick={() => setResendOpen(true)}
                    disabled={resending}
                  >
                    Resend Invite
                  </CtaButton>
                }
              />

              <Stack direction="column" spacing={1.5} sx={{ mt: 1, alignItems: 'flex-start' }}>
                {project.inquiry?.id ? (
                  <CtaButton
                    to={`/admin/inquiries/${project.inquiry.id}`}
                    size="medium"
                    secondary
                  >
                    View Inquiry
                  </CtaButton>
                ) : null}
                {project.proposal?.id ? (
                  <CtaButton
                    to={`/admin/proposals/${project.proposal.id}`}
                    size="medium"
                    secondary
                  >
                    View Proposal
                  </CtaButton>
                ) : null}
              </Stack>
            </DetailBlock>

            <DetailBlock
              title="Domain"
              action={
                !editingDomain ? (
                  <CtaButton type="button" size="medium" onClick={startEditingDomain}>
                    Edit
                  </CtaButton>
                ) : null
              }
            >
              {project.inquiry?.domainName ? (
                <Field label="Intake Domain Name" value={project.inquiry.domainName} />
              ) : null}
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
                </>
              )}
            </DetailBlock>

            <DetailBlock title="Billing">
              {project.hostingStatus && project.hostingStatus !== 'none' ? (
                <ChipField
                  label="Hosting Status"
                  chipLabel={project.hostingStatusLabel}
                  chipSx={hostingStatusChipSx(project.hostingStatus)}
                />
              ) : null}
              {project.hostingCancelAtPeriodEnd ? (
                <Field
                  label="Hosting Cancels"
                  value={
                    project.hostingCurrentPeriodEnd
                      ? formatDate(project.hostingCurrentPeriodEnd)
                      : 'End of current period'
                  }
                />
              ) : null}
              <Box sx={{ mt: 1 }}>
                <Typography
                  sx={{ color: colors.purple, fontSize: 13, fontWeight: 700, mb: 1 }}
                >
                  Invoices
                </Typography>
                <AdminInvoicesSection variant="project" projectId={project.id} pageSize={10} />
              </Box>
            </DetailBlock>

            <DetailBlock title="Attachments">
              <InquiryAttachments
                inquiryId={project.inquiryId || project.inquiry?.id}
                attachments={project.attachments}
              />
            </DetailBlock>
          </>
        ) : null}
      </Section>

      <Dialog
        open={resendOpen}
        onClose={closeResendModal}
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
          Resend portal invite?
          <IconButton
            aria-label="Close"
            onClick={closeResendModal}
            disabled={resending}
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
            {hasPortalPassword
              ? 'This emails a new setup link. Their current password keeps working until they finish choosing a new one.'
              : 'This emails a new setup link. Any unused prior link will stop working.'}
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              onClick={closeResendModal}
              disabled={resending}
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
            <CtaButton size="medium" onClick={confirmResendPortal} disabled={resending}>
              {resending ? 'Sending…' : 'Send invite'}
            </CtaButton>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={markStartedOpen}
        onClose={closeMarkStartedModal}
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
          Mark Project as Started?
          <IconButton
            aria-label="Close"
            onClick={closeMarkStartedModal}
            disabled={markingStarted}
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
            This sets the project to active and records a manual start, bypassing automatic
            kickoff checks.
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              onClick={closeMarkStartedModal}
              disabled={markingStarted}
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
            <CtaButton size="medium" onClick={confirmMarkStarted} disabled={markingStarted}>
              {markingStarted ? 'Starting…' : 'Mark as Started'}
            </CtaButton>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={readyLaunchOpen}
        onClose={closeReadyLaunchModal}
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
          Mark Ready for Launch?
          <IconButton
            aria-label="Close"
            onClick={closeReadyLaunchModal}
            disabled={readyLaunchBusy}
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
            This unlocks Start Hosting in the client portal so they can begin paying for hosting.
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              onClick={closeReadyLaunchModal}
              disabled={readyLaunchBusy}
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
            <CtaButton size="medium" onClick={confirmReadyForLaunch} disabled={readyLaunchBusy}>
              {readyLaunchBusy ? 'Saving…' : 'Mark Ready for Launch'}
            </CtaButton>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProjectDetail;
