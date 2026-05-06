'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Loader, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false);
    await logout();
    router.replace('/login');
    router.refresh();
  }, [logout, router]);

  const initial = (user?.name || user?.email || '?').slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (e) => {
      const t = e.target;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="app-header app-header--premium">
      <Link href="/" className="header-brand" aria-label="MedDocs home">
        <div className="header-logo header-logo--premium">
          <Activity size={20} aria-hidden />
        </div>
        <div className="header-title">
          <h1>MedDocs</h1>
          <p>Clinical intelligence workspace</p>
        </div>
      </Link>
      <div className="header-spacer" />

      <ThemeToggle className="header-theme-toggle" />

      {authLoading ? (
        <span className="header-profile__loading" aria-label="Loading account">
          <Loader size={14} className="spin" aria-hidden />
        </span>
      ) : user ? (
        <div className="header-profile-wrap">
          <button
            ref={triggerRef}
            type="button"
            className="header-profile-trigger"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-controls="header-profile-menu"
            id="header-profile-trigger"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="header-profile__avatar" aria-hidden>
              {initial}
            </span>
            <span
              className={`header-profile-trigger__chev${menuOpen ? ' header-profile-trigger__chev--open' : ''}`}
              aria-hidden
            >
              <ChevronDown size={16} />
            </span>
          </button>

          {menuOpen ? (
            <div
              ref={menuRef}
              id="header-profile-menu"
              className="header-profile-menu"
              role="menu"
              aria-labelledby="header-profile-trigger"
            >
              <div className="header-profile-menu__user" role="presentation">
                <span className="header-profile-menu__name">{user.name || user.email}</span>
                <span className="header-profile-menu__email">{user.email}</span>
              </div>
              <button
                type="button"
                className="header-profile-menu__action header-profile-menu__action--signout"
                role="menuitem"
                onClick={handleSignOut}
              >
                <LogOut size={16} aria-hidden />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
