'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { clearAuthToken } from '../lib/auth-token';
import {
  firebaseSignIn,
  firebaseSignOut,
  refreshFirebaseIdToken,
  subscribeToAuthState,
} from '../lib/firebase-client';
import { isFirebaseConfigured } from '../config/firebase';
import { fetchUserProfile } from '../lib/reportsClient';

const AuthContext = createContext(null);

async function syncSessionCookie (idToken) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Could not establish session');
  }
  return data.user;
}

async function mergeBackendProfile (baseUser, idToken) {
  if (!baseUser || !idToken) return baseUser;

  const profile = await fetchUserProfile().catch(() => null);
  if (!profile) return baseUser;

  return {
    ...baseUser,
    uid: profile.uid || baseUser.uid,
    role: profile.role || 'USER',
    isAdmin: Boolean(profile.isAdmin),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUser(null);
        return;
      }
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      refresh();
      return undefined;
    }

    let active = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!active) return;

      if (!firebaseUser) {
        clearAuthToken();
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        await syncSessionCookie(firebaseUser.idToken);
        if (active) {
          const baseUser = {
            email: firebaseUser.email,
            name: firebaseUser.name,
            uid: firebaseUser.uid,
          };
          const userWithRole = await mergeBackendProfile(baseUser, firebaseUser.idToken);
          if (active) setUser(userWithRole);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !user) return undefined

    const refreshSession = async () => {
      try {
        const idToken = await refreshFirebaseIdToken()
        if (idToken) await syncSessionCookie(idToken)
      } catch {
        /* next API call will surface auth errors */
      }
    }

    const interval = setInterval(refreshSession, 25 * 60 * 1000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user])

  const login = useCallback(async (email, password) => {
    if (isFirebaseConfigured()) {
      const { idToken } = await firebaseSignIn(email, password);
      const sessionUser = await syncSessionCookie(idToken);
      const userWithRole = await mergeBackendProfile(sessionUser, idToken);
      setUser(userWithRole);
      return userWithRole;
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (isFirebaseConfigured()) {
        await firebaseSignOut();
      }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      clearAuthToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
