import { describe, expect, it } from 'vitest'
import {
  getModuleLabel,
  MODULE_ROUTES,
  resolveReportDetailPath,
} from '../../../src/lib/assistant/actionRegistry'

describe('actionRegistry', () => {
  it('maps module keys to labels', () => {
    expect(getModuleLabel('dashboard')).toBe('Dashboard')
    expect(getModuleLabel('reports')).toBe('Reports')
    expect(getModuleLabel('unknown')).toBe('unknown')
  })

  it('exposes workspace routes', () => {
    expect(MODULE_ROUTES.analysis.list).toBe('/analysis')
    expect(MODULE_ROUTES.users.list).toBe('/users')
  })

  it('encodes report detail paths', () => {
    expect(resolveReportDetailPath('doc-1')).toBe('/analysis/doc-1')
    expect(resolveReportDetailPath('a/b')).toBe('/analysis/a%2Fb')
    expect(resolveReportDetailPath(null)).toBe('/analysis')
  })
})
