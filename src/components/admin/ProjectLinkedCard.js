import React from 'react';
import { resolvePackageLabel } from '../../data/adminNav';
import { packageChipSx, projectStatusChipSx } from '../../data/statusChips';
import { projectCardDateLabel } from './linkedCardDates';
import LinkedRecordCard from './LinkedRecordCard';

/**
 * @param {{
 *   project: object,
 *   fallbackName?: string | null,
 *   fallbackBusinessName?: string | null,
 * }} props
 */
const ProjectLinkedCard = ({
  project,
  fallbackName = null,
  fallbackBusinessName = null,
}) => {
  if (!project?.id) return null;

  const packageLabel = resolvePackageLabel(project.packageSlug, project.packageLabel);
  const chips = [];

  if (packageLabel) {
    chips.push({
      key: 'package',
      label: packageLabel,
      sx: packageChipSx,
    });
  }

  if (project.statusLabel || project.status) {
    chips.push({
      key: 'status',
      label: project.statusLabel || project.status,
      sx: projectStatusChipSx(project.status),
    });
  }

  return (
    <LinkedRecordCard
      chips={chips}
      title={project.clientName || fallbackName || null}
      subtitle={project.clientBusinessName || fallbackBusinessName || null}
      dateLabel={projectCardDateLabel(project)}
      viewTo={`/admin/projects/${project.id}`}
      viewLabel="View Project"
    />
  );
};

export default ProjectLinkedCard;
