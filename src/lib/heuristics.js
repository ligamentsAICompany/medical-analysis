import { parseLabValues } from './labParser';

const DOC_TYPES = [
  { type: 'Lab Report', keywords: ['laboratory', 'lab report', 'test result', 'reference range', 'specimen', 'cbc', 'hba1c', 'glucose', 'hemoglobin', 'platelet', 'wbc', 'rbc', 'cholesterol', 'triglyceride', 'creatinine', 'sodium', 'potassium', 'metabolic panel', 'blood count'] },
  { type: 'Prescription', keywords: ['prescription', 'prescribe', 'prescribed', 'rx:', 'tablet', 'capsule', 'mg daily', 'mg twice', 'mg three times', 'take 1', 'pharmacy', 'prescribing physician', 'refill', 'sig:'] },
  { type: 'Discharge Summary', keywords: ['discharge summary', 'discharge date', 'admission date', 'chief complaint', 'hospital course', 'discharge instructions', 'discharge medications', 'admitted via', 'inpatient'] },
  { type: 'Imaging Report', keywords: ['mri', 'ct scan', 'x-ray', 'ultrasound', 'imaging', 'radiolog', 'impression:', 'findings:', 'scan date', 'dicom', 'contrast', 'parenchymal', 'ischaemia', 'radiologist'] },
  { type: 'Referral Letter', keywords: ['referral', 'dear dr', 'i would be grateful', 'kindly review', 'kindly see', 'please see', 'refer', 'specialist', 'kind regards', 're:', 'from:'] },
  { type: 'Consent Form', keywords: ['consent', 'authorize', 'authorise', 'acknowledge', 'i agree', 'i understand', 'signature', 'procedure', 'risk', 'informed consent', 'patient consent'] },
];

export function classifyDocument(text) {
  const lower = text.toLowerCase();
  const scores = DOC_TYPES.map(({ type, keywords }) => ({
    type,
    hits: keywords.filter(kw => lower.includes(kw)).length,
    total: keywords.length,
  }));
  scores.sort((a, b) => b.hits - a.hits);
  const top = scores[0];
  if (top.hits === 0) return { type: 'Other', confidence: 0.3 };
  return {
    type: top.type,
    confidence: Math.min(0.97, 0.45 + (top.hits / top.total) * 1.5),
  };
}

const NAME_PATTERNS = [
  /patient(?:\s+name)?[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
  /(?:re|patient):?\s+(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
  /(?:Mr|Mrs|Ms|Miss)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
];

const DATE_PATTERNS = [
  /\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g,
  /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
];

const MEDICATIONS = [
  'amoxicillin', 'ibuprofen', 'paracetamol', 'acetaminophen', 'metformin',
  'lisinopril', 'atorvastatin', 'omeprazole', 'aspirin', 'warfarin',
  'insulin', 'prednisone', 'amlodipine', 'sertraline', 'levothyroxine',
  'metoprolol', 'ramipril', 'simvastatin', 'furosemide', 'clopidogrel',
];

export function extractEntities(text) {
  const entities = { persons: [], dates: [], organizations: [], medications: [] };

  for (const pattern of NAME_PATTERNS) {
    for (const m of [...text.matchAll(pattern)]) {
      const name = m[1]?.trim();
      if (name && name.length > 3 && !entities.persons.includes(name)) {
        entities.persons.push(name);
      }
    }
  }

  for (const pattern of DATE_PATTERNS) {
    for (const m of [...text.matchAll(pattern)]) {
      const date = m[0]?.trim();
      if (date && !entities.dates.includes(date)) entities.dates.push(date);
    }
  }

  const lower = text.toLowerCase();
  for (const med of MEDICATIONS) {
    if (lower.includes(med)) {
      const label = med.charAt(0).toUpperCase() + med.slice(1);
      if (!entities.medications.includes(label)) entities.medications.push(label);
    }
  }

  for (const m of [...text.matchAll(/([A-Z][A-Za-z\s]+(?:Hospital|Clinic|Medical Centre|Medical Center|Health|Pharmacy|Practice|Institute)[A-Za-z\s]*)/g)]) {
    const org = m[1]?.trim();
    if (org && org.length < 60 && !entities.organizations.includes(org)) {
      entities.organizations.push(org);
    }
  }

  return entities;
}

export function extractKeyMetrics(text) {
  const metrics = {};
  const patterns = {
    'Patient ID': /patient\s+(?:id|number|no)\.?[:]\s*([A-Z0-9-]+)/i,
    'Date of Birth': /(?:date of birth|dob|d\.o\.b)\.?[:]\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}\s+\w+\s+\d{4})/i,
    'Attending Physician': /(?:attending|prescribing physician|reporting radiologist|from)[:]\s*(?:Dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,
    'Primary Diagnosis': /(?:diagnosis|impression|chief complaint|indication)[:]\s*([^\n.]{5,100})/i,
    'Next Appointment': /(?:next appointment|follow.?up|review date)[:]\s*([^\n]{5,80})/i,
  };
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) metrics[key] = match[1].trim().replace(/\s+/g, ' ');
  }
  return metrics;
}

export function generateSummary(text) {
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 300 && !/^(date|patient id|rx:|sig:)/i.test(s));
  return sentences.slice(0, 3).join(' ') || text.slice(0, 250) + '…';
}

export function analyzeDocument(text) {
  const classification = classifyDocument(text);
  const entities = extractEntities(text);
  const metrics = extractKeyMetrics(text);
  const summary = generateSummary(text);
  const patientName = entities.persons[0] || null;

  const labValues = parseLabValues(text);

  return { classification, entities, metrics, summary, patientName, labValues };
}
