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

/**
 * @returns {Promise<{ uid: string, email: string, name: string, role: string, isAdmin: boolean }|null>}
 */
export async function fetchUserProfile () {
  let res
  try {
    res = await fetch(getReportsMeApiUrl(), {
      method: 'GET',
      headers: await authHeaders(),
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
    })
  } catch (err) {
    console.error('fetchUserReports failed', err)
    throw new Error('Could not reach reports API')
  }

  const rawText = await res.text()
  return parseReportsResponse(res, rawText)
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
 *   scanImageUrls?: string[]
 * }} payload
 * @returns {Promise<object>}
 */
export async function saveReport (payload) {
  let res
  try {
    res = await fetch(getReportsApiUrl(), {
      method: 'POST',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('saveReport failed', err)
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
