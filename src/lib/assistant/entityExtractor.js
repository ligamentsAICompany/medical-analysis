import { DOC_TYPE_KEYWORDS } from './actionRegistry'

export function extractPatientQuery (text) {
  const patterns = [
    /(?:for|named|called|patient)\s+["']?([A-Za-z][A-Za-z\s.'-]{1,60})/i,
    /reports?\s+for\s+([A-Za-z][A-Za-z\s.'-]{1,60})/i,
    /find\s+([A-Za-z][A-Za-z\s.'-]{1,60})/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const name = m[1].trim().replace(/\s+(reports?|documents?|files?)$/i, '').trim()
      if (name.length >= 2) return name
    }
  }
  return null
}

export function extractReportId (text) {
  const m = text.match(/\b(RPT_[A-Z0-9]+)\b/i)
  if (m) return m[1].toUpperCase()
  const uuid = text.match(/\b([a-f0-9-]{20,})\b/i)
  if (uuid) return uuid[1]
  return null
}

export function detectDocumentType (text) {
  const lower = text.toLowerCase()
  for (const [type, keywords] of Object.entries(DOC_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (kw.includes(' ') && lower.includes(kw)) return type
    }
  }
  for (const [type, keywords] of Object.entries(DOC_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (!kw.includes(' ') && lower.split(/\W+/).includes(kw)) return type
    }
  }
  if (/\bimaging\b/i.test(text) && /\b(study|studies|scan)\b/i.test(text)) {
    return 'Imaging study'
  }
  return null
}

export function isAffirmative (text) {
  return /^(yes|y|confirm|delete it|go ahead|ok|okay|sure)\b/i.test(text.trim())
}

export function isNegative (text) {
  return /^(no|n|cancel|stop|nevermind|never mind)\b/i.test(text.trim())
}
