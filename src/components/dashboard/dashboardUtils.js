const CHART_COLORS = {
  up: '#1a8060',
  down: '#e05252',
  neutral: '#8b9cb6',
  ramp: ['#3d4f63', '#5a6b7d', '#72839a', '#8b9cb6', '#a8b5c7', '#c5cfdb'],
}

const DAY_MS = 24 * 60 * 60 * 1000

export function getChartColors () {
  return CHART_COLORS
}

export function buildUploadTrend (documents, days = 14) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets = Array.from({ length: days }, (_, i) => {
    const date = new Date(today.getTime() - (days - 1 - i) * DAY_MS)
    const key = date.toISOString().slice(0, 10)
    return {
      key,
      label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count: 0,
    }
  })

  const bucketMap = Object.fromEntries(buckets.map((b) => [b.key, b]))

  for (const doc of documents) {
    if (!doc.uploadedAt) continue
    const key = new Date(doc.uploadedAt).toISOString().slice(0, 10)
    if (bucketMap[key]) bucketMap[key].count += 1
  }

  return buckets
}

export function buildStatusBreakdown (documents) {
  const counts = { ready: 0, analysing: 0, uploading: 0, error: 0 }
  for (const doc of documents) {
    const status = counts[doc.status] != null ? doc.status : 'error'
    counts[status] += 1
  }

  return [
    { name: 'Ready', value: counts.ready, fill: CHART_COLORS.up },
    { name: 'Analysing', value: counts.analysing, fill: '#c98a1a' },
    { name: 'Uploading', value: counts.uploading, fill: CHART_COLORS.neutral },
    { name: 'Error', value: counts.error, fill: CHART_COLORS.down },
  ].filter((item) => item.value > 0)
}

export function buildTypeBreakdown (documents) {
  const counts = new Map()

  for (const doc of documents) {
    const type = doc.analysis?.imageAnalysis
      ? 'Imaging study'
      : doc.analysis?.classification?.type || 'Pending'
    counts.set(type, (counts.get(type) || 0) + 1)
  }

  return [...counts.entries()]
    .map(([name, value], index) => ({
      name,
      value,
      fill: CHART_COLORS.ramp[index % CHART_COLORS.ramp.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

export function formatRelativeTime (iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getDocTypeLabel (doc) {
  if (doc.analysis?.imageAnalysis) return 'Imaging study'
  return doc.analysis?.classification?.type || 'Document'
}
