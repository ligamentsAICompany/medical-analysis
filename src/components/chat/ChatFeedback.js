'use client'

import React, { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { submitChatFeedback } from '../../lib/chatClient'

/**
 * Thumbs up/down + optional corrected-report text, tied to one chat message.
 * Submitting persists to the backend (app/api/chat.py's feedback endpoint),
 * which is what makes this message eligible for the fine-tuning dataset
 * export (scripts/build_medgemma_dataset_from_chat.py).
 * @param {{ messageId: string, existingFeedback?: object|null, onSubmitted?: (feedback: object) => void }} props
 */
export function ChatFeedback ({ messageId, existingFeedback, onSubmitted }) {
  const [rating, setRating] = useState(existingFeedback?.rating || null)
  const [comment, setComment] = useState(existingFeedback?.comment || '')
  const [correctedReport, setCorrectedReport] = useState(existingFeedback?.correctedReport || '')
  const [showCorrection, setShowCorrection] = useState(Boolean(existingFeedback?.correctedReport))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(Boolean(existingFeedback))

  const handleSubmit = async (nextRating) => {
    const effectiveRating = nextRating || rating
    if (!effectiveRating) return
    setRating(effectiveRating)
    setSubmitting(true)
    setError(null)
    try {
      const feedback = await submitChatFeedback(messageId, {
        rating: effectiveRating,
        comment: comment.trim() || undefined,
        correctedReport: correctedReport.trim() || undefined,
      })
      setSubmitted(true)
      onSubmitted?.(feedback)
    } catch (err) {
      setError(err.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="analysis-feedback analysis-feedback--chat">
      <div className="analysis-feedback__row analysis-feedback__row--header" role="group" aria-label="Rate this response">
        <button
          type="button"
          className={`analysis-feedback__thumb${rating === 'up' ? ' analysis-feedback__thumb--active' : ''}`}
          onClick={() => handleSubmit('up')}
          disabled={submitting}
          aria-pressed={rating === 'up'}
          aria-label="Thumbs up — helpful"
        >
          <ThumbsUp size={16} strokeWidth={rating === 'up' ? 2.25 : 1.75} aria-hidden />
        </button>
        <button
          type="button"
          className={`analysis-feedback__thumb${rating === 'down' ? ' analysis-feedback__thumb--active analysis-feedback__thumb--down' : ''}`}
          onClick={() => handleSubmit('down')}
          disabled={submitting}
          aria-pressed={rating === 'down'}
          aria-label="Thumbs down — not helpful"
        >
          <ThumbsDown size={16} strokeWidth={rating === 'down' ? 2.25 : 1.75} aria-hidden />
        </button>
        <button
          type="button"
          className="assistant-chip"
          onClick={() => setShowCorrection((v) => !v)}
        >
          {showCorrection ? 'Hide correction' : 'Correct this report'}
        </button>
      </div>

      {showCorrection ? (
        <div className="analysis-feedback__composer">
          <textarea
            className="analysis-feedback__textarea"
            rows={4}
            value={correctedReport}
            onChange={(e) => setCorrectedReport(e.target.value)}
            placeholder="Paste or type the corrected report text (used as ground truth for fine-tuning)…"
            maxLength={8000}
            aria-label="Corrected report"
          />
          <textarea
            className="analysis-feedback__textarea"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment…"
            maxLength={2000}
            aria-label="Feedback comment"
          />
          <div className="analysis-feedback__actions">
            <button
              type="button"
              className="btn btn--primary analysis-feedback__submit"
              onClick={() => handleSubmit(rating || 'up')}
              disabled={submitting}
            >
              Submit correction
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="analysis-feedback__voice-error" role="alert">{error}</p> : null}
      {submitted && !error ? (
        <p className="analysis-feedback__saved" role="status">Feedback saved</p>
      ) : null}
    </div>
  )
}
