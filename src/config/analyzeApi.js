/**
 * Remote medical analysis API (Cloud Run / team backend).
 * Used by the browser client — only `NEXT_PUBLIC_*` vars are available here.
 *
 * Upload routing (file size determines the path):
 *   < 30 MB  →  POST /api/v1/analyze          (direct multipart)
 *   >= 30 MB →  POST /api/v1/upload-url        (get GCS signed URL)
 *               PUT  <signed_url>              (stream file directly to GCS)
 *               POST /api/v1/analyze-gcs       (trigger analysis by gcs_path)
 */

/** Production default when NEXT_PUBLIC_ANALYZE_API_BASE_URL is unset at build time. */
export const DEFAULT_ANALYZE_API_BASE_URL =
  'https://medical-analysis-backend-2p3fwh332a-uc.a.run.app'

/** Direct multipart upload — for files < 30 MB. */
export const ANALYZE_API_PATH = '/api/v1/analyze'

/** Returns a GCS signed URL for large file uploads (>= 30 MB). */
export const UPLOAD_URL_API_PATH = '/api/v1/upload-url'

/** Triggers analysis after a file has been PUT to GCS. */
export const ANALYZE_GCS_API_PATH = '/api/v1/analyze-gcs'

/**
 * @returns {string} Origin, no trailing slash (e.g. https://….run.app)
 */
export function getAnalyzeApiBaseUrl () {
  const raw =
    process.env.NEXT_PUBLIC_ANALYZE_API_BASE_URL?.trim() ||
    DEFAULT_ANALYZE_API_BASE_URL
  return raw.replace(/\/+$/, '')
}

/**
 * Full URL for small-file direct multipart POST (< 30 MB).
 * @returns {string}
 */
export function getAnalyzeApiUrl () {
  return `${getAnalyzeApiBaseUrl()}${ANALYZE_API_PATH}`
}

/**
 * Full URL to obtain a GCS signed upload URL for large files (>= 30 MB).
 * @returns {string}
 */
export function getUploadUrlApiUrl () {
  return `${getAnalyzeApiBaseUrl()}${UPLOAD_URL_API_PATH}`
}

/**
 * Full URL to trigger analysis after a large file has been uploaded to GCS.
 * @returns {string}
 */
export function getAnalyzeGcsApiUrl () {
  return `${getAnalyzeApiBaseUrl()}${ANALYZE_GCS_API_PATH}`
}

/**
 * Optional Bearer token for the analyze API (public — do not use for secrets).
 * Note: do NOT send this header when making the direct PUT to GCS — the signed
 * URL is self-authenticating and extra auth headers will break the request.
 * @returns {string}
 */
export function getAnalyzeApiPublicKey () {
  return process.env.NEXT_PUBLIC_ANALYZE_API_KEY?.trim() || ''
}
