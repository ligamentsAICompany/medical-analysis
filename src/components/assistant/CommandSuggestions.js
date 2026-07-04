'use client'

import React from 'react'
import { QUICK_COMMANDS, ADMIN_QUICK_COMMANDS } from '../../lib/assistant/actionRegistry'

export function CommandSuggestions ({ query, onSelect, visible, isAdmin = false }) {
  if (!visible) return null

  const q = (query || '').trim().toLowerCase()
  const pool = isAdmin ? [...QUICK_COMMANDS, ...ADMIN_QUICK_COMMANDS] : QUICK_COMMANDS
  const items = q
    ? pool.filter((c) => c.toLowerCase().includes(q))
    : pool

  if (!items.length) return null

  return (
    <ul className="assistant-suggestions" role="listbox" aria-label="Command suggestions">
      {items.slice(0, 6).map((cmd) => (
        <li key={cmd}>
          <button
            type="button"
            role="option"
            className="assistant-suggestions__item"
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(cmd)
            }}
          >
            {cmd}
          </button>
        </li>
      ))}
    </ul>
  )
}
