import { FIREBASE_PROJECT_ID } from '../config/firebase'

function getFirebaseApiKey () {
  return (
    process.env.FIREBASE_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ||
    ''
  )
}

/**
 * Verify a Firebase ID token via Identity Toolkit REST API (no Admin SDK required).
 * @param {string} idToken
 * @returns {Promise<{ uid: string, email: string, name: string }>}
 */
export async function verifyFirebaseIdToken (idToken) {
  const apiKey = getFirebaseApiKey()
  if (!apiKey) {
    throw new Error('Firebase API key is not configured on the server')
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  )

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error?.message || 'Invalid Firebase token'
    throw new Error(msg)
  }

  const user = data?.users?.[0]
  if (!user?.localId) {
    throw new Error('Firebase user not found for token')
  }

  return {
    uid: user.localId,
    email: (user.email || '').toLowerCase(),
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
    projectId: FIREBASE_PROJECT_ID,
  }
}
