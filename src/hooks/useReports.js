'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteReport as deleteReportApi,
  fetchReportById,
  fetchUserReports,
  saveReport as saveReportApi,
  updateReport as updateReportApi,
} from '../lib/reportsClient'
import {
  documentToFeedbackPayload,
  documentToReportPayload,
  mapFeedbackAttachments,
  reportToDocument,
} from '../lib/reportMappers'
import {
  collectFeedbackAttachmentFiles,
  collectInitialReportFiles,
} from '../lib/reportPersist'
import { ensureFreshApiAuthToken } from '../lib/auth-token'

const TOKEN_RETRY_ATTEMPTS = 6
const TOKEN_RETRY_DELAY_MS = 250

async function resolveApiAuthTokenWithRetry () {
  for (let attempt = 0; attempt < TOKEN_RETRY_ATTEMPTS; attempt += 1) {
    const token = await ensureFreshApiAuthToken()
    if (token) return token
    if (attempt < TOKEN_RETRY_ATTEMPTS - 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, TOKEN_RETRY_DELAY_MS * (attempt + 1))
      })
    }
  }
  return null
}

function mergeSavedReportIntoDoc (saved, doc, feedbackOverride = null) {
  const patch = {
    reportId: saved?.reportId,
    isPersisted: true,
    savedAt: saved?.updatedAt || saved?.createdAt || new Date().toISOString(),
    createdBy: saved?.createdBy || doc.createdBy || null,
    uploadedBy: saved?.createdBy || doc.uploadedBy || doc.createdBy || null,
    sourceGcsPath: saved?.sourceGcsPath || doc.sourceGcsPath || null,
    scanImageUrls: saved?.scanImageUrls || doc.scanImageUrls || null,
    size: saved?.fileSizeBytes || doc.size || 0,
    attachmentName: saved?.originalFileName || doc.attachmentName || doc.name || null,
  }

  if (saved?.feedback) {
    const mappedAttachments = mapFeedbackAttachments(saved.feedback)
    patch.userFeedback = {
      ...(doc.userFeedback || {}),
      ...(feedbackOverride || {}),
      sentiment: saved.feedback.helpful ? 'up' : saved.feedback.notHelpful ? 'down' : null,
      comment: saved.feedback.comments || '',
      attachments: mappedAttachments.length ? mappedAttachments : (doc.userFeedback?.attachments || []),
      submittedAt: saved.updatedAt || doc.userFeedback?.submittedAt || new Date().toISOString(),
      updatedAt: saved.updatedAt || new Date().toISOString(),
    }
  } else if (feedbackOverride) {
    patch.userFeedback = { ...doc.userFeedback, ...feedbackOverride }
  }

  if (saved?.originalFileName) {
    patch.attachmentName = saved.originalFileName
  }

  if (saved?.patientName) {
    patch.name = `${saved.patientName} — ${saved?.classification?.type || doc.analysis?.classification?.type || 'Report'}`
  }

  return patch
}

export function useReports ({
  documents,
  setDocuments,
  updateDocument,
  addToast,
  isAuthenticated = false,
  authLoading = false,
  userId = null,
}) {
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsLoaded, setReportsLoaded] = useState(false)
  const prevUserIdRef = useRef(null)
  const loadSeqRef = useRef(0)
  const documentsRef = useRef(documents)

  useEffect(() => {
    documentsRef.current = documents
  }, [documents])

  const loadReports = useCallback(async ({ silent = false } = {}) => {
    const seq = loadSeqRef.current + 1
    loadSeqRef.current = seq
    const requestedUserId = prevUserIdRef.current

    const token = await resolveApiAuthTokenWithRetry()
    if (!token) {
      if (!silent) {
        console.warn('Reports load skipped — Firebase auth token not ready yet')
      }
      return false
    }

    if (!silent) setReportsLoading(true)
    try {
      const reports = await fetchUserReports()
      if (loadSeqRef.current !== seq) return true
      // User switched away while the request was in flight
      if (requestedUserId && prevUserIdRef.current !== requestedUserId) return true

      const list = Array.isArray(reports) ? reports : []
      const persisted = []
      for (const report of list) {
        try {
          const doc = reportToDocument(report)
          if (doc?.reportId) persisted.push(doc)
        } catch (err) {
          console.error('Failed to map report row', report?.reportId || report?.id, err)
        }
      }

      setDocuments((prev) => {
        const sessionDocs = prev.filter((d) => !d.isPersisted && !d.reportId)
        const seen = new Set()
        const uniquePersisted = persisted.filter((d) => {
          if (!d.reportId || seen.has(d.reportId)) return false
          seen.add(d.reportId)
          return true
        })
        return [...sessionDocs, ...uniquePersisted]
      })
      return true
    } catch (err) {
      if (loadSeqRef.current !== seq) return false
      console.error('Failed to load reports', err)
      addToast(err?.message || 'Could not load saved reports', 'warning', 5000)
      return false
    } finally {
      if (loadSeqRef.current === seq) {
        if (!silent) setReportsLoading(false)
        setReportsLoaded(true)
      }
    }
  }, [addToast, setDocuments])

  useEffect(() => {
    if (authLoading) return undefined

    if (!isAuthenticated || !userId) {
      if (prevUserIdRef.current) {
        setDocuments([])
      }
      prevUserIdRef.current = null
      setReportsLoaded(true)
      return undefined
    }

    const userChanged = prevUserIdRef.current !== userId
    if (userChanged) {
      // Keep previous rows until the new fetch lands (avoids empty flash / race clears)
      prevUserIdRef.current = userId
      setReportsLoaded(false)
    }

    let cancelled = false

    const run = async () => {
      let ok = await loadReports()
      if (cancelled) return

      if (!ok) {
        await new Promise((resolve) => { setTimeout(resolve, 600) })
        if (cancelled) return
        ok = await loadReports({ silent: true })
      }

      if (!cancelled && !ok) {
        setReportsLoaded(true)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, authLoading, userId, loadReports, setDocuments])

  useEffect(() => {
    if (!isAuthenticated || !userId || authLoading) return undefined

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      // Always silent refresh so we never flash an empty table
      loadReports({ silent: true })
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isAuthenticated, authLoading, userId, loadReports])

  const persistReport = useCallback(
    async (docId, {
      withFeedback = false,
      feedbackOverride = null,
      docOverride = null,
    } = {}) => {
      const existing = documentsRef.current.find((d) => d.id === docId) || null
      const baseDoc = docOverride
        ? { ...(existing || {}), ...docOverride, id: docId }
        : existing

      if (!baseDoc?.analysis || baseDoc.status !== 'ready') return null

      const doc = feedbackOverride
        ? { ...baseDoc, userFeedback: { ...baseDoc.userFeedback, ...feedbackOverride } }
        : baseDoc

      if (doc.reportId && !withFeedback) return doc.reportId

      const token = await resolveApiAuthTokenWithRetry()
      if (!token) {
        addToast('Sign in to save reports', 'warning', 5000)
        return null
      }

      try {
        if (doc.reportId && withFeedback) {
          const payload = documentToFeedbackPayload(doc, feedbackOverride)
          const files = collectFeedbackAttachmentFiles(doc)
          const saved = await updateReportApi(doc.reportId, payload, files)
          updateDocument(docId, mergeSavedReportIntoDoc(saved, doc, feedbackOverride))
          return doc.reportId
        }

        const payload = documentToReportPayload(doc)
        const files = collectInitialReportFiles(doc)
        const saved = await saveReportApi(payload, files)
        const reportId = saved?.reportId

        if (reportId) {
          updateDocument(docId, mergeSavedReportIntoDoc(saved, doc, feedbackOverride))
        }

        return reportId || null
      } catch (err) {
        console.error('Failed to save report', err)
        addToast(err?.message || 'Could not save report', 'error')
        return null
      }
    },
    [addToast, updateDocument]
  )

  const loadReport = useCallback(
    async (reportId) => {
      const token = await resolveApiAuthTokenWithRetry()
      if (!token) {
        addToast('Sign in to load reports', 'warning', 5000)
        return null
      }

      try {
        const report = await fetchReportById(reportId)
        const doc = reportToDocument(report)

        setDocuments((prev) => {
          const existing = prev.find((d) => d.reportId === reportId || d.id === reportId)
          if (existing) {
            return prev.map((d) =>
              d.reportId === reportId || d.id === reportId ? { ...d, ...doc, id: d.id } : d
            )
          }
          return [doc, ...prev]
        })

        return doc
      } catch (err) {
        console.error('Failed to load report', err)
        addToast(err?.message || 'Could not load report', 'error')
        return null
      }
    },
    [addToast, setDocuments]
  )

  const removeReport = useCallback(
    async (docId) => {
      const doc = documents.find((d) => d.id === docId)
      if (!doc?.reportId) return true

      const token = await resolveApiAuthTokenWithRetry()
      if (!token) return true

      try {
        await deleteReportApi(doc.reportId)
        return true
      } catch (err) {
        console.error('Failed to delete report', err)
        addToast(err?.message || 'Could not delete report from server', 'error')
        return false
      }
    },
    [addToast, documents]
  )

  return {
    reportsLoading,
    reportsLoaded,
    loadReports,
    persistReport,
    loadReport,
    removeReport,
  }
}
