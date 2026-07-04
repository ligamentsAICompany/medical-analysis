'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const SILENCE_TIMEOUT_MS = 2500

function isSupported () {
  return typeof window !== 'undefined'
    && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

export function useVoiceRecognition (onFinalResult) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [error, setError] = useState(null)

  const recogRef = useRef(null)
  const accumulatedRef = useRef('')
  const silenceTimerRef = useRef(null)
  const supported = isSupported()

  useEffect(() => () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    recogRef.current?.abort()
  }, [])

  const start = useCallback(() => {
    if (!supported || listening) return

    setError(null)
    setTranscript('')
    setFinalTranscript('')
    accumulatedRef.current = ''

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    const recog = new SpeechRec()

    recog.continuous = true
    recog.interimResults = true
    recog.lang = 'en-US'
    recog.maxAlternatives = 1

    recog.onstart = () => setListening(true)

    recog.onresult = (e) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          accumulatedRef.current += `${accumulatedRef.current ? ' ' : ''}${t.trim()}`
        } else {
          interim = t
        }
      }

      setTranscript(interim || accumulatedRef.current)

      silenceTimerRef.current = setTimeout(() => {
        recogRef.current?.stop()
      }, SILENCE_TIMEOUT_MS)
    }

    recog.onerror = (e) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (e.error === 'no-speech') {
        setError('No speech detected. Try again.')
      } else if (e.error === 'not-allowed') {
        setError('Microphone access denied. Allow mic access in browser settings.')
      } else if (e.error !== 'aborted') {
        setError(`Voice input failed: ${e.error}`)
      }
      setListening(false)
    }

    recog.onend = () => {
      setListening(false)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

      const final = accumulatedRef.current.trim()
      accumulatedRef.current = ''

      if (final) {
        setFinalTranscript(final)
        setTranscript('')
        onFinalResult(final)
      } else {
        setTranscript('')
      }
    }

    recogRef.current = recog
    recog.start()
  }, [supported, listening, onFinalResult])

  const stop = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    recogRef.current?.stop()
  }, [])

  return {
    isSupported: supported,
    isListening: listening,
    transcript,
    finalTranscript,
    error,
    start,
    stop,
  }
}
