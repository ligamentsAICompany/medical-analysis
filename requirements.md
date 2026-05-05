# MedDocs — Medical Document Manager · Requirements & Progress

> **Status:** v1 feature-complete. Framework migrated to Next.js 16. AI auto-analysis live.

---

## Progress Summary

| Area | Status |
|---|---|
| File upload zone | ✅ Done |
| Document table (search, filter, sort, paginate) | ✅ Done |
| PDF viewer modal | ✅ Done |
| Analysis detail (full page `/analysis/[docId]`, not modal) | ✅ Done |
| Heuristic analysis (instant, regex-based) | ✅ Done |
| AI analysis via Transformers.js | ✅ Done |
| Auto AI on upload (no button needed) | ✅ Done |
| Model pre-load on app start | ✅ Done |
| Download PDF from analysis panel | ✅ Done |
| Mock data (5 documents, all types) | ✅ Done |
| Sample PDFs for testing | ✅ Done |
| Medical-specific views (lab table, imaging blocks, meds) | ✅ Done |
| Next.js 16 migration (from Create React App) | ✅ Done |
| SSR fix for browser-only libraries | ✅ Done |
| Toast notifications | ✅ Done |
| Status badges per document | ✅ Done |
| Web Worker for AI inference | ❌ Pending |
| Zoom controls in PDF viewer | ❌ Pending |
| Bulk delete (checkbox select) | ❌ Pending |
| OCR for image uploads (TrOCR `trocr-small-printed`, loaded with AI stack) | ✅ Done |
| IndexedDB persistence across sessions | ❌ Pending |
| PWA / offline mode | ❌ Pending |

---

## Overview

A browser-only medical document management app. All AI inference runs client-side via **Transformers.js** (WebAssembly) — no backend, no data leaves the device.

---

## Core User Stories

| # | Story | Status |
|---|-------|--------|
| 1 | Drag-and-drop or browse to upload PDF/image | ✅ Done |
| 2 | See all documents in a table | ✅ Done |
| 3 | Open analysis per document (dedicated page) | ✅ Done |
| 4 | View original PDF in-browser | ✅ Done |
| 5 | Delete a document | ✅ Done |
| 6 | Search and filter the table | ✅ Done |
| 7 | See AI analysis status per document | ✅ Done |
| 8 | Analysis page opens automatically on upload | ✅ Done |
| 9 | Download the uploaded file from the analysis page | ✅ Done |
| 10 | AI runs automatically without any button click | ✅ Done |

---

## Functional Requirements

### 1. File Upload Zone ✅ Complete

- [x] Drag-and-drop area at the top of the page
- [x] Fallback "Browse files" button
- [x] Accepted: `.pdf`, `.txt`, `.jpg`, `.jpeg`, `.png`
- [x] Max 20 MB per file — error toast for oversized or unsupported files
- [x] Multiple files at once
- [x] Analysis pipeline auto-triggered on upload
- [x] Analysis panel auto-opens for the first uploaded file

### 2. Document Table ✅ Complete

- [x] Columns: #, File Name, Document Type, Patient Name, Size, Upload Date, Status, Actions
- [x] Search bar (filters by name and patient)
- [x] Filter chips by document type
- [x] Sort by column header
- [x] Pagination — 10 rows per page
- [x] Empty state message
- [x] Action buttons: View PDF · View Analysis · Delete

### 3. PDF Viewer Modal ✅ Partial

- [x] Full-screen overlay with dark backdrop
- [x] pdfjs-dist rendering — 100% in-browser
- [x] Page navigation (previous / next) + page counter
- [x] Close button and Esc key
- [ ] **Zoom in/out controls** — pending

### 4. Analysis Detail (full page) ✅ Complete

#### 4a. Document Summary ✅
- [x] Heuristic summary (instant)
- [x] AI-enhanced summary via `Xenova/distilbart-cnn-6-6` (auto-runs, shows progress bar)

#### 4b. Document Classification ✅
- [x] Heuristic classification (instant) + confidence % bar
- [x] AI classification via `Xenova/nli-deberta-v3-small`
- [x] `AI` badge once enhancement completes

#### 4c. Extracted Entities ✅
- [x] People, Dates, Organizations, Medications (heuristic)
- [x] People, Organizations, Locations (AI-NER via `Xenova/bert-base-NER`)
- [x] Coloured chips per entity type

#### 4d. Medical-Specific Views ✅

**Lab Report:**
- [x] Structured lab values table — Test / Result / Unit / Reference / Flag
- [x] HIGH (red) / LOW (amber) / NORMAL (green) flags auto-calculated from reference ranges
- [x] Abnormal value count alert banner
- [x] "Show all N values" toggle

**Imaging Report:**
- [x] FINDINGS block (blue)
- [x] IMPRESSION / CONCLUSION block (orange)
- [x] RECOMMENDATIONS block (green)

**Prescription:**
- [x] Medication list with dosage lines
- [x] NER-detected drug name chips

**Clinical / Discharge:**
- [x] Vital signs cards (blood pressure, heart rate, SpO₂, etc.)
- [x] Lab values table if present

#### 4e. Key Metrics ✅
- [x] Patient ID, Date of Birth, Attending Physician, Primary Diagnosis, Next Appointment

#### 4f. Raw Text Preview ✅
- [x] Collapsible (first 600 chars) + copy to clipboard

#### 4g. Page actions ✅
- [x] View Document (opens PDF viewer)
- [x] Download PDF (for uploaded files; hidden for demo data)
- [x] Retry AI button (if AI hasn't run or failed)

### 5. AI Analysis Pipeline ✅ Complete

| Task | Model | Size | Status |
|------|-------|------|--------|
| NER | `Xenova/bert-base-NER` | ~60 MB | ✅ Running |
| Zero-shot classification | `Xenova/nli-deberta-v3-small` | ~90 MB | ✅ Running |
| Summarisation | `Xenova/distilbart-cnn-6-6` | ~300 MB | ✅ Running |
| Image OCR | `Xenova/trocr-small-printed` | (extra download) | ✅ Running after text models |

- [x] Models pre-load on app start — header pill shows "AI loading…" → "AI ready"
- [x] Auto-enhance every upload after heuristic pass
- [x] Pending queue — uploads during model load are enhanced once ready
- [x] Models cached in browser (one-time ~450 MB download)
- [ ] **Web Worker** — AI currently runs on main thread (pending)

### 6. Mock & Sample Data ✅ Complete

| File | Type | Patient |
|------|------|---------|
| `lab_results_march_2026.pdf` | Lab Report | Sarah Mitchell |
| `discharge_summary_jones.pdf` | Discharge Summary | Robert Jones |
| `prescription_amoxicillin.pdf` | Prescription | Emily Carter |
| `mri_report_brain.pdf` | Imaging Report | David Nguyen |
| `referral_cardiology_kowalski.pdf` | Referral Letter | Anna Kowalski |

- [x] Sample PDFs in `public/samples/` (blood report, chest X-ray, clinical assessment)
- [x] Lab report mock includes parsed `labValues` with reference ranges and flags

---

## Architecture

### Framework
- [x] **Next.js 16** App Router, webpack mode (migrated from Create React App)

### SSR / Browser-only Library Fix
- [x] `pdfjs-dist` aliased to empty stub (`src/lib/pdfjs-stub.js`) in server webpack build — prevents `DOMMatrix is not defined` SSR crash
- [x] `@xenova/transformers` in `serverExternalPackages`
- [x] All interactive components use `'use client'`

### Technology Choices

| Concern | Library | Why |
|---------|---------|-----|
| Framework | Next.js 16 | App Router, SSR, optimised bundling |
| AI inference | `@xenova/transformers` v2 | Runs ONNX in-browser via WASM, free, no API key |
| PDF rendering | `pdfjs-dist` v5 | Mozilla's production PDF engine |
| Icons | `lucide-react` | Tree-shakeable, MIT |
| Styling | Plain CSS + CSS custom properties | No framework overhead |

---

## Pending / Next Steps

### High Priority
- [ ] **Web Worker for AI inference** — move Transformers.js pipelines off the main thread to prevent UI jank on large documents
- [ ] **Zoom controls in PDF viewer** — pdfjs-dist supports scale; add +/- buttons to the viewer toolbar

### Medium Priority
- [ ] **Bulk delete** — checkbox column + "Delete selected N" action bar
- [x] **OCR for image uploads** — `Xenova/trocr-small-printed` loaded with the main model stack; falls back to filename if OCR fails
- [ ] **Focus trap in modals** — trap Tab key inside PDF viewer and analysis panel overlays

### Low Priority / Future
- [ ] **IndexedDB persistence** — survive page refresh; documents currently lost on reload
- [ ] **DICOM support** — `cornerstone.js` for `.dcm` medical imaging files
- [ ] **Medication interaction check** — cross-reference NER drugs against a local OpenFDA JSON bundle
- [ ] **Export table to CSV**
- [ ] **Audit log** — append-only log of view/delete events
- [ ] **PWA / offline mode** — service worker to cache models and app shell for poor hospital Wi-Fi

---

## Acceptance Criteria

- [x] File upload accepts PDF/image via drag-and-drop and file browser
- [x] Each upload appears as a row immediately (status: Analysing)
- [x] Analysis page opens automatically on upload
- [x] Row status updates to "Ready" when analysis completes
- [x] AI runs automatically — no button click required
- [x] PDF viewer opens and renders all pages
- [x] Analysis page shows summary, classification, entities, medical-specific views
- [x] Lab report shows structured values table with HIGH/LOW flags
- [x] Imaging report shows FINDINGS / IMPRESSION / RECOMMENDATIONS blocks
- [x] Delete removes the row and frees the object URL
- [x] Search and filter chips work
- [x] Download PDF button works for uploaded files
- [x] Mock data visible on first launch with pre-computed analysis
- [x] No data sent to any remote server (only model weights from Hugging Face CDN, first load only)
- [ ] Zoom in PDF viewer
- [ ] Non-blocking AI (Web Worker)
