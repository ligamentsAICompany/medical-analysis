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
