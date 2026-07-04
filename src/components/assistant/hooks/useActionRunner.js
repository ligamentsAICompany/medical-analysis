'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { useMedDocs } from '../../../context/MedDocsContext'
import { useAssistant } from '../../../context/AssistantContext'
import { parseCommandAsync } from '../../../lib/assistant/intentParser'
import {
  MODULE_ROUTES,
  getModuleLabel,
  resolveReportDetailPath,
  QUICK_COMMANDS,
  ADMIN_QUICK_COMMANDS,
} from '../../../lib/assistant/actionRegistry'
import {
  buildSearchFiltersFromText,
  countDocuments,
  documentToTableRow,
  searchDocuments,
} from '../../../lib/assistant/searchService'
import {
  applyFollowUpAnswer,
  extractUserCreateData,
  getMissingUserFields,
  getNextFollowUpQuestion,
  USER_CREATE_FIELDS,
  validateFollowUpAnswer,
} from '../../../lib/assistant/fieldRequirements'
import {
  loadUsersForAssistant,
  searchUsers,
  userToTableRow,
  USER_SEARCH_COLUMNS,
} from '../../../lib/assistant/userSearchService'
import { extractPatientQuery, extractReportId } from '../../../lib/assistant/entityExtractor'
import { isUploadConfirmPhase } from '../../../lib/assistant/clinicalUploadWorkflow'
import { useClinicalUploadWorkflow } from './useClinicalUploadWorkflow'

const BASE_SEARCH_COLUMNS = [
  { key: 'name', label: 'File' },
  { key: 'patient', label: 'Patient' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
]

function getSearchColumns (isAdmin) {
  if (!isAdmin) return BASE_SEARCH_COLUMNS
  return [...BASE_SEARCH_COLUMNS, { key: 'createdBy', label: 'Uploaded by' }]
}

function buildHelpText (isAdmin) {
  const lines = [
    '**Commands I understand:**',
    '• **Navigate** — "Go to dashboard", "Open analysis", "Show users"',
    '• **Search** — "Find lab reports", "Reports for John Smith"',
    '• **Count** — "How many reports?"',
    '• **Open** — "Open latest report", "Open report RPT_…"',
    '• **Delete** — "Delete report for …" or "Delete user email@…"',
    '',
    '**Quick commands:**',
    ...QUICK_COMMANDS.map((c) => `• ${c}`),
  ]
  if (isAdmin) {
    lines.push(
      '',
      '**Admin:**',
      '• "Add user john@meddocs.app"',
      '• "Show users"',
      ...ADMIN_QUICK_COMMANDS.map((c) => `• ${c}`),
    )
  }
  return lines.join('\n')
}

function getListRoute (module, searchQuery) {
  if (module === 'dashboard') return MODULE_ROUTES.dashboard.list
  if (module === 'analysis') return MODULE_ROUTES.analysis.list
  if (module === 'users') return MODULE_ROUTES.users.list
  if (module === 'reports') {
    if (searchQuery) {
      return `/analysis?search=${encodeURIComponent(searchQuery)}`
    }
    return MODULE_ROUTES.analysis.list
  }
  return '/dashboard'
}

function isUserCreateCommand (text, parsed) {
  if (parsed.module === 'users' && parsed.intent === 'create') return true
  return /\b(?:add|create|new)\s+(?:a\s+)?user\b/i.test(text)
}

function isUserDeleteCommand (text, parsed) {
  if (parsed.module === 'users' && parsed.intent === 'delete') return true
  return /\b(?:delete|remove)\s+(?:a\s+)?user\b/i.test(text)
}

function isUserSearchCommand (text, parsed) {
  if (parsed.module === 'users' && (parsed.intent === 'search' || parsed.intent === 'lookup')) return true
  return /\b(?:show|list|find)\s+(?:all\s+)?users\b/i.test(text)
}

export function useActionRunner () {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.isAdmin)
  const { documents } = useMedDocs()
  const {
    createMessageId,
    addMessage,
    updateMessage,
    setProcessing,
    setPendingDelete,
    followUp,
    setFollowUp,
    clearFollowUp,
    setUsersModalPrefill,
    setParserSource,
    uploadWorkflow,
    liteMode,
  } = useAssistant()
  const { handleWorkflowReply } = useClinicalUploadWorkflow()

  const finishThinking = useCallback((thinkingId, patch) => {
    updateMessage(thinkingId, { ...patch, status: patch.status || 'done' })
    setProcessing(false)
  }, [updateMessage, setProcessing])

  const openUserCreateModal = useCallback((data) => {
    const prefill = {
      name: data.name || '',
      email: data.email || '',
      role: data.role || 'USER',
    }
    setUsersModalPrefill(prefill)
    router.push('/users')
  }, [router, setUsersModalPrefill])

  const handleFollowUp = useCallback(async (text, thinkingId) => {
    const field = followUp.fields[followUp.index]
    const validationError = validateFollowUpAnswer(field, text)
    if (validationError) {
      finishThinking(thinkingId, { text: validationError, status: 'error' })
      return
    }

    const data = applyFollowUpAnswer(followUp.data, field, text)
    const nextIndex = followUp.index + 1
    const missing = getMissingUserFields(data)

    if (missing.length > 0) {
      const nextField = missing[0]
      const fieldIndex = followUp.fields.findIndex((f) => f.key === nextField.key)
      setFollowUp({ module: 'users', fields: USER_CREATE_FIELDS, data, index: fieldIndex })
      finishThinking(thinkingId, { text: getNextFollowUpQuestion(nextField) })
      return
    }

    clearFollowUp()
    openUserCreateModal(data)
    finishThinking(thinkingId, {
      text: `Opening **Add user** with **${data.name || data.email}** pre-filled. Set a password to finish.`,
    })
  }, [followUp, finishThinking, setFollowUp, clearFollowUp, openUserCreateModal])

  const handleUserCreate = useCallback(async (text, parsed, thinkingId) => {
    if (!isAdmin) {
      finishThinking(thinkingId, {
        text: 'Users require admin access.',
        status: 'error',
      })
      return
    }

    const extracted = {
      ...extractUserCreateData(text),
      ...(parsed.formData || {}),
    }
    if (!extracted.role) extracted.role = 'USER'

    const missing = getMissingUserFields(extracted)
    if (missing.length > 0) {
      const first = missing[0]
      const fieldIndex = USER_CREATE_FIELDS.findIndex((f) => f.key === first.key)
      setFollowUp({
        module: 'users',
        fields: USER_CREATE_FIELDS,
        data: extracted,
        index: fieldIndex >= 0 ? fieldIndex : 0,
      })
      finishThinking(thinkingId, { text: getNextFollowUpQuestion(first) })
      return
    }

    openUserCreateModal(extracted)
    finishThinking(thinkingId, {
      text: `Opening **Add user** for **${extracted.email}**. Set a password to finish.`,
    })
  }, [isAdmin, finishThinking, setFollowUp, openUserCreateModal])

  const handleUserDelete = useCallback(async (text, parsed, thinkingId) => {
    if (!isAdmin) {
      finishThinking(thinkingId, {
        text: 'Users require admin access.',
        status: 'error',
      })
      return
    }

    try {
      const users = await loadUsersForAssistant()
      const query = parsed.searchQuery || text.replace(/\b(?:delete|remove)\s+(?:a\s+)?user\b/i, '').trim()
      const rows = searchUsers(users, { query, limit: 1 })
      if (!rows.length) {
        finishThinking(thinkingId, {
          text: 'No user matched that request. Try an email or name.',
          status: 'error',
        })
        return
      }

      const target = rows[0]
      setPendingDelete({
        type: 'user',
        uid: target.uid,
        id: target.uid,
        name: target.name,
        email: target.email,
      })
      finishThinking(thinkingId, {
        text: `Confirm delete for **${target.name || target.email}** in the dialog.`,
      })
    } catch (err) {
      finishThinking(thinkingId, {
        text: `Load users failed: ${err?.message || 'Unknown error'}`,
        status: 'error',
      })
    }
  }, [isAdmin, finishThinking, setPendingDelete])

  const handleUserSearch = useCallback(async (text, parsed, thinkingId) => {
    if (!isAdmin) {
      finishThinking(thinkingId, {
        text: 'Users require admin access.',
        status: 'error',
      })
      return
    }

    try {
      const users = await loadUsersForAssistant()
      const query = parsed.searchQuery || text
      const rows = searchUsers(users, { query, limit: 8 })
      if (rows.length) router.push('/users')
      finishThinking(thinkingId, {
        text: rows.length
          ? `Found **${rows.length}** user${rows.length === 1 ? '' : 's'}:`
          : 'No users matched that search.',
        table: rows.length ? { columns: USER_SEARCH_COLUMNS, rows: rows.map(userToTableRow) } : undefined,
      })
    } catch (err) {
      finishThinking(thinkingId, {
        text: `Load users failed: ${err?.message || 'Unknown error'}`,
        status: 'error',
      })
    }
  }, [isAdmin, finishThinking, router])

  const runAction = useCallback(async (rawText) => {
    const text = (rawText || '').trim()
    if (!text) return

    const userId = createMessageId()
    addMessage({
      id: userId,
      role: 'user',
      text,
      timestamp: Date.now(),
      status: 'done',
    })

    const thinkingId = createMessageId()
    addMessage({
      id: thinkingId,
      role: 'assistant',
      text: 'Working on it…',
      timestamp: Date.now(),
      status: 'thinking',
    })
    setProcessing(true)

    if (isUploadConfirmPhase(uploadWorkflow)) {
      const handled = await handleWorkflowReply(text)
      if (handled) {
        setProcessing(false)
        return
      }
    }

    if (followUp) {
      await handleFollowUp(text, thinkingId)
      return
    }

    const parsed = await parseCommandAsync(text, pathname, { liteMode })
    setParserSource(parsed.parserSource || 'keyword')

    const filters = buildSearchFiltersFromText(parsed.searchQuery || text)

    try {
      if (parsed.intent === 'help' || /\bhelp\b/i.test(text)) {
        finishThinking(thinkingId, { text: buildHelpText(isAdmin) })
        return
      }

      if (isUserCreateCommand(text, parsed)) {
        await handleUserCreate(text, parsed, thinkingId)
        return
      }

      if (isUserDeleteCommand(text, parsed)) {
        await handleUserDelete(text, parsed, thinkingId)
        return
      }

      if (isUserSearchCommand(text, parsed)) {
        await handleUserSearch(text, parsed, thinkingId)
        return
      }

      if (parsed.intent === 'navigate' || (parsed.intent === 'create' && parsed.module !== 'users')) {
        if (parsed.module === 'users' && !isAdmin) {
          finishThinking(thinkingId, {
            text: 'Users require admin access.',
            status: 'error',
          })
          return
        }
        const route = getListRoute(parsed.module || 'dashboard', null)
        router.push(route)
        finishThinking(thinkingId, {
          text: `Opening **${getModuleLabel(parsed.module || 'dashboard')}**…`,
        })
        return
      }

      if (parsed.intent === 'count') {
        const total = countDocuments(documents, filters, isAdmin)
        const label = filters.docType || filters.status || 'matching'
        finishThinking(thinkingId, {
          text: `You have **${total}** report${total === 1 ? '' : 's'}${total !== documents.length ? ` (${label})` : ''}.`,
        })
        return
      }

      if (parsed.intent === 'search' || parsed.intent === 'lookup') {
        const rows = searchDocuments(documents, { ...filters, limit: 8 }, isAdmin)
        const searchQuery = filters.docType || extractPatientQuery(parsed.searchQuery || text) || parsed.searchQuery || text
        if (rows.length > 0) {
          router.push(getListRoute('reports', searchQuery))
        }
        finishThinking(thinkingId, {
          text: rows.length
            ? `Found **${rows.length}** report${rows.length === 1 ? '' : 's'}:`
            : 'No reports matched that search.',
          table: rows.length ? { columns: getSearchColumns(isAdmin), rows: rows.map(documentToTableRow) } : undefined,
        })
        return
      }

      if (parsed.intent === 'open') {
        let doc = null
        if (parsed.openLatest) {
          const sorted = [...documents].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
          doc = sorted[0] || null
        } else {
          const id = parsed.reportId || extractReportId(text)
          doc = documents.find((d) => d.id === id || d.reportId === id) || null
        }
        if (!doc) {
          finishThinking(thinkingId, {
            text: 'No matching report found.',
            status: 'error',
          })
          return
        }
        router.push(resolveReportDetailPath(doc.id))
        finishThinking(thinkingId, {
          text: `Opening **${doc.name || doc.id}**…`,
        })
        return
      }

      if (parsed.intent === 'delete') {
        const rows = searchDocuments(documents, { ...filters, limit: 1 }, isAdmin)
        if (!rows.length) {
          finishThinking(thinkingId, {
            text: 'No report found to delete. Try being more specific.',
            status: 'error',
          })
          return
        }
        const doc = rows[0]
        setPendingDelete({
          type: 'report',
          id: doc.id,
          name: doc.name,
        })
        finishThinking(thinkingId, {
          text: `Confirm delete for **${doc.name || doc.id}** in the dialog.`,
        })
        return
      }

      if (parsed.confidence < 0.5) {
        finishThinking(thinkingId, {
          text: 'Command not recognized.\n\n' + buildHelpText(isAdmin),
        })
        return
      }

      finishThinking(thinkingId, {
        text: `Try: ${QUICK_COMMANDS.slice(0, 3).join(' · ')}`,
      })
    } catch (err) {
      finishThinking(thinkingId, {
        text: `Command failed: ${err?.message || 'Unknown error'}`,
        status: 'error',
      })
    }
  }, [
    addMessage,
    createMessageId,
    documents,
    finishThinking,
    followUp,
    handleFollowUp,
    handleUserCreate,
    handleUserDelete,
    handleUserSearch,
    isAdmin,
    pathname,
    router,
    setParserSource,
    setPendingDelete,
    setProcessing,
    uploadWorkflow,
    handleWorkflowReply,
    liteMode,
  ])

  return { runAction }
}
