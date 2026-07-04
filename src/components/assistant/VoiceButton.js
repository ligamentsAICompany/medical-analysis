'use client'

import React from 'react'
import { PiMicrophone, PiMicrophoneSlash } from 'react-icons/pi'

export function VoiceButton ({
  isSupported,
  isListening,
  isProcessing,
  onStart,
  onStop,
}) {
  if (!isSupported) {
    return (
      <div
        className="assistant-voice assistant-voice--disabled"
        title="Voice not supported in this browser. Use Chrome or Edge."
        aria-label="Voice not supported"
      >
        <PiMicrophoneSlash size={16} aria-hidden />
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="assistant-voice assistant-voice--processing" aria-hidden>
        <span className="assistant-voice__spinner" />
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`assistant-voice${isListening ? ' assistant-voice--active' : ''}`}
      onClick={isListening ? onStop : onStart}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      title={isListening ? 'Stop recording' : 'Voice input'}
    >
      {isListening ? <span className="assistant-voice__ping" aria-hidden /> : null}
      <PiMicrophone size={16} aria-hidden />
    </button>
  )
}
