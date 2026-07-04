import { dedupeUsers } from '../usersClient'

function matchesUserQuery (user, query) {
  const q = (query || '').toLowerCase().trim()
  if (!q) return true
  return (
    (user.name || '').toLowerCase().includes(q)
    || (user.email || '').toLowerCase().includes(q)
    || (user.uid || '').toLowerCase().includes(q)
  )
}

/**
 * @param {object[]} users
 * @param {{ query?: string, limit?: number }} options
 */
export function searchUsers (users, { query, limit = 8 } = {}) {
  let rows = [...(users || [])]
  if (query) {
    rows = rows.filter((u) => matchesUserQuery(u, query))
  }
  return rows.slice(0, limit)
}

export function userToTableRow (user) {
  return {
    name: user.name || '—',
    email: user.email || '—',
    role: user.role || 'USER',
    status: user.active === false ? 'Inactive' : 'Active',
  }
}

export async function loadUsersForAssistant () {
  const { fetchUsers } = await import('../usersClient')
  const rows = await fetchUsers()
  return dedupeUsers(rows)
}

export const USER_SEARCH_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
]
