import { extractReportId } from './entityExtractor'

const MIN_TRANSFORMERS_CONFIDENCE = 0.52

function buildParsedResult (raw, intent, module, confidence, parserSource, extras = {}) {
  const lower = raw.toLowerCase()
  let resolvedModule = module

  if (!resolvedModule && (intent === 'search' || intent === 'count' || intent === 'open' || intent === 'delete')) {
    resolvedModule = 'reports'
  }
  if (intent === 'navigate' && !resolvedModule && /\banalysis\b|\bupload\b/i.test(lower)) {
    resolvedModule = 'analysis'
  }

  return {
    intent,
    module: resolvedModule,
    confidence,
    reportId: extractReportId(raw),
    openLatest: /\b(?:open\s+)?latest\b/i.test(raw),
    raw,
    parserSource,
    searchQuery: extras.searchQuery ?? null,
    formData: extras.formData ?? null,
  }
}

/**
 * Primary tier: Transformers.js zero-shot (in-browser).
 * @param {string} text
 */
export async function parseWithTransformers (text) {
  const raw = (text || '').trim()
  if (!raw) return null

  try {
    const { classifyAssistantCommand, isLoaded, loadModels } = await import('../ai')
    if (!isLoaded()) {
      await loadModels()
    }
    const result = await classifyAssistantCommand(raw)
    if (!result || result.confidence < MIN_TRANSFORMERS_CONFIDENCE) return null
    return buildParsedResult(raw, result.intent, result.module, result.confidence, 'transformers')
  } catch (err) {
    console.warn('[intentClassifier] Transformers parse failed', err)
    return null
  }
}
