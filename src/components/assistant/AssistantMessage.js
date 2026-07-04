'use client'

import React from 'react'
import { PiRobot, PiUser } from 'react-icons/pi'

function renderMarkdown (text, isUser) {
  if (!text) return null
  return text.split('\n').map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return (
      <span key={li}>
        {li > 0 && <br />}
        {parts.map((part, pi) => {
          if (/^\*\*[^*]+\*\*$/.test(part)) {
            return (
              <strong key={pi} className={isUser ? 'assistant-msg__strong--user' : 'assistant-msg__strong'}>
                {part.slice(2, -2)}
              </strong>
            )
          }
          return <span key={pi}>{part}</span>
        })}
      </span>
    )
  })
}

function SearchTable ({ columns, rows }) {
  if (!rows?.length) {
    return <p className="assistant-msg__empty">No results found.</p>
  }

  const cellValue = (row, key) => {
    const val = row[key]
    if (val === null || val === undefined || val === '') return '—'
    return String(val)
  }

  return (
    <div className="assistant-msg__table-wrap">
      <table className="assistant-msg__table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {columns.map((col) => {
                const raw = cellValue(row, col.key)
                return (
                  <td key={col.key} title={raw}>
                    {col.key === 'status' ? (
                      <span className={`assistant-status assistant-status--${raw}`}>{raw}</span>
                    ) : raw}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AssistantMessage ({ message }) {
  const isUser = message.role === 'user'
  const isThinking = message.status === 'thinking'

  return (
    <div className={`assistant-msg${isUser ? ' assistant-msg--user' : ' assistant-msg--assistant'}`}>
      <div className="assistant-msg__avatar" aria-hidden>
        {isUser ? <PiUser size={14} /> : <PiRobot size={14} />}
      </div>
      <div className={`assistant-msg__bubble${isUser ? ' assistant-msg__bubble--user' : ''}`}>
        {isThinking ? (
          <span className="assistant-msg__thinking">
            <span className="assistant-msg__dot" />
            <span className="assistant-msg__dot" />
            <span className="assistant-msg__dot" />
          </span>
        ) : (
          <>
            <div className="assistant-msg__text">
              {renderMarkdown(message.text, isUser)}
            </div>
            {message.table ? (
              <SearchTable columns={message.table.columns} rows={message.table.rows} />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
