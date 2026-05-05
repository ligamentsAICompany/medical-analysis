// Node.js script — run with: node scripts/generate-samples.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../public/samples');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function header(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 80).fill('#1e3a8a');
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text(title, 40, 22);
  doc.fontSize(11).font('Helvetica').text(subtitle, 40, 48);
  doc.fillColor('#1e293b');
  doc.moveDown(4);
}

function sectionTitle(doc, text) {
  doc.moveDown(0.5);
  doc.rect(40, doc.y, doc.page.width - 80, 20).fill('#dbeafe');
  doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text(text, 44, doc.y + 4);
  doc.fillColor('#1e293b');
  doc.moveDown(1.4);
}

function row(doc, label, value, unit, refRange, flag) {
  const y = doc.y;
  const flagColor = flag === 'HIGH' ? '#dc2626' : flag === 'LOW' ? '#b45309' : '#15803d';
  doc.font('Helvetica').fontSize(9).fillColor('#334155').text(label, 44, y, { width: 180 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(flag ? flagColor : '#1e293b').text(value, 224, y, { width: 70 });
  doc.font('Helvetica').fontSize(9).fillColor('#475569').text(unit || '', 294, y, { width: 70 });
  doc.fillColor('#475569').text(refRange || '', 364, y, { width: 110 });
  if (flag) {
    doc.font('Helvetica-Bold').fillColor(flagColor).text(flag, 474, y, { width: 50 });
  }
  doc.font('Helvetica').fillColor('#1e293b');
  doc.moveDown(0.9);
}

function tableHead(doc) {
  const y = doc.y;
  doc.rect(40, y, doc.page.width - 80, 16).fill('#f1f5f9');
  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');
  doc.text('TEST', 44, y + 3, { width: 180 });
  doc.text('RESULT', 224, y + 3, { width: 70 });
  doc.text('UNIT', 294, y + 3, { width: 70 });
  doc.text('REFERENCE RANGE', 364, y + 3, { width: 110 });
  doc.text('FLAG', 474, y + 3, { width: 50 });
  doc.fillColor('#1e293b').font('Helvetica');
  doc.moveDown(1.5);
}

function patientInfo(doc, fields) {
  doc.moveDown(0.5);
  const cols = Math.ceil(fields.length / 2);
  fields.forEach((f, i) => {
    const x = (i % 2 === 0) ? 44 : 310;
    const y = doc.page.margins.top + 90 + Math.floor(i / 2) * 18;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text(f[0].toUpperCase() + ':', x, y, { continued: true, width: 110 });
    doc.font('Helvetica').fillColor('#1e293b').text('  ' + f[1]);
  });
  doc.moveDown(fields.length / 2 + 0.5);
}

function divider(doc) {
  doc.moveDown(0.3);
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.5);
}

function paragraph(doc, text, indent = 44) {
  doc.font('Helvetica').fontSize(9.5).fillColor('#334155').text(text, indent, doc.y, { width: doc.page.width - indent - 40, lineGap: 3 });
  doc.moveDown(0.5);
}

function labelValue(doc, label, value, indent = 44) {
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#475569')
    .text(label + ': ', indent, doc.y, { continued: true, width: 150 });
  doc.font('Helvetica').fillColor('#1e293b').text(value, { width: doc.page.width - indent - 40 - 150 });
  doc.moveDown(0.3);
}

function footer(doc, name, designation) {
  const y = doc.page.height - 80;
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
  doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
    .text(`Reported by: ${name}  |  ${designation}`, 44, y + 10)
    .text('This report is generated for medical purposes only. Please correlate clinically.', 44, y + 22)
    .text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 44, y + 34);
}

// ─── 1. BLOOD REPORT ──────────────────────────────────────────────────────────
function generateBloodReport() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(path.join(OUT, 'blood_report_cbc_metabolic.pdf'));
  doc.pipe(stream);

  header(doc, 'PATHOLOGY LABORATORY REPORT', 'St. Bartholomew Medical Centre — Lab Division');

  patientInfo(doc, [
    ['Patient Name', 'John Patterson'],
    ['Patient ID', 'PT-2026-07841'],
    ['Date of Birth', '12/04/1979  (Age: 47 years)'],
    ['Gender', 'Male'],
    ['Referred By', 'Dr. Samantha Reed'],
    ['Collection Date', '01 May 2026'],
    ['Report Date', '01 May 2026'],
    ['Specimen', 'Venous Blood (EDTA + SST)'],
  ]);

  divider(doc);

  // CBC
  sectionTitle(doc, 'COMPLETE BLOOD COUNT (CBC)');
  tableHead(doc);
  row(doc, 'Hemoglobin (Hb)', '18.4',  'g/dL',       '13.5 – 17.5',    'HIGH');
  row(doc, 'Red Blood Cells (RBC)', '6.1', '×10⁶/μL',  '4.5 – 5.9',      'HIGH');
  row(doc, 'White Blood Cells (WBC)', '11.9', '×10³/μL', '4.5 – 11.0',   'HIGH');
  row(doc, 'Neutrophils', '78',       '%',          '40 – 70',        'HIGH');
  row(doc, 'Lymphocytes', '14',       '%',          '20 – 40',        'LOW');
  row(doc, 'Monocytes', '6',          '%',          '2 – 10',         '');
  row(doc, 'Eosinophils', '2',        '%',          '1 – 6',          '');
  row(doc, 'Platelets', '138',        '×10³/μL',    '150 – 400',      'LOW');
  row(doc, 'Hematocrit (PCV)', '54',  '%',          '41 – 53',        'HIGH');
  row(doc, 'MCV', '88',              'fL',          '80 – 100',       '');
  row(doc, 'MCH', '30',              'pg',          '27 – 33',        '');
  row(doc, 'MCHC', '34',             'g/dL',        '31.5 – 36',      '');

  divider(doc);

  // Metabolic
  sectionTitle(doc, 'COMPREHENSIVE METABOLIC PANEL');
  tableHead(doc);
  row(doc, 'Glucose (Fasting)', '126',     'mg/dL',   '70 – 99',        'HIGH');
  row(doc, 'HbA1c', '7.2',                '%',       '< 5.7%',         'HIGH');
  row(doc, 'Creatinine', '1.4',           'mg/dL',   '0.7 – 1.3',      'HIGH');
  row(doc, 'Blood Urea Nitrogen (BUN)', '22', 'mg/dL','7 – 20',         'HIGH');
  row(doc, 'eGFR', '58',                 'mL/min/1.73m²', '> 60',      'LOW');
  row(doc, 'Sodium (Na⁺)', '139',         'mEq/L',   '136 – 145',      '');
  row(doc, 'Potassium (K⁺)', '3.3',       'mEq/L',   '3.5 – 5.1',      'LOW');
  row(doc, 'Chloride (Cl⁻)', '101',       'mEq/L',   '98 – 107',       '');
  row(doc, 'Bicarbonate (HCO₃⁻)', '24',  'mEq/L',   '22 – 29',        '');
  row(doc, 'ALT (SGPT)', '52',            'U/L',     '7 – 40',         'HIGH');
  row(doc, 'AST (SGOT)', '48',            'U/L',     '10 – 40',        'HIGH');
  row(doc, 'Total Bilirubin', '1.1',      'mg/dL',   '0.2 – 1.2',      '');
  row(doc, 'Albumin', '4.1',              'g/dL',    '3.5 – 5.0',      '');

  divider(doc);

  // Lipids
  sectionTitle(doc, 'LIPID PROFILE');
  tableHead(doc);
  row(doc, 'Total Cholesterol', '242',    'mg/dL',   '< 200',          'HIGH');
  row(doc, 'LDL Cholesterol', '162',      'mg/dL',   '< 130',          'HIGH');
  row(doc, 'HDL Cholesterol', '38',       'mg/dL',   '> 40',           'LOW');
  row(doc, 'Triglycerides', '208',        'mg/dL',   '< 150',          'HIGH');
  row(doc, 'VLDL Cholesterol', '42',      'mg/dL',   '< 30',           'HIGH');
  row(doc, 'LDL/HDL Ratio', '4.3',       '',        '< 3.5',          'HIGH');

  divider(doc);

  // Iron Studies
  sectionTitle(doc, 'IRON STUDIES');
  tableHead(doc);
  row(doc, 'Serum Iron', '180',          'μg/dL',   '60 – 170',       'HIGH');
  row(doc, 'Total Iron Binding Capacity', '290', 'μg/dL', '250 – 370', '');
  row(doc, 'Transferrin Saturation', '62', '%',    '20 – 50',         'HIGH');
  row(doc, 'Ferritin', '680',            'ng/mL',   '12 – 300',       'HIGH');

  divider(doc);

  // Comments
  sectionTitle(doc, 'CLINICAL COMMENTS');
  paragraph(doc,
    'Significant findings: Polycythemia (elevated Hb, RBC, Hematocrit) with leukocytosis and thrombocytopenia. ' +
    'Iron studies consistent with iron overload / possible Polycythemia Vera. Pre-diabetic state indicated by fasting glucose 126 mg/dL and HbA1c 7.2%. ' +
    'Dyslipidemia with elevated LDL, low HDL, elevated triglycerides — increased cardiovascular risk. ' +
    'Mildly impaired renal function (eGFR 58) and mildly elevated liver enzymes (ALT, AST). ' +
    'Recommend haematology referral, repeat TFTs, JAK2 mutation screen, and renal function follow-up in 4 weeks.'
  );

  footer(doc, 'Dr. Nadia Patel', 'MD Pathology, FRCPA');
  doc.end();
  stream.on('finish', () => console.log('✅  blood_report_cbc_metabolic.pdf'));
}

// ─── 2. CHEST X-RAY REPORT ────────────────────────────────────────────────────
function generateXRayReport() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(path.join(OUT, 'chest_xray_radiology_report.pdf'));
  doc.pipe(stream);

  header(doc, 'RADIOLOGY IMAGING REPORT', 'Royal General Hospital — Department of Radiology');

  patientInfo(doc, [
    ['Patient Name', 'Maria Santos'],
    ['Patient ID', 'PT-2026-06615'],
    ['Date of Birth', '08/11/1962  (Age: 63 years)'],
    ['Gender', 'Female'],
    ['Referring Physician', 'Dr. Kevin Okafor'],
    ['Examination Date', '30 April 2026'],
    ['Reported On', '30 April 2026'],
    ['Accession No.', 'RAD-2026-44821'],
  ]);

  divider(doc);

  sectionTitle(doc, 'EXAMINATION DETAILS');
  labelValue(doc, 'Modality', 'Plain Radiography (X-Ray)');
  labelValue(doc, 'Study', 'Chest — Posteroanterior (PA) and Left Lateral Views');
  labelValue(doc, 'Clinical Indication', 'Progressive dyspnoea, persistent cough × 6 weeks, bilateral ankle oedema. Known history of hypertension and ischaemic heart disease.');
  labelValue(doc, 'Comparison', 'Previous chest X-ray dated 14 January 2026');

  divider(doc);

  sectionTitle(doc, 'TECHNICAL QUALITY');
  paragraph(doc, 'Adequate inspiratory effort. Proper PA positioning confirmed. Good contrast and exposure. Both lung fields and costophrenic angles are visible. No significant rotation.');

  divider(doc);

  sectionTitle(doc, 'RADIOLOGICAL FINDINGS');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e40af').text('Heart and Mediastinum:', 44, doc.y);
  doc.moveDown(0.2);
  paragraph(doc,
    'Cardiothoracic ratio is 0.62, indicating cardiomegaly (increased from 0.57 on prior study). ' +
    'The cardiac silhouette is globular in contour, raising concern for pericardial effusion. ' +
    'Superior mediastinum is not widened. Aortic arch is mildly unfolded and calcified, consistent with atherosclerosis.');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e40af').text('Lung Fields:', 44, doc.y);
  doc.moveDown(0.2);
  paragraph(doc,
    'Bilateral perihilar haziness and vascular engorgement consistent with pulmonary venous hypertension. ' +
    'Kerley B lines visible at the right base, suggesting interstitial oedema. ' +
    'No focal consolidation, mass lesion, or cavitation identified. ' +
    'Ill-defined opacification in the bilateral lower zones, more pronounced on the right, in keeping with ' +
    'bilateral pleural effusions — right greater than left.');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e40af').text('Pleura:', 44, doc.y);
  doc.moveDown(0.2);
  paragraph(doc,
    'Bilateral pleural effusions — moderate on the right, small on the left. ' +
    'Both costophrenic angles are blunted. No evidence of pneumothorax.');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e40af').text('Bones and Soft Tissues:', 44, doc.y);
  doc.moveDown(0.2);
  paragraph(doc,
    'Thoracic cage is intact with no rib fractures or lytic lesions identified. ' +
    'Mild degenerative changes noted in the thoracic spine. ' +
    'Soft tissues are unremarkable. Old healed fracture noted at right 6th rib (chronic appearance).');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e40af').text('Diaphragm and Abdomen:', 44, doc.y);
  doc.moveDown(0.2);
  paragraph(doc, 'Both hemidiaphragms are mildly elevated. Gaseous distension of the stomach. No free subdiaphragmatic gas.');

  divider(doc);

  sectionTitle(doc, 'IMPRESSION / CONCLUSION');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#dc2626').text('PRIMARY FINDINGS:', 44, doc.y);
  doc.moveDown(0.3);

  const findings = [
    '1.  Cardiomegaly (CT ratio 0.62) — increased from prior study. Pericardial effusion cannot be excluded; echocardiography recommended.',
    '2.  Bilateral pleural effusions (right > left) with features of congestive cardiac failure.',
    '3.  Pulmonary venous hypertension with interstitial oedema (Kerley B lines, perihilar haziness).',
    '4.  Unfolded calcified aortic arch consistent with systemic hypertension and atherosclerosis.',
    '5.  Old healed right 6th rib fracture — incidental finding, no acute rib pathology.',
  ];
  findings.forEach(f => {
    paragraph(doc, f, 50);
  });

  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#334155').text('RECOMMENDATIONS:', 44, doc.y);
  doc.moveDown(0.3);
  paragraph(doc,
    'Urgent cardiology review. Transthoracic echocardiogram to assess LV function and rule out pericardial effusion. ' +
    'Consider BNP / NT-proBNP. Clinical correlation required. If no improvement with diuresis, CT chest with contrast may be warranted to exclude underlying malignancy.'
  );

  footer(doc, 'Dr. Yusuf Al-Rashid', 'FRCR, Consultant Radiologist');
  doc.end();
  stream.on('finish', () => console.log('✅  chest_xray_radiology_report.pdf'));
}

// ─── 3. CLINICAL ASSESSMENT / DISCHARGE SUMMARY ───────────────────────────────
function generateClinicalReport() {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(path.join(OUT, 'clinical_assessment_hypertension.pdf'));
  doc.pipe(stream);

  header(doc, 'CLINICAL ASSESSMENT REPORT', 'Greenfield Medical Practice — Cardiology Outpatient Clinic');

  patientInfo(doc, [
    ['Patient Name', 'Thomas Wright'],
    ['Patient ID', 'PT-2026-05589'],
    ['Date of Birth', '19/07/1968  (Age: 57 years)'],
    ['Gender', 'Male'],
    ['NHS Number', 'NHS-456 789 1234'],
    ['Clinic Date', '28 April 2026'],
    ['Next Review', '28 July 2026'],
    ['Consulting Physician', 'Dr. Claire Montague'],
  ]);

  divider(doc);

  sectionTitle(doc, 'REASON FOR VISIT / CHIEF COMPLAINT');
  paragraph(doc, 'Follow-up appointment for hypertension management and medication review. Patient reports persistent morning headaches (3/10 severity), occasional exertional chest tightness (NYHA Class II), and fatigue over the past 4 weeks. Denies syncope, palpitations, or peripheral oedema.');

  divider(doc);

  sectionTitle(doc, 'MEDICAL HISTORY');
  const hx = [
    ['Hypertension', 'Diagnosed 2018, on treatment'],
    ['Hypercholesterolaemia', 'Diagnosed 2020'],
    ['Type 2 Diabetes Mellitus', 'Diagnosed 2022, diet-controlled + oral agents'],
    ['Obesity', 'BMI 31.4 kg/m²'],
    ['Ex-Smoker', '15 pack-year history, quit 2019'],
  ];
  hx.forEach(([cond, detail]) => {
    labelValue(doc, cond, detail, 50);
  });

  divider(doc);

  sectionTitle(doc, 'CURRENT MEDICATIONS');
  const meds = [
    ['Amlodipine', '10 mg', 'Once daily (morning)'],
    ['Ramipril', '5 mg', 'Once daily (morning)'],
    ['Atorvastatin', '40 mg', 'Once daily (night)'],
    ['Metformin', '1000 mg', 'Twice daily with meals'],
    ['Aspirin', '75 mg', 'Once daily (morning)'],
    ['Bisoprolol', '2.5 mg', 'Once daily (morning)  — newly added today'],
  ];
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b');
  doc.text('MEDICATION', 50, doc.y, { width: 160 });
  doc.text('DOSE', 210, doc.y - 12, { width: 60 });
  doc.text('FREQUENCY / NOTES', 270, doc.y - 12, { width: 260 });
  doc.moveDown(0.6);
  meds.forEach(([med, dose, freq]) => {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b').text(med, 50, y, { width: 155 });
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text(dose, 210, y, { width: 60 });
    doc.fillColor('#334155').text(freq, 270, y, { width: 260 });
    doc.moveDown(0.7);
  });

  divider(doc);

  sectionTitle(doc, 'VITAL SIGNS');
  tableHead(doc);
  row(doc, 'Blood Pressure (sitting)', '158 / 96', 'mmHg', '< 130 / 80', 'HIGH');
  row(doc, 'Blood Pressure (standing, 3 min)', '152 / 92', 'mmHg', '< 130 / 80', 'HIGH');
  row(doc, 'Heart Rate', '88', 'bpm', '60 – 100', '');
  row(doc, 'Oxygen Saturation (SpO₂)', '97', '%', '≥ 95%', '');
  row(doc, 'Respiratory Rate', '16', 'breaths/min', '12 – 20', '');
  row(doc, 'Temperature', '36.7', '°C', '36.1 – 37.2', '');
  row(doc, 'Weight', '94', 'kg', '', '');
  row(doc, 'BMI', '31.4', 'kg/m²', '18.5 – 24.9', 'HIGH');
  row(doc, 'Fasting Blood Glucose (today)', '138', 'mg/dL', '70 – 99', 'HIGH');

  divider(doc);

  sectionTitle(doc, 'PHYSICAL EXAMINATION');
  paragraph(doc, 'General: Alert, orientated, mildly overweight. No distress at rest.');
  paragraph(doc, 'Cardiovascular: Regular rate and rhythm. S1 S2 heard. Soft ejection systolic murmur at aortic area (grade II/VI) — unchanged from prior. No added sounds. No carotid bruits. JVP not elevated. No peripheral oedema.');
  paragraph(doc, 'Respiratory: Clear to auscultation bilaterally. No wheeze or crepitations.');
  paragraph(doc, 'Abdomen: Soft and non-tender. No hepatosplenomegaly. No abdominal bruit.');
  paragraph(doc, 'Neurological: Grossly intact. No focal neurological deficit.');

  divider(doc);

  sectionTitle(doc, 'INVESTIGATIONS ORDERED');
  const inv = [
    'Fasting lipid profile + HbA1c',
    'U&E, eGFR, LFTs, TFTs',
    '12-lead ECG (performed today — sinus rhythm, LVH pattern noted)',
    'Ambulatory 24-hour blood pressure monitoring',
    'Echocardiogram (to assess LV hypertrophy given ECG changes)',
    'Urine ACR (albumin-creatinine ratio) for diabetic nephropathy screening',
  ];
  inv.forEach((item, i) => paragraph(doc, `${i + 1}.  ${item}`, 50));

  divider(doc);

  sectionTitle(doc, 'ASSESSMENT AND PLAN');
  paragraph(doc,
    'Primary Diagnosis: Poorly controlled essential hypertension with features of hypertensive end-organ damage (ECG LVH).'
  );
  paragraph(doc,
    'Secondary Diagnoses: Type 2 diabetes mellitus with suboptimal glycaemic control (fasting glucose 138 mg/dL — requires HbA1c review). Hypercholesterolaemia on atorvastatin.'
  );
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#334155').text('Management Plan:', 44, doc.y);
  doc.moveDown(0.3);
  const plan = [
    '1.  Bisoprolol 2.5 mg OD added to regimen for rate control and BP management.',
    '2.  Reinforce lifestyle modification: DASH diet, sodium restriction (< 2 g/day), weight loss target 5 kg.',
    '3.  Review HbA1c result — if > 8%, consider escalation of diabetic therapy (add SGLT2i / DPP-4 inhibitor).',
    '4.  Repeat BP check in 4 weeks; target BP < 130/80 mmHg.',
    '5.  Echocardiogram referral to assess LV function and rule out hypertensive cardiomyopathy.',
    '6.  Patient counselled regarding cardiovascular risk factors and signs of hypertensive emergency.',
  ];
  plan.forEach(p => paragraph(doc, p, 50));

  footer(doc, 'Dr. Claire Montague', 'MD MRCP, Consultant Cardiologist');
  doc.end();
  stream.on('finish', () => console.log('✅  clinical_assessment_hypertension.pdf'));
}

// ─── Run all ──────────────────────────────────────────────────────────────────
generateBloodReport();
generateXRayReport();
generateClinicalReport();
console.log('Generating PDFs into public/samples/ …');
