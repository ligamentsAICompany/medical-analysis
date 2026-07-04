'use client'

import { useEffect } from 'react'
import { useAssistant } from '../../context/AssistantContext'
import { useModelLoader } from './hooks/useModelLoader'

/** Keyboard shortcuts — visual entry is TopBar "Ask AI". */
export function FloatingAssistant () {
  const { isOpen, toggleAssistant, closeAssistant } = useAssistant()

  useModelLoader()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        toggleAssistant()
      }
      if (e.key === 'Escape' && isOpen) {
        closeAssistant()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, toggleAssistant, closeAssistant])

  return null
}
