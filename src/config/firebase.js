/**
 * Firebase web client config (public — safe to expose in the browser).
 * Get API key from Firebase Console → Project settings → Your apps → Web app.
 */

export const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || 'med-docs-1fe8d'

export function getFirebaseConfig () {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()
  if (!apiKey) return null

  return {
    apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
      `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: FIREBASE_PROJECT_ID,
  }
}

export function isFirebaseConfigured () {
  return Boolean(getFirebaseConfig()?.apiKey)
}
