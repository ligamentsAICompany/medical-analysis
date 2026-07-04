# MedDocs Floating Assistant — Implementation Plan

> **Purpose:** Step-by-step plan to add a Dealer-style floating assistant to MedDocs (`medical-analysis` + `medical-analysis-backend-python`), adapted for clinical reports, analysis upload, and admin user management.
>
> **Reference:** [Dealer-Management floating assistant plan](../../Dealer-Management/docs/floating_assistant_portable_implementation_plan.md) — copy **patterns**, not DMS modules.
>
> **Status:** Complete through Phase 4 (Transformers.js primary, Groq fallback)  
> **Last updated:** 2026-07-03

---

## 1. Strategic goals

| Goal | MedDocs “good” looks like |
|------|---------------------------|
| **Time-to-action** | “Show lab reports for John” → filtered list or open report in one step |
| **Upload acceleration** | Attach PDF/image in chat → classify → run existing analyze pipeline |
| **Operational access** | Count/list/search reports without opening filters manually |
| **Admin efficiency** | “Add user …” / “Delete user …” via chat with confirmation |
| **Safe automation** | Firebase JWT on every API call; admin-only actions respect `isAdmin` |
| **Progressive cost** | Keyword commands work without LLM; Groq optional for parse/extract |

---

## 2. MedDocs modules (as-built)

### 2.1 Workspace navigation

| Module | Routes | Access | Primary UI |
|--------|--------|--------|------------|
| **Dashboard** | `/dashboard` | All | KPIs, charts, recent activity |
| **Analysis** | `/analysis`, `/analysis/[docId]` | All | Upload, document table, detail + feedback |
| **Users** | `/users` | Admin | User table, add/edit/delete modals |

Source: `src/components/shell/Sidebar.js`, `src/app/(workspace)/`.

### 2.2 Domain entities (under Analysis)

| Entity | API / storage | Notes |
|--------|---------------|-------|
| **Reports** | `GET/POST/DELETE /api/v1/reports` | Firestore; admin sees all |
| **Document types** | On `analysis.classification.type` | Lab Report, Imaging Report, Prescription, etc. |
| **Imaging** | `analysis.imageAnalysis`, DICOM/images | Vision upload path |
| **Patients** | `patientName`, `patientId` on report | No dedicated `/patients` module |
| **Feedback** | On report detail | Helpful / comment |

### 2.3 Backend APIs (reuse — do not duplicate in assistant)

| Endpoint | Used for |
|----------|----------|
| `POST /api/v1/analyze` | Small file analyze |
| `POST /api/v1/upload-url` + `POST /api/v1/analyze-gcs` | Large files |
| `GET/POST/DELETE /api/v1/reports` | Report CRUD |
| `GET /api/v1/reports/me` | Profile + role |
| `GET/POST/PATCH/DELETE /api/v1/users` | User admin |

Auth: Firebase Bearer via `getApiAuthToken()` (`src/config/analyzeApi.js`).

### 2.4 Client stack today

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 App Router |
| State | React Context (`AuthContext`, `MedDocsContext`) — **no Redux** |
| Documents | `useDocuments` + `useReports` + `useAnalysis` |
| Shell | LigaX tokens, `AppShell`, `TopBar`, `Sidebar` |
| Package manager | pnpm |

**Gap:** No assistant, voice, intent parser, or command registry.

---

## 3. Product scope

### 3.1 In scope (v1 floating assistant)

| Capability | Behavior |
|------------|----------|
| Global entry | “Ask AI” in TopBar + **Alt+A**; side panel on all workspace routes |
| Text commands | Navigate, search, lookup, count, open report |
| Quick chips | “Open analysis”, “Show reports”, “Go to dashboard” |
| Keyword parser | Always works without LLM |
| Optional LLM parse | `POST /api/assistant/parse` (Groq) |
| Inline results | Report table in chat bubble (patient, type, status, date) |
| List search prefill | `?search=` on `/analysis` consumed by `DocumentTable` |
| Delete report | Search → confirm in chat → `deleteReport` API |
| Admin users | “Add user” opens modal with prefill; delete uses existing `ConfirmModal` |
| File attach (Phase 3) | PDF/image in panel → classify → `analyzeFile` pipeline |
| Voice (Phase 2+) | Web Speech API, optional |

### 3.2 Out of scope (v1)

| Capability | Reason |
|------------|--------|
| Long-form specialist chat | No `specialist_agents` / persisted conversations |
| Autonomous agents / monitors | Not in MedDocs backend |
| Patient CRUD module | Patients are report metadata only |
| Client-side Transformers NLI | Optional later; backend Gemini already handles analyze |
| Chat persistence across refresh | Ephemeral Redux/Context state (match Dealer default) |

---

## 4. Architecture

```mermaid
flowchart TB
  subgraph ui [UI Layer]
    Entry[TopBar Ask AI + Alt+A]
    Panel[AssistantSidePanel + AssistantPanel]
    Runner[useActionRunner]
    UploadWf[useClinicalUploadWorkflow]
    Voice[useVoiceRecognition]
  end

  subgraph state [Client State]
    Store[assistantStore or AssistantContext]
    MedDocs[MedDocsContext documents]
  end

  subgraph logic [lib/assistant]
    Registry[actionRegistry]
    Parser[intentParser]
    Search[searchService]
    Classify[documentClassifier]
    Fields[fieldRequirements users only]
  end

  subgraph nextapi [Next.js API optional]
    Parse[/api/assistant/parse]
    ExtractPdf[/api/assistant/extract-pdf]
  end

  subgraph backend [Python Cloud Run]
    Analyze[/api/v1/analyze]
    Reports[/api/v1/reports]
    Users[/api/v1/users]
  end

  Entry --> Panel
  Panel --> Runner
  Panel --> UploadWf
  Runner --> Store
  Runner --> MedDocs
  Runner --> Registry
  Runner --> Parser
  Runner --> Search
  Parser --> Parse
  UploadWf --> Analyze
  Runner --> Reports
  Runner --> Users
```

### 4.1 Design principles

1. **Single orchestrator** — `useActionRunner.runAction()` handles all text commands.
2. **Registry-driven** — New capability = update `actionRegistry.js`, not scatter logic in UI.
3. **Reuse MedDocsContext** — Search/lookup/count read `documents[]`; do not duplicate report state.
4. **Reuse API clients** — `reportsClient.js`, `usersClient.js`, `analyzeClient.js` only.
5. **Assistant does not own analysis** — It triggers existing `analyzeFile` / `deleteDocument` flows.
6. **RBAC unchanged** — Same Firebase token and admin gates as sidebar routes.

---

## 5. Module registry (MedDocs)

Implement in `src/lib/assistant/actionRegistry.js`:

```javascript
export const MODULE_ROUTES = {
  dashboard: { list: '/dashboard' },
  analysis:  { list: '/analysis', add: '/analysis' },
  reports:   { list: '/analysis', detail: '/analysis/:id' },
  users:     { list: '/users' },
}

export const MODULE_KEYWORDS = {
  dashboard: ['dashboard', 'overview', 'home', 'stats', 'kpi'],
  analysis:  ['analysis', 'analyze', 'upload', 'clinical', 'workspace'],
  reports:   ['report', 'reports', 'document', 'documents', 'file', 'files', 'study', 'studies'],
  users:     ['user', 'users', 'member', 'members', 'account', 'admin'],
}

export const DOC_TYPE_KEYWORDS = {
  'Lab Report':        ['lab', 'cbc', 'blood', 'metabolic', 'specimen'],
  'Imaging Report':    ['x-ray', 'xray', 'ct', 'mri', 'ultrasound', 'imaging', 'scan', 'dicom'],
  'Prescription':      ['prescription', 'rx', 'medication', 'pharmacy'],
  'Discharge Summary': ['discharge', 'admission', 'hospital'],
  'Referral Letter':   ['referral', 'refer'],
  'Consent Form':      ['consent'],
}
```

### 5.1 Intents

| Intent | MedDocs examples |
|--------|------------------|
| `navigate` | “Open analysis”, “Go to dashboard”, “Users page” |
| `search` / `lookup` | “Find reports for Sarah”, “Show imaging studies”, “Lab reports” |
| `count` | “How many reports?”, “How many in analysis?” |
| `open` | “Open report RPT_ABC123”, “Open latest report” |
| `delete` | “Delete report for patient X” → confirm |
| `create` | “Upload document”, “Add user manoj@meddocs.app” (admin) |
| `unknown` | Show help + quick chips |

---

## 6. State model

Prefer **Zustand** (`assistantStore.js`) or **AssistantContext** — avoid introducing Redux unless team standardizes on it.

| State key | Purpose |
|-----------|---------|
| `isOpen` | Panel visibility |
| `messages[]` | Chat transcript (`{ id, role, text, tableData?, status? }`) |
| `isProcessing` | Block send during async |
| `pendingDelete` | `{ type: 'report' \| 'user', id, name }` awaiting yes/no |
| `followUp` | Multi-turn admin user create (optional Phase 2) |
| `uploadWorkflow` | Clinical upload phases (Phase 3) |
| `pendingFile` | Local UI state in panel OR in store |
| `lastParserSource` | `keyword` \| `groq` badge |
| `usersModalPrefill` | Trigger Users page/modal from assistant (event or store) |

**Do not store** `documents[]` in assistant state — read from `useMedDocs()`.

### 6.1 Actions (minimum)

`openAssistant`, `closeAssistant`, `toggleAssistant`, `addMessage`, `updateMessage`, `setProcessing`, `setPendingDelete`, `clearPendingDelete`, `setFollowUp`, `clearFollowUp`.

---

## 7. Command execution flow

```
User message
    │
    ├─ pendingDelete? ──► ConfirmModal / yes-no in chat → deleteReport | deleteUser
    │
    ├─ uploadWorkflow active? ──► useClinicalUploadWorkflow
    │
    └─ parseVoiceCommand (keyword → optional Groq)
            │
            ├─ navigate ──► router.push(MODULE_ROUTES)
            ├─ lookup/search ──► searchService(documents) → inline table + optional ?search=
            ├─ count ──► filter documents → reply with number
            ├─ open ──► router.push(/analysis/[id])
            ├─ delete ──► search → setPendingDelete
            ├─ create ──► navigate /analysis OR open Users add modal (admin)
            └─ unknown ──► help text
```

**Priority:** `pendingDelete` and `uploadWorkflow` override generic parsing (Dealer pattern).

---

## 8. Clinical upload workflow (Phase 3)

Rename Dealer `pdfOrderWorkflow` → **`clinicalUploadWorkflow`**.

| Phase | Behavior |
|-------|----------|
| `attach` | User attaches file; show pending chip |
| `classify` | `documentClassifier` + optional Groq on extract-pdf route |
| `confirm` | “Analyze this Lab Report?” yes/no |
| `analysing` | Call existing `addDocument` + `analyzeFile` / bundle path |
| `complete` | Message with summary snippet + link `/analysis/[docId]` |
| `error` | Toast + assistant error message; fallback “Open analysis to retry” |

Reuse: `validateAnalyzeFileSelection`, `medicalFileTypes.js`, `useAnalysis`, `persistReport`.

---

## 9. Next.js API routes (new)

| Route | Method | Phase | Role |
|-------|--------|-------|------|
| `/api/assistant/parse` | POST | 1+ | Intent broker (Groq); body: `{ text, context? }` |
| `/api/assistant/extract-pdf` | POST | 3 | multipart PDF → text + optional classification |

**Env:** `GROQ_API_KEY` (server only). Keyword tier works without it.

`extract-pdf` must use `export const runtime = 'nodejs'` (pdfjs).

---

## 10. UI integration points

| File | Change |
|------|--------|
| `src/components/shell/AppShell.js` | Mount `AssistantSidePanel`, `FloatingAssistant` (keyboard) |
| `src/components/shell/TopBar.js` | Add “Ask AI” button → `toggleAssistant` |
| `src/app/(workspace)/layout.js` | No change if mounted in AppShell |
| `src/components/DocumentTable.js` | Read `searchParams.search` for list prefill |
| `src/components/UsersView.js` | Subscribe to `usersModalPrefill` / custom event for assistant-triggered add |
| `src/app/app-shell.css` | Assistant panel width, slide-in, `--shell-panel-w` if needed |

Panel layout: **right side drawer** (match LigaX shell; Dealer uses same pattern).

---

## 11. Phased implementation

### Phase 0 — Foundation (3–5 days)

**Goal:** Panel opens, messages work, no commands yet.

- [ ] Create `src/context/AssistantContext.js` (or `src/store/assistantStore.js`)
- [ ] Create `src/components/assistant/AssistantSidePanel.js`
- [ ] Create `src/components/assistant/AssistantPanel.js` (input, send, message list)
- [ ] Create `src/components/assistant/AssistantMessage.js`
- [ ] Create `src/components/assistant/FloatingAssistant.js` (Alt+A, Escape)
- [ ] Wire `AssistantProvider` in `src/app/providers.js`
- [ ] Mount assistant in `AppShell.js`
- [ ] Add “Ask AI” to `TopBar.js`
- [ ] Add assistant CSS to `app-shell.css` (panel, messages, backdrop on mobile)

**Acceptance:** User opens panel, sends text, sees echo or static welcome; Alt+A toggles; works on dashboard, analysis, users.

---

### Phase 1 — Command engine — keywords only (5–7 days)

**Goal:** Navigate + lookup + count without LLM.

- [ ] `src/lib/assistant/actionRegistry.js` — routes, keywords, doc types
- [ ] `src/lib/assistant/intentParser.js` — keyword tier (`create|search|navigate|lookup|delete|count|open|unknown`)
- [ ] `src/lib/assistant/entityExtractor.js` — patient name, report id, doc type from text
- [ ] `src/lib/assistant/searchService.js` — filter `documents[]` by name, patient, type, status
- [ ] `src/components/assistant/hooks/useActionRunner.js` — orchestrator
- [ ] `src/components/assistant/CommandSuggestions.js` + quick chips
- [ ] Inline `tableData` on assistant messages for lookup results
- [ ] Help text for `unknown` intent

**Commands to support:**

| Command | Expected result |
|---------|-----------------|
| “Go to dashboard” | Navigate `/dashboard` |
| “Open analysis” | Navigate `/analysis` |
| “Show users” (admin) | Navigate `/users` |
| “Find reports for {name}” | Filter + table in chat |
| “Show lab reports” | Filter by type |
| “How many reports?” | Count reply |
| “Open latest report” | Navigate newest `uploadedAt` |
| “Open report {id}” | Navigate `/analysis/{id}` |

**Acceptance:** All above work with **no** `GROQ_API_KEY`.

---

### Phase 2 — CRUD depth + voice (5–7 days)

**Goal:** Delete, admin users, list prefill, voice.

- [ ] `pendingDelete` flow for reports → reuse `ConfirmModal` pattern
- [ ] Wire `deleteDocument` / `reports.removeReport` on confirm
- [ ] `DocumentTable` reads URL `?search=` from assistant
- [ ] Assistant → Users: dispatch open-create with prefill (`name`, `email`, `role`)
- [ ] `src/lib/assistant/fieldRequirements.js` — `users` create fields
- [ ] Optional multi-turn user create in chat (follow-up)
- [ ] `src/components/assistant/hooks/useVoiceRecognition.js`
- [ ] `src/components/assistant/VoiceButton.js`
- [ ] `POST /api/assistant/parse` + Groq broker (optional enhancement to Phase 1 parser)
- [ ] `ParserSourceChip` — keyword vs groq

**Acceptance:** Delete report with custom confirm modal; admin can start “add user” from chat; voice submits command in Chrome/Edge.

---

### Phase 3 — Document upload in panel (7–10 days)

**Goal:** Attach clinical file in assistant → analyze → open report.

- [ ] Pending file chip in `AssistantPanel`
- [ ] `src/lib/assistant/documentClassifier.js` (port signals from `heuristics.js` DOC_TYPES)
- [ ] `src/app/api/assistant/extract-pdf/route.js` (optional pre-scan)
- [ ] `src/lib/assistant/clinicalUploadWorkflow.js` — phase state machine
- [ ] `src/components/assistant/hooks/useClinicalUploadWorkflow.js`
- [ ] Integrate `useMedDocs().addDocument`, `analyzeFile`, `analyzeFileBundle`
- [ ] On complete: navigate `/analysis/[docId]` + summary in chat
- [ ] Email paste detection (low priority — skip if no email ingestion in MedDocs)

**Acceptance:** User attaches PDF in panel, confirms, analysis runs, link opens detail page.

---

### Phase 4 — Polish (3–5 days)

- [ ] Lite mode toggle (skip any future client ML)
- [ ] Mobile: panel full-screen overlay
- [ ] Admin column “Uploaded by” in inline tables
- [ ] Keyboard: Escape closes panel
- [ ] Error copy aligned with Design.md voice (no emoji, verb-first)
- [ ] Unit tests: `actionRegistry`, `intentParser`, `searchService`, `documentClassifier`

---

### Phase 5 — Optional future

- [ ] Server-side report search API (`GET /reports?search=&type=`)
- [ ] Specialist long-form chat (new module — not floating assistant)
- [ ] `@xenova/transformers` client tier (only if offline parse needed)

---

## 12. File tree (target)

```
src/
  components/assistant/
    FloatingAssistant.js
    AssistantSidePanel.js
    AssistantPanel.js
    AssistantMessage.js
    CommandSuggestions.js
    VoiceButton.js
    ParserSourceChip.js
    hooks/
      useActionRunner.js
      useClinicalUploadWorkflow.js
      useVoiceRecognition.js

  lib/assistant/
    actionRegistry.js
    intentParser.js
    entityExtractor.js
    searchService.js
    fieldRequirements.js
    documentClassifier.js
    clinicalUploadWorkflow.js

  context/AssistantContext.js    # or store/assistantStore.js

  app/api/assistant/
    parse/route.js
    extract-pdf/route.js

  lib/server/assistant/          # optional
    broker.js
    providers/groq.js
```

---

## 13. Environment variables

| Variable | Required | Used by |
|----------|----------|---------|
| `NEXT_PUBLIC_ANALYZE_API_BASE_URL` | Yes | Existing API clients |
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Auth (existing) |
| `GROQ_API_KEY` | Phase 1+ optional | `/api/assistant/parse`, extract-pdf |
| `AI_PROVIDER` | Optional | Default `groq` |

---

## 14. Testing strategy

| Layer | Tests |
|-------|-------|
| Unit | `intentParser` keywords, `searchService` filters, `actionRegistry` routes |
| Unit | `documentClassifier` on sample lab/imaging text |
| Integration | `extract-pdf` with fixture PDF |
| E2E manual | Navigate commands; lookup; delete confirm; upload workflow |
| E2E manual | Admin user create from chat; non-admin denied users commands |
| RBAC | User token cannot list all reports; admin can |

---

## 15. RBAC matrix

| Action | USER | ADMIN |
|--------|------|-------|
| Navigate dashboard/analysis | ✅ | ✅ |
| Search own reports | ✅ | ✅ |
| Search all reports | ❌ | ✅ |
| Delete own report | ✅ | ✅ |
| Delete any report | ❌ | ✅ |
| Users module commands | ❌ | ✅ |
| Upload / analyze | ✅ | ✅ |

Implement admin checks in `useActionRunner` before navigate to `/users` or cross-user delete.

---

## 16. Dependencies & risks

| Risk | Mitigation |
|------|------------|
| No server search on reports | Phase 1 client-side filter on loaded `documents` |
| Large report list slow to filter | Phase 5 backend `?search=`; cap inline table to 10 rows |
| Analyze is async | Show `analysing` status in chat; poll `documents` or listen via context |
| Users add is modal-based | Event/callback to `UsersView`, not a separate route |
| pnpm + pdfjs in Docker | Copy pdf worker in postinstall (existing) |

---

## 17. Success criteria (v1 done)

- [ ] Assistant opens from any workspace page (TopBar + Alt+A).
- [ ] **Navigate** and **lookup** work with keywords only (no LLM).
- [ ] **Count** and **open report** work from chat.
- [ ] **Delete report** requires in-app confirmation (not `window.confirm`).
- [ ] Admin can trigger **add user** from chat.
- [ ] Phase 3: **attach file** → analyze → open report link.
- [ ] All API calls use Firebase Bearer; permissions match sidebar behavior.
- [ ] Parser source or clear error when command fails.

---

## 18. Suggested implementation order (sprints)

| Sprint | Deliverable |
|--------|-------------|
| **S1** | Phase 0 — shell + panel + provider |
| **S2** | Phase 1 — registry + keyword runner + lookup tables |
| **S3** | Phase 2 — delete, users bridge, voice, optional Groq parse |
| **S4** | Phase 3 — clinical upload workflow |
| **S5** | Phase 4 — polish + tests |

**Total estimate:** ~4–6 weeks for Phases 0–4 (one developer, part-time QA).

---

## 19. Reference mapping (Dealer → MedDocs)

| Dealer artifact | MedDocs equivalent |
|-----------------|-------------------|
| `MODULE_ROUTES.orders` | `MODULE_ROUTES.reports` / `analysis` |
| `pdfOrderWorkflow` | `clinicalUploadWorkflow` |
| `pdfOrderCreate` | `analyzeFile` + `persistReport` |
| `directCreateService` | `usersClient.createUser` (admin) |
| `searchService` MODULE_CONFIG | Filter `documents[]` + future API |
| `assistantSlice` | `AssistantContext` |
| `specialist_agents` | Out of scope v1 |

---

## 20. Summary

MedDocs floating assistant is a **thin command layer** over existing upload, reports, and users APIs. Implement **Phase 0–1 first** (panel + keywords) for immediate value without backend or LLM changes. Phase 3 adds the highest clinical value (upload from chat). Use the Dealer repo as a **reference implementation** for `useActionRunner`, panel UX, and workflow state machines — replace every DMS-specific route and field with the registry in §5.

**Next step:** Start Phase 0 — create `AssistantContext` + `AssistantSidePanel` + TopBar “Ask AI” button.
