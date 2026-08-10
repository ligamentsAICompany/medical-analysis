import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchReportDownloadUrl } from '../../src/lib/reportsClient'
import { setAuthToken, clearAuthToken } from '../../src/lib/auth-token'

// Covers the "Download source" button fix: the backend previously had no
// endpoint to generate a working link to a report's private-GCS source
// file, so the button either silently failed or downloaded the wrong
// thing (a scan preview image via doc.objectUrl). This client function now
// calls the real GET /api/v1/reports/{reportId}/download endpoint.

describe('fetchReportDownloadUrl', () => {
  afterEach(() => {
    clearAuthToken()
    vi.unstubAllGlobals()
  })

  it('returns the signed download URL on success', async () => {
    setAuthToken('fake-token')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ downloadUrl: 'https://storage.googleapis.com/x?sig=1', expiresInMinutes: 15, filename: 'study.zip' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await fetchReportDownloadUrl('RPT_TEST0001')

    expect(result.downloadUrl).toBe('https://storage.googleapis.com/x?sig=1')
    expect(result.filename).toBe('study.zip')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/reports/RPT_TEST0001/download'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }),
      })
    )
  })

  it('throws with the backend error message on a 404 (no source file)', async () => {
    setAuthToken('fake-token')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () => JSON.stringify({ detail: { error: 'No source file is associated with this report' } }),
      })
    )

    await expect(fetchReportDownloadUrl('RPT_TEST0001')).rejects.toThrow(
      'No source file is associated with this report'
    )
  })

  it('throws when no auth token is available', async () => {
    // authHeaders()'s "Sign in required" error is thrown while building the
    // fetch() call's options, so it's caught by this function's own
    // try/catch and rewrapped as the generic "Could not reach reports API"
    // — same pattern every other function in this file already has.
    clearAuthToken()
    await expect(fetchReportDownloadUrl('RPT_TEST0001')).rejects.toThrow('Could not reach reports API')
  })
})
