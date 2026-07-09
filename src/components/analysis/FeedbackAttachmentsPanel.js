'use client'

import React from 'react'
import { Download, ExternalLink, Paperclip } from 'lucide-react'

function getAttachmentUrl (att) {
  return att?.url || att?.objectUrl || ''
}

function canPreviewInBrowser (att) {
  const type = (att?.fileType || att?.contentType || '').toLowerCase()
  const name = (att?.name || '').toLowerCase()
  return type.startsWith('image/')
    || type === 'application/pdf'
    || name.endsWith('.pdf')
    || name.endsWith('.png')
    || name.endsWith('.jpg')
    || name.endsWith('.jpeg')
    || name.endsWith('.webp')
}

function formatBytes (bytes) {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

/**
 * View / download list for persisted feedback attachments (GCS URLs).
 * @param {{ attachments: object[], title?: string }} props
 */
export function FeedbackAttachmentsPanel ({ attachments = [], title = 'Feedback attachments' }) {
  const saved = attachments.filter((att) => getAttachmentUrl(att))

  if (!saved.length) return null

  const handleView = (att) => {
    const url = getAttachmentUrl(att)
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = (att) => {
    const url = getAttachmentUrl(att)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = att.name || 'attachment'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  return (
    <section className="feedback-attachments-panel" aria-label={title}>
      <div className="feedback-attachments-panel__head">
        <Paperclip size={16} aria-hidden />
        <h3 className="feedback-attachments-panel__title">{title}</h3>
        <span className="feedback-attachments-panel__count">{saved.length} file{saved.length !== 1 ? 's' : ''}</span>
      </div>
      <ul className="feedback-attachments-panel__list">
        {saved.map((att) => {
          const previewable = canPreviewInBrowser(att)
          return (
            <li key={att.id || att.url || att.name} className="feedback-attachments-panel__item">
              <div className="feedback-attachments-panel__meta">
                <span className="feedback-attachments-panel__name" title={att.name}>{att.name}</span>
                {att.size ? (
                  <span className="feedback-attachments-panel__size">{formatBytes(att.size)}</span>
                ) : null}
              </div>
              <div className="feedback-attachments-panel__actions">
                {previewable ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleView(att)}
                    aria-label={`View ${att.name}`}
                  >
                    <ExternalLink size={14} aria-hidden /> View
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => handleDownload(att)}
                  aria-label={`Download ${att.name}`}
                >
                  <Download size={14} aria-hidden /> Download
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * @param {object} doc
 * @returns {string}
 */
export function getDocumentAttachmentName (doc) {
  if (!doc) return '—'
  return doc.attachmentName || doc.name || '—'
}
