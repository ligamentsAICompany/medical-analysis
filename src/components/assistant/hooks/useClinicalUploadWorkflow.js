'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMedDocs } from '../../../context/MedDocsContext'
import { useAssistant } from '../../../context/AssistantContext'
import { classifyClinicalFile } from '../../../lib/assistant/documentClassifier'
import {
  buildCompleteMessage,
  buildConfirmMessage,
  createUploadWorkflowState,
  isUploadConfirmPhase,
  UPLOAD_PHASES,
} from '../../../lib/assistant/clinicalUploadWorkflow'
import {
  isAnalyzeUploadFile,
  validateAnalyzeFileSelection,
} from '../../../lib/medicalFileTypes'
import {
  MAX_DOCUMENT_FILES_PER_REQUEST,
  MAX_VISION_FILES_PER_REQUEST,
} from '../../../config/uploadLimits'
import { isAffirmative, isNegative } from '../../../lib/assistant/entityExtractor'

function filterAssistantFiles (fileList) {
  const raw = [...fileList].filter(isAnalyzeUploadFile)
  const selection = validateAnalyzeFileSelection(raw)
  if (!selection.ok) {
    return { ok: false, error: selection.error, files: [] }
  }

  let vSeen = 0
  let dSeen = 0
  const files = raw.filter((f) => {
    if (f.type?.startsWith('image/') || f.type === 'application/dicom') {
      if (vSeen >= MAX_VISION_FILES_PER_REQUEST) return false
      vSeen += 1
      return true
    }
    if (dSeen >= MAX_DOCUMENT_FILES_PER_REQUEST) return false
    dSeen += 1
    return true
  })

  if (!files.length) {
    return { ok: false, error: 'No supported clinical files in selection.', files: [] }
  }

  return { ok: true, files, error: null }
}

export function useClinicalUploadWorkflow () {
  const router = useRouter()
  const {
    documents,
    addDocument,
    addImageBundle,
    analyzeFile,
    analyzeFileBundle,
  } = useMedDocs()
  const {
    uploadWorkflow,
    setUploadWorkflow,
    clearUploadWorkflow,
    addMessage,
    updateMessage,
    createMessageId,
    setProcessing,
    liteMode,
  } = useAssistant()

  const documentsRef = useRef(documents)
  useEffect(() => {
    documentsRef.current = documents
  }, [documents])

  const watchRef = useRef(null)

  useEffect(() => () => {
    if (watchRef.current) clearInterval(watchRef.current)
  }, [])

  const waitForDocReady = useCallback((docId) => {
    if (watchRef.current) clearInterval(watchRef.current)

    return new Promise((resolve) => {
      const started = Date.now()
      watchRef.current = setInterval(() => {
        const doc = documentsRef.current.find((d) => d.id === docId)
        if (doc?.status === 'ready') {
          clearInterval(watchRef.current)
          watchRef.current = null
          resolve(doc)
          return
        }
        if (doc?.status === 'error' || Date.now() - started > 120000) {
          clearInterval(watchRef.current)
          watchRef.current = null
          resolve(doc || null)
        }
      }, 800)
    })
  }, [])

  const attachFiles = useCallback(async (fileList) => {
    const picked = filterAssistantFiles(fileList)
    if (!picked.ok) {
      addMessage({
        id: createMessageId(),
        role: 'assistant',
        text: picked.error,
        timestamp: Date.now(),
        status: 'error',
      })
      return
    }

    const files = picked.files
    const primary = files[0]
    setUploadWorkflow(createUploadWorkflowState({
      phase: UPLOAD_PHASES.CLASSIFY,
      files,
    }))
    setProcessing(true)

    const thinkingId = createMessageId()
    addMessage({
      id: thinkingId,
      role: 'assistant',
      text: liteMode
        ? `Classifying **${primary.name}**…`
        : `Classifying **${primary.name}** with Transformers.js…`,
      timestamp: Date.now(),
      status: 'thinking',
    })

    try {
      const classification = await classifyClinicalFile(primary, { liteMode })
      if (classification.error) {
        throw new Error(classification.error)
      }

      setUploadWorkflow(createUploadWorkflowState({
        phase: UPLOAD_PHASES.CONFIRM,
        files,
        classification,
      }))

      addMessage({
        id: createMessageId(),
        role: 'assistant',
        text: buildConfirmMessage(classification, primary.name),
        timestamp: Date.now(),
        status: 'done',
      })
      updateMessage(thinkingId, {
        text: `Classified as **${classification.type}** (${classification.method}).`,
        status: 'done',
      })
    } catch (err) {
      setUploadWorkflow(createUploadWorkflowState({
        phase: UPLOAD_PHASES.ERROR,
        files,
        error: err?.message || 'Classification failed',
      }))
      addMessage({
        id: createMessageId(),
        role: 'assistant',
        text: `Classify file failed: ${err?.message || 'Unknown error'}`,
        timestamp: Date.now(),
        status: 'error',
      })
      clearUploadWorkflow()
    } finally {
      setProcessing(false)
    }
  }, [
    addMessage,
    clearUploadWorkflow,
    createMessageId,
    setProcessing,
    setUploadWorkflow,
    updateMessage,
    liteMode,
  ])

  const startAnalysis = useCallback(async () => {
    if (!uploadWorkflow?.files?.length) return

    const files = uploadWorkflow.files
    setUploadWorkflow({
      ...uploadWorkflow,
      phase: UPLOAD_PHASES.ANALYSING,
    })
    setProcessing(true)

    const thinkingId = createMessageId()
    addMessage({
      id: thinkingId,
      role: 'assistant',
      text: 'Running clinical analysis…',
      timestamp: Date.now(),
      status: 'thinking',
    })

    try {
      let docId
      if (files.length >= 2) {
        docId = addImageBundle(files)
        analyzeFileBundle(docId, files)
      } else {
        docId = addDocument(files[0])
        analyzeFile(docId, files[0])
      }

      setUploadWorkflow({
        ...uploadWorkflow,
        phase: UPLOAD_PHASES.ANALYSING,
        docId,
      })

      const doc = await waitForDocReady(docId)
      if (!doc || doc.status === 'error') {
        throw new Error('Analysis failed. Open Analysis to retry.')
      }

      setUploadWorkflow({
        ...uploadWorkflow,
        phase: UPLOAD_PHASES.COMPLETE,
        docId,
      })

      addMessage({
        id: createMessageId(),
        role: 'assistant',
        text: buildCompleteMessage(doc),
        timestamp: Date.now(),
        status: 'done',
      })

      router.push(`/analysis/${docId}`)
      clearUploadWorkflow()
    } catch (err) {
      addMessage({
        id: createMessageId(),
        role: 'assistant',
        text: err?.message || 'Analysis failed',
        timestamp: Date.now(),
        status: 'error',
      })
      clearUploadWorkflow()
    } finally {
      setProcessing(false)
    }
  }, [
    addDocument,
    addImageBundle,
    addMessage,
    analyzeFile,
    analyzeFileBundle,
    clearUploadWorkflow,
    createMessageId,
    router,
    setProcessing,
    setUploadWorkflow,
    uploadWorkflow,
    waitForDocReady,
  ])

  const cancelUpload = useCallback(() => {
    clearUploadWorkflow()
    addMessage({
      id: createMessageId(),
      role: 'assistant',
      text: 'Upload cancelled.',
      timestamp: Date.now(),
      status: 'done',
    })
  }, [addMessage, clearUploadWorkflow, createMessageId])

  const handleWorkflowReply = useCallback(async (text) => {
    if (!isUploadConfirmPhase(uploadWorkflow)) return false

    if (isAffirmative(text)) {
      await startAnalysis()
      return true
    }
    if (isNegative(text)) {
      cancelUpload()
      return true
    }

    addMessage({
      id: createMessageId(),
      role: 'assistant',
      text: 'Reply **yes** to analyze or **no** to cancel.',
      timestamp: Date.now(),
      status: 'done',
    })
    return true
  }, [addMessage, cancelUpload, createMessageId, startAnalysis, uploadWorkflow])

  return {
    uploadWorkflow,
    attachFiles,
    startAnalysis,
    cancelUpload,
    handleWorkflowReply,
    clearUploadWorkflow,
  }
}
