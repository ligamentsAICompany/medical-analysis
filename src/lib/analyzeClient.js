import { getAnalyzeApiPublicKey, getAnalyzeApiUrl } from '../config/analyzeApi';
import {
  buildAnalyzeMultipartFormData,
  buildAnalyzeTextFormData,
} from './analyzeMultipart';
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
 * @param {Response} res
 * @param {string} rawText
 */
async function parseAnalyzeResponse (res, rawText) {
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
  return analysis;
}

/**
 * POST one or more files to the analyze API.
 * @param {File[]} files
 * @returns {Promise<{ analysis: object }>}
 */
export async function analyzeFilesWithBackend (files) {
  const form = buildAnalyzeMultipartFormData(files);

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
  const analysis = await parseAnalyzeResponse(res, rawText);
  console.log('[analyze files] OK', { status: res.status, count: files.length });
  return { analysis };
}

/**
 * POST extracted text as a single `.txt` part (enhance / re-run on existing text).
 * @param {{ text: string, filename?: string }} payload
 * @returns {Promise<{ analysis: object }>}
 */
export async function analyzeTextWithBackend ({ text, filename = '' }) {
  const form = buildAnalyzeTextFormData(text, filename);

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
  const analysis = await parseAnalyzeResponse(res, rawText);
  return { analysis };
}

/** @deprecated Use analyzeFilesWithBackend or analyzeTextWithBackend */
export async function analyzeWithBackend (payload) {
  if (payload.files?.length) {
    return analyzeFilesWithBackend(payload.files);
  }
  if (payload.mode === 'text' || payload.text != null) {
    return analyzeTextWithBackend({
      text: payload.text || '',
      filename: payload.filename || '',
    });
  }
  throw new Error('analyzeWithBackend requires files[] or text');
}
