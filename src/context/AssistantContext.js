'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { readLiteModePreference, writeLiteModePreference } from '../lib/assistant/liteMode'

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hi — I can navigate MedDocs, search reports, attach files for analysis, or count your documents. Try **Go to dashboard** or attach a PDF with the clip button.',
  timestamp: Date.now(),
  status: 'done',
}

function createMessageId () {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const initialState = {
  isOpen: false,
  messages: [WELCOME_MESSAGE],
  isProcessing: false,
  pendingDelete: null,
  deleteConfirming: false,
  followUp: null,
  usersModalPrefill: null,
  lastParserSource: 'keyword',
  uploadWorkflow: null,
  modelsPreloading: false,
  liteMode: false,
}

function reducer (state, action) {
  switch (action.type) {
    case 'TOGGLE':
      return { ...state, isOpen: !state.isOpen }
    case 'OPEN':
      return { ...state, isOpen: true }
    case 'CLOSE':
      return { ...state, isOpen: false }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) => (
          m.id === action.payload.id ? { ...m, ...action.payload.patch } : m
        )),
      }
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [WELCOME_MESSAGE] }
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload }
    case 'SET_PENDING_DELETE':
      return { ...state, pendingDelete: action.payload }
    case 'CLEAR_PENDING_DELETE':
      return { ...state, pendingDelete: null, deleteConfirming: false }
    case 'SET_DELETE_CONFIRMING':
      return { ...state, deleteConfirming: action.payload }
    case 'SET_FOLLOW_UP':
      return { ...state, followUp: action.payload }
    case 'CLEAR_FOLLOW_UP':
      return { ...state, followUp: null }
    case 'SET_USERS_MODAL_PREFILL':
      return { ...state, usersModalPrefill: action.payload }
    case 'CLEAR_USERS_MODAL_PREFILL':
      return { ...state, usersModalPrefill: null }
    case 'SET_PARSER_SOURCE':
      return { ...state, lastParserSource: action.payload }
    case 'SET_UPLOAD_WORKFLOW':
      return { ...state, uploadWorkflow: action.payload }
    case 'CLEAR_UPLOAD_WORKFLOW':
      return { ...state, uploadWorkflow: null }
    case 'SET_MODELS_PRELOADING':
      return { ...state, modelsPreloading: action.payload }
    case 'SET_LITE_MODE':
      return { ...state, liteMode: action.payload }
    case 'CLOSE_AND_RESET':
      return {
        ...state,
        isOpen: false,
        uploadWorkflow: null,
        followUp: null,
      }
    default:
      return state
  }
}

const AssistantContext = createContext(null)

export function AssistantProvider ({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({ type: 'SET_LITE_MODE', payload: readLiteModePreference() })
  }, [])

  const toggleAssistant = useCallback(() => {
    dispatch({ type: 'TOGGLE' })
  }, [])

  const openAssistant = useCallback(() => {
    dispatch({ type: 'OPEN' })
  }, [])

  const closeAssistant = useCallback(() => {
    dispatch({ type: 'CLOSE_AND_RESET' })
  }, [])

  const addMessage = useCallback((message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message })
  }, [])

  const updateMessage = useCallback((id, patch) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, patch } })
  }, [])

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' })
  }, [])

  const setProcessing = useCallback((value) => {
    dispatch({ type: 'SET_PROCESSING', payload: value })
  }, [])

  const setPendingDelete = useCallback((target) => {
    dispatch({ type: 'SET_PENDING_DELETE', payload: target })
  }, [])

  const clearPendingDelete = useCallback(() => {
    dispatch({ type: 'CLEAR_PENDING_DELETE' })
  }, [])

  const setDeleteConfirming = useCallback((value) => {
    dispatch({ type: 'SET_DELETE_CONFIRMING', payload: value })
  }, [])

  const setFollowUp = useCallback((followUp) => {
    dispatch({ type: 'SET_FOLLOW_UP', payload: followUp })
  }, [])

  const clearFollowUp = useCallback(() => {
    dispatch({ type: 'CLEAR_FOLLOW_UP' })
  }, [])

  const setUsersModalPrefill = useCallback((prefill) => {
    dispatch({ type: 'SET_USERS_MODAL_PREFILL', payload: prefill })
  }, [])

  const clearUsersModalPrefill = useCallback(() => {
    dispatch({ type: 'CLEAR_USERS_MODAL_PREFILL' })
  }, [])

  const setParserSource = useCallback((source) => {
    dispatch({ type: 'SET_PARSER_SOURCE', payload: source })
  }, [])

  const setUploadWorkflow = useCallback((workflow) => {
    dispatch({ type: 'SET_UPLOAD_WORKFLOW', payload: workflow })
  }, [])

  const clearUploadWorkflow = useCallback(() => {
    dispatch({ type: 'CLEAR_UPLOAD_WORKFLOW' })
  }, [])

  const setModelsPreloading = useCallback((value) => {
    dispatch({ type: 'SET_MODELS_PRELOADING', payload: value })
  }, [])

  const setLiteMode = useCallback((enabled) => {
    writeLiteModePreference(enabled)
    dispatch({ type: 'SET_LITE_MODE', payload: enabled })
  }, [])

  const value = useMemo(() => ({
    ...state,
    createMessageId,
    toggleAssistant,
    openAssistant,
    closeAssistant,
    addMessage,
    updateMessage,
    clearMessages,
    setProcessing,
    setPendingDelete,
    clearPendingDelete,
    setDeleteConfirming,
    setFollowUp,
    clearFollowUp,
    setUsersModalPrefill,
    clearUsersModalPrefill,
    setParserSource,
    setUploadWorkflow,
    clearUploadWorkflow,
    setModelsPreloading,
    setLiteMode,
  }), [
    state,
    toggleAssistant,
    openAssistant,
    closeAssistant,
    addMessage,
    updateMessage,
    clearMessages,
    setProcessing,
    setPendingDelete,
    clearPendingDelete,
    setDeleteConfirming,
    setFollowUp,
    clearFollowUp,
    setUsersModalPrefill,
    clearUsersModalPrefill,
    setParserSource,
    setUploadWorkflow,
    clearUploadWorkflow,
    setModelsPreloading,
    setLiteMode,
  ])

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant () {
  const ctx = useContext(AssistantContext)
  if (!ctx) {
    throw new Error('useAssistant must be used within AssistantProvider')
  }
  return ctx
}
