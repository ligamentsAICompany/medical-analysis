export function normalizeEmailInput (text) {
  if (!text) return ''
  return String(text)
    .trim()
    .replace(/\s+at\s+/gi, '@')
    .replace(/\s+dot\s+/gi, '.')
    .replace(/\s+/g, '')
}

export const USER_CREATE_FIELDS = [
  {
    key: 'name',
    label: 'Name',
    question: "What is the user's **full name**?",
    type: 'text',
    required: true,
  },
  {
    key: 'email',
    label: 'Email',
    question: "What is their **email address**?",
    type: 'email',
    required: true,
    validate: (value) => (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmailInput(value))
        ? null
        : 'That does not look like a valid email.'
    ),
  },
  {
    key: 'role',
    label: 'Role',
    question: 'Should they be **ADMIN** or **USER**?',
    type: 'select',
    options: ['USER', 'ADMIN'],
    required: false,
  },
]

export function extractEmail (text) {
  const spoken = text.match(
    /[a-zA-Z0-9._%+\-]+(?:\s*@\s*|\s+at\s+)[a-zA-Z0-9.\-]+(?:\s*\.\s*|\s+dot\s+)[a-zA-Z]{2,}/i,
  )
  if (spoken) return normalizeEmailInput(spoken[0])

  const plain = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return plain ? plain[0].toLowerCase() : null
}

export function extractUserRole (text) {
  if (/\badmin(?:istrator)?\b/i.test(text)) return 'ADMIN'
  if (/\buser\b/i.test(text) && !/\badmin\b/i.test(text)) return 'USER'
  return null
}

export function extractUserName (text, email) {
  const quoted = text.match(/(?:named|called)\s+["']([^"']+)["']/i)
  if (quoted?.[1]) return quoted[1].trim()

  const beforeEmail = text.match(/(?:user|member|account)\s+([A-Za-z][A-Za-z\s.'-]{1,50}?)(?:\s+(?:with|email|as)\b|,|$)/i)
  if (beforeEmail?.[1]) {
    const name = beforeEmail[1].trim()
    if (name.length >= 2 && !name.includes('@')) return name
  }

  if (email) {
    const local = email.split('@')[0]
    const pretty = local.replace(/[._-]+/g, ' ').trim()
    if (pretty.length >= 2) {
      return pretty.replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }

  return null
}

/**
 * @param {string} text
 * @returns {{ name?: string, email?: string, role?: string }}
 */
export function extractUserCreateData (text) {
  const email = extractEmail(text)
  const role = extractUserRole(text)
  const name = extractUserName(text, email)
  const data = {}
  if (name) data.name = name
  if (email) data.email = email
  if (role) data.role = role
  return data
}

export function getMissingUserFields (data = {}) {
  return USER_CREATE_FIELDS.filter((field) => {
    if (!field.required) return false
    const value = data[field.key]
    return value === undefined || value === null || String(value).trim() === ''
  })
}

export function getNextFollowUpQuestion (field) {
  return field?.question || `Please provide **${field?.label || 'value'}**.`
}

export function applyFollowUpAnswer (data, field, answer) {
  const next = { ...data }
  if (field.key === 'role') {
    const role = extractUserRole(answer) || (/\badmin\b/i.test(answer) ? 'ADMIN' : 'USER')
    next.role = role
    return next
  }
  if (field.type === 'email') {
    next.email = extractEmail(answer) || normalizeEmailInput(answer)
    return next
  }
  next[field.key] = String(answer).trim()
  return next
}

export function validateFollowUpAnswer (field, answer) {
  if (!field?.validate) return null
  return field.validate(answer)
}
