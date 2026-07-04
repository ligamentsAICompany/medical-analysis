'use client'

import React from 'react'
import { PiLightning, PiLightningSlash } from 'react-icons/pi'

export function LiteModeToggle ({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
      className={`assistant-lite-toggle${enabled ? ' assistant-lite-toggle--on' : ''}`}
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      aria-pressed={enabled}
      title={enabled ? 'Lite mode on — keyword parser only' : 'Lite mode off — Transformers.js enabled'}
      aria-label={enabled ? 'Disable lite mode' : 'Enable lite mode'}
    >
      {enabled ? <PiLightningSlash size={14} aria-hidden /> : <PiLightning size={14} aria-hidden />}
      <span>Lite</span>
    </button>
  )
}
