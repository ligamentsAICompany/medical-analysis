import {
  MAX_ANALYZE_FILE_BYTES,
  MAX_ANALYZE_FILE_MB,
  MAX_ANALYZE_TEXT_CHARS,
} from '../config/uploadLimits';
import { isAnalyzeUploadFile } from './medicalFileTypes';

/**
 * @param {File[]} files
 */
export function assertAnalyzeFiles (files) {
  if (!files?.length) {
    throw new Error('No files to analyze');
  }
  for (const file of files) {
    if (!isAnalyzeUploadFile(file)) {
      throw new Error(`${file.name}: unsupported file type for analysis`);
    }
    if (file.size > MAX_ANALYZE_FILE_BYTES) {
      throw new Error(`${file.name}: exceeds ${MAX_ANALYZE_FILE_MB} MB`);
    }
  }
}

/**
 * Multipart body for team analyze API: repeated field `files` (raw File blobs).
 * @param {File[]} files
 * @returns {FormData}
 */
export function buildAnalyzeMultipartFormData (files) {
  assertAnalyzeFiles(files);
  const form = new FormData();
  for (const file of files) {
    form.append('files', file, file.name);
  }
  return form;
}

/**
 * Text-only enhance path (no original File on disk).
 * @param {string} text
 * @param {string} filename
 * @returns {FormData}
 */
export function buildAnalyzeTextFormData (text, filename) {
  const trimmed = typeof text === 'string' ? text : '';
  if (!trimmed.trim()) {
    throw new Error('text is required for text analysis');
  }
  const clipped =
    trimmed.length > MAX_ANALYZE_TEXT_CHARS
      ? trimmed.slice(0, MAX_ANALYZE_TEXT_CHARS)
      : trimmed;
  const fn =
    typeof filename === 'string' && filename.trim()
      ? filename.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 200) || 'document.txt'
      : 'document.txt';
  const safeName = fn.toLowerCase().endsWith('.txt') ? fn : `${fn}.txt`;
  const form = new FormData();
  form.append(
    'files',
    new Blob([clipped], { type: 'text/plain;charset=utf-8' }),
    safeName
  );
  return form;
}
