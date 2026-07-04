import { parseIntentWithGroq } from '../../../../lib/server/assistant/parseIntent'

const REQUESTS_PER_MINUTE = 30
const buckets = new Map()

function isRateLimited (ip) {
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now > bucket.reset) {
    buckets.set(ip, { count: 1, reset: now + 60_000 })
    return false
  }

  if (bucket.count >= REQUESTS_PER_MINUTE) return true
  bucket.count += 1
  return false
}

export async function POST (req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return Response.json(
      { error: 'Too many requests — please slow down.' },
      { status: 429 },
    )
  }

  let text
  let currentPath
  try {
    const body = await req.json()
    if (!body?.text || typeof body.text !== 'string' || !body.text.trim()) {
      return Response.json({ error: 'text is required' }, { status: 400 })
    }
    text = body.text.trim().slice(0, 500)
    if (typeof body.currentPath === 'string' && body.currentPath.trim()) {
      currentPath = body.currentPath.trim().slice(0, 200)
    }
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const result = await parseIntentWithGroq(text, currentPath)
    return Response.json(result)
  } catch (err) {
    console.error('[api/assistant/parse]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
