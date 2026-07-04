'use client'

import React, { useEffect } from 'react'
import { PiWarning, PiX } from 'react-icons/pi'

export function ConfirmModal ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  confirming = false,
  destructive = false,
  alertOnly = false,
}) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !confirming) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, confirming, onClose])

  if (!open) return null

  return (
    <div className="user-modal-backdrop" role="presentation" onClick={confirming ? undefined : onClose}>
      <div
        className="user-modal confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-modal__header">
          <div className="confirm-modal__title-row">
            {destructive ? (
              <span className="confirm-modal__icon confirm-modal__icon--danger" aria-hidden>
                <PiWarning size={18} />
              </span>
            ) : null}
            <h2 id="confirm-modal-title" className="user-modal__title">
              {title}
            </h2>
          </div>
          {!confirming ? (
            <button type="button" className="shell-icon-btn" onClick={onClose} aria-label="Close">
              <PiX size={18} aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="confirm-modal__body">
          <p id="confirm-modal-description" className="confirm-modal__description">
            {description}
          </p>

          <div className="user-modal__actions">
            {!alertOnly ? (
              <button
                type="button"
                className="shell-btn shell-btn--secondary"
                onClick={onClose}
                disabled={confirming}
              >
                {cancelLabel}
              </button>
            ) : null}
            <button
              type="button"
              className={`shell-btn${destructive ? ' shell-btn--danger' : ' shell-btn--primary'}`}
              onClick={alertOnly ? onClose : onConfirm}
              disabled={confirming}
            >
              {confirming ? 'Deleting…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
