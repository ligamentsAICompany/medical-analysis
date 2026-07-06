'use client'

import React from 'react'
import { PiMicrophone, PiMicrophoneSlash } from 'react-icons/pi'

export function VoiceButton ({
  isSupported,
  isListening,
  isProcessing,
  onStart,
  onStop,
  className = '',
  label = '',
}) {
  const mergedClass = (base) => `${base}${className ? ` ${className}` : ''}`.trim()

  if (!isSupported) {
    return (
      <div
        className={mergedClass('assistant-voice assistant-voice--disabled')}
        title="Voice not supported in this browser. Use Chrome or Edge."
        aria-label="Voice not supported"
      >
        <PiMicrophoneSlash size={16} aria-hidden />
        {label ? <span className="assistant-voice__label">{label}</span> : null}
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className={mergedClass('assistant-voice assistant-voice--processing')} aria-hidden>
        <span className="assistant-voice__spinner" />
      </div>
    )
  }

  return (
    <button
      type="button"
      className={mergedClass(`assistant-voice${isListening ? ' assistant-voice--active' : ''}`)}
      onClick={isListening ? onStop : onStart}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      title={isListening ? 'Stop recording' : 'Voice input'}
    >
      {isListening ? <span className="assistant-voice__ping" aria-hidden /> : null}
      <PiMicrophone size={16} aria-hidden />
      {label ? <span className="assistant-voice__label">{label}</span> : null}
    </button>
  )
}
