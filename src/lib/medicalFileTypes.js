import {
  MAX_ANALYZE_FILE_BYTES,
  MAX_ZIP_FILE_BYTES,
  maxAnalyzeFileLabel,
  maxZipFileLabel,
} from '../config/uploadLimits'

/** IANA type for DICOM Part 10 / P10 objects (.dcm). */
export const DICOM_MIME = 'application/dicom'

/** Office Open XML Word document (.docx). */
export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {boolean}
 */
export function isDocxFile (file) {
  if (!file) return false
  const t = (file.type || '').toLowerCase().trim()
  if (t === DOCX_MIME) return true
  return (file.name || '').toLowerCase().endsWith('.docx')
}

/**
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {boolean}
 */
export function isDicomFile (file) {
  if (!file) return false
  const t = (file.type || '').toLowerCase().trim()
  if (t === DICOM_MIME || t === 'application/x-dicom') return true
  const name = (file.name || '').toLowerCase()
  return name.endsWith('.dcm') || name.endsWith('.dicom')
}

/**
 * Single-file or bundle uploads we send to Gemini as vision (inline_data), not text extraction.
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {boolean}
 */
export function isGeminiVisionUpload (file) {
  if (!file) return false
  if (file.type && file.type.startsWith('image/')) return true
  return isDicomFile(file)
}

/** ZIP archive for batch upload (backend unpacks / analyzes). */
export const ZIP_MIMES = ['application/zip', 'application/x-zip-compressed']

/**
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {boolean}
 */
export function isZipFile (file) {
  if (!file) return false
  const t = (file.type || '').toLowerCase().trim()
  if (ZIP_MIMES.includes(t)) return true
  return (file.name || '').toLowerCase().endsWith('.zip')
}

/**
 * PDF, DOCX, or plain text — documents merged with imaging in one analyze request.
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {boolean}
 */
export function isTextBundleFile (file) {
  if (!file) return false
  const t = (file.type || '').toLowerCase()
  return t === 'application/pdf' || t === 'text/plain' || isDocxFile(file)
}

/**
 * Document-side files for a combined analyze request (not imaging).
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {boolean}
 */
export function isDocumentBundleFile (file) {
  return isTextBundleFile(file) || isZipFile(file)
}

/**
 * Any file type the workspace sends to the analyze API.
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {boolean}
 */
export function isAnalyzeUploadFile (file) {
  if (!file) return false
  return isGeminiVisionUpload(file) || isDocumentBundleFile(file)
}

/**
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {number}
 */
export function getMaxAnalyzeFileBytes (file) {
  return isZipFile(file) ? MAX_ZIP_FILE_BYTES : MAX_ANALYZE_FILE_BYTES
}

/**
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {string}
 */
export function maxAnalyzeFileLabelFor (file) {
  return isZipFile(file) ? maxZipFileLabel : maxAnalyzeFileLabel
}

/**
 * ZIP archives must be the sole file in a selection (no mixing with PDF, images, etc.).
 * @param {Array<{ type?: string, name?: string }>} files
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateAnalyzeFileSelection (files) {
  if (!files?.length) {
    return { ok: false, error: 'No files selected' }
  }
  const archiveFiles = files.filter((f) => isZipFile(f))
  if (archiveFiles.length === 0) {
    return { ok: true }
  }
  if (archiveFiles.length > 1) {
    return { ok: false, error: 'Upload one ZIP archive at a time.' }
  }
  if (files.length > 1) {
    return {
      ok: false,
      error: 'ZIP archives must be uploaded alone — remove other files from this selection.',
    }
  }
  return { ok: true }
}

/**
 * @param {{ type?: string, name?: string, size?: number } | null | undefined} file
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateAnalyzeFile (file) {
  if (!file) {
    return { ok: false, error: 'No file selected' }
  }
  if (!isAnalyzeUploadFile(file)) {
    return { ok: false, error: `${file.name}: unsupported file type` }
  }
  const maxBytes = getMaxAnalyzeFileBytes(file)
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `${file.name}: exceeds ${maxAnalyzeFileLabelFor(file)} limit`,
    }
  }
  return { ok: true }
}

/**
 * @param {Array<{ type?: string, name?: string }>} files
 * @returns {{
 *   textFiles: typeof files,
 *   visionFiles: typeof files,
 *   archiveFiles: typeof files,
 *   isFullPartition: boolean
 * }}
 */
export function partitionClinicalBundle (files) {
  if (!files?.length) {
    return { textFiles: [], visionFiles: [], archiveFiles: [], isFullPartition: true }
  }
  const textFiles = files.filter((f) => isTextBundleFile(f))
  const visionFiles = files.filter((f) => isGeminiVisionUpload(f))
  const archiveFiles = files.filter((f) => isZipFile(f))
  const isFullPartition =
    textFiles.length + visionFiles.length + archiveFiles.length === files.length
  return { textFiles, visionFiles, archiveFiles, isFullPartition }
}

/**
 * MIME for Gemini inline_data (browser often leaves .dcm empty).
 * @param {{ type?: string, name?: string } | null | undefined} file
 * @returns {string}
 */
export function effectiveVisionMimeType (file) {
  if (!file) return 'image/png'
  if (file.type && file.type.startsWith('image/')) return file.type || 'image/png'
  if (isDicomFile(file)) return DICOM_MIME
  return file.type || 'image/png'
}

/**
 * @param {string} mime
 * @returns {boolean}
 */
export function isAllowedGeminiVisionMime (mime) {
  if (!mime || typeof mime !== 'string') return false
  if (mime === DICOM_MIME || mime.toLowerCase() === 'application/x-dicom') return true
  return mime.startsWith('image/')
}

/**
 * Document row / analysis page: treat like imaging workflow (not PDF body).
 * @param {{ fileType?: string, name?: string, isImageBundle?: boolean, analysis?: { imageAnalysis?: unknown } } | null | undefined} doc
 * @returns {boolean}
 */
export function isVisionStudyDoc (doc) {
  if (!doc) return false
  if (doc.isImageBundle || doc.isZipArchive) return true
  if (doc.analysis?.imageAnalysis) return true
  if (doc.analysis?.classification?.type === 'Imaging Report') return true
  if (isZipFile({ type: doc.fileType, name: doc.name })) return true
  if (doc.fileType?.startsWith('image/')) return true
  return isDicomFile({ type: doc.fileType, name: doc.name })
}
