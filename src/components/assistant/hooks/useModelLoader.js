'use client'

import { useEffect } from 'react'
import { useAssistant } from '../../../context/AssistantContext'

/** Preload Transformers.js models when assistant opens (skipped in lite mode). */
export function useModelLoader () {
  const { isOpen, liteMode, setModelsPreloading } = useAssistant()

  useEffect(() => {
    if (!isOpen || liteMode) return undefined

    let cancelled = false
    setModelsPreloading(true)

    import('../../../lib/ai')
      .then(({ loadModels }) => loadModels())
      .catch((err) => {
        console.warn('[assistant] Transformers preload failed', err)
      })
      .finally(() => {
        if (!cancelled) setModelsPreloading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, liteMode, setModelsPreloading])
}
