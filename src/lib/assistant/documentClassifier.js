import { classifyDocument } from '../heuristics'
import { extractTextFromPdf } from '../pdfExtract'
import {
  isGeminiVisionUpload,
  isTextBundleFile,
  validateAnalyzeFile,
} from '../medicalFileTypes'

const MIN_KEYWORD_CONFIDENCE = 0.68
const MIN_TRANSFORMERS_CONFIDENCE = 0.5

async function loadAi () {
  return import('../ai')
}

/**
 * @param {File} file
 * @param {{ extractedText?: string }} [options]
 */
export async function classifyClinicalFile (file, options = {}) {
  const { extractedText, liteMode = false } = options
  const validation = validateAnalyzeFile(file)
  if (!validation.ok) {
    return { type: 'Other', confidence: 0, method: 'error', error: validation.error }
  }

  if (isGeminiVisionUpload(file)) {
    return {
      type: 'Imaging study',
      confidence: 0.92,
      method: 'vision',
      signals: ['imaging upload'],
    }
  }

  let text = extractedText || ''
  if (!text && file.type === 'application/pdf') {
    try {
      text = await extractTextFromPdf(file)
    } catch {
      text = ''
    }
  }
  if (!text && file.type?.startsWith('image/') && !liteMode) {
    try {
      const { loadModels, extractTextFromImage } = await loadAi()
      await loadModels()
      text = await extractTextFromImage(file)
    } catch {
      text = ''
    }
  }
  if (!text) {
    text = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  }

  const keyword = classifyDocument(text)
  if (keyword.confidence >= MIN_KEYWORD_CONFIDENCE) {
    return {
      type: keyword.type,
      confidence: keyword.confidence,
      method: 'keywords',
      signals: ['heuristics'],
      previewText: text.slice(0, 240),
    }
  }

  if (!liteMode) {
    try {
      const { loadModels, classifyDocumentType } = await loadAi()
      await loadModels()
      const ml = await classifyDocumentType(text)
      if (ml && ml.confidence >= MIN_TRANSFORMERS_CONFIDENCE) {
        return {
          type: ml.type,
          confidence: ml.confidence,
          method: 'transformers',
          signals: ['zero-shot'],
          previewText: text.slice(0, 240),
        }
      }
    } catch (err) {
      console.warn('[documentClassifier] Transformers classify failed', err)
    }
  }

  return {
    type: keyword.type,
    confidence: keyword.confidence,
    method: 'keywords',
    signals: ['heuristics-fallback'],
    previewText: text.slice(0, 240),
  }
}

export function shouldAnalyzeClinicalFile (file) {
  return validateAnalyzeFile(file).ok
}

export function describeClinicalFile (file) {
  if (!file) return 'document'
  if (isGeminiVisionUpload(file)) return 'imaging study'
  if (isTextBundleFile(file)) return 'clinical document'
  return file.name || 'file'
}
