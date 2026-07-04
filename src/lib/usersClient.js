import {
  getFreshApiAuthToken,
  getAnalyzeApiBaseUrl,
} from '../config/analyzeApi'

const USERS_API_PATH = '/api/v1/users'

async function authHeaders (json = false) {
  const token = await getFreshApiAuthToken()
  if (!token) throw new Error('Sign in required')
  return {
    accept: 'application/json',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  }
}

async function parseUsersResponse (res, rawText) {
  let data
  try {
    data = rawText ? JSON.parse(rawText) : null
  } catch {
    throw new Error('Users API returned non-JSON')
  }

  if (!res.ok) {
    const detail = data?.detail ?? data?.message ?? data?.error
    const msg =
      typeof detail === 'string'
        ? detail
        : detail != null && typeof detail === 'object' && detail.error
          ? detail.error
          : detail != null && typeof detail === 'object'
            ? JSON.stringify(detail)
            : `Users API error (${res.status})`
    throw new Error(msg)
  }

  return data
}

const uidPriority = (uid) => {
  if (!uid) return 0
  if (String(uid).startsWith('mocked_')) return 1
  return 2
}

/**
 * Keep one row per email — prefer real Firebase UIDs over mocked duplicates.
 * @param {object[]} users
 * @returns {object[]}
 */
export function dedupeUsers (users = []) {
  const byEmail = new Map()

  for (const user of users) {
    const email = (user?.email || '').trim().toLowerCase()
    if (!email) continue

    const existing = byEmail.get(email)
    if (!existing || uidPriority(user.uid) > uidPriority(existing.uid)) {
      byEmail.set(email, user)
    }
  }

  return [...byEmail.values()].sort((a, b) => {
    const aAdmin = a.role === 'ADMIN' ? 0 : 1
    const bAdmin = b.role === 'ADMIN' ? 0 : 1
    if (aAdmin !== bAdmin) return aAdmin - bAdmin
    return (a.name || a.email || '').localeCompare(b.name || b.email || '')
  })
}

/**
 * @returns {Promise<object[]>}
 */
export async function fetchUsers () {
  const res = await fetch(`${getAnalyzeApiBaseUrl()}${USERS_API_PATH}`, {
    method: 'GET',
    headers: await authHeaders(),
  })

  const rawText = await res.text()
  const data = await parseUsersResponse(res, rawText)
  return dedupeUsers(Array.isArray(data) ? data : [])
}

/**
 * @returns {Promise<object>}
 */
export async function createUser (payload) {
  const res = await fetch(`${getAnalyzeApiBaseUrl()}${USERS_API_PATH}`, {
    method: 'POST',
    headers: await authHeaders(true),
    body: JSON.stringify(payload),
  })

  const rawText = await res.text()
  return parseUsersResponse(res, rawText)
}

/**
 * @param {string} uid
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function updateUser (uid, payload) {
  const res = await fetch(`${getAnalyzeApiBaseUrl()}${USERS_API_PATH}/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    headers: await authHeaders(true),
    body: JSON.stringify(payload),
  })

  const rawText = await res.text()
  return parseUsersResponse(res, rawText)
}

/**
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function deleteUser (uid) {
  const res = await fetch(`${getAnalyzeApiBaseUrl()}${USERS_API_PATH}/${encodeURIComponent(uid)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })

  if (res.status === 204) return

  const rawText = await res.text()
  await parseUsersResponse(res, rawText)
}
