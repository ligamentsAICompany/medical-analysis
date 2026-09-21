'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PiPaperclip } from 'react-icons/pi'
import { isZipFile } from '../../lib/medicalFileTypes'
import { listChatMessages, uploadChatFile } from '../../lib/chatClient'
import { ChatMessage } from './ChatMessage'

const CHAT_MODEL_OPTIONS = [
  { value: 'medgemma-dicom-v1', label: 'MedGemma' },
]

let turnIdSeq = 1
const nextTurnId = () => `chat-turn-${Date.now()}-${turnIdSeq++}`

export function ChatPanel () {
  const [turns, setTurns] = useState([])
  const [model, setModel] = useState(CHAT_MODEL_OPTIONS[0].value)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])

  useEffect(() => {
    let active = true

    listChatMessages()
      .then((messages) => {
        if (!active) return

        // The API returns newest first. Chat reads naturally oldest first.
        const historyTurns = [...messages].reverse().map((chatMessage) => ({
          id: `saved-${chatMessage.messageId}`,
          kind: 'assistant',
          chatMessage,
        }))

        setTurns((currentTurns) => {
          const currentMessageIds = new Set(
            currentTurns.map((turn) => turn.chatMessage?.messageId).filter(Boolean)
          )
          return [
            ...historyTurns.filter(
              (turn) => !currentMessageIds.has(turn.chatMessage?.messageId)
            ),
            ...currentTurns,
          ]
        })
      })
      .catch((err) => {
        if (!active) return
        setTurns((currentTurns) => [
          {
            id: nextTurnId(),
            kind: 'error',
            text: err.message || 'Could not load saved MedGemma reports',
          },
          ...currentTurns,
        ])
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleFeedbackSubmitted = useCallback((messageId, feedback) => {
    setTurns((prev) =>
      prev.map((turn) =>
        turn.chatMessage?.messageId === messageId
          ? { ...turn, chatMessage: { ...turn.chatMessage, feedback } }
          : turn
      )
    )
  }, [])

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!isZipFile(file)) {
      setTurns((prev) => [
        ...prev,
        {
          id: nextTurnId(),
          kind: 'error',
          text: `${file.name}: the chat currently only accepts a DICOM ZIP archive.`,
        },
      ])
      return
    }

    const userTurnId = nextTurnId()
    const thinkingTurnId = nextTurnId()
    setTurns((prev) => [
      ...prev,
      { id: userTurnId, kind: 'user', fileName: file.name },
      { id: thinkingTurnId, kind: 'thinking' },
    ])
    setIsUploading(true)

    try {
      const chatMessage = await uploadChatFile(file, model)
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === thinkingTurnId
            ? { id: thinkingTurnId, kind: 'assistant', chatMessage }
            : turn
        )
      )
    } catch (err) {
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === thinkingTurnId
            ? { id: thinkingTurnId, kind: 'error', text: err.message || 'Upload failed' }
            : turn
        )
      )
    } finally {
      setIsUploading(false)
    }
  }, [model])

  return (
    <div className="assistant-panel">
      <header className="assistant-panel__header">
        <div className="assistant-panel__title-row">
          <h2 className="assistant-panel__title">Chat</h2>
        </div>
        <div className="assistant-panel__header-actions">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isUploading}
            aria-label="Chat model"
          >
            {CHAT_MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="assistant-panel__messages" role="log" aria-live="polite" aria-relevant="additions">
        {isLoadingHistory && turns.length === 0 ? (
          <p className="assistant-msg__empty">Loading saved MedGemma reports…</p>
        ) : turns.length === 0 ? (
          <p className="assistant-msg__empty">
            Upload a DICOM ZIP to get a chat-style analysis response, then rate it or correct
            the report — feedback is what makes a case eligible for the fine-tuning dataset.
          </p>
        ) : null}
        {turns.map((turn) => (
          <ChatMessage key={turn.id} turn={turn} onFeedbackSubmitted={handleFeedbackSubmitted} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="assistant-panel__composer">
        <div className="assistant-panel__input-row">
          <input
            ref={fileInputRef}
            type="file"
            className="assistant-panel__file-input"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={handleFileChange}
            aria-hidden
            tabIndex={-1}
          />
          <button
            type="button"
            className="assistant-voice"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Upload DICOM ZIP"
            title="Upload DICOM ZIP"
          >
            <PiPaperclip size={16} aria-hidden />
          </button>
          <span className="assistant-panel__hint">
            {isUploading ? 'Analyzing…' : 'Attach a DICOM ZIP to start'}
          </span>
        </div>
      </div>
    </div>
  )
}
