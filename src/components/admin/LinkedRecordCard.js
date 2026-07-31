import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { colors } from '../../theme/colors';

const cardSx = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1.5,
  alignItems: 'center',
  justifyContent: 'space-between',
  p: 1.5,
  borderRadius: 1,
  border: `1px solid rgba(149, 99, 187, 0.35)`,
  backgroundColor: colors.cardBg,
};

/**
 * Shared admin linked-record row: identity, chips, date, and a vertically centered view link.
 * @param {{
 *   chips: Array<{ key?: string, label: string, sx?: object }>,
 *   title?: string | null,
 *   subtitle?: string | null,
 *   dateLabel?: string | null,
 *   viewTo: string,
 *   viewLabel: string,
 * }} props
 */
const LinkedRecordCard = ({
  chips = [],
  title = null,
  subtitle = null,
  dateLabel = null,
  viewTo,
  viewLabel,
}) => (
  <Box sx={cardSx}>
    <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
      {title ? (
        <Typography sx={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{title}</Typography>
      ) : null}
      {subtitle ? (
        <Typography sx={{ color: colors.muted, fontSize: 13 }}>{subtitle}</Typography>
      ) : null}
      {chips.length ? (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: title || subtitle ? 0.75 : 0,
            mb: dateLabel ? 0.5 : 0,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {chips.map((chip, index) => (
            <Chip
              key={chip.key || `${chip.label}-${index}`}
              label={chip.label}
              size="small"
              sx={chip.sx}
            />
          ))}
        </Stack>
      ) : null}
      {dateLabel ? (
        <Typography
          sx={{
            color: colors.muted,
            fontSize: 13,
            mt: chips.length || title || subtitle ? 0.35 : 0,
          }}
        >
          {dateLabel}
        </Typography>
      ) : null}
    </Box>
    <Button component={RouterLink} to={viewTo} sx={{ color: colors.green, textTransform: 'none' }}>
      {viewLabel}
    </Button>
  </Box>
);

export default LinkedRecordCard;
