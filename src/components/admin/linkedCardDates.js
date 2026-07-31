export function formatCardDate(iso) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export function formatKickoffDate(ymd) {
  if (!ymd) return null;
  const raw = String(ymd).slice(0, 10);
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
      new Date(`${raw}T12:00:00`)
    );
  } catch {
    return raw;
  }
}

export function inquiryCardDateLabel(inquiry) {
  const when = formatCardDate(inquiry?.createdAt);
  return when ? `Submitted ${when}` : 'Submitted —';
}

export function proposalCardDateLabel(proposal) {
  if (proposal?.status === 'accepted') {
    const when = formatCardDate(proposal.acceptedAt || proposal.updatedAt || proposal.createdAt);
    return when ? `Accepted ${when}` : 'Accepted';
  }
  if (proposal?.status === 'declined') {
    const when = formatCardDate(proposal.declinedAt || proposal.updatedAt || proposal.createdAt);
    return when ? `Declined ${when}` : 'Declined';
  }
  if (proposal?.status === 'revision_requested') {
    const when = formatCardDate(proposal.updatedAt || proposal.sentAt || proposal.createdAt);
    return when ? `Revision requested ${when}` : 'Revision requested';
  }
  if (proposal?.status === 'sent') {
    const when = formatCardDate(proposal.sentAt || proposal.updatedAt || proposal.createdAt);
    return when ? `Sent ${when}` : 'Sent';
  }
  const when = formatCardDate(proposal?.updatedAt || proposal?.createdAt);
  return when ? `Drafted ${when}` : 'Drafted';
}

export function projectCardDateLabel(project) {
  const when = formatKickoffDate(project?.kickoffDate);
  return when ? `Kickoff ${when}` : 'Kickoff —';
}
