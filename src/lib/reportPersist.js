import { LARGE_FILE_THRESHOLD_BYTES } from '../config/uploadLimits'
import { isZipFile } from './medicalFileTypes'

/**
 * Whether the original study file should be re-uploaded with POST /api/v1/reports.
 * Large ZIPs and GCS-backed studies are already stored — send metadata only.
 * @param {object} doc
 * @returns {boolean}
 */
export function shouldAttachOriginalStudyFile (doc) {
  if (!doc?.file) return false
  if (doc.sourceGcsPath) return false
  if (isZipFile(doc.file) && doc.file.size >= LARGE_FILE_THRESHOLD_BYTES) return false
  if (doc.file.size >= LARGE_FILE_THRESHOLD_BYTES) return false
  return true
}

/**
 * Files to include when creating a report (small originals + small bundle parts only).
 * @param {object} doc
 * @returns {File[]}
 */
export function collectInitialReportFiles (doc) {
  const files = []
  if (shouldAttachOriginalStudyFile(doc)) {
    files.push(doc.file)
  }
  if (Array.isArray(doc.bundleFiles)) {
    for (const file of doc.bundleFiles) {
      if (!file || file.size >= LARGE_FILE_THRESHOLD_BYTES) continue
      if (doc.file && file.name === doc.file.name && file.size === doc.file.size) continue
      files.push(file)
    }
  }
  return files
}

/**
 * Feedback attachment files (never include the original large ZIP study).
 * @param {object} doc
 * @returns {File[]}
 */
export function collectFeedbackAttachmentFiles (doc) {
  return (doc.userFeedback?.attachments || [])
    .map((att) => att.file)
    .filter((file) => file && file.size < LARGE_FILE_THRESHOLD_BYTES)
}
