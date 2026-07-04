'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PiPaperclip, PiPaperPlaneRight, PiTrash, PiX } from 'react-icons/pi'
import { useAuth } from '../../context/AuthContext'
import { useAssistant } from '../../context/AssistantContext'
import { ADMIN_QUICK_COMMANDS, QUICK_COMMANDS } from '../../lib/assistant/actionRegistry'
import { formatClassificationLabel, isUploadConfirmPhase } from '../../lib/assistant/clinicalUploadWorkflow'
import { AssistantMessage } from './AssistantMessage'
import { CommandSuggestions } from './CommandSuggestions'
import { ParserSourceChip } from './ParserSourceChip'
import { LiteModeToggle } from './LiteModeToggle'
import { VoiceButton } from './VoiceButton'
import { useActionRunner } from './hooks/useActionRunner'
import { useClinicalUploadWorkflow } from './hooks/useClinicalUploadWorkflow'
import { useVoiceRecognition } from './hooks/useVoiceRecognition'

const FILE_ACCEPT = '.pdf,.txt,.docx,.jpg,.jpeg,.png,.webp,.zip,.dcm,.dicom,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,application/zip,application/x-zip-compressed,application/dicom'

export function AssistantPanel () {
  const { user } = useAuth()
  const isAdmin = Boolean(user?.isAdmin)
  const {
    messages,
    isProcessing,
    clearMessages,
    closeAssistant,
    lastParserSource,
    modelsPreloading,
    uploadWorkflow,
    liteMode,
    setLiteMode,
  } = useAssistant()
  const { runAction } = useActionRunner()
  const { attachFiles, cancelUpload, startAnalysis } = useClinicalUploadWorkflow()

  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [voiceError, setVoiceError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)
  const fileInputRef = useRef(null)

  const quickCommands = useMemo(() => (
    isAdmin ? [...QUICK_COMMANDS.slice(0, 3), ...ADMIN_QUICK_COMMANDS.slice(0, 1)] : QUICK_COMMANDS.slice(0, 4)
  ), [isAdmin])

  const pendingFile = uploadWorkflow?.files?.[0] || null
  const showPendingChip = isUploadConfirmPhase(uploadWorkflow) && pendingFile

  const handleVoiceResult = useCallback(async (text) => {
    setVoiceError(null)
    setInput(text)
    await runAction(text)
  }, [runAction])

  const voice = useVoiceRecognition(handleVoiceResult)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (voice.error) setVoiceError(voice.error)
  }, [voice.error])

  useEffect(() => {
    if (!voice.isListening && !voice.transcript) return
    setInput(voice.transcript)
  }, [voice.transcript, voice.isListening])

  useEffect(() => {
    if (!showSuggestions) return undefined
    const handlePointerDown = (e) => {
      if (wrapperRef.current?.contains(e.target)) return
      setShowSuggestions(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [showSuggestions])

  const handleSubmit = useCallback(async (text) => {
    const value = (text ?? input).trim()
    if (!value || isProcessing) return
    setInput('')
    setShowSuggestions(false)
    setVoiceError(null)
    await runAction(value)
  }, [input, isProcessing, runAction])

  const handleFileChange = useCallback(async (e) => {
    const files = e.target.files
    if (!files?.length) return
    await attachFiles(files)
    e.target.value = ''
  }, [attachFiles])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      closeAssistant()
    }
  }

  const handleChipClick = (cmd) => {
    inputRef.current?.focus()
    handleSubmit(cmd)
  }

  return (
    <div className="assistant-panel">
      <header className="assistant-panel__header">
        <div>
          <div className="assistant-panel__title-row">
            <h2 className="assistant-panel__title">MedDocs Assistant</h2>
            {/* <ParserSourceChip source={lastParserSource} /> */}
          </div>
        </div>
        <div className="assistant-panel__header-actions">
          {/* <LiteModeToggle
            enabled={liteMode}
            onChange={setLiteMode}
            disabled={isProcessing}
          /> */}
          <button
            type="button"
            className="shell-icon-btn"
            onClick={clearMessages}
            aria-label="Clear chat"
            title="Clear chat"
          >
            <PiTrash size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="shell-icon-btn"
            onClick={closeAssistant}
            aria-label="Close assistant"
          >
            <PiX size={18} aria-hidden />
          </button>
        </div>
      </header>

      {modelsPreloading && !liteMode ? (
        <div className="assistant-panel__model-bar" role="status" aria-live="polite">
          <span className="assistant-panel__model-bar-spinner" aria-hidden />
          Load Transformers.js models
        </div>
      ) : null}

      <div className="assistant-panel__messages" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((msg) => (
          <AssistantMessage key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {showPendingChip ? (
        <div className="assistant-file-chip" aria-label="Pending file upload">
          <div className="assistant-file-chip__meta">
            <span className="assistant-file-chip__name">{pendingFile.name}</span>
            <span className="assistant-file-chip__type">
              {formatClassificationLabel(uploadWorkflow.classification)}
              {uploadWorkflow.classification?.method ? ` · ${uploadWorkflow.classification.method}` : ''}
            </span>
          </div>
          <div className="assistant-file-chip__actions">
            <button
              type="button"
              className="assistant-chip assistant-chip--primary"
              onClick={startAnalysis}
              disabled={isProcessing}
            >
              Analyze
            </button>
            <button
              type="button"
              className="assistant-chip"
              onClick={cancelUpload}
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="assistant-panel__chips" aria-label="Quick commands">
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            className="assistant-chip"
            onClick={() => handleChipClick(cmd)}
            disabled={isProcessing}
          >
            {cmd}
          </button>
        ))}
      </div>

      <div className="assistant-panel__composer" ref={wrapperRef}>
        <CommandSuggestions
          query={input}
          visible={showSuggestions && !isProcessing}
          onSelect={(cmd) => handleSubmit(cmd)}
          isAdmin={isAdmin}
        />
        <div className="assistant-panel__input-row">
          <input
            ref={fileInputRef}
            type="file"
            className="assistant-panel__file-input"
            accept={FILE_ACCEPT}
            multiple
            onChange={handleFileChange}
            aria-hidden
            tabIndex={-1}
          />
          <button
            type="button"
            className="assistant-voice"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            aria-label="Attach clinical file"
            title="Attach PDF, image, or DICOM"
          >
            <PiPaperclip size={16} aria-hidden />
          </button>
          <VoiceButton
            isSupported={voice.isSupported}
            isListening={voice.isListening}
            isProcessing={isProcessing}
            onStart={voice.start}
            onStop={voice.stop}
          />
          <input
            ref={inputRef}
            type="text"
            className="assistant-panel__input"
            placeholder="Ask or command… (e.g. Show lab reports)"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            aria-label="Assistant command input"
          />
          <button
            type="button"
            className="assistant-panel__send"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isProcessing}
            aria-label="Send command"
          >
            <PiPaperPlaneRight size={18} aria-hidden />
          </button>
        </div>
        {/* {voiceError ? (
          <p className="assistant-panel__voice-error" role="alert">{voiceError}</p>
        ) : null}
        <p className="assistant-panel__hint">
          {liteMode ? 'Lite mode on' : 'Transformers.js first'} · Groq fallback · Clip to attach · Esc to close
        </p> */}
      </div>
    </div>
  )
}
