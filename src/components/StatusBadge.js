'use client';

import React from 'react';

const CONFIG = {
  uploading: { label: 'Uploading', color: '#64748b', bg: '#f1f5f9' },
  analysing: { label: 'Analysing', color: '#b45309', bg: '#fef3c7', pulse: true },
  ready:     { label: 'Ready',     color: '#15803d', bg: '#dcfce7' },
  error:     { label: 'Error',     color: '#dc2626', bg: '#fee2e2' },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.error;
  return (
    <span
      className={`status-badge${cfg.pulse ? ' status-badge--pulse' : ''}`}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="status-badge__dot" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}
