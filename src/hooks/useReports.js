'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteReport as deleteReportApi,
  fetchReportById,
  fetchUserReports,
  saveReport as saveReportApi,
} from '../lib/reportsClient'
import { documentToReportPayload, reportToDocument } from '../lib/reportMappers'
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

  const loadReports = useCallback(async ({ silent = false } = {}) => {
    const seq = loadSeqRef.current + 1
    loadSeqRef.current = seq

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

      const persisted = (reports || []).map(reportToDocument)
      const seen = new Set()

      setDocuments((prev) => {
        const sessionDocs = prev.filter((d) => !d.isPersisted && !d.reportId)
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
      if (prevUserIdRef.current) {
        setDocuments([])
      }
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
      loadReports({ silent: documents.length > 0 })
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isAuthenticated, authLoading, userId, loadReports, documents.length])

  const persistReport = useCallback(
    async (docId, { withFeedback = false, feedbackOverride = null } = {}) => {
      const baseDoc = documents.find((d) => d.id === docId)
      if (!baseDoc?.analysis || baseDoc.status !== 'ready') return null

      const doc = feedbackOverride
        ? { ...baseDoc, userFeedback: { ...baseDoc.userFeedback, ...feedbackOverride } }
        : baseDoc

      if (doc.reportId && !withFeedback) return doc.reportId
      if (doc.reportId && withFeedback) return doc.reportId

      const token = await resolveApiAuthTokenWithRetry()
      if (!token) {
        addToast('Sign in to save reports', 'warning', 5000)
        return null
      }

      try {
        const payload = documentToReportPayload(doc)
        const files = []
        if (doc.file) files.push(doc.file)
        if (Array.isArray(doc.bundleFiles)) files.push(...doc.bundleFiles)
        const saved = await saveReportApi(payload, files)
        const reportId = saved?.reportId

        if (reportId) {
          updateDocument(docId, {
            reportId,
            isPersisted: true,
            savedAt: saved.updatedAt || saved.createdAt || new Date().toISOString(),
            ...(feedbackOverride ? { userFeedback: doc.userFeedback } : {}),
          })
        }

        return reportId || null
      } catch (err) {
        console.error('Failed to save report', err)
        addToast(err?.message || 'Could not save report', 'error')
        return null
      }
    },
    [addToast, documents, updateDocument]
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
