'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
};

const COLORS = {
  success: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
  error:   { bg: '#fff1f2', border: '#fca5a5', color: '#dc2626' },
  info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8' },
};

export default function Toast({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div
            key={t.id}
            className="toast"
            style={{ background: c.bg, borderColor: c.border, color: c.color }}
          >
            <span className="toast__icon">{ICONS[t.type] || ICONS.info}</span>
            <span className="toast__msg">{t.message}</span>
            <button className="toast__close" onClick={() => onRemove(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
