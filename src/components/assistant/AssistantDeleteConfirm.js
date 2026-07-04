'use client'

import React from 'react'
import { ConfirmModal } from '../shell/ConfirmModal'
import { useAssistant } from '../../context/AssistantContext'
import { useAuth } from '../../context/AuthContext'
import { useMedDocs } from '../../context/MedDocsContext'
import { deleteUser } from '../../lib/usersClient'

export function AssistantDeleteConfirm () {
  const { user } = useAuth()
  const { deleteDocument } = useMedDocs()
  const {
    pendingDelete,
    deleteConfirming,
    clearPendingDelete,
    setDeleteConfirming,
    addMessage,
    createMessageId,
  } = useAssistant()

  if (!pendingDelete) return null

  const isUser = pendingDelete.type === 'user'
  const label = pendingDelete.name || pendingDelete.email || pendingDelete.id || 'this item'
  const title = isUser ? 'Delete user' : 'Delete report'
  const description = isUser
    ? `Delete ${label}? This removes their account and cannot be undone.`
    : `Delete ${label}? This report will be permanently removed.`

  const handleClose = () => {
    if (deleteConfirming) return
    clearPendingDelete()
    addMessage({
      id: createMessageId(),
      role: 'assistant',
      text: 'Delete cancelled.',
      timestamp: Date.now(),
      status: 'done',
    })
  }

  const handleConfirm = async () => {
    if (!pendingDelete?.id && !pendingDelete?.uid) return

    if (isUser && pendingDelete.uid === user?.uid) {
      clearPendingDelete()
      addMessage({
        id: createMessageId(),
        role: 'assistant',
        text: 'You cannot delete your own account while signed in.',
        timestamp: Date.now(),
        status: 'error',
      })
      return
    }

    setDeleteConfirming(true)
    try {
      if (isUser) {
        await deleteUser(pendingDelete.uid)
      } else {
        await deleteDocument(pendingDelete.id)
      }
      addMessage({
        id: createMessageId(),
        role: 'assistant',
        text: `Deleted **${label}**.`,
        timestamp: Date.now(),
        status: 'done',
      })
      clearPendingDelete()
    } catch (err) {
      addMessage({
        id: createMessageId(),
        role: 'assistant',
        text: `Delete failed: ${err?.message || 'Unknown error'}`,
        timestamp: Date.now(),
        status: 'error',
      })
      clearPendingDelete()
    } finally {
      setDeleteConfirming(false)
    }
  }

  return (
    <ConfirmModal
      open
      title={title}
      description={description}
      confirmLabel={isUser ? 'Delete user' : 'Delete report'}
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      onClose={handleClose}
      confirming={deleteConfirming}
      destructive
    />
  )
}
