export const UPLOAD_PHASES = {
  IDLE: 'idle',
  CLASSIFY: 'classify',
  CONFIRM: 'confirm',
  ANALYSING: 'analysing',
  COMPLETE: 'complete',
  ERROR: 'error',
}

export function createUploadWorkflowState (overrides = {}) {
  return {
    phase: UPLOAD_PHASES.IDLE,
    files: [],
    classification: null,
    docId: null,
    error: null,
    ...overrides,
  }
}

export function isUploadWorkflowActive (workflow) {
  if (!workflow) return false
  return workflow.phase !== UPLOAD_PHASES.IDLE
    && workflow.phase !== UPLOAD_PHASES.COMPLETE
    && workflow.phase !== UPLOAD_PHASES.ERROR
}

export function isUploadConfirmPhase (workflow) {
  return workflow?.phase === UPLOAD_PHASES.CONFIRM
}

export function formatClassificationLabel (classification) {
  if (!classification?.type) return 'clinical document'
  return classification.type
}

export function buildConfirmMessage (classification, fileName) {
  const label = formatClassificationLabel(classification)
  const name = fileName || 'this file'
  return `Analyze **${label}** (${name})? Reply **yes** to start or **no** to cancel.`
}

export function buildCompleteMessage (doc) {
  const type = doc?.analysis?.classification?.type || 'Document'
  const patient = doc?.analysis?.patientName
  const lines = [
    `Analysis complete — **${type}**`,
    patient ? `Patient: **${patient}**` : null,
    'Opening report detail…',
  ].filter(Boolean)
  return lines.join('\n')
}
