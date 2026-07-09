import { normalizeGeminiAnalysis } from './geminiNormalize'

function normalizeTimestamp (value) {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value._seconds != null) {
    return new Date(value._seconds * 1000).toISOString()
  }
  return new Date().toISOString()
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
    attachments: [],
    submittedAt: report.updatedAt || report.createdAt || null,
    updatedAt: report.updatedAt || report.createdAt || null,
  }

  const scanUrls = report.scanImageUrls || []
  const isImaging = Boolean(analysis?.imageAnalysis)
  const name =
    scanUrls.length > 1
      ? `Report ${reportId} (${scanUrls.length} scans)`
      : report.patientName
        ? `${report.patientName} — ${analysis?.classification?.type || 'Report'}`
        : `Report ${reportId}`

  return {
    id: reportId,
    reportId,
    name,
    fileType: isImaging ? 'image/jpeg' : 'application/pdf',
    size: 0,
    uploadedAt: normalizeTimestamp(report.createdAt),
    status: 'ready',
    isMock: false,
    isPersisted: true,
    file: null,
    objectUrl: scanUrls[0] || null,
    scanImageUrls: scanUrls,
    textContent: report.summary || null,
    analysis,
    isImageBundle: scanUrls.length > 1,
    bundleFiles: null,
    bundleObjectUrls: scanUrls.length > 1 ? scanUrls : null,
    userFeedback,
    patientId: report.patientId || null,
    createdBy: report.createdBy || null,
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
 *   scanImageUrls: string[]
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
    },
    helpful: fb.sentiment === 'up',
    notHelpful: fb.sentiment === 'down',
    feedback: fb.comment || '',
    scanImageUrls: doc.scanImageUrls || (doc.objectUrl ? [doc.objectUrl] : []),
    sourceGcsPath: doc.sourceGcsPath || null,
  }
}
