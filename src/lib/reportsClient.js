import {
  getFreshApiAuthToken,
  getReportApiUrl,
  getReportsApiUrl,
  getReportsMeApiUrl,
} from '../config/analyzeApi'

/**
 * @param {Response} res
 * @param {string} rawText
 */
async function parseReportsResponse (res, rawText) {
  let raw
  try {
    raw = rawText ? JSON.parse(rawText) : {}
  } catch {
    throw new Error('Reports API returned non-JSON')
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
            : `Reports API error (${res.status})`
    throw new Error(msg)
  }

  return raw
}

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

/** Avoid Next.js / browser caching stale report lists in dev. */
const REPORTS_FETCH_INIT = { cache: 'no-store' }

/**
 * @param {unknown} raw
 * @returns {object[]}
 */
function normalizeReportsList (raw) {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.reports)) return raw.reports
    if (Array.isArray(raw.data)) return raw.data
    if (Array.isArray(raw.items)) return raw.items
  }
  return []
}

/**
 * @returns {Promise<{ uid: string, email: string, name: string, role: string, isAdmin: boolean }|null>}
 */
export async function fetchUserProfile () {
  let res
  try {
    res = await fetch(getReportsMeApiUrl(), {
      method: 'GET',
      headers: await authHeaders(),
      ...REPORTS_FETCH_INIT,
    })
  } catch (err) {
    console.error('fetchUserProfile failed', err)
    return null
  }

  const rawText = await res.text()
  if (!res.ok) return null

  try {
    return rawText ? JSON.parse(rawText) : null
  } catch {
    return null
  }
}

/**
 * @returns {Promise<object[]>}
 */
export async function fetchUserReports () {
  let res
  try {
    res = await fetch(getReportsApiUrl(), {
      method: 'GET',
      headers: await authHeaders(),
      ...REPORTS_FETCH_INIT,
    })
  } catch (err) {
    console.error('fetchUserReports failed', err)
    throw new Error('Could not reach reports API')
  }

  const rawText = await res.text()
  const raw = await parseReportsResponse(res, rawText)
  return normalizeReportsList(raw)
}

/**
 * @param {string} reportId
 * @returns {Promise<object>}
 */
export async function fetchReportById (reportId) {
  let res
  try {
    res = await fetch(getReportApiUrl(reportId), {
      method: 'GET',
      headers: await authHeaders(),
      ...REPORTS_FETCH_INIT,
    })
  } catch (err) {
    console.error('fetchReportById failed', err)
    throw new Error('Could not reach reports API')
  }

  const rawText = await res.text()
  return parseReportsResponse(res, rawText)
}

/**
 * @param {{
 *   reportData: object,
 *   helpful?: boolean,
 *   notHelpful?: boolean,
 *   feedback?: string,
 *   scanImageUrls?: string[],
 *   sourceGcsPath?: string | null
 * }} payload
 * @param {File[]} [files]
 * @returns {Promise<object>}
 */
export async function saveReport (payload, files = []) {
  const hasFiles = Array.isArray(files) && files.length > 0
  let res
  try {
    if (hasFiles) {
      const form = new FormData()
      form.append('report', JSON.stringify(payload))
      files.forEach((file) => {
        if (file) form.append('files', file)
      })
      res = await fetch(getReportsApiUrl(), {
        method: 'POST',
        headers: await authHeaders(),
        body: form,
      })
    } else {
      res = await fetch(getReportsApiUrl(), {
        method: 'POST',
        headers: {
          ...(await authHeaders()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    }
  } catch (err) {
    console.error('saveReport failed', err)
    throw new Error('Could not reach reports API')
  }

  const rawText = await res.text()
  return parseReportsResponse(res, rawText)
}

/**
 * @param {string} reportId
 * @param {{ helpful?: boolean, notHelpful?: boolean, feedback?: string }} payload
 * @param {File[]} [files]
 * @returns {Promise<object>}
 */
export async function updateReport (reportId, payload, files = []) {
  const hasFiles = Array.isArray(files) && files.length > 0
  let res
  try {
    if (hasFiles) {
      const form = new FormData()
      form.append('report', JSON.stringify(payload))
      files.forEach((file) => {
        if (file) form.append('files', file)
      })
      res = await fetch(getReportApiUrl(reportId), {
        method: 'PATCH',
        headers: await authHeaders(),
        body: form,
      })
    } else {
      res = await fetch(getReportApiUrl(reportId), {
        method: 'PATCH',
        headers: {
          ...(await authHeaders()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    }
  } catch (err) {
    console.error('updateReport failed', err)
    throw new Error('Could not reach reports API')
  }

  const rawText = await res.text()
  return parseReportsResponse(res, rawText)
}

/**
 * @param {string} reportId
 * @returns {Promise<object>}
 */
export async function deleteReport (reportId) {
  let res
  try {
    res = await fetch(getReportApiUrl(reportId), {
      method: 'DELETE',
      headers: await authHeaders(),
    })
  } catch (err) {
    console.error('deleteReport failed', err)
    throw new Error('Could not reach reports API')
  }

  const rawText = await res.text()
  return parseReportsResponse(res, rawText)
}
