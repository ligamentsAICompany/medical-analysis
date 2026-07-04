'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PiList, PiMoon, PiSparkle, PiSun, PiSignOut } from 'react-icons/pi'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useAssistant } from '../../context/AssistantContext'

export function TopBar ({ onToggleSidebar, sidebarCollapsed }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isOpen: isAssistantOpen, isProcessing, toggleAssistant } = useAssistant()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false)
    await logout()
    router.replace('/login')
  }, [logout, router])

  useEffect(() => {
    if (!menuOpen) return undefined
    const handlePointerDown = (e) => {
      if (menuRef.current?.contains(e.target)) return
      setMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  const initial = (user?.name || user?.email || '?').slice(0, 1).toUpperCase()

  return (
    <header className={`shell-topbar${sidebarCollapsed ? ' shell-topbar--sidebar-collapsed' : ''}`}>
      <div className="shell-topbar__left">
        <div className="shell-topbar__toggle-slot">
          <button
            type="button"
            className="shell-icon-btn"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PiList size={18} aria-hidden />
          </button>
        </div>
        <Link href="/dashboard" className="shell-topbar__brand" aria-label="MedDocs home">
          <span className="shell-wordmark">
            Med<span className="shell-wordmark__accent">Docs</span>
          </span>
        </Link>
      </div>

      <div className="shell-topbar__actions">
        <button
          type="button"
          className={`shell-ask-ai${isAssistantOpen ? ' shell-ask-ai--active' : ''}`}
          onClick={toggleAssistant}
          title="Ask AI (Alt+A)"
          aria-label="Ask AI"
          aria-expanded={isAssistantOpen}
        >
          {isProcessing ? <span className="shell-ask-ai__pulse" aria-hidden /> : null}
          <PiSparkle size={16} aria-hidden />
          <span className="shell-ask-ai__label">Ask AI</span>
        </button>

        <button
          type="button"
          className="shell-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <PiSun size={18} aria-hidden /> : <PiMoon size={18} aria-hidden />}
        </button>

        {user ? (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              className="shell-profile"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="shell-profile__avatar" aria-hidden>{initial}</span>
              <span className="shell-profile__meta">
                <span className="shell-profile__name">{user.name || user.email}</span>
                <span className="shell-profile__role">{user.role || 'USER'}</span>
              </span>
            </button>
            {menuOpen ? (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  minWidth: 180,
                  padding: 8,
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid color-mix(in oklch, var(--border) 50%, transparent)',
                  background: 'var(--card)',
                  boxShadow: '0 12px 40px color-mix(in oklch, var(--foreground) 12%, transparent)',
                  zIndex: 50,
                }}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="shell-nav__link"
                  style={{ color: 'var(--foreground)' }}
                  onClick={handleSignOut}
                >
                  <PiSignOut size={16} aria-hidden />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  )
}
