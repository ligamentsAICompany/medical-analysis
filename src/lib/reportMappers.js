import { normalizeGeminiAnalysis } from './geminiNormalize'
import { isZipFile } from './medicalFileTypes'

function normalizeTimestamp (value) {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value._seconds != null) {
    return new Date(value._seconds * 1000).toISOString()
  }
  return new Date().toISOString()
}

function isImagingReport (analysis, originalFileName) {
  if (analysis?.imageAnalysis) return true
  if (analysis?.classification?.type === 'Imaging Report') return true
  if (originalFileName && isZipFile({ name: originalFileName })) return true
  return false
}

function mapFeedbackAttachments (feedback) {
  const fb = feedback || {}
  return (fb.attachments || []).map((att) => ({
    id: att.id,
    name: att.name,
    size: att.size || 0,
    fileType: att.contentType || att.fileType || '',
    contentType: att.contentType || att.fileType || '',
    objectUrl: att.url || '',
    url: att.url || '',
    gcsPath: att.gcsPath || null,
  }))
}

/**
 * Convert backend Firestore report → frontend document row.
 * @param {object} report
 * @returns {object}
 */
export function reportToDocument (report) {
  const reportId = report.reportId || report.id
  const analysis = normalizeGeminiAnalysis({
    classification: report.classification,
    summary: report.summary,
    patientName: report.patientName,
    entities: report.entities,
    metrics: report.metrics,
    labValues: report.labValues,
    imageAnalysis: report.imageAnalysis,
    aiInsights: report.aiInsights,
  })

  const fb = report.feedback || {}
  const userFeedback = {
    sentiment: fb.helpful ? 'up' : fb.notHelpful ? 'down' : null,
    comment: fb.comments || '',
    attachments: mapFeedbackAttachments(fb),
    submittedAt: fb.comments || mapFeedbackAttachments(fb).length ? (report.updatedAt || report.createdAt || null) : null,
    updatedAt: report.updatedAt || report.createdAt || null,
  }

  const scanUrls = report.scanImageUrls || []
  const attachmentName = report.originalFileName || null
  const imaging = isImagingReport(analysis, attachmentName)
  const zipArchive = attachmentName ? isZipFile({ name: attachmentName }) : false

  const name = report.patientName
    ? `${report.patientName} — ${analysis?.classification?.type || 'Report'}`
    : attachmentName
      || (scanUrls.length > 1
        ? `Report ${reportId} (${scanUrls.length} scans)`
        : `Report ${reportId}`)

  return {
    id: reportId,
    reportId,
    name,
    attachmentName,
    fileType: zipArchive
      ? 'application/zip'
      : imaging
        ? 'image/jpeg'
        : 'application/pdf',
    size: report.fileSizeBytes || 0,
    uploadedAt: normalizeTimestamp(report.createdAt),
    status: 'ready',
    isMock: false,
    isPersisted: true,
    file: null,
    objectUrl: scanUrls[0] || null,
    scanImageUrls: scanUrls,
    sourceGcsPath: report.sourceGcsPath || null,
    textContent: report.summary || null,
    analysis,
    isImageBundle: scanUrls.length > 1,
    isZipArchive: zipArchive,
    bundleFiles: null,
    bundleObjectUrls: scanUrls.length > 1 ? scanUrls : null,
    userFeedback,
    patientId: report.patientId || null,
    createdBy: report.createdBy || null,
    uploadedBy: report.createdBy || null,
  }
}

/**
 * Build POST /api/v1/reports body from a frontend document.
 * @param {object} doc
 * @returns {{
 *   reportData: object,
 *   helpful: boolean,
 *   notHelpful: boolean,
 *   feedback: string,
 *   scanImageUrls: string[],
 *   sourceGcsPath: string | null
 * }}
 */
export function documentToReportPayload (doc) {
  const analysis = doc.analysis || {}
  const fb = doc.userFeedback || {}

  return {
    reportData: {
      classification: analysis.classification || { type: 'Other', confidence: 0 },
      summary: analysis.summary || '',
      patientName: analysis.patientName || doc.name || null,
      patientId: doc.patientId || analysis.metrics?.patientId || analysis.metrics?.['Patient ID'] || null,
      entities: analysis.entities || {},
      metrics: analysis.metrics || {},
      labValues: analysis.labValues || [],
      imageAnalysis: analysis.imageAnalysis || null,
      aiInsights: analysis.aiInsights || null,
      originalFileName: doc.attachmentName || doc.name || null,
      fileSizeBytes: doc.size || 0,
    },
    helpful: fb.sentiment === 'up',
    notHelpful: fb.sentiment === 'down',
    feedback: fb.comment || '',
    scanImageUrls: doc.scanImageUrls || (doc.objectUrl ? [doc.objectUrl] : []),
    sourceGcsPath: doc.sourceGcsPath || null,
  }
}

/**
 * Build PATCH /api/v1/reports/{id} body for feedback updates.
 * @param {object} doc
 * @param {object} [feedbackOverride]
 */
export function documentToFeedbackPayload (doc, feedbackOverride = null) {
  const fb = feedbackOverride || doc.userFeedback || {}
  return {
    helpful: fb.sentiment === 'up',
    notHelpful: fb.sentiment === 'down',
    feedback: fb.comment || '',
  }
}

export { mapFeedbackAttachments }
