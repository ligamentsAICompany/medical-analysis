'use client'

import React from 'react'
import { ASSISTANT_PARSER_LABELS } from '../../lib/assistant/actionRegistry'

export function ParserSourceChip ({ source }) {
  const label = ASSISTANT_PARSER_LABELS[source] || source
  return (
    <span
      className={`assistant-parser-chip assistant-parser-chip--${source || 'keyword'}`}
      title="Intent parser used for the last command"
    >
      {label}
    </span>
  )
}
