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
  const user = auth?.currentUser
  if (!user) return null

  const idToken = await user.getIdToken(true)
  setAuthToken(idToken)
  return idToken
}
