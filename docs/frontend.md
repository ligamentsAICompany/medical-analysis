# MedDocs — frontend code structure and requirements

This document describes how the **MedDocs** Next.js frontend is organized and which **business requirements** are implemented in the repo today. It is meant for onboarding and planning (for example, when adding a separate API + database).

---

## 1. Product intent

**MedDocs** is a medical document workspace: users sign in, upload clinical files (PDF, text, images), and receive **structured AI analysis** (classification, summaries, lab-style tables where applicable, imaging-style sections for images). The UI emphasizes a compact dashboard (bento-style home), a full-page analysis experience, and clear document status (uploading, analysing, ready, error).

**Important:** Outputs are **assistive** and not a substitute for professional medical judgment. Copy in the app should continue to reflect that where shown.

---

## 2. Business requirements implemented

### 2.1 Access control

| Requirement | Implementation |
|-------------|----------------|
| Users must be signed in to use the app | Root `middleware.js` verifies an HTTP-only session cookie and redirects unauthenticated users to `/login` with a `from` query for return navigation. Matcher covers `/`, `/login`, `/analysis/:path*`. |
| Login | `src/app/login/page.js` — email/password form against `POST /api/auth/login`. |
| Session persistence | Signed cookie (`meddocs_session` / configurable name via auth lib); `GET /api/auth/me` for client bootstrap in `AuthContext`. |
| Logout | `POST /api/auth/logout` clears the cookie. |
| Configurable demo credentials | `MEDDOCS_LOGIN_EMAIL`, `MEDDOCS_LOGIN_PASSWORD`, `MEDDOCS_AUTH_SECRET` (see `src/lib/auth-config.js`, `src/lib/auth-session-*.js`). |

### 2.2 Document lifecycle

| Requirement | Implementation |
|-------------|----------------|
| Upload PDF, plain text, and images (with size limits enforced for API payloads) | `UploadZone.js`, `useDocuments.js`, `MedDocsApp.js` — `addDocument` + `analyzeFile`. |
| Client-side PDF text extraction | `src/lib/pdfExtract.js` (pdfjs-dist in the browser; server build uses `pdfjs-stub.js` via `next.config.js` alias). |
| In-browser PDF preview | `PdfViewer.js`; optional open via `?view=` query handled in `MedDocsApp.js`. |
| Document list with status | `DocumentTable.js` — sort/filter/search patterns; integrates with `StatusBadge.js`. |
| Delete document | `deleteDocument` + toasts; header/analysis flows handle navigation. |
| Download original | Analysis page download uses object URL where available. |

### 2.3 AI analysis (primary path: team analyze API)

| Requirement | Implementation |
|-------------|----------------|
| **Base URL** | `src/config/analyzeApi.js` — `getAnalyzeApiBaseUrl()`, `getAnalyzeApiUrl()` (appends `ANALYZE_API_PATH`, default `/api/v1/analyze`). Configure **`NEXT_PUBLIC_ANALYZE_API_BASE_URL`** (no trailing slash). |
| **Text / PDF-extracted text** | `useAnalysis.js` → `analyzeClient.js` builds `multipart/form-data` with a `.txt` part under field name **`files`**, same as imaging uploads. |
| **Images / DICOM** | Base64 on the client → `Blob` parts, each appended as **`files`** (repeated field), matching `curl -F 'files=@…'`. |
| **Multiple images (same study)** | One document, `mode: 'multiImage'` → several **`files`** parts in one POST to `getAnalyzeApiUrl()`. |
| **PDF + imaging (same patient)** | `mode: 'docAndImages'` — imaging **`files`** first, then `extracted-context.txt` as **`files`**. |
| **User feedback on analysis** | On `/analysis/[docId]`, a **standalone Feedback section** below the report offers thumbs up/down, optional comment, and **optional file attachments** (PDF/TXT/images, capped count/size). Stored as `userFeedback` including `attachments[]` with `objectUrl` + `file` refs (client session only until a backend exists). |
| Consistent schema for UI | `src/lib/geminiNormalize.js` normalises whatever JSON the analyze API returns (expects the same MedDocs analysis shape, or `{ analysis: { … } }`). |
| Lab values | Prefer API output; merge with `labParser.js` on extracted text when useful (`mergedLabValues` in `useAnalysis.js`). |
| Failure handling (text) | On API error: **heuristic fallback** via `heuristics.js` / `analyzeDocument`, user warned with toast. |
| Re-run / refresh AI on existing text | `enhanceWithAI` → `runStructuredTextAnalysis` (used from analysis UI where wired). |

### 2.4 Presentation of analysis

| Requirement | Implementation |
|-------------|----------------|
| Full-page analysis per document | App route `src/app/analysis/[docId]/page.js` + `AnalysisPageView.js`. |
| Shared sections for document types | `analysis/AnalysisShared.js` — classification, summary, entities, type-specific blocks (lab, imaging narrative, prescription-style, etc.) as data allows. |
| Dedicated imaging UI when analysis includes image fields | `analysis/ImageAnalysisView.js` + branching in `AnalysisPageView.js` (`isImage`, `imageAnalysis`). |
| **AI Insights** and premium layout | Driven by normalized analysis object and styles in `globals.css`, `premium-ui.css`, `analysis-v2.css`. |
| Loading / analysing UX | Rotating status messages on analysis page; `aiLoading` / `aiLoadProgress` from `useAnalysis`. |

### 2.5 Shell, theme, and global UX

| Requirement | Implementation |
|-------------|----------------|
| Light / dark theme | `ThemeContext.js`, `ThemeToggle.js`, `src/app/providers.js`. |
| App-wide document state | `MedDocsContext.js` composes `useDocuments`, `useToast`, `useAnalysis`. |
| Toasts | `Toast.js`, `useToast.js`. |
| Top chrome | `AppHeader.js` (used on home and analysis). |
| Home dashboard | `MedDocsApp.js` — bento-style stats, upload zone, quick links to bundled sample images under `public/`, navigation into analysis on first upload. |

### 2.6 Demo and samples

| Requirement | Implementation |
|-------------|----------------|
| Pre-seeded mock documents (in-memory demos) | `src/lib/mockData.js` loaded via document hook / app initialization patterns (see `useDocuments.js`). |
| Additional PDF samples in repo | `public/samples/` (see root `README.md` for filenames). |

### 2.7 Explicitly not in scope yet (frontend)

- **No persisted multi-user document store** in a database (documents live in client memory / object URLs for the session).
- **No separate backend service** for CRUD (planned in [backend-db-and-frontend-structure.md](./backend-db-and-frontend-structure.md)).
- **`src/lib/ai.js`** (Transformers.js in-browser pipelines) remains in the codebase as a **possible offline / secondary** path; the **current** `useAnalysis` flow calls the **remote analyze API** from the browser (`analyzeClient.js`), not `loadModels()` / `enhanceAnalysis()` from that file.

---

## 3. Technical stack (frontend-relevant)

| Area | Choice |
|------|--------|
| Framework | Next.js 16, App Router under `src/app/`, default **Turbopack** (`next dev` / `next build`). Custom bundling lives in `next.config.js` → `turbopack.resolveAlias`. |
| UI | React 19, lucide-react; CSS modules not used — global and route-scoped CSS files under `src/app/`. |
| Auth | Cookie sessions verified in middleware (Edge) and route handlers (Node). |
| AI | Medical analyze HTTP API from the browser (`NEXT_PUBLIC_ANALYZE_API_BASE_URL`); optional `NEXT_PUBLIC_ANALYZE_API_KEY` (Bearer). Session cookie is only for this app’s auth routes, not for the analyze host (configure CORS on the analyze service). |

---

## 4. Code structure

Repository root keeps **Next config**, **middleware**, **public** assets, **Dockerfile**, and **environment** files. **Application source** lives under **`src/`**.

```
middleware.js                 # Auth gate for matched routes

src/app/                      # Next.js App Router
  layout.js                   # HTML shell, global CSS imports, Providers
  page.js                     # Home: loads MedDocsApp (client)
  providers.js                # ThemeProvider, AuthProvider, MedDocsProvider
  globals.css                 # Base design tokens and layout
  premium-ui.css              # Premium / glass-style utilities
  analysis-v2.css             # Analysis page layout and components
  login/page.js               # Login screen
  analysis/[docId]/page.js    # Per-document analysis page
  api/
    auth/login/route.js       # Issue session cookie
    auth/logout/route.js      # Clear session cookie
    auth/me/route.js          # Current user for AuthContext

src/components/
  MedDocsApp.js               # Home shell: upload, table, stats, sample links
  AppHeader.js
  UploadZone.js
  DocumentTable.js
  AnalysisPageView.js         # Full-page analysis wrapper
  analysis/
    AnalysisShared.js         # Shared analysis sections + AI insights
    ImageAnalysisView.js      # Imaging-oriented presentation
  PdfViewer.js
  StatusBadge.js
  Toast.js
  ThemeToggle.js

src/context/
  AuthContext.js              # User + login/logout helpers
  MedDocsContext.js           # Documents + analysis + toasts
  ThemeContext.js

src/config/
  analyzeApi.js               # Base URL + analyze path for reuse

src/hooks/
  useDocuments.js             # In-memory document list + CRUD
  useAnalysis.js              # Extract text → analyze API (and fallbacks)
  useToast.js

src/lib/
  auth-config.js              # Cookie name, secret, demo credentials
  auth-session-edge.js        # Edge-safe session verify (middleware)
  auth-session-node.js        # Node route session sign/verify
  analyzeClient.js            # POST multipart to analyze API; normalise response
  analyzeMultipart.js         # Build FormData (repeated `files` field)
  geminiNormalize.js          # Shape API JSON for UI (name retained for history)
  heuristics.js               # Regex/heuristic analysis (fallback + hints)
  labParser.js                # Parse lab lines from plain text
  pdfExtract.js               # Client PDF text extraction
  pdfjs-stub.js               # Server-side stub for webpack
  mockData.js                 # Demo documents
  imageAnalysis.js            # Helpers related to imaging analysis shape
  ai.js                       # Transformers.js loaders (not primary path today)
```

---

## 5. Primary runtime flows

### 5.1 Sign-in

1. Unauthenticated user hits `/` or `/analysis/...` → middleware redirects to `/login?from=…`.
2. Successful `POST /api/auth/login` sets cookie; `AuthContext` can call `/api/auth/me`.
3. Authenticated user on `/login` → middleware redirects to `/`.

### 5.2 Upload → analyse → review

1. User selects files → `addDocument` creates an in-memory record (id, file, object URL, status).
2. First file navigates to `/analysis/{id}`.
3. `analyzeFile`: set status **analysing**; extract text for PDF/text; for **images**, skip text pipeline and POST multipart **files** to the analyze API; for **text/PDF**, POST extracted text as a **files** `.txt` part (on error, heuristic fallback for text path).
4. UI reads `doc.analysis` (normalized) through `AnalysisShared` / `ImageAnalysisView`.

### 5.3 Analyze API call

Browser → `analyzeClient.js` → `POST` **`getAnalyzeApiUrl()`** with **`multipart/form-data`**, repeated form field **`files`** (same idea as `curl -F 'files=@…'`). JSON response is parsed and passed through **`normalizeGeminiAnalysis`** so the rest of the app still receives `{ analysis }`.

---

## 6. Environment variables (frontend / full-stack dev)

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_ANALYZE_API_BASE_URL` | **Required for analysis.** Origin of the medical analyze service (no trailing slash), e.g. `https://….run.app`. Path `/api/v1/analyze` is appended in `src/config/analyzeApi.js` (`ANALYZE_API_PATH`). |
| `NEXT_PUBLIC_ANALYZE_API_KEY` | Optional. If set, sent as `Authorization: Bearer …` from the browser (only if acceptable for your threat model). |
| `MEDDOCS_AUTH_SECRET` | Signing secret for session tokens (must be strong in production). |
| `MEDDOCS_LOGIN_EMAIL` / `MEDDOCS_LOGIN_PASSWORD` | Expected credentials for demo login. |

---

## 7. Related documentation

- [backend-db-and-frontend-structure.md](./backend-db-and-frontend-structure.md) — backend-only: stack, DB, storage, repo layout, API scaffold links.
- Root [README.md](../README.md) — historical stack notes (some sections may still mention older analysis stacks; **this file** reflects the **current** remote analyze API path).

---

*Generated from the MedDocs codebase layout and behavior. Update this file when major features (persistence, new routes, or analysis providers) change.*
