import React from 'react';
import Typography from '@mui/material/Typography';
import AttachmentList from '../attachments/AttachmentList';
import { attachmentDownloadUrl, fetchAttachmentPreview } from '../../api/adminClient';
import { colors } from '../../theme/colors';

/**
 * List + preview/download for inquiry attachments (admin).
 * @param {{ inquiryId: string, attachments?: Array }} props
 */
const InquiryAttachments = ({ inquiryId, attachments = [] }) => {
  if (!inquiryId) {
    return <Typography sx={{ color: colors.muted }}>No linked inquiry.</Typography>;
  }

  return (
    <AttachmentList
      attachments={attachments}
      fetchPreview={(file) => fetchAttachmentPreview(inquiryId, file.id)}
      downloadUrl={(file) => attachmentDownloadUrl(inquiryId, file.id)}
    />
  );
};

export default InquiryAttachments;
