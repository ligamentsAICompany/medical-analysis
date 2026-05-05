# MedDocs — Medical Document Manager

A browser-based medical document upload and AI analysis tool built with **Next.js 16** and **Transformers.js**. All AI processing runs entirely in the browser — no backend, no API keys, no data leaves the device.

---

## Features

### Document Management
- Drag-and-drop or click-to-browse upload (PDF, TXT, JPG, PNG — max 20 MB)
- Document table with sortable columns: file name, type, patient, size, upload date, status
- Search by file name or patient name; filter by document type
- Delete documents; view raw PDF in-browser

### AI-Powered Analysis (Transformers.js)
- Models pre-load in the background the moment the app opens
- On file upload: heuristic analysis runs instantly, then AI enhancement runs automatically
- No manual "Run AI" button required — analysis appears in the panel as soon as ready
- Models are cached in the browser after the first download (~150 MB total, one-time)
- Models used:
  - `Xenova/bert-base-NER` — named entity recognition (people, orgs, locations)
  - `Xenova/nli-deberta-v3-small` — zero-shot document classification
  - `Xenova/distilbart-cnn-6-6` — summarisation

### Document Analysis Panel
Opens automatically on upload; also accessible via "View Analysis" in the table.

| Document Type | Analysis Shown |
|---|---|
| **Lab Report** | Lab values table with HIGH/LOW flags, abnormal count alert |
| **Imaging Report** | Findings, Impression, Recommendations blocks |
| **Prescription** | Medication list with dosage, NER-detected drugs |
| **Discharge Summary** | Vital signs cards, patient timeline |
| **All types** | AI summary, classification + confidence bar, extracted entities, patient details |

- **Download PDF** button in the panel footer for uploaded files
- **Retry AI** button if AI enhancement failed or hasn't run

### Mock Data
Five pre-loaded demo documents covering all document types:
- `lab_results_march_2026.pdf` — CBC + metabolic panel with lab values table
- `discharge_summary_jones.pdf` — Cardiac admission discharge summary
- `prescription_amoxicillin.pdf` — Antibiotic prescription with medications list
- `mri_report_brain.pdf` — Radiology report with FINDINGS / IMPRESSION / RECOMMENDATIONS
- `referral_cardiology_kowalski.pdf` — GP referral letter

### Sample PDFs for testing
Three realistic medical PDFs included in `public/samples/`:
- `blood_report_cbc_metabolic.pdf`
- `chest_xray_radiology_report.pdf`
- `clinical_assessment_hypertension.pdf`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, webpack mode) |
| UI | React 19, lucide-react icons |
| PDF extraction | pdfjs-dist v5 (browser-only, dynamic import) |
| AI / NLP | @xenova/transformers v2 (100% in-browser WASM) |
| Styling | Plain CSS (globals.css, CSS custom properties) |
| Sample generation | pdfkit (dev dependency, `scripts/generate-samples.js`) |

---

## Project Structure

```
app/
  layout.js          # Root Next.js layout + metadata
  page.js            # Entry: lazy-loads MedDocsApp with 'use client'
  globals.css        # All styles (variables, layout, components)

src/
  components/
    MedDocsApp.js    # Root app component — state wiring, auto-open panel on upload
    UploadZone.js    # Drag-and-drop upload area
    DocumentTable.js # Sortable, filterable document list
    AnalysisPageView.js # Full-page AI analysis (`/analysis/[docId]`)
    analysis/AnalysisShared.js # Shared analysis sections (lab, imaging, entities)
    PdfViewer.js     # In-browser PDF viewer modal
    StatusBadge.js   # Uploading / Analysing / Ready / Error pill
    Toast.js         # Toast notification stack

  hooks/
    useDocuments.js  # Document state (add, update, delete, object URLs)
    useAnalysis.js   # Heuristic + AI analysis; model pre-load on mount
    useToast.js      # Toast queue management

  lib/
    heuristics.js    # Fast regex-based: classify, NER, metrics, summary
    labParser.js     # Parses lab value rows → { test, value, unit, refRange, flag }
    pdfExtract.js    # PDF text extraction via pdfjs-dist (dynamic import)
    ai.js            # Transformers.js pipeline loader + enhanceAnalysis()
    mockData.js      # Five pre-built demo documents
    pdfjs-stub.js    # Empty module aliased to pdfjs-dist in server webpack build

scripts/
  generate-samples.js  # Node script (pdfkit) to regenerate sample PDFs
```

---

## Getting Started

```bash
npm install          # Also copies pdfjs worker to public/ via postinstall
npm run dev          # Starts Next.js dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Serve production build
```

To regenerate the sample PDFs:
```bash
node scripts/generate-samples.js
```

---

## Architecture Notes

### SSR / Browser-only libraries
`pdfjs-dist` and `@xenova/transformers` use browser APIs (`DOMMatrix`, WebAssembly, etc.) and cannot run in Node.js.

**Fix applied:** `next.config.js` aliases `pdfjs-dist` → `src/lib/pdfjs-stub.js` (empty module) in the server webpack build. Client build gets the real library. `@xenova/transformers` is kept in `serverExternalPackages`.

### AI model pre-loading
`useAnalysis` calls `loadModels()` inside a `useEffect` on mount. A singleton `loadingPromise` in `ai.js` ensures concurrent callers share one download. Documents uploaded before models finish are queued in `pendingRef` and enhanced automatically once models are ready.

### Analysis flow
1. File dropped → `addDocument()` creates record + `objectUrl`
2. Analysis panel opens immediately (shows skeleton)
3. `analyzeFile()` extracts text (PDF → pdfjs, text → FileReader, image → filename)
4. Heuristic analysis runs synchronously: classify → NER → metrics → lab values → summary
5. Document status → `ready`; panel populates with heuristic results
6. `runAiEnhance()` called automatically → Transformers.js models refine classification, entities, summary
7. Panel updates with `aiEnhanced: true` badge
