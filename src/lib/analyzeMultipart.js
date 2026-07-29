import { MAX_ANALYZE_TEXT_CHARS } from '../config/uploadLimits';
import { validateAnalyzeFile, validateAnalyzeFileSelection } from './medicalFileTypes';

/** Frontend clinicalContext key -> backend wire field name (multipart Form / JSON body). */
const CLINICAL_CONTEXT_FIELD_MAP = {
  patientSex: 'patient_sex',
  patientAge: 'patient_age',
  presentComplaint: 'present_complaint',
  pastHistory: 'past_history',
  priorSurgicalHistory: 'prior_surgical_history',
};

/**
 * Convert a clinicalContext state object into the wire payload shape.
 * Empty/blank fields are omitted so the backend sees them as unset (None).
 * @param {object|null} clinicalContext
 * @returns {Record<string, string|number|boolean>}
 */
export function clinicalContextToPayload (clinicalContext) {
  if (!clinicalContext) return {};
  const payload = {};
  for (const [key, wireKey] of Object.entries(CLINICAL_CONTEXT_FIELD_MAP)) {
    const raw = clinicalContext[key];
    if (raw === null || raw === undefined) continue;
    const trimmed = String(raw).trim();
    if (!trimmed) continue;
    payload[wireKey] = key === 'patientAge' ? Number(trimmed) : trimmed;
  }
  payload.no_significant_history = Boolean(clinicalContext.noSignificantHistory);
  return payload;
}

/**
 * Append clinicalContext fields onto an existing FormData instance.
 * @param {FormData} form
 * @param {object|null} clinicalContext
 */
export function appendClinicalContext (form, clinicalContext) {
  if (!clinicalContext) return;
  const payload = clinicalContextToPayload(clinicalContext);
  for (const [wireKey, value] of Object.entries(payload)) {
    form.append(wireKey, String(value));
  }
}

/**
 * @param {File[]} files
 */
export function assertAnalyzeFiles (files) {
  if (!files?.length) {
    throw new Error('No files to analyze');
  }
  const selection = validateAnalyzeFileSelection(files);
  if (!selection.ok) {
    throw new Error(selection.error);
  }
  for (const file of files) {
    const result = validateAnalyzeFile(file);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }
}

/**
 * Multipart body for team analyze API: repeated field `files` (raw File blobs),
 * plus optional clinicalContext fields (patient_sex, patient_age, present_complaint,
 * past_history, prior_surgical_history, no_significant_history).
 * @param {File[]} files
 * @param {object|null} [clinicalContext]
 * @returns {FormData}
 */
export function buildAnalyzeMultipartFormData (files, clinicalContext) {
  assertAnalyzeFiles(files);
  const form = new FormData();
  for (const file of files) {
    form.append('files', file, file.name);
  }
  appendClinicalContext(form, clinicalContext);
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
