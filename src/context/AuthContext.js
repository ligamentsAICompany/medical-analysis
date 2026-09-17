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
import { getRegisterApiUrl } from '../config/analyzeApi';

const AuthContext = createContext(null);

// Two independent call sites fire this for the same sign-in: login()'s
// explicit call and the onAuthStateChanged listener's own call (triggered
// by the same Firebase auth state change login() just caused). Without
// dedup this sends two concurrent POST /api/auth/login requests for the
// same idToken on every sign-in -- reproduced directly this session as the
// cause of an intermittent stuck "Signing in..." state (one of the two
// concurrent requests would occasionally stall, and login()'s handleSubmit
// awaits its own call, never resolving until it does). Caching the in-flight
// promise per idToken means the second caller just awaits the first
// request's result instead of firing a duplicate.
let inFlightSessionSync = null;
let inFlightSessionSyncToken = null;

async function syncSessionCookie (idToken) {
  if (inFlightSessionSync && inFlightSessionSyncToken === idToken) {
    return inFlightSessionSync;
  }

  inFlightSessionSyncToken = idToken;
  inFlightSessionSync = (async () => {
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
  })();

  try {
    return await inFlightSessionSync;
  } finally {
    inFlightSessionSync = null;
    inFlightSessionSyncToken = null;
  }
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

  const register = useCallback(async (name, email, password) => {
    const res = await fetch(getRegisterApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.detail;
      const message = typeof detail === 'string' ? detail : detail?.error || 'Registration failed';
      throw new Error(message);
    }
    // Registration only creates the account server-side; sign in
    // immediately after so the user lands in the same authenticated state
    // login() produces (Firebase client state + session cookie + role).
    return login(email, password);
  }, [login]);

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
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
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
