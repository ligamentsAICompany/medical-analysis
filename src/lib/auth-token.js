/** In-memory Firebase ID token for authenticated backend API calls. */

let cachedIdToken = null

export function setAuthToken (token) {
  cachedIdToken = typeof token === 'string' && token.trim() ? token.trim() : null
}

export function getAuthToken () {
  return cachedIdToken
}

export function clearAuthToken () {
  cachedIdToken = null
}

/**
 * Return a valid Firebase ID token when signed in.
 * Refreshes automatically when the cached token has expired.
 */
export async function ensureFreshApiAuthToken () {
  const { isFirebaseConfigured } = await import('../config/firebase')

  if (isFirebaseConfigured()) {
    const { refreshFirebaseIdToken } = await import('./firebase-client')
    const fresh = await refreshFirebaseIdToken()
    if (fresh) return fresh
  }

  return (
    getAuthToken() ||
    process.env.NEXT_PUBLIC_API_AUTH_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_ANALYZE_API_KEY?.trim() ||
    ''
  )
}
