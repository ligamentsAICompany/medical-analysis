export const MODULE_ROUTES = {
  dashboard: { list: '/dashboard' },
  analysis: { list: '/analysis', add: '/analysis' },
  reports: { list: '/analysis', detail: '/analysis/:id' },
  users: { list: '/users' },
}

export const MODULE_KEYWORDS = {
  dashboard: ['dashboard', 'overview', 'home', 'stats', 'kpi', 'summary'],
  analysis: ['analysis', 'analyze', 'upload', 'clinical', 'workspace'],
  reports: ['report', 'reports', 'document', 'documents', 'file', 'files', 'study', 'studies'],
  users: ['user', 'users', 'member', 'members', 'account', 'accounts'],
}

export const DOC_TYPE_KEYWORDS = {
  'Lab Report': ['lab', 'cbc', 'blood', 'metabolic', 'specimen', 'laboratory'],
  'Imaging Report': ['x-ray', 'xray', 'ct', 'mri', 'ultrasound', 'imaging', 'scan', 'dicom', 'radiology'],
  'Prescription': ['prescription', 'rx', 'medication', 'pharmacy'],
  'Discharge Summary': ['discharge', 'admission', 'hospital'],
  'Referral Letter': ['referral', 'refer'],
  'Consent Form': ['consent'],
  'Imaging study': ['imaging study', 'image study', 'vision'],
}

export const INTENT_KEYWORDS = {
  navigate: [
    'go to', 'open', 'show me', 'take me to', 'navigate', 'switch to', 'view page',
  ],
  search: ['find', 'search', 'look for', 'lookup', 'look up', 'filter', 'list'],
  count: ['how many', 'count', 'number of', 'total'],
  open: ['open report', 'open latest', 'open document', 'view report'],
  delete: ['delete', 'remove', 'drop'],
  create: ['add', 'create', 'new', 'upload'],
  help: ['help', 'what can you', 'commands'],
}

export const QUICK_COMMANDS = [
  'Go to dashboard',
  'Open analysis',
]

export const ADMIN_QUICK_COMMANDS = [
  'Show users',
  'Add user',
]

export const ASSISTANT_PARSER_LABELS = {
  keyword: 'Keyword',
  transformers: 'Transformers',
  groq: 'Groq',
}

export function getModuleLabel (module) {
  const labels = {
    dashboard: 'Dashboard',
    analysis: 'Analysis',
    reports: 'Reports',
    users: 'Users',
  }
  return labels[module] || module
}

export function resolveReportDetailPath (docId) {
  if (!docId) return '/analysis'
  return `/analysis/${encodeURIComponent(docId)}`
}
