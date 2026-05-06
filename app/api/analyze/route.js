import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieName, verifySession } from '../../../src/lib/auth-session-node';
import { GEMINI_JSON_INSTRUCTIONS } from '../../../src/lib/geminiPrompt';
import { normalizeGeminiAnalysis } from '../../../src/lib/geminiNormalize';

const MAX_TEXT_CHARS = 120_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

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

  const mode = body.mode === 'image' ? 'image' : 'text';
  const filename = typeof body.filename === 'string' ? body.filename : '';

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  /** @type {{ role?: string, parts: object[] }[]} */
  const contents = [];
  const parts = [];

  if (mode === 'image') {
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/png';
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
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

  if (mode === 'image') {
    const cand0 = raw?.candidates?.[0];
    console.log('[Gemini image] upstream HTTP', upstream.status, {
      finishReason: cand0?.finishReason,
      modelVersion: raw?.modelVersion,
      promptFeedback: raw?.promptFeedback,
    });
    const rawPreview = JSON.stringify(raw, null, 2);
    console.log(
      '[Gemini image] raw API JSON (truncated)',
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

  if (mode === 'image') {
    console.log('[Gemini image] model text length', textPart.length);
    console.log('[Gemini image] model text preview', textPart.slice(0, 2500));
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJsonFromModelText(textPart));
  } catch (e) {
    console.error('Gemini JSON parse failed', e, textPart.slice(0, 500));
    return NextResponse.json({ error: 'Model returned invalid JSON' }, { status: 502 });
  }

  if (mode === 'image') {
    console.log('[Gemini image] parsed JSON (object)', parsed);
  }

  const analysis = normalizeGeminiAnalysis(parsed);
  if (!analysis) {
    return NextResponse.json({ error: 'Could not normalise analysis' }, { status: 502 });
  }

  if (mode === 'image') {
    console.log('[Gemini image] normalized analysis returned to client', analysis);
  }

  return NextResponse.json({ analysis });
}
