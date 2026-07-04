'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PiPencilSimple, PiPlus, PiTrash } from 'react-icons/pi'
import { PageHeader } from './shell/PageHeader'
import { ConfirmModal } from './shell/ConfirmModal'
import { UserFormModal } from './users/UserFormModal'
import { useAuth } from '../context/AuthContext'
import { useAssistant } from '../context/AssistantContext'
import { createUser, deleteUser, fetchUsers, updateUser } from '../lib/usersClient'

export function UsersView () {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { usersModalPrefill, clearUsersModalPrefill } = useAssistant()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [alertModal, setAlertModal] = useState(null)
  const [createPrefill, setCreatePrefill] = useState(null)
  const fetchIdRef = useRef(0)

  const loadUsers = useCallback(async () => {
    const requestId = ++fetchIdRef.current
    setLoading(true)
    setError('')

    try {
      const rows = await fetchUsers()
      if (requestId !== fetchIdRef.current) return
      setUsers(rows)
    } catch (err) {
      if (requestId !== fetchIdRef.current) return
      setError(err?.message || 'Could not load users')
    } finally {
      if (requestId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (authLoading) return undefined
    if (!user?.uid) return undefined

    if (!user.isAdmin) {
      router.replace('/dashboard')
      return undefined
    }

    loadUsers()

    return () => {
      fetchIdRef.current += 1
    }
  }, [authLoading, user?.uid, user?.isAdmin, router, loadUsers])

  useEffect(() => {
    if (!usersModalPrefill) return
    setCreatePrefill(usersModalPrefill)
    setModalError('')
    setSelectedUser(null)
    setModalMode('create')
    clearUsersModalPrefill()
  }, [usersModalPrefill, clearUsersModalPrefill])

  const handleOpenCreate = () => {
    setModalError('')
    setSelectedUser(null)
    setModalMode('create')
  }

  const handleOpenEdit = (row) => {
    setModalError('')
    setSelectedUser(row)
    setModalMode('edit')
  }

  const handleCloseModal = () => {
    if (saving) return
    setModalMode(null)
    setSelectedUser(null)
    setModalError('')
    setCreatePrefill(null)
  }

  const handleCreate = async (payload) => {
    setSaving(true)
    setModalError('')
    try {
      const created = await createUser(payload)
      setUsers((prev) => {
        const next = prev.filter((u) => u.uid !== created.uid && u.email !== created.email)
        return [...next, created].sort((a, b) => {
          const aAdmin = a.role === 'ADMIN' ? 0 : 1
          const bAdmin = b.role === 'ADMIN' ? 0 : 1
          if (aAdmin !== bAdmin) return aAdmin - bAdmin
          return (a.name || a.email || '').localeCompare(b.name || b.email || '')
        })
      })
      handleCloseModal()
    } catch (err) {
      setModalError(err?.message || 'Could not create user')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (payload) => {
    if (!selectedUser?.uid) return
    setSaving(true)
    setModalError('')
    try {
      const updated = await updateUser(selectedUser.uid, payload)
      setUsers((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)))
      handleCloseModal()
    } catch (err) {
      setModalError(err?.message || 'Could not update user')
    } finally {
      setSaving(false)
    }
  }

  const handleRequestDelete = (row) => {
    if (!row?.uid) return
    if (row.uid === user?.uid) {
      setAlertModal({
        title: 'Cannot delete account',
        description: 'You cannot delete your own account while signed in.',
      })
      return
    }
    setDeleteTarget(row)
  }

  const handleCloseDelete = () => {
    if (deleting) return
    setDeleteTarget(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.uid) return
    setDeleting(true)
    setError('')
    try {
      await deleteUser(deleteTarget.uid)
      setUsers((prev) => prev.filter((u) => u.uid !== deleteTarget.uid))
      setDeleteTarget(null)
    } catch (err) {
      setError(err?.message || 'Could not delete user')
    } finally {
      setDeleting(false)
    }
  }

  if (!user?.isAdmin) return null

  const deleteLabel = deleteTarget?.name || deleteTarget?.email || 'this user'

  return (
    <>
      <PageHeader
        breadcrumb="Home · Users"
        title="Users"
        description="Manage workspace members and roles. Admin access only."
        actions={(
          <button type="button" className="shell-btn shell-btn--primary" onClick={handleOpenCreate}>
            <PiPlus size={16} aria-hidden />
            Add user
          </button>
        )}
      />

      <div className="shell-card">
        <div className="shell-card__body">
          {loading ? (
            <p style={{ color: 'var(--muted-foreground)' }}>Loading users…</p>
          ) : error ? (
            <p style={{ color: 'var(--destructive)' }}>{error}</p>
          ) : users.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)' }}>No users found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.uid}>
                      <td>{u.name || '—'}</td>
                      <td className="tabular-nums">{u.email || '—'}</td>
                      <td>
                        <span className={`role-badge role-badge--${(u.role || 'USER').toLowerCase()}`}>
                          {u.role || 'USER'}
                        </span>
                      </td>
                      <td>{u.active === false ? 'Inactive' : 'Active'}</td>
                      <td>
                        <div className="users-table__actions">
                          <button
                            type="button"
                            className="users-table__action"
                            onClick={() => handleOpenEdit(u)}
                            aria-label={`Edit ${u.name || u.email}`}
                          >
                            <PiPencilSimple size={15} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="users-table__action users-table__action--danger"
                            onClick={() => handleRequestDelete(u)}
                            disabled={u.uid === user?.uid}
                            aria-label={`Delete ${u.name || u.email}`}
                          >
                            <PiTrash size={15} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <UserFormModal
        mode={modalMode}
        open={modalMode === 'create' || modalMode === 'edit'}
        initial={selectedUser}
        prefill={modalMode === 'create' ? createPrefill : null}
        onClose={handleCloseModal}
        onSubmit={modalMode === 'create' ? handleCreate : handleUpdate}
        saving={saving}
        error={modalError}
        currentUserUid={user?.uid}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete user"
        description={`Delete ${deleteLabel}? This removes their account and cannot be undone.`}
        confirmLabel="Delete user"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDelete}
        confirming={deleting}
        destructive
      />

      <ConfirmModal
        open={Boolean(alertModal)}
        title={alertModal?.title || ''}
        description={alertModal?.description || ''}
        confirmLabel="OK"
        onConfirm={() => setAlertModal(null)}
        onClose={() => setAlertModal(null)}
        alertOnly
      />
    </>
  )
}
