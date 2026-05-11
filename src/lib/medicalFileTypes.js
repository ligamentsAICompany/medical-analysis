/** IANA type for DICOM Part 10 / P10 objects (.dcm). */
export const DICOM_MIME = 'application/dicom'

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

/**
 * PDF or plain text — can be merged into one Gemini text block with imaging.
 * @param {{ type?: string } | null | undefined} file
 * @returns {boolean}
 */
export function isTextBundleFile (file) {
  if (!file) return false
  const t = (file.type || '').toLowerCase()
  return t === 'application/pdf' || t === 'text/plain'
}

/**
 * @param {Array<{ type?: string, name?: string }>} files
 * @returns {{ textFiles: typeof files, visionFiles: typeof files, isFullPartition: boolean }}
 */
export function partitionClinicalBundle (files) {
  if (!files?.length) {
    return { textFiles: [], visionFiles: [], isFullPartition: true }
  }
  const textFiles = files.filter((f) => isTextBundleFile(f))
  const visionFiles = files.filter((f) => isGeminiVisionUpload(f))
  const isFullPartition = textFiles.length + visionFiles.length === files.length
  return { textFiles, visionFiles, isFullPartition }
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
  if (doc.isImageBundle) return true
  if (doc.analysis?.imageAnalysis) return true
  if (doc.fileType?.startsWith('image/')) return true
  return isDicomFile({ type: doc.fileType, name: doc.name })
}
