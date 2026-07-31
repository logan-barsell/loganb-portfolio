import React from 'react';
import {
  inquiryTypeChipLabel,
  resolvePackageLabel,
  resolveStageLabel,
} from '../../data/adminNav';
import {
  inquiryTypeChipSx,
  packageChipSx,
  pipelineStageChipSx,
} from '../../data/statusChips';
import { inquiryCardDateLabel } from './linkedCardDates';
import LinkedRecordCard from './LinkedRecordCard';

/**
 * @param {{
 *   inquiry: object,
 *   fallbackName?: string | null,
 *   fallbackBusinessName?: string | null,
 * }} props
 */
const InquiryLinkedCard = ({
  inquiry,
  fallbackName = null,
  fallbackBusinessName = null,
}) => {
  if (!inquiry?.id) return null;

  const packageLabel = resolvePackageLabel(inquiry.packageSlug, inquiry.packageLabel);
  const chips = [];

  if (inquiry.type === 'project' && packageLabel) {
    chips.push({
      key: 'package',
      label: packageLabel,
      sx: packageChipSx,
    });
  } else {
    chips.push({
      key: 'type',
      label: inquiryTypeChipLabel(inquiry.type, inquiry.packageLabel, inquiry.packageSlug),
      sx: inquiryTypeChipSx(inquiry.type),
    });
  }

  if (inquiry.stage || inquiry.stageLabel) {
    chips.push({
      key: 'stage',
      label: resolveStageLabel(inquiry.stage, inquiry.stageLabel),
      sx: pipelineStageChipSx(inquiry.stage),
    });
  }

  return (
    <LinkedRecordCard
      chips={chips}
      title={inquiry.name || fallbackName || null}
      subtitle={inquiry.businessName || fallbackBusinessName || null}
      dateLabel={inquiryCardDateLabel(inquiry)}
      viewTo={`/admin/inquiries/${inquiry.id}`}
      viewLabel="View Inquiry"
    />
  );
};

export default InquiryLinkedCard;
