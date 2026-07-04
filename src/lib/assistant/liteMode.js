const STORAGE_KEY = 'meddocs-assistant-lite-mode'

export function readLiteModePreference () {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeLiteModePreference (enabled) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    /* ignore quota errors */
  }
}
