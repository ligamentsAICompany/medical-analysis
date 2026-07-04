import { describe, expect, it } from 'vitest'
import {
  buildSearchFiltersFromText,
  countDocuments,
  documentToTableRow,
  searchDocuments,
} from '../../../src/lib/assistant/searchService'

const sampleDocs = [
  {
    id: 'doc-1',
    name: 'cbc.pdf',
    status: 'ready',
    uploadedAt: '2026-01-02T10:00:00.000Z',
    createdBy: 'admin@meddocs.app',
    analysis: {
      patientName: 'Sarah Jones',
      classification: { type: 'Lab Report' },
    },
  },
  {
    id: 'doc-2',
    name: 'xray.png',
    status: 'ready',
    uploadedAt: '2026-01-03T10:00:00.000Z',
    createdBy: 'user@meddocs.app',
    analysis: {
      imageAnalysis: { summary: 'Chest x-ray' },
    },
  },
]

describe('searchService', () => {
  it('filters by patient name', () => {
    const rows = searchDocuments(sampleDocs, { query: 'Sarah' })
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('doc-1')
  })

  it('filters imaging studies by doc type', () => {
    const rows = searchDocuments(sampleDocs, { docType: 'Imaging study' })
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('doc-2')
  })

  it('counts matching documents', () => {
    expect(countDocuments(sampleDocs)).toBe(2)
    expect(countDocuments(sampleDocs, { docType: 'Lab Report' })).toBe(1)
  })

  it('maps rows for inline tables including uploaded by', () => {
    const row = documentToTableRow(sampleDocs[0])
    expect(row.patient).toBe('Sarah Jones')
    expect(row.createdBy).toBe('admin@meddocs.app')
  })

  it('builds filters from natural language', () => {
    const filters = buildSearchFiltersFromText('Show lab reports')
    expect(filters.docType).toBe('Lab Report')
  })
})
