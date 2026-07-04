import {
  INTENT_KEYWORDS,
  MODULE_KEYWORDS,
} from './actionRegistry'
import { extractReportId } from './entityExtractor'
import { parseWithTransformers } from './intentClassifier'

const MIN_KEYWORD_CONFIDENCE = 0.65
const MIN_GROQ_CONFIDENCE = 0.55

function detectIntent (lower) {
  if (/\bhelp\b|\bwhat can you\b/i.test(lower)) {
    return { intent: 'help', confidence: 0.9 }
  }
  if (/\bhow many\b|\bcount\b|\bnumber of\b|\btotal\b/i.test(lower)) {
    return { intent: 'count', confidence: 0.85 }
  }
  if (/\bopen latest\b|\blatest report\b/i.test(lower)) {
    return { intent: 'open', confidence: 0.9, openLatest: true }
  }
  const reportId = extractReportId(lower)
  if (reportId && /\bopen\b|\bview\b|\bshow\b/i.test(lower)) {
    return { intent: 'open', confidence: 0.9, reportId }
  }
  for (const kw of INTENT_KEYWORDS.delete) {
    if (lower.includes(kw)) return { intent: 'delete', confidence: 0.85 }
  }
  for (const kw of INTENT_KEYWORDS.search) {
    if (kw.includes(' ') && lower.includes(kw)) return { intent: 'search', confidence: 0.85 }
  }
  for (const kw of INTENT_KEYWORDS.navigate) {
    if (kw.includes(' ') && lower.includes(kw)) return { intent: 'navigate', confidence: 0.8 }
  }
  for (const kw of INTENT_KEYWORDS.create) {
    if (lower.includes(kw)) return { intent: 'create', confidence: 0.75 }
  }
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (!kw.includes(' ') && lower.split(/\W+/).includes(kw)) {
        return { intent, confidence: 0.7 }
      }
    }
  }
  if (/\b(show|list|find)\b/.test(lower)) {
    return { intent: 'search', confidence: 0.65 }
  }
  return { intent: 'unknown', confidence: 0.3 }
}

function detectModule (lower) {
  for (const [mod, keywords] of Object.entries(MODULE_KEYWORDS)) {
    for (const kw of keywords) {
      if (kw.includes(' ') && lower.includes(kw)) return mod
    }
  }
  for (const [mod, keywords] of Object.entries(MODULE_KEYWORDS)) {
    for (const kw of keywords) {
      if (!kw.includes(' ') && lower.split(/\W+/).some((w) => w === kw || w.startsWith(kw))) {
        return mod
      }
    }
  }
  return null
}

/**
 * Parse order: Transformers.js (primary) → keyword → Groq API (fallback).
 * @param {string} text
 * @param {string} [currentPath]
 * @param {{ liteMode?: boolean }} [options]
 */
export async function parseCommandAsync (text, currentPath, options = {}) {
  const { liteMode = false } = options
  const raw = (text || '').trim()
  if (!raw) {
    return { intent: 'unknown', module: null, confidence: 0, raw, parserSource: 'keyword' }
  }

  if (!liteMode) {
    const transformers = await parseWithTransformers(raw)
    if (transformers && transformers.confidence >= 0.58) {
      return transformers
    }
  }

  const keyword = parseCommand(raw)
  if (keyword.confidence >= MIN_KEYWORD_CONFIDENCE) {
    return keyword
  }

  if (!liteMode) {
    const transformers = await parseWithTransformers(raw)
    if (transformers) return transformers
  }

  if (!liteMode) {
    try {
      const res = await fetch('/api/assistant/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: raw, currentPath }),
      })
      if (res.ok) {
        const data = await res.json()
        const confidence = typeof data.confidence === 'number' ? data.confidence : 0.7
        if (confidence >= MIN_GROQ_CONFIDENCE) {
          return {
            intent: data.intent || 'unknown',
            module: data.module || null,
            confidence,
            searchQuery: data.searchQuery || null,
            formData: data.formData || null,
            reportId: extractReportId(raw),
            openLatest: /\b(?:open\s+)?latest\b/i.test(raw),
            raw,
            parserSource: data.provider === 'groq' ? 'groq' : 'keyword',
          }
        }
      }
    } catch {
      /* keyword fallback */
    }
  }

  return keyword
}

/**
 * @param {string} text
 * @returns {{ intent: string, module: string|null, confidence: number, reportId?: string, openLatest?: boolean, raw: string }}
 */
export function parseCommand (text) {
  const raw = (text || '').trim()
  const lower = raw.toLowerCase()
  const { intent, confidence, reportId, openLatest } = detectIntent(lower)
  let module = detectModule(lower)

  if (!module && (intent === 'search' || intent === 'count' || intent === 'open' || intent === 'delete')) {
    module = 'reports'
  }
  if (intent === 'navigate' && !module && /\banalysis\b|\bupload\b/i.test(lower)) {
    module = 'analysis'
  }

  return {
    intent,
    module,
    confidence,
    reportId: reportId || extractReportId(raw),
    openLatest: Boolean(openLatest),
    raw,
    parserSource: 'keyword',
  }
}
