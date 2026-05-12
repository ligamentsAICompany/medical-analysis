/**
 * Remote medical analysis API (Cloud Run / team backend).
 * Used by the browser client — only `NEXT_PUBLIC_*` vars are available here.
 */

/** Path appended to {@link getAnalyzeApiBaseUrl} for multipart analyze. */
export const ANALYZE_API_PATH = '/api/v1/analyze'

/**
 * @returns {string} Origin + optional path prefix, no trailing slash (e.g. https://….run.app)
 */
export function getAnalyzeApiBaseUrl () {
  const raw = process.env.NEXT_PUBLIC_ANALYZE_API_BASE_URL?.trim()
  if (!raw) {
    throw new Error(
      'NEXT_PUBLIC_ANALYZE_API_BASE_URL is not set. Add it to .env (see .env.example).'
    )
  }
  return raw.replace(/\/+$/, '')
}

/**
 * Full URL for `POST` analyze (multipart `files` field).
 * @returns {string}
 */
export function getAnalyzeApiUrl () {
  return `${getAnalyzeApiBaseUrl()}${ANALYZE_API_PATH}`
}

/**
 * Optional Bearer token for the analyze API (public — do not use for secrets).
 * Prefer backend auth that does not rely on a browser-exposed key in production.
 * @returns {string}
 */
export function getAnalyzeApiPublicKey () {
  return process.env.NEXT_PUBLIC_ANALYZE_API_KEY?.trim() || ''
}
