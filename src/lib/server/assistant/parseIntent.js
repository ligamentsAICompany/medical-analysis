import { parseCommand } from '../../assistant/intentParser'

const VALID_INTENTS = new Set([
  'navigate', 'search', 'lookup', 'count', 'open', 'delete', 'create', 'help', 'unknown',
])

const VALID_MODULES = new Set(['dashboard', 'analysis', 'reports', 'users'])

export const MEDDOCS_PARSE_PROMPT = `You parse short MedDocs clinical workspace commands into JSON.

MedDocs modules:
- dashboard: KPI overview
- analysis: upload and workspace
- reports: documents, lab reports, imaging studies (list lives on /analysis)
- users: admin user management

Return ONLY valid JSON:
{
  "intent": "navigate|search|lookup|count|open|delete|create|help|unknown",
  "module": "dashboard|analysis|reports|users|null",
  "searchQuery": "string or null",
  "formData": { "name": "", "email": "", "role": "USER|ADMIN" } or null,
  "confidence": 0.0-1.0
}

Examples:
- "show lab reports for Sarah" -> search, reports, searchQuery "Sarah lab"
- "how many imaging studies" -> count, reports, searchQuery "imaging"
- "add user john@meddocs.app as admin" -> create, users, formData { email, role ADMIN }
- "delete report for John" -> delete, reports, searchQuery "John"
- "go to dashboard" -> navigate, dashboard`

function extractJson (raw) {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function keywordFallback (text) {
  const parsed = parseCommand(text)
  return {
    intent: parsed.intent,
    module: parsed.module,
    searchQuery: parsed.raw,
    formData: null,
    confidence: parsed.confidence,
    provider: 'keyword',
  }
}

/**
 * @param {string} text
 * @param {string} [currentPath]
 */
export async function parseIntentWithGroq (text, currentPath) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return keywordFallback(text)
  }

  const userContent = currentPath
    ? `Current page: ${currentPath}\nCommand: ${text}`
    : text

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 300,
        messages: [
          { role: 'system', content: MEDDOCS_PARSE_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
    })

    if (!res.ok) {
      return keywordFallback(text)
    }

    const payload = await res.json()
    const raw = payload?.choices?.[0]?.message?.content ?? ''
    const json = extractJson(raw)
    if (!json) return keywordFallback(text)

    const intent = VALID_INTENTS.has(String(json.intent)) ? String(json.intent) : 'unknown'
    const module = json.module && VALID_MODULES.has(String(json.module)) ? String(json.module) : null

    return {
      intent,
      module,
      searchQuery: typeof json.searchQuery === 'string' ? json.searchQuery : null,
      formData: json.formData && typeof json.formData === 'object' ? json.formData : null,
      confidence: typeof json.confidence === 'number' ? json.confidence : 0.7,
      provider: 'groq',
    }
  } catch {
    return keywordFallback(text)
  }
}
