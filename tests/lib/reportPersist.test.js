import { describe, expect, it } from 'vitest'
import {
  collectInitialReportFiles,
  shouldAttachOriginalStudyFile,
} from '../../src/lib/reportPersist'
import { LARGE_FILE_THRESHOLD_BYTES } from '../../src/config/uploadLimits'

describe('reportPersist', () => {
  it('skips re-upload when study is already in GCS', () => {
    const doc = {
      file: { name: 'study.zip', size: 120 * 1024 * 1024, type: 'application/zip' },
      sourceGcsPath: 'gs://medical-analysis/mri-uploads/abc.zip',
    }
    expect(shouldAttachOriginalStudyFile(doc)).toBe(false)
    expect(collectInitialReportFiles(doc)).toEqual([])
  })

  it('skips large ZIP files for direct report upload', () => {
    const doc = {
      file: { name: 'study.zip', size: LARGE_FILE_THRESHOLD_BYTES, type: 'application/zip' },
      sourceGcsPath: null,
    }
    expect(collectInitialReportFiles(doc)).toEqual([])
  })

  it('includes small original files', () => {
    const file = { name: 'labs.pdf', size: 1024, type: 'application/pdf' }
    const doc = { file, sourceGcsPath: null }
    expect(collectInitialReportFiles(doc)).toEqual([file])
  })
})
