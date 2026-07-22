import { getFreshApiAuthToken, getReportCorrectionsApiUrl } from '../config/analyzeApi'

/** Avoid Next.js / browser caching stale correction lists in dev. */
const CORRECTIONS_FETCH_INIT = { cache: 'no-store' }

async function authHeaders () {
  const token = await getFreshApiAuthToken()
  if (!token) {
    throw new Error('Sign in required — no Firebase auth token available')
  }
  return {
    accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

/**
 * @param {Response} res
 * @param {string} rawText
 */
async function parseCorrectionsResponse (res, rawText) {
  let raw
  try {
    raw = rawText ? JSON.parse(rawText) : {}
  } catch {
    throw new Error('Corrections API returned non-JSON')
  }

  if (!res.ok) {
    const detail = raw?.detail ?? raw?.message ?? raw?.error
    const msg =
      typeof detail === 'string'
        ? detail
        : detail != null && typeof detail === 'object' && detail.error
          ? detail.error
          : detail != null && typeof detail === 'object'
            ? JSON.stringify(detail)
            : `Corrections API error (${res.status})`
    throw new Error(msg)
  }

  return raw
}

/**
 * @typedef {'dicom'|'lab'|'document'|'generic_image'} AnalysisType
 * @typedef {'incorrect'|'missing'|'extra'} CorrectionType
 *
 * @typedef {object} CorrectionPayload
 * @property {AnalysisType} analysisType
 * @property {string} fieldPath
 * @property {CorrectionType} correctionType
 * @property {unknown} [originalValue]
 * @property {unknown} correctedValue
 * @property {string} [note]
 */

/**
 * Submit a structured correction against a report's AI analysis.
 * Requires an authenticated CLINICIAN or ADMIN user.
 * @param {string} reportId
 * @param {CorrectionPayload} payload
 * @returns {Promise<object>}
 */
export async function submitCorrection (reportId, payload) {
  let res
  try {
    res = await fetch(getReportCorrectionsApiUrl(reportId), {
      method: 'POST',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('submitCorrection failed', err)
    throw new Error('Could not reach corrections API')
  }

  const rawText = await res.text()
  return parseCorrectionsResponse(res, rawText)
}

/**
 * List structured corrections already submitted against a report.
 * @param {string} reportId
 * @returns {Promise<object[]>}
 */
export async function listCorrections (reportId) {
  let res
  try {
    res = await fetch(getReportCorrectionsApiUrl(reportId), {
      method: 'GET',
      headers: await authHeaders(),
      ...CORRECTIONS_FETCH_INIT,
    })
  } catch (err) {
    console.error('listCorrections failed', err)
    throw new Error('Could not reach corrections API')
  }

  const rawText = await res.text()
  const raw = await parseCorrectionsResponse(res, rawText)
  return Array.isArray(raw) ? raw : []
}
