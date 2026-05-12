import { getAnalyzeApiPublicKey, getAnalyzeApiUrl } from '../config/analyzeApi';
import { buildAnalyzeMultipartFormData } from './analyzeMultipart';
import { normalizeGeminiAnalysis } from './geminiNormalize';

/**
 * @param {unknown} data
 * @returns {object|null}
 */
function extractAnalysisPayload (data) {
  if (!data || typeof data !== 'object') return null;
  if (data.analysis && typeof data.analysis === 'object') return data.analysis;
  if (
    data.classification != null ||
    data.summary != null ||
    data.imageAnalysis != null
  ) {
    return data;
  }
  return null;
}

/**
 * POST multipart to the team analyze API and return `{ analysis }` for MedDocs state.
 *
 * @param {{
 *   mode: 'text' | 'image' | 'multiImage' | 'docAndImages',
 *   text?: string,
 *   textFilename?: string,
 *   mimeType?: string,
 *   imageBase64?: string,
 *   filename?: string,
 *   images?: { mimeType: string, imageBase64: string, filename: string }[],
 * }} payload
 * @returns {Promise<{ analysis: object }>}
 */
export async function analyzeWithBackend (payload) {
  const mode = payload.mode;
  const form = buildAnalyzeMultipartFormData(mode, payload);

  /** @type {Record<string, string>} */
  const headers = { accept: 'application/json' };
  const pubKey = getAnalyzeApiPublicKey();
  if (pubKey) {
    headers.Authorization = `Bearer ${pubKey}`;
  }

  let res;
  try {
    res = await fetch(getAnalyzeApiUrl(), {
      method: 'POST',
      body: form,
      headers,
    });
  } catch (err) {
    console.error('Analyze API request failed', err);
    throw new Error('Could not reach analyze API');
  }

  const rawText = await res.text();
  let raw;
  try {
    raw = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error('Analyze API returned non-JSON');
  }

  if (!res.ok) {
    const detail = raw?.detail ?? raw?.message ?? raw?.error;
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d?.msg || d?.message || JSON.stringify(d)).join('; ')
          : detail != null && typeof detail === 'object'
            ? JSON.stringify(detail)
            : `Analyze API error (${res.status})`;
    throw new Error(msg);
  }

  const payloadObj = extractAnalysisPayload(raw);
  const analysis = normalizeGeminiAnalysis(payloadObj);
  if (!analysis) {
    console.error('Analyze API unexpected JSON', rawText.slice(0, 2000));
    throw new Error('Could not normalise analysis from API');
  }

  if (mode === 'image' || mode === 'multiImage' || mode === 'docAndImages') {
    console.log(`[analyze ${mode}] OK`, { status: res.status, analysis });
  }

  return { analysis };
}
