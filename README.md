# Qflow — Hospital Queue Management Platform

> A multi-tenant (SaaS) platform that digitises the hospital out-patient (OPD) journey:
> patients book/queue from a mobile app, while hospital staff (admin, receptionist, doctor)
> manage queues, patients and consultations in real time.

This document is a **full architectural review** of the codebase as it exists today. It is written
for a full-stack engineer who will (a) harden the app for production, (b) turn it into a real
multi-tenant SaaS, and (c) ship the patient app as an Android APK via Capacitor.

It contains:

1. [What this project is](#1-what-this-project-is)
2. [Repository structure](#2-repository-structure)
3. [Architecture (as-built)](#3-architecture-as-built)
4. [Data model](#4-data-model)
5. [Runtime / how to run it locally](#5-runtime--how-to-run-it-locally)
6. [Critical flaws & their fixes](#6-critical-flaws--their-fixes)
7. [Security checklist (healthcare-grade)](#7-security-checklist-healthcare-grade)
8. [What it takes to be a real SaaS](#8-what-it-takes-to-be-a-real-saas)
9. [Capacitor / Android APK plan](#9-capacitor--android-apk-plan)
10. [Target architecture (industry standard)](#10-target-architecture-industry-standard)
11. [Prioritised roadmap](#11-prioritised-roadmap)

---

## 1. What this project is

Qflow is a **monorepo** with three independently deployable apps:

| App | Stack | Audience | Notes |
|-----|-------|----------|-------|
| `backend` | Node.js, Express 5, TypeScript, Prisma, Socket.IO, Supabase | All clients | REST API + WebSocket gateway |
| `hospital-frontend` | Next.js 16 (App Router), React 19, Tailwind v4 | Hospital staff (admin / receptionist / doctor) | Web dashboard |
| `patient-frontend` | Next.js 16 (static `output: export`) + Capacitor | Patients | Web **and** Android APK |

Shared backing services:

- **PostgreSQL** (hosted on **Supabase**) accessed via **Prisma ORM**.
- **Supabase Auth** for credential verification / email confirmation.
- **Socket.IO** for live queue + notification broadcasts.
- **Firebase (FCM)** is scaffolded for push notifications (not yet implemented).

---

## 2. Repository structure

```
hospital queue final/
├── backend/                      # Express + Prisma API and Socket.IO gateway
│   └── src/
│       ├── app.ts                # Express app, route mounting, CORS
│       ├── server.ts             # HTTP + Socket.IO bootstrap
│       ├── config/               # env, supabase, firebase, queue config  (several are stubs)
│       ├── controllers/          # request handlers (auth, patient, doctor, admin, queue, …)
│       ├── services/             # business logic (auth implemented; many are stubs)
│       ├── routes/               # express routers
│       ├── middleware/           # auth (done); role/hospital/error (TODO stubs)
│       ├── queue/                # queue engine: manager/priority/allocator (TODO stubs)
│       ├── sockets/              # socket.io rooms + broadcast helpers
│       ├── validators/           # request validation (TODO stubs)
│       ├── utils/                # response helper, audit logger (stub), token gen (stub)
│       └── prisma/               # schema.prisma + client + seed
│
├── hospital-frontend/            # Next.js staff dashboard
│   └── src/
│       ├── app/                  # routes: dashboard, login, verify
│       ├── components/           # admin / doctor / receptionist / shared / shells
│       ├── contexts/             # Auth (MOCK), Socket, Theme
│       ├── services/             # api (axios), auth, socket, firebase
│       └── lib/                  # supabase, proxy (route guard)
│
└── patient-frontend/             # Next.js patient app (also the Capacitor source)
    ├── app/                      # routes: login, register, verify, /app/* feature screens
    ├── components/               # ui, shells, figma
    ├── services/                 # api/axios, auth, socket
    ├── lib/                      # supabase, proxy, utils
    ├── capacitor.config.ts       # Capacitor (appId com.medicore.qflow, webDir "out")
    ├── android/                  # generated native Android project
    └── out/                      # static export consumed by Capacitor
```

> Note: `capacitor.config.json` at the repo root (`com.qflow.app`, `webDir: "build"`) **conflicts**
> with `patient-frontend/capacitor.config.ts` (`com.medicore.qflow`, `webDir: "out"`). See §9.

---

## 3. Architecture (as-built)

### Request flow

```
[Patient APK / Web]  ─┐
[Staff Web Dashboard]─┤── HTTPS REST ──> Express (controllers → services → Prisma) ──> Postgres (Supabase)
                      └── WebSocket  ──> Socket.IO (rooms: patients/doctors/receptionists)
                                          │
Supabase Auth  <── credential verify ────┘
FCM (planned)  <── push notifications
```

### Auth flow (current)

1. `POST /api/auth/register` → backend calls Supabase Auth to create the user, then writes a row in
   `users` (and a `patients` row for patient role). `password_hash` is stored as the literal string
   `"SUPABASE_AUTH_DELEGATED"` (passwords live in Supabase, not in our DB).
2. `POST /api/auth/login` → backend verifies the password via `supabase.auth.signInWithPassword`,
   then **mints its own JWT** (`{ userId, email, role }`, 1-day expiry) signed with `JWT_SECRET`.
3. Clients store the JWT in **both** a (non-httpOnly) cookie and `localStorage`, and attach it as
   `Authorization: Bearer <jwt>` via an axios interceptor.
4. Protected backend routes use `authMiddleware`, which verifies the JWT and attaches `req.user`.

> There are effectively **two identity systems** (Supabase session + our own JWT) that are not
> reconciled. The frontend axios interceptor even calls a `/auth/refresh` endpoint that **does not
> exist** on the backend.

### Real-time

`sockets/index.ts` exposes `join_patient_room` / `join_doctor_room` / `join_receptionist_room` and a
`broadcastGlobalNotification(target, data)` helper. Rooms are **global per-role**, with **no
authentication** on the socket connection and **no per-hospital scoping** — every connected patient
receives every broadcast.

---

## 4. Data model

Defined in `backend/src/prisma/schema.prisma` (PostgreSQL). Core entities and relationships:

- `hospitals` — tenant root. Almost every table has a `hospital_id` FK (good — the multi-tenant
  *column* exists, it is just **not enforced** in queries yet).
- `users` — login identity (`role`, `status`, `hospital_id`, `password_hash`).
- Role tables linked 1:1 to `users`: `admins`, `doctors`, `receptionists`, `patients`.
- `departments`, `walk_in_patients`.
- Queue & clinical flow: `queue_tokens` → `consultations` → `lab_reports`, `billing_invoices`,
  `follow_up_consultations`.
- `notifications`.

Observations:

- IDs are `BigInt` autoincrement. This forces a global `BigInt.prototype.toJSON` monkey-patch so
  Express can serialise responses. Works, but leaks DB ids to clients and complicates everything.
- `patients` lacks a `created_at` (the API fakes `admitted: new Date()`), and several UI fields
  (`condition`, `address`) are mocked in the controller because they don't exist in the schema.
- No DB-level uniqueness on `users.email`, no composite tenant indexes, no soft-delete, no
  `updated_at` timestamps.

---

## 5. Runtime / how to run it locally

Each app is installed and run separately.

```bash
# Backend (http://localhost:5000)
cd backend
npm install
npx prisma generate
npm run dev

# Hospital dashboard (http://localhost:3000)
cd hospital-frontend
npm install
npm run dev

# Patient app (web dev)
cd patient-frontend
npm install
npm run dev
```

Environment variables currently referenced:

- **backend**: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `PORT`.
- **frontends**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> `backend/src/config/env.ts` is a `// TODO` stub — there is **no centralised, validated env config**.
> Env vars are read ad-hoc via `process.env.*` with insecure fallbacks.

---

## 6. Critical flaws & their fixes

Ordered roughly by severity. These are **blocking** for any production / SaaS launch.

### 6.1 No tenant isolation (multi-tenancy is not enforced) — **CRITICAL**
- **What:** Queries like `getAllPatients` run `prisma.patients.findMany()` with **no `hospital_id`
  filter**, returning every patient of every hospital. The JWT payload doesn't even include
  `hospitalId`, so the API *can't* scope by tenant today.
- **Why it matters:** This is a cross-tenant data breach — the #1 SaaS failure mode, and with health
  data it is also a regulatory breach.
- **Fix:**
  - Add `hospitalId` to the JWT claims at login.
  - Add a `tenantScope` middleware that puts `req.hospitalId` on every request.
  - Make **every** Prisma query filter by `hospital_id` (centralise via a repository layer or Prisma
    `$extends`/client extension that injects the tenant filter).
  - Enable **Postgres Row-Level Security (RLS)** as defence-in-depth.

### 6.2 Authorization (RBAC) is missing — **CRITICAL**
- **What:** `role.middleware.ts` and `hospital.middleware.ts` are empty `// TODO` files. Sensitive
  routes have **no auth at all**: `admin.routes.ts` (create/delete receptionists), `queue.routes.ts`,
  and the admin/receptionist patient routes (`POST /api/patients`, `DELETE /api/patients/:id`,
  `GET /api/patients`) are completely open. Anyone can delete any patient by UHID without a token.
- **Fix:** Implement `requireAuth` + `requireRole('admin'|'receptionist'|'doctor')` and apply to
  every route. Default to deny. Combine with tenant scoping (6.1).

### 6.3 Hardcoded secrets & weak JWT default — **CRITICAL**
- **What:** `JWT_SECRET` falls back to the literal `'supersecretjwtkey_change_me'` in both
  `auth.middleware.ts` and `auth.service.ts`. If `JWT_SECRET` isn't set, anyone can forge admin
  tokens. `.env.local` with live Supabase keys is present in the working tree.
- **Fix:** Fail fast on missing `JWT_SECRET` (no fallback). Validate all env at boot (see §6.10).
  Rotate any committed keys. Keep secrets out of the repo and out of client bundles.

### 6.4 Mock / bypass authentication left in the app — **CRITICAL**
- **What:**
  - `hospital-frontend/src/contexts/AuthContext.tsx` **auto-logs-in a mock admin** and stores
    `firebaseToken: "mock-token-auth-bypass"`. There is no real staff login.
  - `patient-frontend/app/dev-bypass/page.tsx` sets a fake session (`dev-bypass-token-123`) and walks
    straight into the app.
  - `auth.service.ts` branches on a hardcoded personal email (`dhruvraj4872@gmail.com`) and
    auto-confirms every other user, bypassing email verification.
- **Fix:** Delete `dev-bypass`, replace the mock `AuthContext` with the real login, and remove the
  hardcoded-email branch. Gate any dev-only helpers behind `NODE_ENV !== 'production'` **and** strip
  them from production builds.

### 6.5 Wide-open CORS & unauthenticated WebSockets — **HIGH**
- **What:** `app.use(cors())` allows all origins; Socket.IO uses `origin: '*'` and accepts any
  connection (the `auth.token` sent by the client is never verified server-side).
- **Fix:** Restrict CORS to an allow-list of known origins (web app + Capacitor origin). Authenticate
  the socket handshake with the JWT in `io.use(...)`, then join the user to a **hospital-scoped** room.

### 6.6 Tokens in `localStorage` (XSS-exfiltratable) — **HIGH**
- **What:** JWTs are stored in `localStorage` and non-httpOnly cookies. Any XSS can steal them.
- **Fix (web):** Prefer httpOnly, Secure, SameSite cookies set by the backend. **Capacitor caveat:**
  in a native shell cross-site cookie semantics differ, so for the APK store tokens in
  `@capacitor/preferences` / SecureStorage rather than `localStorage`. Implement real access/refresh
  rotation (the refresh endpoint the client expects doesn't exist yet).

### 6.7 Core queue engine is unimplemented — **HIGH (functional)**
- **What:** `queueManager.ts`, `priorityEngine.ts`, `tokenAllocator.ts`, `waitTimeCalculator.ts` and
  `queue.service.ts` are all `// TODO`. The queue dashboard returns **hardcoded fallback numbers**
  (`waiting: 24`, etc.). The product's headline feature does not exist server-side.
- **Fix:** Implement token allocation, priority scoring (senior citizen / emergency), position
  recalculation, and wait-time estimation as a tested service; emit `queue:update` over sockets on
  every state change.

### 6.8 No input validation — **HIGH**
- **What:** `validators/*` are stubs. Controllers read `req.body` directly and pass it to Prisma.
  `appointment.controller.ts` and `report.controller.ts` are referenced but `appointment.routes.ts`
  is a stub.
- **Fix:** Validate/parse every request with **Zod** (or similar) at the route boundary; reject
  unknown fields; never spread raw `req.body` into Prisma `create`/`update`.

### 6.9 No error handling, logging, or audit trail — **HIGH**
- **What:** `error.middleware.ts` and `utils/auditLogger.ts` are stubs. Controllers leak raw
  `error.message` to clients (information disclosure). No structured logs, no request IDs.
- **Fix:** Central error middleware that maps errors to safe responses + logs internally. Structured
  logging (pino). For healthcare, an **append-only audit log** of who accessed/changed which patient
  record is effectively mandatory.

### 6.10 No security middleware / hardening — **HIGH**
- **What:** No `helmet`, no rate limiting, no body-size limits, no HPP protection, no request timeouts.
- **Fix:** Add `helmet`, `express-rate-limit` (especially on `/auth/*`), JSON body size caps, and a
  validated config module (`env.ts`) using Zod that fails fast on missing/invalid vars.

### 6.11 "Auto-heal" side effects & magic fallbacks — **MEDIUM**
- **What:** `getProfile`/`updateProfile` silently **create** patient records; bookings fall back to
  `doctor_id = 1`, `primary_doctor_id = 1`; notifications fall back to "the first hospital." These
  hide bugs and corrupt data in a multi-tenant world.
- **Fix:** Make reads pure; create records explicitly during registration; never default foreign keys
  to `1`. Resolve tenant/doctor from authenticated context.

### 6.12 Bleeding-edge dependency versions — **MEDIUM**
- **What:** Express 5, Next 16, React 19, Tailwind 4, Prisma 6, TypeScript 6. Some are very new;
  `hospital-frontend` and `patient-frontend` also pin **different** `lucide-react`/motion versions.
- **Fix:** Pin and align versions across apps, add a lockfile policy, and schedule dependency
  updates (Renovate/Dependabot). Verify each major is actually GA, not a pre-release.

---

## 7. Security checklist (healthcare-grade)

Patient data is **PHI/sensitive personal data**. In India this falls under the **DPDP Act 2023** (and
hospitals often align with ABDM/NDHM); equivalents elsewhere are HIPAA (US) / GDPR (EU). Treat the
following as requirements, not nice-to-haves:

- [ ] Enforce tenant isolation in code **and** with Postgres RLS.
- [ ] Real RBAC on every route; deny by default.
- [ ] Strong, mandatory `JWT_SECRET`; short-lived access tokens + rotating refresh tokens.
- [ ] httpOnly+Secure cookies (web) / secure storage (native); never tokens in `localStorage`.
- [ ] TLS everywhere; HSTS; no `cleartext` traffic in production.
- [ ] `helmet`, rate limiting, body-size limits, CORS allow-list, authenticated sockets.
- [ ] Input validation (Zod) + output encoding; parameterised queries (Prisma covers this).
- [ ] Encryption at rest (Supabase/Postgres) and field-level encryption for the most sensitive fields.
- [ ] Append-only **audit logging** of PHI access and changes.
- [ ] Secrets in a manager (not in `.env` committed); rotate the keys currently in the tree.
- [ ] Data lifecycle: retention policy, soft-delete, right-to-erasure, consent capture.
- [ ] Dependency scanning (`npm audit`, Dependabot) + SAST/secret scanning in CI.
- [ ] Backups + tested restore; disaster-recovery runbook.
- [ ] Remove all dev bypasses and mock auth from production builds.

---

## 8. What it takes to be a real SaaS

The schema is tenant-aware (every table has `hospital_id`), which is a great start. To become a true
multi-tenant SaaS you still need:

1. **Tenant context everywhere** — resolve `hospital_id` from the authenticated user on every request
   and force it into every query (see §6.1). This is the foundation.
2. **Tenant onboarding & lifecycle** — self-serve hospital sign-up, provisioning, admin invite flow,
   suspend/cancel, per-tenant configuration (working hours, departments, branding).
3. **Subscription & billing** — plans, seats, usage metering, payment provider (Razorpay/Stripe),
   invoices, dunning. (Note: the existing `billing_invoices` table is *patient* billing, not SaaS
   subscription billing — keep them separate.)
4. **Role & permission model** — beyond the four roles, support per-tenant custom permissions
   (the `admins.permissions` JSON column hints at this; nothing reads it yet).
5. **Observability** — centralised logs, metrics, tracing, error tracking (Sentry), uptime alerts,
   per-tenant usage dashboards.
6. **Scalability** — stateless API behind a load balancer; move Socket.IO to a **Redis adapter** so
   real-time works across multiple instances; connection pooling (PgBouncer / Supabase pooler — note
   the schema already separates `DATABASE_URL` from `DIRECT_URL` for this).
7. **Environments & CI/CD** — dev/staging/prod, automated migrations (`prisma migrate deploy`),
   automated tests, blue-green or canary deploys.
8. **Tooling** — proper config validation, feature flags, background jobs/queues (BullMQ) for emails,
   FCM pushes, and queue recalculation.
9. **Tests** — there are currently **none**. Add unit tests (queue engine, auth), integration tests
   (API + DB), and a few E2E flows.

---

## 9. Capacitor / Android APK plan

The patient app is the one shipping as an APK. It is already set up for static export
(`next.config.ts` → `output: "export"`, Capacitor `webDir: "out"`), which is the correct approach.
Key implications and fixes:

### 9.1 Resolve the conflicting Capacitor configs
There are two: root `capacitor.config.json` (`appId com.qflow.app`, `webDir build`) and
`patient-frontend/capacitor.config.ts` (`appId com.medicore.qflow`, `webDir out`). The native
`android/` project is under `patient-frontend`. **Pick one appId, delete the root config**, and keep
the Capacitor config co-located with the patient app.

### 9.2 Remove dev-only networking before release
`capacitor.config.ts` currently has:
```ts
server: { cleartext: true, allowNavigation: ['192.168.1.9', '192.168.1.9:5000'] }
```
This points the APK at a developer's LAN IP over **plain HTTP**. For a real build:
- Remove `server.cleartext` and the LAN `allowNavigation`.
- Point `NEXT_PUBLIC_API_URL` at a **public HTTPS** API domain.
- Configure Android network security to disallow cleartext.

### 9.3 Static-export consequences (already in effect)
- No Next.js SSR, middleware, or server route protection — **all** auth/guarding happens client-side
  (`RouteGuard`). The backend must therefore be the real security boundary (it currently isn't; see §6).
- All data fetching is client-side via axios to `NEXT_PUBLIC_API_URL`.

### 9.4 Native concerns to plan for
- **Token storage:** use `@capacitor/preferences` / secure storage, not `localStorage` (§6.6).
- **Push notifications:** wire `@capacitor/push-notifications` + FCM (the backend `firebase/` is stubbed).
- **Deep links / app URL scheme**, splash screen, app icons, permissions.
- **Release signing:** generate a keystore, configure `signingConfigs`, build a signed AAB/APK, and
  set up Play Console. Never commit the keystore.
- **CORS / origin:** the WebView origin (`https://localhost` or `capacitor://`) must be in the backend
  CORS allow-list and socket origin list.

### 9.5 Build pipeline
```bash
cd patient-frontend
npm run build          # next build → static export into ./out
npx cap sync android   # copy web assets + plugins into android/
npx cap open android    # build/sign in Android Studio  (or ./gradlew assembleRelease)
```

---

## 10. Target architecture (industry standard)

A pragmatic, layered target that this codebase can evolve into without a rewrite:

```
backend/src/
├── config/        # validated env (Zod), constants
├── middleware/    # auth, tenantScope, rbac, validate(zodSchema), errorHandler, rateLimit
├── modules/       # feature-first: each owns route + controller + service + repository + dto/schema
│   ├── auth/
│   ├── patients/
│   ├── queue/
│   ├── appointments/
│   ├── notifications/
│   └── admin/
├── infra/         # prisma client, redis, socket.io (with redis adapter), fcm, supabase
├── jobs/          # background workers (emails, push, queue recompute) via BullMQ
└── shared/        # response envelope, errors, logger (pino), audit logger
```

Principles:
- **Controllers stay thin**; business logic in services; DB access in repositories.
- **Tenant + auth context** injected by middleware and threaded through every layer.
- **Validation at the edge** (Zod) → typed DTOs inward.
- **One consistent response envelope** and **one central error handler**.
- **Real-time and background work** decoupled via Redis so the API scales horizontally.
- **Frontends** keep the `services/` (API) + `contexts/` pattern they already use, but back it with
  real auth and a typed API client.

---

## 11. Prioritised roadmap

**Phase 0 — Stop the bleeding (security):**
1. Remove mock auth + `dev-bypass` + hardcoded-email branch.
2. Mandatory `JWT_SECRET`, validated env config, rotate committed keys.
3. Add `requireAuth` + `requireRole` to every route; lock down CORS and sockets.
4. Enforce `hospital_id` scoping on every query; add `hospitalId` to JWT.

**Phase 1 — Make it correct:**
5. Zod validation + central error handler + structured logging + audit log.
6. Implement the real auth/refresh-token flow.
7. Implement the queue engine (allocation, priority, wait time) with tests.

**Phase 2 — Make it a SaaS:**
8. Tenant onboarding, subscription/billing, per-tenant config & permissions.
9. Redis-backed sockets, background jobs, observability (Sentry/metrics), CI/CD + migrations.

**Phase 3 — Ship the APK:**
10. Single Capacitor config, HTTPS API, secure native token storage, FCM push, signed release.

---

*This README is a living architecture/decision document. Update it as the above items are completed.*
