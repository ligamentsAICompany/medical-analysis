import { isAllowedGeminiVisionMime } from './medicalFileTypes';

const MAX_TEXT_CHARS = 120_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_MULTI_IMAGES = 8;
const MAX_MULTI_TOTAL_BYTES = 36 * 1024 * 1024;

/**
 * @param {string} base64
 * @param {string} mimeType
 * @returns {Blob}
 */
function base64ToBlob (base64, mimeType) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
}

/**
 * Build multipart body: repeated form field `files` (matches team `curl -F 'files=@…'`).
 *
 * @param {'text' | 'image' | 'multiImage' | 'docAndImages'} mode
 * @param {object} body
 * @returns {FormData}
 */
export function buildAnalyzeMultipartFormData (mode, body) {
  const form = new FormData();

  if (mode === 'multiImage') {
    const images = Array.isArray(body.images) ? body.images : [];
    if (images.length < 2) {
      throw new Error('multiImage mode requires at least 2 images in the "images" array');
    }
    if (images.length > MAX_MULTI_IMAGES) {
      throw new Error(`Too many images (max ${MAX_MULTI_IMAGES} per request)`);
    }
    let totalApprox = 0;
    for (let i = 0; i < images.length; i += 1) {
      const img = images[i];
      const mimeType = typeof img?.mimeType === 'string' ? img.mimeType : 'image/png';
      const imageBase64 = typeof img?.imageBase64 === 'string' ? img.imageBase64 : '';
      const fn = typeof img?.filename === 'string' ? img.filename : `image-${i + 1}`;
      if (!isAllowedGeminiVisionMime(mimeType)) {
        throw new Error(`images[${i}] (${fn}): unsupported MIME type for vision analysis`);
      }
      if (!imageBase64) {
        throw new Error(`images[${i}].imageBase64 is required`);
      }
      const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        throw new Error(`Image ${i + 1} (${fn}) exceeds ~12 MB`);
      }
      totalApprox += approxBytes;
      form.append('files', base64ToBlob(imageBase64, mimeType), fn);
    }
    if (totalApprox > MAX_MULTI_TOTAL_BYTES) {
      throw new Error('Combined images exceed size limit — upload fewer or smaller files');
    }
    return form;
  }

  if (mode === 'docAndImages') {
    const images = Array.isArray(body.images) ? body.images : [];
    const docText = typeof body.text === 'string' ? body.text : '';
    if (images.length < 1) {
      throw new Error('docAndImages mode requires at least one entry in "images"');
    }
    if (images.length > MAX_MULTI_IMAGES) {
      throw new Error(`Too many images (max ${MAX_MULTI_IMAGES} per request)`);
    }
    let totalApprox = 0;
    for (let i = 0; i < images.length; i += 1) {
      const img = images[i];
      const mimeType = typeof img?.mimeType === 'string' ? img.mimeType : 'image/png';
      const imageBase64 = typeof img?.imageBase64 === 'string' ? img.imageBase64 : '';
      const fn = typeof img?.filename === 'string' ? img.filename : `image-${i + 1}`;
      if (!isAllowedGeminiVisionMime(mimeType)) {
        throw new Error(`images[${i}] (${fn}): unsupported MIME type for vision analysis`);
      }
      if (!imageBase64) {
        throw new Error(`images[${i}].imageBase64 is required`);
      }
      const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        throw new Error(`Image ${i + 1} (${fn}) exceeds ~12 MB`);
      }
      totalApprox += approxBytes;
      form.append('files', base64ToBlob(imageBase64, mimeType), fn);
    }
    if (totalApprox > MAX_MULTI_TOTAL_BYTES) {
      throw new Error('Combined images exceed size limit — upload fewer or smaller files');
    }
    const clippedDoc =
      docText.length > MAX_TEXT_CHARS ? docText.slice(0, MAX_TEXT_CHARS) : docText;
    if (!clippedDoc.trim()) {
      throw new Error('text is required for docAndImages (extracted document body was empty)');
    }
    form.append(
      'files',
      new Blob([clippedDoc], { type: 'text/plain;charset=utf-8' }),
      'extracted-context.txt'
    );
    return form;
  }

  if (mode === 'image') {
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/png';
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
    const fn = typeof body.filename === 'string' ? body.filename : 'upload.bin';
    if (!isAllowedGeminiVisionMime(mimeType)) {
      throw new Error('Unsupported MIME type for image mode (allowed: image/*, application/dicom)');
    }
    if (!imageBase64) {
      throw new Error('imageBase64 is required for image mode');
    }
    const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      throw new Error('Image too large (max ~12 MB)');
    }
    form.append('files', base64ToBlob(imageBase64, mimeType), fn);
    return form;
  }

  const text = typeof body.text === 'string' ? body.text : '';
  if (!text.trim()) {
    throw new Error('text is required for text mode');
  }
  const clipped = text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;
  const fn =
    typeof body.filename === 'string' && body.filename.trim()
      ? body.filename.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 200) || 'document.txt'
      : 'document.txt';
  const safeName = fn.toLowerCase().endsWith('.txt') ? fn : `${fn}.txt`;
  form.append(
    'files',
    new Blob([clipped], { type: 'text/plain;charset=utf-8' }),
    safeName
  );
  return form;
}
