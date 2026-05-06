const DOC_TYPES = new Set([
  'Lab Report',
  'Prescription',
  'Discharge Summary',
  'Imaging Report',
  'Referral Letter',
  'Consent Form',
  'Other',
]);

function asStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function normalizeLabRow(row) {
  if (!row || typeof row !== 'object') return null;
  const test = String(row.test || '').trim();
  const value = String(row.value || '').trim();
  if (!test || !value) return null;
  const unit = String(row.unit || '').trim();
  const refRange = String(row.refRange || row.ref || '').trim();
  let flag = String(row.flag || '').toUpperCase().trim();
  if (!['HIGH', 'LOW', 'NORMAL', ''].includes(flag)) flag = '';
  return { test, value, unit, refRange, flag };
}

function normalizeAiInsights(ins) {
  if (!ins || typeof ins !== 'object') return null;
  const executiveSummary = typeof ins.executiveSummary === 'string' && ins.executiveSummary.trim()
    ? ins.executiveSummary.trim()
    : null;
  const insights = asStringArray(ins.insights);
  const limitations = asStringArray(ins.limitations);
  const careCoordinationNotes = asStringArray(ins.careCoordinationNotes);
  if (!executiveSummary && !insights.length && !limitations.length && !careCoordinationNotes.length) {
    return null;
  }
  return {
    executiveSummary,
    insights,
    limitations,
    careCoordinationNotes,
  };
}

function normalizeImageAnalysis(ia) {
  if (!ia || typeof ia !== 'object') return null;
  const findings = asStringArray(ia.findings);
  const impression = asStringArray(ia.impression);
  if (!findings.length && !impression.length && !ia.modality && !ia.examTitle) return null;

  return {
    modality: String(ia.modality || 'Imaging').trim() || 'Imaging',
    examTitle: String(ia.examTitle || 'Imaging study').trim(),
    indication: String(ia.indication || 'Not stated').trim(),
    technique: String(ia.technique || 'Not stated').trim(),
    findings: findings.length ? findings : ['No discrete findings enumerated.'],
    impression: impression.length ? impression : ['See findings; clinical correlation recommended.'],
    reportDate: String(ia.reportDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })),
    accessionNumber: String(ia.accessionNumber || 'N/A').trim(),
    radiologist: String(ia.radiologist || 'Not stated').trim(),
    referringPhysician: String(ia.referringPhysician || 'Not stated').trim(),
    isImageAnalysis: true,
    isStatic: false,
    geminiGenerated: true,
  };
}

/**
 * @param {unknown} raw
 * @returns {object|null} analysis object for MedDocs state
 */
export function normalizeGeminiAnalysis(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const c = raw.classification && typeof raw.classification === 'object' ? raw.classification : {};
  let type = String(c.type || 'Other').trim();
  if (!DOC_TYPES.has(type)) type = 'Other';
  const conf = typeof c.confidence === 'number' && !Number.isNaN(c.confidence)
    ? Math.min(1, Math.max(0, c.confidence))
    : 0.75;

  const entitiesIn = raw.entities && typeof raw.entities === 'object' ? raw.entities : {};
  const entities = {
    persons: asStringArray(entitiesIn.persons),
    dates: asStringArray(entitiesIn.dates),
    organizations: asStringArray(entitiesIn.organizations),
    medications: asStringArray(entitiesIn.medications),
  };

  const metrics = {};
  if (raw.metrics && typeof raw.metrics === 'object') {
    for (const [k, v] of Object.entries(raw.metrics)) {
      if (typeof v === 'string' && v.trim()) metrics[String(k).trim()] = v.trim();
      else if (v != null && typeof v !== 'object') metrics[String(k).trim()] = String(v).trim();
    }
  }

  let labValues = [];
  if (Array.isArray(raw.labValues)) {
    labValues = raw.labValues.map(normalizeLabRow).filter(Boolean);
  }

  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';
  const patientName = raw.patientName != null && String(raw.patientName).trim()
    ? String(raw.patientName).trim()
    : null;

  const imageAnalysis = normalizeImageAnalysis(raw.imageAnalysis);
  const aiInsights = normalizeAiInsights(raw.aiInsights);

  return {
    classification: { type, confidence: conf },
    summary: summary || 'No summary returned.',
    patientName,
    entities,
    metrics,
    labValues,
    ...(imageAnalysis ? { imageAnalysis } : {}),
    ...(aiInsights ? { aiInsights } : {}),
    aiEnhanced: true,
    geminiGenerated: true,
  };
}
