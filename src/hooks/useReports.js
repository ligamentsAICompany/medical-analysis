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
import { refreshFirebaseIdToken } from '../lib/firebase-client'

async function resolveApiAuthToken () {
  return ensureFreshApiAuthToken()
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

  const loadReports = useCallback(async () => {
    const token = await resolveApiAuthToken()
    if (!token) {
      setReportsLoaded(true)
      return
    }

    setReportsLoading(true)
    try {
      const reports = await fetchUserReports()
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
    } catch (err) {
      console.error('Failed to load reports', err)
      addToast(err?.message || 'Could not load saved reports', 'warning', 5000)
    } finally {
      setReportsLoading(false)
      setReportsLoaded(true)
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

    if (prevUserIdRef.current !== userId) {
      setDocuments([])
      prevUserIdRef.current = userId
    }

    setReportsLoaded(false)
    loadReports()

    return undefined
  }, [isAuthenticated, authLoading, userId, loadReports, setDocuments])

  const persistReport = useCallback(
    async (docId, { withFeedback = false, feedbackOverride = null } = {}) => {
      const baseDoc = documents.find((d) => d.id === docId)
      if (!baseDoc?.analysis || baseDoc.status !== 'ready') return null

      const doc = feedbackOverride
        ? { ...baseDoc, userFeedback: { ...baseDoc.userFeedback, ...feedbackOverride } }
        : baseDoc

      if (doc.reportId && !withFeedback) return doc.reportId
      if (doc.reportId && withFeedback) return doc.reportId

      const token = await resolveApiAuthToken()
      if (!token) {
        addToast('Sign in to save reports', 'warning', 5000)
        return null
      }

      try {
        const payload = documentToReportPayload(doc)
        const saved = await saveReportApi(payload)
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
      const token = await resolveApiAuthToken()
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

      const token = await resolveApiAuthToken()
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
