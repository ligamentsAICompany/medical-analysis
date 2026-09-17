'use client'

import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getFirebaseConfig, isFirebaseConfigured } from '../config/firebase'
import { clearAuthToken, setAuthToken } from './auth-token'

let authInstance = null

export function getFirebaseAuth () {
  if (!isFirebaseConfigured()) return null
  if (authInstance) return authInstance

  const config = getFirebaseConfig()
  const app = getApps().length ? getApps()[0] : initializeApp(config)
  authInstance = getAuth(app)
  return authInstance
}

export async function firebaseSignIn (email, password) {
  const auth = getFirebaseAuth()
  if (!auth) {
    throw new Error('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env')
  }

  const credential = await signInWithEmailAndPassword(auth, email, password)
  const idToken = await credential.user.getIdToken()
  setAuthToken(idToken)
  return {
    user: credential.user,
    idToken,
  }
}

export async function firebaseSignOut () {
  const auth = getFirebaseAuth()
  clearAuthToken()
  if (auth) await signOut(auth)
}

export function subscribeToAuthState (onUser) {
  const auth = getFirebaseAuth()
  if (!auth) {
    onUser(null)
    return () => {}
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      clearAuthToken()
      onUser(null)
      return
    }

    try {
      const idToken = await user.getIdToken()
      setAuthToken(idToken)
      onUser({
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
        idToken,
      })
    } catch {
      clearAuthToken()
      onUser(null)
    }
  })
}

export async function refreshFirebaseIdToken () {
  const auth = getFirebaseAuth()
  if (!auth) return null

  // authStateReady() resolves once the SDK finishes restoring a persisted
  // session from IndexedDB on page load -- without this, auth.currentUser
  // can still be null immediately after a fresh page load/reload even for
  // an actually-signed-in user, purely because that restoration hasn't
  // finished yet. Reproduced directly this session: a chat upload fired
  // right after navigating to /chat failed with "no Firebase auth token
  // available" even though the user was genuinely signed in -- this is the
  // race that caused it.
  await auth.authStateReady()

  const user = auth.currentUser
  if (!user) return null

  // getIdToken() returns a fresh token when the cached one has expired
  const idToken = await user.getIdToken()
  setAuthToken(idToken)
  return idToken
}
