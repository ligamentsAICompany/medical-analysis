import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieName, verifySession } from '../../../lib/auth-session-node';
import { GEMINI_JSON_INSTRUCTIONS } from '../../../lib/geminiPrompt';
import { normalizeGeminiAnalysis } from '../../../lib/geminiNormalize';
import { isAllowedGeminiVisionMime } from '../../../lib/medicalFileTypes';

const MAX_TEXT_CHARS = 120_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_MULTI_IMAGES = 8;
/** Total decoded payload budget for multi-image (sum of all images). */
const MAX_MULTI_TOTAL_BYTES = 36 * 1024 * 1024;

function extractJsonFromModelText(text) {
  if (!text || typeof text !== 'string') return null;
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  }
  return t.trim();
}

export async function POST(request) {
  const jar = await cookies();
  const session = verifySession(jar.get(getCookieName())?.value);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const mode =
    body.mode === 'docAndImages'
      ? 'docAndImages'
      : body.mode === 'multiImage'
        ? 'multiImage'
        : body.mode === 'image'
          ? 'image'
          : 'text';
  const filename = typeof body.filename === 'string' ? body.filename : '';

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  /** @type {{ role?: string, parts: object[] }[]} */
  const contents = [];
  const parts = [];

  if (mode === 'multiImage') {
    const images = Array.isArray(body.images) ? body.images : [];
    if (images.length < 2) {
      return NextResponse.json(
        { error: 'multiImage mode requires at least 2 images in the "images" array' },
        { status: 400 }
      );
    }
    if (images.length > MAX_MULTI_IMAGES) {
      return NextResponse.json(
        { error: `Too many images (max ${MAX_MULTI_IMAGES} per request)` },
        { status: 413 }
      );
    }
    let totalApprox = 0;
    const names = [];
    for (let i = 0; i < images.length; i += 1) {
      const img = images[i];
      const mimeType = typeof img?.mimeType === 'string' ? img.mimeType : 'image/png';
      const imageBase64 = typeof img?.imageBase64 === 'string' ? img.imageBase64 : '';
      const fn = typeof img?.filename === 'string' ? img.filename : `image-${i + 1}`;
      names.push(fn);
      if (!isAllowedGeminiVisionMime(mimeType)) {
        return NextResponse.json(
          { error: `images[${i}] (${fn}): unsupported MIME type for vision analysis` },
          { status: 400 }
        );
      }
      if (!imageBase64) {
        return NextResponse.json(
          { error: `images[${i}].imageBase64 is required` },
          { status: 400 }
        );
      }
      const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `Image ${i + 1} (${fn}) exceeds ~12 MB` },
          { status: 413 }
        );
      }
      totalApprox += approxBytes;
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBase64,
        },
      });
    }
    if (totalApprox > MAX_MULTI_TOTAL_BYTES) {
      return NextResponse.json(
        { error: 'Combined images exceed size limit — upload fewer or smaller files' },
        { status: 413 }
      );
    }
    const nameList = names.join('; ');
    parts.push({
      text:
        `${GEMINI_JSON_INSTRUCTIONS}\n\nYou are given ${images.length} medical images in order (filenames for context only: ${nameList}). ` +
        'They are intended as one patient / one encounter or one imaging series. Produce ONE unified JSON object: synthesize imageAnalysis and aiInsights across all images. ' +
        'Return the JSON object described in the instructions above.',
    });
  } else if (mode === 'docAndImages') {
    const images = Array.isArray(body.images) ? body.images : [];
    const docText = typeof body.text === 'string' ? body.text : '';
    const textFilename = typeof body.textFilename === 'string' ? body.textFilename : 'documents';
    if (images.length < 1) {
      return NextResponse.json(
        { error: 'docAndImages mode requires at least one entry in "images"' },
        { status: 400 }
      );
    }
    if (images.length > MAX_MULTI_IMAGES) {
      return NextResponse.json(
        { error: `Too many images (max ${MAX_MULTI_IMAGES} per request)` },
        { status: 413 }
      );
    }
    const clippedDoc =
      docText.length > MAX_TEXT_CHARS ? docText.slice(0, MAX_TEXT_CHARS) : docText;
    if (!clippedDoc.trim()) {
      return NextResponse.json(
        { error: 'text is required for docAndImages (extracted document body was empty)' },
        { status: 400 }
      );
    }
    let totalApprox = 0;
    const names = [];
    for (let i = 0; i < images.length; i += 1) {
      const img = images[i];
      const mimeType = typeof img?.mimeType === 'string' ? img.mimeType : 'image/png';
      const imageBase64 = typeof img?.imageBase64 === 'string' ? img.imageBase64 : '';
      const fn = typeof img?.filename === 'string' ? img.filename : `image-${i + 1}`;
      names.push(fn);
      if (!isAllowedGeminiVisionMime(mimeType)) {
        return NextResponse.json(
          { error: `images[${i}] (${fn}): unsupported MIME type for vision analysis` },
          { status: 400 }
        );
      }
      if (!imageBase64) {
        return NextResponse.json(
          { error: `images[${i}].imageBase64 is required` },
          { status: 400 }
        );
      }
      const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `Image ${i + 1} (${fn}) exceeds ~12 MB` },
          { status: 413 }
        );
      }
      totalApprox += approxBytes;
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBase64,
        },
      });
    }
    if (totalApprox > MAX_MULTI_TOTAL_BYTES) {
      return NextResponse.json(
        { error: 'Combined images exceed size limit — upload fewer or smaller files' },
        { status: 413 }
      );
    }
    const nameList = names.join('; ');
    parts.push({
      text:
        `${GEMINI_JSON_INSTRUCTIONS}\n\nYou are given ${images.length} imaging attachment(s) (filenames for context only: ${nameList}) AND clinical document text from: ${textFilename}. ` +
        'They refer to ONE patient / one encounter. Cross-reference the narrative or structured data in the document with what is visible in the imaging. ' +
        'Produce ONE unified JSON object: synthesize classification, summary, entities, metrics, labValues (from document text where applicable), imageAnalysis (from imaging and any imaging-related text), and aiInsights across ALL material. ' +
        'If the document and imaging appear unrelated, say so in limitations and still complete each section conservatively.\n\n' +
        '--- DOCUMENT TEXT (extracted) ---\n' +
        clippedDoc,
    });
  } else if (mode === 'image') {
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/png';
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
    if (!isAllowedGeminiVisionMime(mimeType)) {
      return NextResponse.json(
        { error: 'Unsupported MIME type for image mode (allowed: image/*, application/dicom)' },
        { status: 400 }
      );
    }
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required for image mode' }, { status: 400 });
    }
    const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max ~12 MB)' }, { status: 413 });
    }
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: imageBase64,
      },
    });
    parts.push({
      text:
        `${GEMINI_JSON_INSTRUCTIONS}\n\nFilename (hint only): ${filename || 'unknown'}\n\nAnalyse this medical image and return the JSON object described above.`,
    });
  } else {
    const text = typeof body.text === 'string' ? body.text : '';
    if (!text.trim()) {
      return NextResponse.json({ error: 'text is required for text mode' }, { status: 400 });
    }
    const clipped = text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;
    parts.push({
      text:
        `${GEMINI_JSON_INSTRUCTIONS}\n\nFilename (hint only): ${filename || 'unknown'}\n\n--- DOCUMENT TEXT ---\n${clipped}`,
    });
  }

  contents.push({ role: 'user', parts });

  let upstream;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err) {
    console.error('Gemini request failed', err);
    return NextResponse.json({ error: 'Could not reach Gemini API' }, { status: 502 });
  }

  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const msg = raw?.error?.message || raw?.error || `Gemini error (${upstream.status})`;
    console.error('Gemini API error', upstream.status, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (mode === 'image' || mode === 'multiImage' || mode === 'docAndImages') {
    const cand0 = raw?.candidates?.[0];
    console.log(`[Gemini ${mode}] upstream HTTP`, upstream.status, {
      finishReason: cand0?.finishReason,
      modelVersion: raw?.modelVersion,
      promptFeedback: raw?.promptFeedback,
    });
    const rawPreview = JSON.stringify(raw, null, 2);
    console.log(
      `[Gemini ${mode}] raw API JSON (truncated)`,
      rawPreview.length > 14000 ? `${rawPreview.slice(0, 14000)}\n… [truncated ${rawPreview.length} chars]` : rawPreview
    );
  }

  const textPart =
    raw?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') || '';

  if (!textPart) {
    const reason = raw?.candidates?.[0]?.finishReason || 'empty';
    return NextResponse.json(
      { error: `No model output (finish: ${reason})` },
      { status: 502 }
    );
  }

  if (mode === 'image' || mode === 'multiImage' || mode === 'docAndImages') {
    console.log(`[Gemini ${mode}] model text length`, textPart.length);
    console.log(`[Gemini ${mode}] model text preview`, textPart.slice(0, 2500));
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJsonFromModelText(textPart));
  } catch (e) {
    console.error('Gemini JSON parse failed', e, textPart.slice(0, 500));
    return NextResponse.json({ error: 'Model returned invalid JSON' }, { status: 502 });
  }

  if (mode === 'image' || mode === 'multiImage' || mode === 'docAndImages') {
    console.log(`[Gemini ${mode}] parsed JSON (object)`, parsed);
  }

  const analysis = normalizeGeminiAnalysis(parsed);
  if (!analysis) {
    return NextResponse.json({ error: 'Could not normalise analysis' }, { status: 502 });
  }

  if (mode === 'image' || mode === 'multiImage' || mode === 'docAndImages') {
    console.log(`[Gemini ${mode}] normalized analysis returned to client`, analysis);
  }

  return NextResponse.json({ analysis });
}
