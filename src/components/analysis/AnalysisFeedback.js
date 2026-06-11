'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { File, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { useMedDocs } from '../../context/MedDocsContext'
import { DICOM_MIME, DOCX_MIME, isDicomFile, isDocxFile, isZipFile, validateAnalyzeFile } from '../../lib/medicalFileTypes'
import {
  maxAnalyzeFileLabel,
  maxZipFileLabel,
} from '../../config/uploadLimits'

const ACCEPT_FEEDBACK = [
  'application/pdf',
  'text/plain',
  DOCX_MIME,
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
  DICOM_MIME,
  'application/x-dicom',
]
const MAX_FEEDBACK_FILES = 6

let attachmentIdSeq = 1

function validateFeedbackFile (file, addToast) {
  const typeOk =
    (file.type && ACCEPT_FEEDBACK.includes(file.type)) ||
    isDocxFile(file) ||
    isDicomFile(file) ||
    isZipFile(file)
  if (!typeOk) {
    addToast(`${file.name}: type not allowed (PDF, TXT, DOCX, ZIP, images, DICOM .dcm)`, 'error')
    return false
  }
  const result = validateAnalyzeFile(file)
  if (!result.ok) {
    addToast(result.error, 'error')
    return false
  }
  return true
}

export function AnalysisFeedbackSection ({ doc, showTitle = true, pageTitle = null }) {
  const { updateDocument, addToast } = useMedDocs()
  const fb = doc.userFeedback || null
  const [comment, setComment] = useState(fb?.comment || '')
  const fileInputRef = useRef(null)

  useEffect(() => {
    setComment(fb?.comment || '')
  }, [doc.id, fb?.comment])

  const handleThumb = useCallback(
    (sentiment) => {
      updateDocument(doc.id, (d) => {
        const prev = d.userFeedback || {}
        const next = prev.sentiment === sentiment ? null : sentiment
        return {
          userFeedback: {
            ...prev,
            sentiment: next,
            comment: comment.trim(),
            attachments: prev.attachments || [],
            updatedAt: new Date().toISOString(),
          },
        }
      })
    },
    [comment, doc.id, updateDocument]
  )

  const handleCommentBlur = useCallback(() => {
    const trimmed = comment.trim()
    if (trimmed === (fb?.comment || '')) return
    updateDocument(doc.id, (d) => {
      const prev = d.userFeedback || {}
      return {
        userFeedback: {
          ...prev,
          sentiment: prev.sentiment ?? null,
          comment: trimmed,
          attachments: prev.attachments || [],
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }, [comment, doc.id, fb?.comment, updateDocument])

  const handlePickFiles = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e) => {
      const picked = [...(e.target.files || [])]
      e.target.value = ''
      if (!picked.length) return

      const startCount = (doc.userFeedback?.attachments || []).length
      if (startCount >= MAX_FEEDBACK_FILES) {
        addToast(`Maximum ${MAX_FEEDBACK_FILES} attachments`, 'warning')
        return
      }

      let room = MAX_FEEDBACK_FILES - startCount
      const toAdd = []
      for (const file of picked) {
        if (room <= 0) {
          addToast('Some files were skipped (attachment limit reached)', 'warning')
          break
        }
        if (!validateFeedbackFile(file, addToast)) continue
        const objectUrl = URL.createObjectURL(file)
        toAdd.push({
          id: `fb-att-${Date.now()}-${attachmentIdSeq++}`,
          name: file.name,
          size: file.size,
          fileType: file.type,
          objectUrl,
          file,
        })
        room -= 1
      }

      if (!toAdd.length) return

      updateDocument(doc.id, (d) => {
        const prev = d.userFeedback || {}
        const existing = [...(prev.attachments || [])]
        return {
          userFeedback: {
            ...prev,
            comment: prev.comment ?? '',
            sentiment: prev.sentiment ?? null,
            attachments: [...existing, ...toAdd],
            updatedAt: new Date().toISOString(),
          },
        }
      })
    },
    [addToast, doc.id, doc.userFeedback?.attachments, updateDocument]
  )

  const handleRemoveAttachment = useCallback(
    (attachmentId) => {
      updateDocument(doc.id, (d) => {
        const prev = d.userFeedback || {}
        const list = prev.attachments || []
        const att = list.find((a) => a.id === attachmentId)
        if (att?.objectUrl) URL.revokeObjectURL(att.objectUrl)
        return {
          userFeedback: {
            ...prev,
            attachments: list.filter((a) => a.id !== attachmentId),
            updatedAt: new Date().toISOString(),
          },
        }
      })
    },
    [doc.id, updateDocument]
  )

  if (doc.status !== 'ready') return null

  const active = fb?.sentiment || null
  const attachments = fb?.attachments || []

  const thumbRow = (
    <div
      className="analysis-feedback__row analysis-feedback__row--header"
      role="group"
      aria-label="Rate this analysis"
    >
      <button
        type="button"
        className={`analysis-feedback__thumb${active === 'up' ? ' analysis-feedback__thumb--active' : ''}`}
        onClick={() => handleThumb('up')}
        aria-pressed={active === 'up'}
        aria-label="Thumbs up — helpful"
      >
        <ThumbsUp size={20} strokeWidth={active === 'up' ? 2.25 : 1.75} aria-hidden />
        <span>Helpful</span>
      </button>
      <button
        type="button"
        className={`analysis-feedback__thumb${active === 'down' ? ' analysis-feedback__thumb--active analysis-feedback__thumb--down' : ''}`}
        onClick={() => handleThumb('down')}
        aria-pressed={active === 'down'}
        aria-label="Thumbs down — not helpful"
      >
        <ThumbsDown size={20} strokeWidth={active === 'down' ? 2.25 : 1.75} aria-hidden />
        <span>Not helpful</span>
      </button>
    </div>
  )

  return (
    <div className="analysis-feedback">
      <input
        id={`analysis-feedback-files-${doc.id}`}
        ref={fileInputRef}
        type="file"
        className="analysis-feedback__file-input"
        multiple
        accept=".pdf,.txt,.docx,.jpg,.jpeg,.png,.webp,.zip,.dcm,.dicom,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,application/zip,application/x-zip-compressed,application/dicom"
        aria-label="Attach files to feedback"
        onChange={handleFileChange}
      />
      {pageTitle != null ? (
        <div className="analysis-feedback-standalone__head">
          <div className="analysis-feedback-standalone__head-title">{pageTitle}</div>
          {thumbRow}
        </div>
      ) : showTitle ? (
        <div className="analysis-feedback__header">
          <div className="analysis-feedback__header-text">
            <p className="analysis-feedback__title">Was this analysis helpful?</p>
            <p className="analysis-feedback__hint">Your feedback improves the product</p>
          </div>
          {thumbRow}
        </div>
      ) : (
        <div className="analysis-feedback__header analysis-feedback__header--compact">
          {thumbRow}
        </div>
      )}

      <span id={`analysis-feedback-attach-hint-${doc.id}`} className="sr-only">
        Attach up to {MAX_FEEDBACK_FILES} files: PDF, plain text, ZIP, JPEG, PNG, WebP, or DICOM (.dcm). Most files up to {maxAnalyzeFileLabel}; ZIP up to {maxZipFileLabel}.
      </span>
      <div className="analysis-feedback__textarea-wrap">
        <textarea
          id={`analysis-feedback-${doc.id}`}
          className="analysis-feedback__textarea analysis-feedback__textarea--with-attach"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={handleCommentBlur}
          placeholder="Comments (optional). Use the file icon to attach files."
          maxLength={2000}
          aria-label="Feedback comments (optional)"
          aria-describedby={`analysis-feedback-attach-hint-${doc.id}`}
        />
        <button
          type="button"
          className="analysis-feedback__textarea-attach"
          onClick={handlePickFiles}
          disabled={attachments.length >= MAX_FEEDBACK_FILES}
          aria-label="Attach files to feedback"
          aria-describedby={`analysis-feedback-attach-hint-${doc.id}`}
          title="Attach files"
        >
          <File size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="analysis-feedback__attach-block">
          <ul className="analysis-feedback__attachments" aria-label="Attached files">
            {attachments.map((att) => (
              <li key={att.id} className="analysis-feedback__att-item">
                <span className="analysis-feedback__att-name" title={att.name}>{att.name}</span>
                <span className="analysis-feedback__att-meta">
                  {att.size >= 1024 * 1024
                    ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${(att.size / 1024).toFixed(att.size > 102400 ? 0 : 1)} KB`}
                </span>
                {att.fileType?.startsWith('image/') && att.objectUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.objectUrl}
                    alt={`Preview: ${att.name}`}
                    className="analysis-feedback__att-thumb"
                  />
                ) : null}
                <button
                  type="button"
                  className="analysis-feedback__att-remove"
                  onClick={() => handleRemoveAttachment(att.id)}
                  aria-label={`Remove ${att.name}`}
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fb?.updatedAt && (
        <p className="analysis-feedback__saved" role="status">
          Saved {new Date(fb.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
