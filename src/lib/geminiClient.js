/**
 * Calls the server-side Gemini analysis endpoint (credentials: session cookie).
 * @param {{ mode: 'text' | 'image', text?: string, mimeType?: string, imageBase64?: string, filename?: string }} payload
 * @returns {Promise<{ analysis: object }>}
 */
export async function analyzeWithGemini(payload) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Analysis failed (${res.status})`);
  }
  if (!data.analysis) {
    throw new Error('Invalid response from analysis service');
  }
  if (payload.mode === 'image') {
    console.log('[Gemini image] geminiClient /api/analyze OK', {
      status: res.status,
      analysis: data.analysis,
    });
  }
  return data;
}
