/**
 * Build a human-readable clinical analysis export and trigger browser download.
 */

function line (label, value) {
  if (value == null || value === '') return ''
  return `${label}: ${value}\n`
}

function section (title, body) {
  const trimmed = (body || '').trim()
  if (!trimmed) return ''
  return `\n${title}\n${'─'.repeat(Math.min(title.length, 48))}\n${trimmed}\n`
}

function formatLabTable (labValues) {
  if (!Array.isArray(labValues) || !labValues.length) return ''
  const rows = labValues.map((row) => {
    const flag = row.flag ? ` [${row.flag}]` : ''
    return `  • ${row.test}: ${row.value}${row.unit ? ` ${row.unit}` : ''}${row.refRange ? ` (ref ${row.refRange})` : ''}${flag}`
  })
  return rows.join('\n')
}

function formatList (items) {
  if (!Array.isArray(items) || !items.length) return ''
  return items.map((item) => `  • ${item}`).join('\n')
}

function formatEntities (entities) {
  if (!entities || typeof entities !== 'object') return ''
  const parts = []
  for (const [key, values] of Object.entries(entities)) {
    if (!Array.isArray(values) || !values.length) continue
    parts.push(`${key}: ${values.join(', ')}`)
  }
  return parts.join('\n')
}

/**
 * @param {object} doc
 * @returns {string}
 */
export function buildAnalysisReportText (doc) {
  const analysis = doc?.analysis || {}
  const ia = analysis.imageAnalysis || {}
  const ai = analysis.aiInsights || {}
  const type = analysis.classification?.type || 'Report'
  const confidence = analysis.classification?.confidence != null
    ? `${Math.round(analysis.classification.confidence * 100)}%`
    : '—'

  let text = 'MEDDOCS CLINICAL ANALYSIS REPORT\n'
  text += `Generated: ${new Date().toISOString()}\n`
  text += line('Report', doc?.reportId || doc?.id)
  text += line('Attachment', doc?.attachmentName || doc?.name)
  text += line('Patient', analysis.patientName)
  text += line('Uploaded by', doc?.createdBy || doc?.uploadedBy)
  text += line('Document type', type)
  text += line('Confidence', confidence)

  text += section('AI Summary', analysis.summary)

  if (ai.executiveSummary || ai.insights?.length || ai.limitations?.length) {
    let insightsBlock = ''
    if (ai.executiveSummary) insightsBlock += `${ai.executiveSummary}\n`
    if (ai.insights?.length) insightsBlock += `\nKey insights:\n${formatList(ai.insights)}\n`
    if (ai.limitations?.length) insightsBlock += `\nLimitations:\n${formatList(ai.limitations)}\n`
    if (ai.careCoordinationNotes?.length) {
      insightsBlock += `\nCare coordination:\n${formatList(ai.careCoordinationNotes)}\n`
    }
    text += section('AI Insights', insightsBlock)
  }

  if (analysis.labValues?.length) {
    text += section('Lab Results', formatLabTable(analysis.labValues))
  }

  if (ia.modality || ia.findings?.length || ia.impression?.length) {
    let imaging = ''
    imaging += line('Modality', ia.modality)
    imaging += line('Exam', ia.examTitle)
    imaging += line('Indication', ia.indication)
    imaging += line('Technique', ia.technique)
    if (ia.findings?.length) imaging += `\nFindings:\n${formatList(ia.findings)}\n`
    if (ia.impression?.length) imaging += `\nImpression:\n${formatList(ia.impression)}\n`
    text += section('Imaging Analysis', imaging)
  }

  const entitiesText = formatEntities(analysis.entities)
  if (entitiesText) text += section('Entities', entitiesText)

  if (analysis.metrics && Object.keys(analysis.metrics).length) {
    const metrics = Object.entries(analysis.metrics)
      .map(([k, v]) => `  • ${k}: ${v}`)
      .join('\n')
    text += section('Metrics', metrics)
  }

  const fb = doc?.userFeedback
  if (fb?.comment || fb?.sentiment) {
    let feedback = ''
    if (fb.sentiment) feedback += line('Rating', fb.sentiment === 'up' ? 'Helpful' : 'Not helpful')
    if (fb.comment) feedback += line('Comments', fb.comment)
    text += section('User Feedback', feedback)
  }

  return text.trim() + '\n'
}

/**
 * @param {object} doc
 * @returns {string}
 */
export function buildAnalysisReportFilename (doc) {
  const base = (doc?.attachmentName || doc?.name || doc?.reportId || 'report')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80)
  return `${base}-analysis.txt`
}

/**
 * @param {object} doc
 * @param {'text'|'json'} [format='text']
 */
export function downloadAnalysisReport (doc, format = 'text') {
  if (!doc?.analysis) return

  const filename = format === 'json'
    ? buildAnalysisReportFilename(doc).replace(/\.txt$/, '.json')
    : buildAnalysisReportFilename(doc)

  const content = format === 'json'
    ? JSON.stringify({
      reportId: doc.reportId || doc.id,
      attachmentName: doc.attachmentName || doc.name,
      uploadedAt: doc.uploadedAt,
      createdBy: doc.createdBy || doc.uploadedBy,
      analysis: doc.analysis,
      userFeedback: doc.userFeedback || null,
    }, null, 2)
    : buildAnalysisReportText(doc)

  const mime = format === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8'
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
