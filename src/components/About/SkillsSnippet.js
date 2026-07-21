import './SkillsSnippet.css';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { skills } from '../../data/skills';
import { colors } from '../../theme/colors';

const SkillsSnippet = () => {
  const entries = Object.entries(skills);

  return (
    <Box
      className="altFont skills-snippet"
      sx={{
        maxWidth: 720,
        margin: '10px auto',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${colors.purple}44`,
        background: 'rgba(3, 12, 28, 0.95)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${colors.purple}33`,
          background: 'rgba(6, 5, 35, 0.85)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f' }} />
        </Box>
        <Typography
          sx={{
            color: colors.muted,
            fontSize: '12px',
            ml: 1,
            letterSpacing: '0.04em',
          }}
        >
          skills.js
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', overflowX: 'auto' }}>
        <Box
          aria-hidden="true"
          sx={{
            flexShrink: 0,
            py: 2.5,
            pl: 1.5,
            pr: 1,
            textAlign: 'right',
            color: `${colors.muted}99`,
            fontSize: { xs: '12px', sm: '13px' },
            lineHeight: 1.75,
            userSelect: 'none',
            borderRight: `1px solid ${colors.purple}22`,
          }}
        >
          {Array.from({ length: entries.length + 2 }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </Box>

        <Box
          component="pre"
          className="skills-snippet__pre"
          sx={{
            flex: 1,
            m: 0,
            py: 2.5,
            px: { xs: 1.5, sm: 2.5 },
            fontSize: { xs: '12px', sm: '14px' },
            lineHeight: 1.75,
          }}
        >
          <code>
            <div>
              <span className="token-keyword">const</span>{' '}
              <span className="token-const">SKILLS</span>{' '}
              <span className="token-punct">=</span>{' '}
              <span className="token-punct">{'{'}</span>
            </div>
            {entries.map(([category, items], index) => (
              <div key={category} className="skills-snippet__line">
                <span className="token-key">{category}</span>
                <span className="token-punct">:</span>{' '}
                <span className="token-punct">[</span>
                <span className="skills-snippet__array">
                  {items.map((skill, i) => (
                    <span key={skill}>
                      <span className="token-string">&apos;{skill}&apos;</span>
                      {i < items.length - 1 ? (
                        <span className="token-punct">, </span>
                      ) : null}
                    </span>
                  ))}
                </span>
                <span className="token-punct">]</span>
                {index < entries.length - 1 ? (
                  <span className="token-punct">,</span>
                ) : null}
              </div>
            ))}
            <div>
              <span className="token-punct">{'}'}</span>
              <span className="token-punct">;</span>
              <span className="skills-cursor" aria-hidden="true" />
            </div>
          </code>
        </Box>
      </Box>
    </Box>
  );
};

export default SkillsSnippet;
