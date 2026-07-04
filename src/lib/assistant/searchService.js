import { detectDocumentType, extractPatientQuery } from './entityExtractor'

function docTypeLabel (doc) {
  if (doc.analysis?.imageAnalysis) return 'Imaging study'
  return doc.analysis?.classification?.type || 'Document'
}

function matchesQuery (doc, query, isAdmin) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    (doc.name || '').toLowerCase().includes(q)
    || (doc.analysis?.patientName || '').toLowerCase().includes(q)
    || (doc.id || '').toLowerCase().includes(q)
    || (doc.reportId || '').toLowerCase().includes(q)
    || docTypeLabel(doc).toLowerCase().includes(q)
    || (isAdmin && (doc.createdBy || '').toLowerCase().includes(q))
  )
}

export function searchDocuments (documents, { query, docType, status, limit = 10 } = {}, isAdmin = false) {
  let rows = [...(documents || [])]

  if (docType) {
    rows = rows.filter((d) => {
      if (docType === 'Imaging study') return Boolean(d.analysis?.imageAnalysis)
      return docTypeLabel(d) === docType
    })
  }

  if (status) {
    rows = rows.filter((d) => d.status === status)
  }

  const patient = extractPatientQuery(query || '')
  const searchTerm = patient || query
  if (searchTerm) {
    rows = rows.filter((d) => matchesQuery(d, searchTerm, isAdmin))
  }

  rows.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
  return rows.slice(0, limit)
}

export function countDocuments (documents, filters = {}, isAdmin = false) {
  return searchDocuments(documents, { ...filters, limit: 10000 }, isAdmin).length
}

export function documentToTableRow (doc) {
  return {
    id: doc.id,
    name: doc.name || '—',
    patient: doc.analysis?.patientName || '—',
    type: docTypeLabel(doc),
    status: doc.status || '—',
    uploadedAt: doc.uploadedAt,
    createdBy: doc.createdBy || '—',
  }
}

export function buildSearchFiltersFromText (text) {
  const docType = detectDocumentType(text)
  const patient = extractPatientQuery(text)
  let status = null
  if (/\banalysing\b|\banalyzing\b|\bprocessing\b/i.test(text)) status = 'analysing'
  if (/\bready\b|\bcompleted?\b/i.test(text)) status = 'ready'
  return {
    docType,
    query: patient || text,
    status,
  }
}
