'use client'

import React, { useEffect, useState } from 'react'
import { PiX } from 'react-icons/pi'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'USER',
  active: true,
}

export function UserFormModal ({
  mode,
  initial,
  prefill,
  open,
  onClose,
  onSubmit,
  saving,
  error,
  currentUserUid,
}) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setForm({
        name: initial.name || '',
        email: initial.email || '',
        password: '',
        role: initial.role || 'USER',
        active: initial.active !== false,
      })
      return
    }
    if (mode === 'create' && prefill) {
      setForm({
        name: prefill.name || '',
        email: prefill.email || '',
        password: '',
        role: prefill.role || 'USER',
        active: true,
      })
      return
    }
    setForm(EMPTY_FORM)
  }, [open, mode, initial, prefill])

  if (!open) return null

  const handleChange = (field) => (e) => {
    const value = field === 'active' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'create') {
      onSubmit({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })
      return
    }

    const payload = {
      name: form.name.trim(),
      role: form.role,
      active: form.active,
    }
    if (form.password.trim()) {
      payload.password = form.password
    }
    onSubmit(payload)
  }

  const isSelf = mode === 'edit' && initial?.uid && initial.uid === currentUserUid

  return (
    <div className="user-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-modal__header">
          <h2 id="user-modal-title" className="user-modal__title">
            {mode === 'create' ? 'Add user' : 'Edit user'}
          </h2>
          <button type="button" className="shell-icon-btn" onClick={onClose} aria-label="Close">
            <PiX size={18} aria-hidden />
          </button>
        </div>

        <form className="user-modal__form" onSubmit={handleSubmit}>
          <label className="user-modal__field">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              required
              autoComplete="name"
            />
          </label>

          {mode === 'create' ? (
            <label className="user-modal__field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                required
                autoComplete="email"
              />
            </label>
          ) : (
            <label className="user-modal__field">
              <span>Email</span>
              <input type="email" value={form.email} disabled />
            </label>
          )}

          <label className="user-modal__field">
            <span>{mode === 'create' ? 'Password' : 'New password (optional)'}</span>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              required={mode === 'create'}
              minLength={6}
              autoComplete={mode === 'create' ? 'new-password' : 'off'}
            />
          </label>

          <label className="user-modal__field">
            <span>Role</span>
            <select value={form.role} onChange={handleChange('role')} disabled={isSelf}>
              <option value="USER">User</option>
              <option value="CLINICIAN">Clinician</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          {mode === 'edit' ? (
            <label className="user-modal__checkbox">
              <input
                type="checkbox"
                checked={form.active}
                onChange={handleChange('active')}
                disabled={isSelf}
              />
              <span>Active account</span>
            </label>
          ) : null}

          {error ? <p className="user-modal__error">{error}</p> : null}

          <div className="user-modal__actions">
            <button type="button" className="shell-btn shell-btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="shell-btn shell-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
