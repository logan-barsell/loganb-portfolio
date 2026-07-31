import React from 'react';
import { resolvePackageLabel } from '../../data/adminNav';
import { packageChipSx, projectStatusChipSx } from '../../data/statusChips';
import { proposalCardDateLabel } from './linkedCardDates';
import LinkedRecordCard from './LinkedRecordCard';

/**
 * @param {{
 *   proposal: object,
 *   fallbackName?: string | null,
 *   fallbackBusinessName?: string | null,
 *   projectStatus?: string | null,
 *   projectStatusLabel?: string | null,
 * }} props
 */
const ProposalLinkedCard = ({
  proposal,
  fallbackName = null,
  fallbackBusinessName = null,
  projectStatus = null,
  projectStatusLabel = null,
}) => {
  if (!proposal?.id) return null;

  const packageLabel = resolvePackageLabel(proposal.packageSlug, proposal.packageLabel);
  const status = projectStatus ?? proposal.projectStatus ?? null;
  const statusLabel =
    projectStatusLabel ?? proposal.projectStatusLabel ?? status ?? null;
  const chips = [];

  if (packageLabel) {
    chips.push({
      key: 'package',
      label: packageLabel,
      sx: packageChipSx,
    });
  }

  if (statusLabel || status) {
    chips.push({
      key: 'project-status',
      label: statusLabel || status,
      sx: projectStatusChipSx(status),
    });
  }

  return (
    <LinkedRecordCard
      chips={chips}
      title={proposal.clientName || fallbackName || null}
      subtitle={proposal.businessName || fallbackBusinessName || null}
      dateLabel={proposalCardDateLabel(proposal)}
      viewTo={`/admin/proposals/${proposal.id}`}
      viewLabel="View Proposal"
    />
  );
};

export default ProposalLinkedCard;
