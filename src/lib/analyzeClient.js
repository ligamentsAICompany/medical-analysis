import {
  getAnalyzeApiPublicKey,
  getAnalyzeApiUrl,
  getAnalyzeGcsApiUrl,
  getUploadUrlApiUrl,
} from '../config/analyzeApi';
import { LARGE_FILE_THRESHOLD_BYTES } from '../config/uploadLimits';
import {
  buildAnalyzeMultipartFormData,
  buildAnalyzeTextFormData,
} from './analyzeMultipart';
import { isZipFile } from './medicalFileTypes';
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
 * Request a GCS signed upload URL from the backend.
 * @returns {Promise<{ upload_url: string, gcs_path: string }>}
 */
async function getSignedUploadUrl () {
  const headers = { accept: 'application/json' };
  const pubKey = getAnalyzeApiPublicKey();
  if (pubKey) {
    headers.Authorization = `Bearer ${pubKey}`;
  }

  let res;
  try {
    res = await fetch(getUploadUrlApiUrl(), { method: 'POST', headers });
  } catch (err) {
    console.error('upload-url request failed', err);
    throw new Error('Could not reach upload URL service');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = '';
    try { detail = JSON.parse(text)?.detail || text; } catch { detail = text; }
    throw new Error(detail || `Failed to get upload URL (${res.status})`);
  }

  return res.json();
}

/**
 * PUT the file directly to GCS using the signed URL.
 * IMPORTANT: do not send Authorization headers — the signed URL is self-authenticating.
 * @param {File} file
 * @param {string} uploadUrl
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<void>}
 */
function uploadToGCS (file, uploadUrl, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`GCS upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('GCS upload network error'));
    xhr.onabort = () => reject(new Error('GCS upload aborted'));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', 'application/zip');
    xhr.send(file);
  });
}

/**
 * Trigger analysis after a file has been uploaded to GCS.
 * @param {string} gcsPath  e.g. "gs://medical-analysis/mri-uploads/<uuid>.zip"
 * @returns {Promise<object>} normalised analysis
 */
async function analyzeGcs (gcsPath) {
  const headers = {
    accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const pubKey = getAnalyzeApiPublicKey();
  if (pubKey) {
    headers.Authorization = `Bearer ${pubKey}`;
  }

  let res;
  try {
    res = await fetch(getAnalyzeGcsApiUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ gcs_path: gcsPath }),
    });
  } catch (err) {
    console.error('analyze-gcs request failed', err);
    throw new Error('Could not reach analyze-gcs API');
  }

  const rawText = await res.text();
  return parseAnalyzeResponse(res, rawText);
}

/**
 * POST one or more files to the analyze API.
 * ZIP files >= 30 MB are automatically routed through the GCS signed-URL flow;
 * all other files use the direct multipart path.
 * @param {File[]} files
 * @param {(phase: 'uploading'|'analyzing', percent: number) => void} [onProgress]
 * @returns {Promise<{ analysis: object }>}
 */
export async function analyzeFilesWithBackend (files, onProgress) {
  const zipFile = files.length === 1 && isZipFile(files[0]) ? files[0] : null;
  const usesGcsFlow = zipFile !== null && zipFile.size >= LARGE_FILE_THRESHOLD_BYTES;

  if (usesGcsFlow) {
    console.log('[analyze files] large ZIP — using GCS flow', { size: zipFile.size });

    // Step 1: get signed URL
    const { upload_url, gcs_path } = await getSignedUploadUrl();

    // Step 2: upload to GCS with progress
    onProgress?.('uploading', 0);
    await uploadToGCS(zipFile, upload_url, (pct) => onProgress?.('uploading', pct));
    onProgress?.('analyzing', 0);
    console.log('[analyze files] GCS upload complete, triggering analysis');

    // Step 3: trigger analysis
    const analysis = await analyzeGcs(gcs_path);
    console.log('[analyze files] GCS analysis OK');
    return { analysis };
  }

  // Direct multipart path for small files and all non-ZIP types
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
  console.log('[analyze files] direct OK', { status: res.status, count: files.length });
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
