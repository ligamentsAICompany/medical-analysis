# Dedicated backend API — stack, data, and repo bootstrap

Use this document when creating a **separate backend repository** (API + database + storage) for MedDocs. It intentionally omits frontend folder layout; see [frontend.md](./frontend.md) for the Next app.

---

## 1. Language: Node.js or Python?

### Recommendation: **Node.js (TypeScript)**

| Factor | Node.js + TS | Python |
|--------|----------------|--------|
| **Fit with MedDocs** | The product already uses **Next.js** route handlers and JSON APIs today; a Node service matches runtime, hiring, and optional **shared types** (OpenAPI or `packages/types`). | Adds a second runtime and deploy story unless the team is Python-first. |
| **ORM & migrations** | **Prisma** or **Drizzle** + **PostgreSQL** | **SQLAlchemy 2** + **Alembic** + Postgres |
| **Heavy ML later** | Keep Node as the primary API; add a **Python worker** (queue-driven) only if you need training, custom models, or batch pipelines. | Prefer Python if the *core* product is data science, not document CRUD + Gemini proxying. |

**Practical split**

- **Primary service:** Node (TypeScript) — HTTP API, auth, Postgres, object storage orchestration, optional Gemini proxy.
- **Optional later:** Python worker for async jobs (Redis / SQS / BullMQ).

---

## 2. What the backend should own

| Domain | Scope |
|--------|--------|
| **Users / auth** | Sign-in, tokens or sessions, password hashing, refresh if using JWT — or delegate to an IdP (Auth0, Cognito, Clerk). |
| **Documents** | Metadata: name, mime, size, `owner_id`, `created_at`, `updated_at`, status, optional content hash. |
| **File blobs** | **Not** in Postgres at scale — use **object storage** (S3, GCS, MinIO); DB holds **bucket + key** (or signed URL policy). |
| **Analysis** | Persist **normalized JSON** (same shape your UI expects today) or a versioned schema; optional link to raw model payload in object storage. |
| **Audit** | Append-only events: who read/updated/deleted which resource (common for health-adjacent products). |

---

## 3. Database

- **PostgreSQL** — use **JSONB** for flexible `analysis` documents; relational tables for users, documents, audit rows.
- **Migrations** — Prisma Migrate or Drizzle Kit (pick one and stay consistent).
- **Files** — store binaries in object storage; DB only stores pointers and metadata.

---

## 4. Repository layout

**Option A — dedicated API repo (recommended to start)**

- `medical-analysis` — existing web app (consumer of your API).
- `medical-analysis-api` — Node + Postgres + storage SDK + OpenAPI (optional).

**Option B — monorepo**

```
apps/api/          # Express / Fastify / Nest
packages/types/    # shared DTOs / Zod schemas (optional)
```

---

## 5. Integration with the web app (high level)

No frontend file paths here — only **contracts** the new API should expose:

1. **Base URL** — e.g. `NEXT_PUBLIC_API_URL` on the client; server-side calls can use an internal URL.
2. **Auth** — either **Bearer JWT** after login or **opaque session** validated per request; align CORS and `credentials` if cookies cross origins.
3. **Analyze** — the web app now calls a **remote analyze service** from the browser (`NEXT_PUBLIC_ANALYZE_API_BASE_URL`), typically `POST …/api/v1/analyze` with **`multipart/form-data`** and repeated **`files`** parts; see `src/config/analyzeApi.js` and `src/lib/analyzeClient.js` in the frontend repo.
4. **Health** — `GET /health` or `/ready` for load balancers and k8s.

---

## 6. Scaffold a Node API (“base repo”)

There is no single official Node backend template; pick a framework and add Prisma or Drizzle.

| Stack | Start here | Good for |
|-------|------------|----------|
| **Fastify** | [Getting Started](https://fastify.dev/docs/latest/Guides/Getting-Started/) | Lean APIs, plugins, throughput |
| **NestJS** | [First steps](https://docs.nestjs.com/first-steps) — `npx @nestjs/cli new project` | Modules, DI, OpenAPI, Prisma integration |
| **Express** | [Application generator](https://expressjs.com/en/starter/generator.html) | Minimal surface; you add structure |
| **Hono** | [Node.js](https://hono.dev/docs/getting-started/nodejs) | Small core, edge-friendly patterns |

**ORM**

- [Prisma quickstart (PostgreSQL)](https://www.prisma.io/docs/getting-started/quickstart)
- [Drizzle + PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)

**Patterns and security**

- [nodebestpractices](https://github.com/goldbergyoni/nodebestpractices)

**Suggested default for MedDocs:** **Fastify or NestJS + Prisma + PostgreSQL** in `medical-analysis-api`.

---

## 7. Summary

| Topic | Choice |
|-------|--------|
| **Runtime** | Node.js + TypeScript |
| **Database** | PostgreSQL + Prisma or Drizzle |
| **Files** | Object storage; DB holds metadata + keys |
| **Repo** | New `medical-analysis-api` (or `apps/api` in a monorepo) |
| **Scaffold** | Fastify or NestJS CLI + Prisma |

---

*Backend-only guide for creating the API repository. Frontend structure and implemented features: [frontend.md](./frontend.md).*
