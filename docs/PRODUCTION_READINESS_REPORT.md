# CrestCare CRM — Complete Production Readiness Report
> Generated: 2026-05-06 | Analyst: Antigravity AI | Branch: saas-v3

---

# 1. PROJECT SUMMARY

## What This SaaS Does

CrestCare CRM is a **multi-tenant AI-powered Hospital Patient Conversion System** built on Next.js 16. It replaces a traditional CRM with an automated WhatsApp-first patient intake pipeline. When a patient sends a WhatsApp message (typically from a Facebook Ad), the system:

1. Receives the message via Meta Webhook
2. Queues it in BullMQ (Redis-backed)
3. Runs a 7-layer compliance engine (intent classify → risk score → policy check → AI reply → sanitize → disclaimer → failsafe)
4. Generates a contextual AI reply using OpenAI GPT-4o-mini + RAG (pgvector knowledge base)
5. Sends the reply back via WhatsApp Business API
6. Creates/updates a Lead record in PostgreSQL (Supabase)
7. Surfaces the lead on the staff dashboard for calling and conversion tracking

## User Flow
```
Patient → WhatsApp → Meta Webhook → BullMQ Worker → AI Engine → WhatsApp Reply
                                                    ↓
                                          Lead created in DB
                                                    ↓
                              Staff Dashboard → Call → Outcome logged
```

## Hospital (Tenant) Flow
```
Super Admin creates Org → Admin logs in → Onboarding (3 steps) → 
Hospital Name + WhatsApp Credentials + First Doctor → Dashboard Live
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 + pg adapter |
| Vector Search | pgvector (Supabase extension) |
| Auth | NextAuth v4 (JWT, Credentials) |
| AI | OpenAI GPT-4o-mini + text-embedding-3-small |
| WhatsApp | Meta Cloud API v19.0 |
| Queue | BullMQ + IORedis |
| Styling | Tailwind CSS v4 |
| PWA | @ducanh2912/next-pwa |
| Hosting Target | Vercel (serverless) |

## Architecture Scalability

- ✅ Multi-tenant via `organizationId` on every model
- ✅ Per-org WhatsApp credentials (encrypted AES-256-CBC)
- ✅ Per-org RAG knowledge base
- ✅ Subdomain-aware middleware (x-tenant-subdomain header)
- ⚠️ BullMQ Worker runs as a SEPARATE Node.js process — not compatible with Vercel serverless
- ⚠️ Doctor schedules and hospital info hardcoded in `lib/ai.ts` (not multi-tenant)
- ⚠️ `getDefaultOrganizationId()` hardcoded to "Crest Care Hospital" — fallback leaks single-tenant assumptions

## Production Readiness Score: **61 / 100**

| Area | Score |
|---|---|
| Auth & RBAC | 80/100 |
| Multi-tenancy | 65/100 |
| WhatsApp Integration | 75/100 |
| AI / Compliance | 70/100 |
| Database Design | 75/100 |
| Security | 45/100 |
| Deployment Readiness | 40/100 |
| Background Jobs | 30/100 |
| Observability | 20/100 |
| Environment Config | 50/100 |

---

# 2. DEPLOYMENT READINESS CHECKLIST

## ✅ Already Production Ready

- [x] NextAuth JWT session with role-based middleware
- [x] Prisma ORM with Supabase PostgreSQL connection
- [x] Multi-tenant organizationId isolation on all DB models
- [x] WhatsApp webhook GET (verification) + POST (message ingestion)
- [x] BullMQ queue with jobId deduplication
- [x] 7-layer compliance engine (classify → risk → policy → AI → sanitize → disclaimer → failsafe)
- [x] Per-org WhatsApp credentials stored encrypted (AES-256-CBC)
- [x] Super Admin dashboard with org health overview
- [x] Organization impersonation (JWT-based audit trail)
- [x] 3-step onboarding flow for new hospital admins
- [x] Follow-up cron endpoint (`/api/cron/followup`) with CRON_SECRET guard
- [x] PWA support (`@ducanh2912/next-pwa`)
- [x] Lead priority sorting (HOT → WARM → COLD)
- [x] Credential health monitoring (lastSuccessAt, failureCount)
- [x] Retry logic in WhatsApp sender (exponential backoff, 3 attempts)
- [x] Message deduplication via `messageId` unique field

## ⚠️ Partially Ready

- [ ] **BullMQ Worker** — exists in `scripts/worker.ts` but requires a separate long-running Node process. Vercel cannot run this. Needs Railway/Render/VPS or Vercel Fluid Compute workaround.
- [ ] **ENCRYPTION_KEY** — falls back to `crypto.randomBytes(32)` if env var missing. This means every server restart generates a new key and breaks all decryption of stored tokens.
- [ ] **NEXTAUTH_SECRET** — hardcoded fallback `"fallback-secret-for-dev"` in both `middleware.ts` and `[...nextauth]/route.ts`. Will work but is a security risk in production.
- [ ] **CRON_SECRET** — defaults to `"crestcare-cron"` if not set. Predictable default.
- [ ] **Onboarding** — stores WhatsApp access token in DB **unencrypted** (the `encrypt()` function is not called in `api/onboarding/route.ts`).
- [ ] **Knowledge Base** — seeded with Crest Care-specific data. New tenants start with no RAG data.
- [ ] **Subdomain routing** — middleware extracts subdomain but no routing logic consumes it dynamically.
- [ ] **Supabase client** (`lib/supabase.ts`) — initialized but Supabase Auth is unused; NextAuth is used instead.

## ❌ Missing / Blockers

- [ ] **REDIS_URL** env variable not set → BullMQ falls back to `localhost:6379` which will crash on Vercel
- [ ] **NEXTAUTH_URL** env variable not set in any env file → NextAuth will fail in production
- [ ] **NEXTAUTH_SECRET** not set as a real secret → predictable session tokens
- [ ] **ENCRYPTION_KEY** not set → rotating random key on restart = cannot decrypt stored WhatsApp tokens
- [ ] **Rate limiting** — no rate limiting on any API route, including `/api/webhook`
- [ ] **Webhook signature validation** — Meta sends an `X-Hub-Signature-256` header; the code does NOT verify it. Anyone can POST fake events.
- [ ] **Missing migrations folder** — no `prisma/migrations/` directory. Schema pushed via `prisma db push`. This is NOT safe for production (no rollback, no audit trail).
- [ ] **Worker deployment strategy** — no Dockerfile, no PM2 config, no Railway/Render config for the BullMQ worker
- [ ] **Error monitoring** — no Sentry, no LogRocket, no structured logging
- [ ] **`getDefaultOrganizationId()`** hardcoded to "Crest Care Hospital" — will auto-create this org for any unknown tenant, polluting the database
- [ ] **Doctor data hardcoded** in `lib/ai.ts` (names, schedules, fees) — not multi-tenant

---

# 3. ENVIRONMENT VARIABLES AUDIT

## Complete Variable Map

### DATABASE_URL
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```
- **Purpose:** Prisma runtime connection (pooled, serverless-safe)
- **Where to get:** Supabase Dashboard → Settings → Database → Connection String → Pooling mode (port 6543)
- **Required?:** ✅ CRITICAL — app crashes without it
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO
- **Current status:** SET (but raw DB password exposed in .env files)

---

### DIRECT_URL
```
DIRECT_URL=postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
```
- **Purpose:** Direct DB connection for Prisma migrations (`prisma db push`)
- **Where to get:** Supabase Dashboard → Settings → Database → Connection String → Direct mode (port 5432)
- **Required?:** ✅ For migrations only
- **Frontend or Backend:** Backend / CLI only
- **Safe for client?:** ❌ NO
- **Current status:** SET

---

### NEXTAUTH_SECRET
```
NEXTAUTH_SECRET=your-long-random-secret-min-32-chars
```
- **Purpose:** Signs and verifies all JWT session tokens
- **Where to get:** Run `openssl rand -base64 32` in terminal
- **Required?:** ✅ CRITICAL in production
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO — NEVER expose
- **Current status:** ❌ NOT SET — code uses `"fallback-secret-for-dev"` hardcoded

---

### NEXTAUTH_URL
```
NEXTAUTH_URL=https://your-domain.vercel.app
```
- **Purpose:** Tells NextAuth the canonical base URL for redirects and callbacks
- **Where to get:** Your Vercel deployment URL or custom domain
- **Required?:** ✅ CRITICAL in production (NextAuth breaks without it on Vercel)
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO
- **Current status:** ❌ MISSING from all env files

---

### OPENAI_API_KEY
```
OPENAI_API_KEY=sk-proj-...
```
- **Purpose:** Powers GPT-4o-mini chat replies and text-embedding-3-small for RAG
- **Where to get:** platform.openai.com → API Keys
- **Required?:** ✅ CRITICAL — AI replies and vector search fail without it
- **Frontend or Backend:** Backend only (server-side fetch)
- **Safe for client?:** ❌ NO
- **Current status:** SET but **EXPOSED IN PLAIN TEXT** in `.env`, `.env.local`, `.env.saas` — all committed files

---

### WHATSAPP_TOKEN
```
WHATSAPP_TOKEN=EAAG...
```
- **Purpose:** Default Meta Cloud API access token (fallback for orgs without DB credentials)
- **Where to get:** Meta for Developers → Your App → WhatsApp → API Setup
- **Required?:** ⚠️ Required as fallback until all orgs have DB credentials
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO
- **Current status:** SET but **EXPOSED IN PLAIN TEXT** in committed env files

---

### WHATSAPP_VERIFY_TOKEN
```
WHATSAPP_VERIFY_TOKEN=your-custom-verify-token
```
- **Purpose:** Validates Meta's GET request during webhook setup
- **Where to get:** You set this yourself, then enter same value in Meta webhook config
- **Required?:** ✅ CRITICAL — webhook verification fails without it
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO
- **Current status:** SET but exposed in committed files

---

### PHONE_NUMBER_ID
```
PHONE_NUMBER_ID=1234567890
```
- **Purpose:** Default Meta phone number ID for sending messages (global fallback)
- **Where to get:** Meta for Developers → WhatsApp → API Setup
- **Required?:** ⚠️ Fallback only
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO
- **Current status:** SET

---

### ENCRYPTION_KEY
```
ENCRYPTION_KEY=64-char-hex-string-generated-with-openssl-rand-hex-32
```
- **Purpose:** AES-256-CBC key for encrypting WhatsApp access tokens stored in DB
- **Where to get:** Run `openssl rand -hex 32` in terminal. Save this ONCE and never change it.
- **Required?:** ✅ CRITICAL — without this, every restart generates a new random key, breaking decryption of all stored tokens
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO
- **Current status:** ❌ MISSING — falls back to `crypto.randomBytes(32)` (DANGEROUS)

---

### REDIS_URL
```
REDIS_URL=redis://default:password@your-redis-host:6379
```
- **Purpose:** BullMQ connection for webhook job queue
- **Where to get:** Upstash (Vercel marketplace), Railway, or Redis Cloud
- **Required?:** ✅ CRITICAL — BullMQ crashes on `localhost:6379` in production
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO
- **Current status:** ❌ MISSING — falls back to localhost

---

### CRON_SECRET
```
CRON_SECRET=your-random-cron-secret
```
- **Purpose:** Secures the `/api/cron/followup` endpoint from unauthorized calls
- **Where to get:** Generate any random string (`openssl rand -base64 24`)
- **Required?:** ✅ Recommended — defaults to `"crestcare-cron"` which is guessable
- **Frontend or Backend:** Backend only
- **Safe for client?:** ❌ NO
- **Current status:** ⚠️ NOT SET — predictable default used

---

### NEXT_PUBLIC_SUPABASE_URL
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```
- **Purpose:** Supabase JS client URL (currently unused in auth flow but present for future Realtime)
- **Where to get:** Supabase Dashboard → Settings → API → Project URL
- **Required?:** ⚠️ Optional currently
- **Frontend or Backend:** Both (NEXT_PUBLIC = client-visible)
- **Safe for client?:** ✅ YES — public URL
- **Current status:** SET

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```
- **Purpose:** Supabase anonymous key for client-side SDK
- **Where to get:** Supabase Dashboard → Settings → API → anon/public key
- **Required?:** ⚠️ Optional currently
- **Frontend or Backend:** Both (client-visible)
- **Safe for client?:** ✅ YES — anon key is designed to be public
- **Current status:** SET

---

### NEXT_PUBLIC_APP_MODE
```
NEXT_PUBLIC_APP_MODE=saas
```
- **Purpose:** Signals to client code that the app is in SaaS multi-tenant mode
- **Where to get:** Set manually
- **Required?:** ⚠️ Optional
- **Frontend or Backend:** Client-side only
- **Safe for client?:** ✅ YES
- **Current status:** SET in `.env.saas` only

---

### SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
```
SUPER_ADMIN_EMAIL=superadmin@yourplatform.com
SUPER_ADMIN_PASSWORD=StrongPassword123!
```
- **Purpose:** Used by `scripts/create-super-admin.ts` to seed the initial super admin
- **Where to get:** You define these
- **Required?:** ✅ Required at launch to create first super admin
- **Frontend or Backend:** CLI / scripts only
- **Safe for client?:** ❌ NO
- **Current status:** ❌ MISSING — script falls back to `superadmin@platform.com` / `SuperAdmin123!`

---

## Security Issues Detected

| Issue | Severity | File |
|---|---|---|
| Real OpenAI API key in committed `.env` files | 🔴 CRITICAL | `.env`, `.env.local`, `.env.saas` |
| Real WhatsApp tokens in committed `.env` files | 🔴 CRITICAL | `.env`, `.env.local`, `.env.saas` |
| Real DB passwords in committed `.env` files | 🔴 CRITICAL | `.env`, `.env.local`, `.env.saas` |
| Hardcoded fallback NEXTAUTH_SECRET in code | 🔴 CRITICAL | `middleware.ts`, `[...nextauth]/route.ts`, `impersonate/route.ts` |
| ENCRYPTION_KEY missing → random key on restart | 🔴 CRITICAL | `lib/encryption.ts` |
| NEXTAUTH_URL missing | 🔴 CRITICAL | All env files |
| REDIS_URL missing → localhost fallback on Vercel | 🔴 CRITICAL | `lib/queue.ts`, `scripts/worker.ts` |
| WhatsApp token stored unencrypted on onboarding | 🔴 HIGH | `app/api/onboarding/route.ts` |
| Webhook POST has no X-Hub-Signature-256 verification | 🔴 HIGH | `app/api/webhook/route.ts` |
| No rate limiting on any API route | 🟠 HIGH | All API routes |
| CRON_SECRET defaults to predictable string | 🟡 MEDIUM | `app/api/cron/followup/route.ts` |
| `getDefaultOrganizationId()` hardcoded org name | 🟡 MEDIUM | `lib/db/organization.ts` |

---

# 4. STEP-BY-STEP VERCEL DEPLOYMENT GUIDE

## Prerequisites
- GitHub account with the `cicrm` repo pushed
- Vercel account (vercel.com)
- Supabase project (already exists)
- Upstash Redis account (upstash.com) — free tier is enough to start
- OpenAI account with API key
- Meta WhatsApp Business API configured

---

## Step 1 — Prepare Your Repository

**Before deploying, rotate all exposed secrets:**
```bash
# 1. Revoke current OpenAI key at platform.openai.com → API Keys → Delete
# 2. Revoke current WhatsApp token at developers.facebook.com → Your App → WhatsApp
# 3. Change your Supabase DB password: Supabase → Settings → Database → Reset Password
# 4. Generate new secrets:
openssl rand -base64 32     # → NEXTAUTH_SECRET
openssl rand -hex 32        # → ENCRYPTION_KEY
openssl rand -base64 24     # → CRON_SECRET
```

**Ensure `.gitignore` includes all env files:**
```gitignore
.env
.env.local
.env.saas
.env.production
```

---

## Step 2 — Set Up Upstash Redis (Required for BullMQ)

1. Go to [upstash.com](https://upstash.com) → Create Account
2. Click **Create Database** → Choose region closest to your Supabase region
3. After creation, click the database → **Details** tab
4. Copy the **Redis URL** (format: `rediss://default:password@host.upstash.io:6379`)
5. Save this as `REDIS_URL`

> ⚠️ **Important:** Upstash Redis with BullMQ requires the `rediss://` (TLS) URL, not `redis://`

---

## Step 3 — Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) → Click **Add New → Project**
2. Click **Import Git Repository** → Connect GitHub if not connected
3. Search for `cicrm` → Click **Import**
4. **Framework Preset:** Select `Next.js` (auto-detected)
5. **Root Directory:** Leave as `./` (project root)
6. **Build Command:** `npm run build` (or leave default)
7. **Output Directory:** `.next` (leave default)
8. **Node.js Version:** Set to `20.x` in Project Settings → General after deployment

---

## Step 4 — Add Environment Variables in Vercel

In the **Configure Project** screen, expand **Environment Variables** and add ALL of the following:

| Variable | Value | Environment |
|---|---|---|
| `DATABASE_URL` | Your Supabase pooling URL (port 6543) | Production, Preview |
| `DIRECT_URL` | Your Supabase direct URL (port 5432) | Production |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` | Production, Preview |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | Production |
| `OPENAI_API_KEY` | Your new OpenAI key | Production, Preview |
| `WHATSAPP_TOKEN` | Your new Meta access token | Production |
| `WHATSAPP_VERIFY_TOKEN` | Any string you define (e.g. `crestcare_wh_2026`) | Production |
| `PHONE_NUMBER_ID` | Your Meta Phone Number ID | Production |
| `ENCRYPTION_KEY` | Output of `openssl rand -hex 32` | Production |
| `REDIS_URL` | Upstash Redis URL (`rediss://...`) | Production |
| `CRON_SECRET` | Output of `openssl rand -base64 24` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | All |
| `NEXT_PUBLIC_APP_MODE` | `saas` | All |

**How to add each one:**
1. Type the variable name in the **Name** field
2. Paste the value in the **Value** field
3. Select environment: **Production** (and **Preview** if needed)
4. Click **Add**

---

## Step 5 — Deploy

1. Click **Deploy** button
2. Wait 2-5 minutes for build to complete
3. If build fails: Click **View Build Logs** → look for the error at the bottom

**Common build errors and fixes:**
- `prisma generate failed` → Ensure `postinstall` script runs (`prisma generate` is in package.json ✅)
- `Cannot find module 'ioredis'` → Not a build error; Redis is runtime only
- `NEXTAUTH_URL not set` → Add it in environment variables

---

## Step 6 — Update NEXTAUTH_URL

After first deployment:
1. Copy your Vercel URL (e.g. `https://cicrm-abc123.vercel.app`)
2. Go to Project → **Settings** → **Environment Variables**
3. Edit `NEXTAUTH_URL` → paste your actual URL
4. Click **Save** → **Redeploy** (Deployments tab → ⋮ → Redeploy)

If you have a custom domain:
- Go to Project → **Settings** → **Domains** → Add domain
- Update `NEXTAUTH_URL` to `https://your-custom-domain.com`

---

## Step 7 — Configure Meta Webhook

After Vercel deployment:
1. Go to [Meta for Developers](https://developers.facebook.com) → Your App → WhatsApp → Configuration
2. Under **Webhook**, click **Edit**
3. **Callback URL:** `https://your-domain.vercel.app/api/webhook`
4. **Verify Token:** Same value as your `WHATSAPP_VERIFY_TOKEN` env variable
5. Click **Verify and Save**
6. Under **Webhook Fields**, subscribe to: `messages`

---

## Step 8 — Deploy the BullMQ Worker (Separate from Vercel)

> ⚠️ This is the **most critical deployment step**. The worker CANNOT run on Vercel.

### Option A — Railway (Recommended)
1. Go to [railway.app](https://railway.app) → New Project
2. Select **Deploy from GitHub** → same repo
3. Set **Start Command:** `npx tsx scripts/worker.ts`
4. Add the same env variables (DATABASE_URL, REDIS_URL, OPENAI_API_KEY, WHATSAPP_TOKEN, etc.)
5. Railway will run it as a persistent background process

### Option B — Render.com
1. New Service → Background Worker
2. Build command: `npm install && npm run db:generate`
3. Start command: `npx tsx scripts/worker.ts`
4. Add env variables

---

## Step 9 — Set Up Vercel Cron Job

Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/followup",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

This runs the follow-up cron every 30 minutes. Vercel will call the endpoint with the `Authorization: Bearer CRON_SECRET` header automatically if you configure it in Vercel's cron settings.

> Note: Vercel Cron does NOT automatically add auth headers. You'll need to call it from an external cron service (cron-job.org) with the header: `Authorization: Bearer YOUR_CRON_SECRET`

---

## Step 10 — Create Super Admin

After Vercel deployment, run locally with production env:
```bash
# Copy production env vars to .env.production.local temporarily
SUPER_ADMIN_EMAIL=admin@yourhospital.com npm run create:super-admin
```

Or add to Railway as a one-time run command.

---

# 5. DATABASE & BACKEND SETUP GUIDE

## Database Used
- **PostgreSQL** hosted on **Supabase**
- ORM: **Prisma 7** with `@prisma/adapter-pg` (serverless-compatible)
- Extension: **pgvector** (for AI embeddings / RAG knowledge base)

## Schema Management Strategy
> ⚠️ Currently using `prisma db push` (no migration files). This is acceptable for early development but risky in production.

## Initial Setup (One-time)

### Step 1: Enable pgvector in Supabase
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Push Schema to Production DB
```bash
# Set your PRODUCTION database URLs in .env temporarily
DATABASE_URL="..." DIRECT_URL="..." npx prisma db push
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```
This runs automatically on `npm install` via `postinstall` script ✅

### Step 4: Verify Tables Were Created
```sql
-- Run in Supabase SQL Editor → Table Editor
-- Expect these tables:
-- organizations, users, staff, leads, messages,
-- call_logs, knowledge_chunks, doctors, settings,
-- whatsapp_numbers, whatsapp_credentials
```

## Seeding Knowledge Base
```bash
# Run this once per hospital to populate the RAG knowledge base
npm run seed:knowledge
```
> ⚠️ Current seed data is specific to Crest Care Hospital. For new tenants, create custom seed data.

## Migration Strategy (Recommended for Production)

To switch from `db push` to proper migrations:
```bash
# 1. Create baseline migration
npx prisma migrate dev --name init

# 2. For each future schema change
npx prisma migrate dev --name describe_change

# 3. Deploy migrations in production
npx prisma migrate deploy
```

## Multi-Tenant Isolation

Every table includes `organizationId` as a foreign key:
```
organizations ← users, staff, leads, messages, call_logs,
                knowledge_chunks, doctors, settings,
                whatsapp_numbers, whatsapp_credentials
```

All queries in `lib/db/` filter by `organizationId` ✅

The one exception is `getDefaultOrganizationId()` which bypasses isolation — **remove this in production**.

## Backup Strategy

Supabase provides:
- Daily automated backups (Pro plan)
- Point-in-time recovery (Pro plan)

For additional safety:
```bash
# Manual backup via pg_dump
pg_dump "$DIRECT_URL" > backup_$(date +%Y%m%d).sql
```

## Production DB Optimization

Add these indexes for performance at scale:
```sql
CREATE INDEX IF NOT EXISTS idx_leads_org_priority ON leads("organizationId", priority);
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads("organizationId", status);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages("leadId");
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages("organizationId");
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs("leadId");
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_phone ON whatsapp_numbers("phoneNumber");
```

---

# 6. NEW HOSPITAL ONBOARDING FLOW

## How It Currently Works

The onboarding system is **admin-driven** — a Super Admin creates the org and admin user first, then the admin logs in and completes the 3-step wizard.

### Current Architecture

```
Super Admin (manual step)
  ↓  Creates Organization in DB
  ↓  Creates User with role="admin", organizationId=<org.id>
  
Admin logs in
  ↓  NextAuth verifies credentials
  ↓  JWT contains { role: "admin", organizationId: "xxx" }
  
If onboardingComplete === false → redirected to /onboarding
  ↓  Step 1: Enter Hospital Name
  ↓  Step 2: Enter WhatsApp Phone Number ID + Access Token
  ↓  Step 3: Add First Doctor
  ↓  POST /api/onboarding → updates org, creates WhatsAppCredential + Doctor
  ↓  Redirect to /dashboard
```

### Which Tables Get Created / Updated During Onboarding

| Action | Table | Operation |
|---|---|---|
| Super Admin creates org | `organizations` | INSERT |
| Super Admin creates admin user | `users` | INSERT |
| Step 1 (Hospital Name) | `organizations` | UPDATE name, onboardingComplete=true |
| Step 2 (WhatsApp Creds) | `whatsapp_credentials` | INSERT |
| Step 3 (First Doctor) | `doctors` | INSERT |

### Tenant Isolation During Onboarding

All records are created with `organizationId` from the JWT session — so data is isolated immediately ✅

### Known Issues in Onboarding

1. **WhatsApp token stored unencrypted** — `api/onboarding/route.ts` does NOT call `encrypt()` before saving the access token
2. **No validation** — WhatsApp credentials are not tested against the Meta API before saving
3. **No WhatsApp Number mapping** — `whatsapp_numbers` table is never populated during onboarding, so multi-tenant webhook routing won't work for new hospitals until this is done manually

---

## Step-by-Step Hospital Onboarding SOP

### STEP 1 — Create the Organization (Super Admin)

```bash
# Login to /super-admin
# Click "View all + Add →" on the organizations table
# OR use the API directly:

curl -X POST https://your-domain.com/api/super-admin/organizations \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SUPER_ADMIN_TOKEN" \
  -d '{ "name": "City Life Hospital" }'
```

Or via Prisma Studio / SQL:
```sql
INSERT INTO organizations (id, name, "onboardingComplete", disabled, "createdAt")
VALUES (gen_random_uuid(), 'City Life Hospital', false, false, NOW());
```

### STEP 2 — Create the Admin User

```bash
# Run the create-admin script locally with production env:
HOSPITAL_NAME="City Life Hospital" \
ADMIN_EMAIL="admin@citylife.com" \
ADMIN_PASSWORD="SecurePass123!" \
npm run create:admin
```

The script (`scripts/create-admin.ts`) creates a `User` record with:
- `role: "admin"`
- `organizationId: <org id>`
- `email + bcrypt-hashed password`

### STEP 3 — Admin Logs In and Runs Onboarding Wizard

1. Admin opens the app URL and logs in with their credentials
2. System detects `onboardingComplete === false` and redirects to `/onboarding`
3. Admin fills in:
   - Hospital name (e.g. "City Life Hospital")
   - WhatsApp Phone Number ID (from Meta Developer Console)
   - WhatsApp System Access Token (long-lived token from Meta)
   - First doctor name + department

### STEP 4 — Map WhatsApp Number (CRITICAL — Currently Manual)

After onboarding, the webhook won't route correctly until this is done:
```sql
-- Run in Supabase SQL Editor
-- Get the organizationId for this hospital:
SELECT id FROM organizations WHERE name = 'City Life Hospital';

-- Insert the WhatsApp phone number mapping:
INSERT INTO whatsapp_numbers (id, "phoneNumber", "organizationId", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), '+919876543210', '<org-id>', NOW(), NOW());
```

> ⚠️ The phone number must be in E.164 format (e.g., `+919876543210`). The webhook matches on `display_phone_number` from Meta's payload.

### STEP 5 — Add More Doctors

Admin goes to `/dashboard/doctors` → Add Doctor (name + department)

### STEP 6 — Seed Knowledge Base

```bash
# Create a custom seed file for this hospital
# Edit scripts/seed-knowledge.ts to include hospital-specific data
npm run seed:knowledge
```

Or via the Dashboard at `/dashboard/knowledge` → Add Knowledge Chunk

### STEP 7 — Configure Follow-up Settings

Currently hardcoded in `app/api/cron/followup/route.ts`. Future improvement: move to `Settings` table per org.

### STEP 8 — Test the Chatbot

Send a WhatsApp message to the hospital's number and verify:
1. Message appears in `/dashboard` as a new lead
2. AI replies are sent back to the patient
3. Lead priority is correctly classified (HOT/WARM/COLD)

### STEP 9 — Add Staff (Callers)

Admin goes to `/dashboard/staff` → Invite/Add caller with phone number

### STEP 10 — Activate

The hospital is live when:
- [x] `onboardingComplete = true` in organizations table
- [x] `whatsapp_credentials` record exists
- [x] `whatsapp_numbers` mapping exists
- [x] At least one doctor is added
- [x] Webhook is receiving messages

---

# 7. ACCESS CONTROL & USER MANAGEMENT

## Roles in the System

| Role | Where Defined | Access Level |
|---|---|---|
| `super_admin` | `users.role` | Full platform access — all orgs, impersonation, disable/enable orgs |
| `admin` | `users.role` | Full org access — settings, doctors, staff, integrations, WhatsApp config |
| `staff` | `users.role` | Limited — view leads, call patients, update status |

> Note: The `Staff` model also has a `Role` enum (`ADMIN`/`CALLER`) but this is a SEPARATE model from `User`. The `User` model handles authentication; `Staff` handles CRM assignment. They are NOT linked by a foreign key — this is a potential inconsistency.

## Middleware Guards (Frontend)

```
/super-admin/*  → requires token.role === "super_admin"
/dashboard/*    → requires any authenticated token (not super_admin)
/dashboard/settings, /doctors, /integrations, /staff → requires role === "admin"
```

## API Route Guards

- **Super Admin routes** (`/api/super-admin/*`) — check `session.user.role === "super_admin"` inline ✅
- **Dashboard routes** — use `requireRole()` from `lib/auth/rbac.ts` ✅
- **Webhook** — unprotected by design (public Meta endpoint) ✅
- **Cron** — protected by `Authorization: Bearer CRON_SECRET` ✅
- **Leads API** (`/api/leads`) — authenticated but does NOT enforce role ⚠️

## How to Give Hospital Access

1. Create Organization (Super Admin)
2. Create admin User with that `organizationId`
3. Share credentials with the hospital admin
4. Admin completes onboarding

## How to Revoke Access

**Temporarily disable a hospital:**
```sql
UPDATE organizations SET disabled = true WHERE id = '<org-id>';
```

**Permanently delete a user:**
```sql
DELETE FROM users WHERE email = 'admin@hospital.com';
```

**The `disabled` field on Organization does NOT currently block API access** — middleware only blocks dashboard UI. This is a security gap — API routes do not check `org.disabled`.

## Session Security

- JWT strategy (stateless) — no server-side session store
- Session expires based on NextAuth default (30 days unless configured)
- No refresh token rotation
- Impersonation creates a new JWT signed with the same secret — no expiry override

---

# 8. FULL SYSTEM TESTING GUIDE

## Pre-Launch Testing Checklist

### Auth Testing
- [ ] Login with valid email+password → should redirect to dashboard
- [ ] Login with wrong password → should show error, NOT crash
- [ ] Super admin login → should redirect to `/super-admin`
- [ ] Admin login (no onboarding) → should redirect to `/onboarding`
- [ ] Admin login (onboarding done) → should redirect to `/dashboard`
- [ ] Direct access to `/dashboard` without login → should redirect to `/login`
- [ ] Direct access to `/super-admin` as regular admin → should redirect to `/dashboard`
- [ ] JWT token expiry → should redirect to login

### WhatsApp Webhook Testing
- [ ] Send GET to `/api/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=123` → should return `123`
- [ ] Send GET with wrong token → should return 403
- [ ] Send real WhatsApp message → should appear as lead in dashboard
- [ ] Send duplicate message (same messageId) → should NOT create duplicate lead
- [ ] Send message from unknown WhatsApp number → should fall back to env credentials

### AI Testing
- [ ] Send "namaste" → should return greeting (deterministic, not OpenAI)
- [ ] Ask for Dr. Avijeet's schedule → should return correct days/times
- [ ] Ask about fees → should return correct fee from map
- [ ] Ask for address → should return correct location
- [ ] Ask for medicine advice → compliance engine should block and redirect
- [ ] Ask about emergency → should return emergency response immediately
- [ ] Send voice message placeholder → should return "please type your query"

### Lead Testing
- [ ] New message from unknown number → creates new lead
- [ ] Second message from same number → updates existing lead (no duplicate)
- [ ] HOT priority message → lead auto-assigned status ASSIGNED
- [ ] Lead appears in dashboard sorted by priority (HOT first)

### Multi-Tenant Testing
- [ ] Login as Hospital A admin → can only see Hospital A leads
- [ ] Login as Hospital B admin → can only see Hospital B leads
- [ ] Webhook for Hospital A number → creates lead under Hospital A
- [ ] Webhook for Hospital B number → creates lead under Hospital B

### Follow-Up Cron Testing
- [ ] Call `/api/cron/followup` without auth → should return 401
- [ ] Call with correct `Authorization: Bearer SECRET` → should process leads
- [ ] HOT lead gets follow-up after 10+ minutes of inactivity
- [ ] Lead at stage 3 gets no more follow-ups

### Security Testing
- [ ] POST to `/api/webhook` with fake payload → verify it still returns 200 (Meta requirement)
- [ ] POST to `/api/webhook` from wrong IP without signature → should be blocked after implementing signature validation
- [ ] Attempt SQL injection in WhatsApp message → Prisma parameterized queries should protect
- [ ] Attempt prompt injection ("Ignore all previous instructions") → compliance engine should rate it RISKY/DANGEROUS

### Mobile Responsiveness
- [ ] Dashboard on 375px width (iPhone SE) → HOT leads visible, call button accessible
- [ ] Lead card tappable — tap to call works
- [ ] One-tap call via `tel:` link
- [ ] Bottom navigation works on mobile

---

# 9. ANALYTICS & TRACKING SYSTEM

## Current Tracking

| What | How Tracked | Where |
|---|---|---|
| Lead created | `leads` table with timestamps | Dashboard → Leads list |
| Lead priority | `leads.priority` (HOT/WARM/COLD) | Dashboard |
| Lead status | `leads.status` (NEW → ASSIGNED → BOOKED → VISITED → CLOSED) | Dashboard |
| Messages exchanged | `messages` table | Dashboard → Lead chat |
| Calls made | `call_logs` table (duration, outcome, staffId) | Lead detail page |
| WhatsApp credential health | `whatsapp_credentials.failureCount` | Super Admin dashboard |
| Follow-up stages | `leads.followUpStage`, `lastFollowUpAt` | Cron logs |

## Missing Analytics

- ❌ No conversion rate tracking (leads vs bookings vs visits)
- ❌ No AI accuracy tracking (how many replies were overridden)
- ❌ No compliance event log (which messages triggered failsafe)
- ❌ No response time tracking (time from message received to AI reply sent)
- ❌ No per-hospital revenue tracking
- ❌ No staff performance dashboard (calls made, conversion rate per caller)
- ❌ No session analytics (which pages are visited most)

## Recommended Additions

1. **Error Monitoring:** Add Sentry (`@sentry/nextjs`)
2. **Analytics:** Add PostHog or Mixpanel with organization-aware event tracking
3. **Structured Logging:** Use Pino or Winston; export to Loki/DataDog
4. **Custom Metrics Table:** Add `analytics_events` table for tracking key actions

---

# 10. PRODUCTION SECURITY AUDIT

## 🔴 Critical Risks

### 1. Secrets Exposed in Git (IMMEDIATE ACTION REQUIRED)
**Files:** `.env`, `.env.local`, `.env.saas`  
These files contain live API keys, DB passwords, and WhatsApp tokens. If these files are in git history, you MUST:
```bash
# Step 1: Revoke ALL keys immediately
# Step 2: Remove from git history
git filter-repo --path .env --invert-paths
git filter-repo --path .env.local --invert-paths
git filter-repo --path .env.saas --invert-paths
# Step 3: Force push
git push origin --force --all
```

### 2. No Meta Webhook Signature Verification
**File:** `app/api/webhook/route.ts`  
Anyone who knows your webhook URL can send fake WhatsApp events.  
**Fix:**
```typescript
// Add at the top of POST handler:
const signature = req.headers.get('x-hub-signature-256');
const body = await req.text(); // Read body as text first
const expected = 'sha256=' + crypto
  .createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
  .update(body)
  .digest('hex');
if (signature !== expected) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
}
// Then parse: const data = JSON.parse(body);
```
Requires a new env variable: `WHATSAPP_APP_SECRET` (App Secret from Meta Developer Console)

### 3. ENCRYPTION_KEY Missing
**File:** `lib/encryption.ts`  
Without this env var, a random key is generated on each cold start. All stored WhatsApp tokens become unreadable after restart.  
**Fix:** Set `ENCRYPTION_KEY` to a stable 64-char hex value immediately.

### 4. WhatsApp Token Stored Unencrypted on Onboarding
**File:** `app/api/onboarding/route.ts` line 36-41  
The access token is saved directly to DB without calling `encrypt()`.  
**Fix:**
```typescript
import { encrypt } from '@/lib/encryption';
// Change line 39 to:
accessToken: encrypt(whatsappAccessToken),
```

### 5. Hardcoded Fallback Secrets in Code
**Files:** `middleware.ts:17`, `[...nextauth]/route.ts:110`, `impersonate/route.ts:33`  
The string `"fallback-secret-for-dev"` is used if `NEXTAUTH_SECRET` is not set.  
**Fix:** Add a startup check that throws if `NEXTAUTH_SECRET` is missing in production:
```typescript
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in production');
}
```

## 🟠 High Risks

### 6. No Rate Limiting
Any route can be called unlimited times. The webhook is especially vulnerable to flood attacks.  
**Fix:** Use Vercel's Edge rate limiting or add `upstash/ratelimit`:
```bash
npm install @upstash/ratelimit @upstash/redis
```

### 7. Disabled Org Still Has API Access
Setting `org.disabled = true` blocks the UI but API routes (like `/api/leads`) still respond for that org.  
**Fix:** Add `org.disabled` check in `requireRole()` or in each protected API route.

### 8. Impersonation Token Has No Expiry
`/api/super-admin/impersonate` creates a JWT without setting `exp`. The token is valid forever until the `NEXTAUTH_SECRET` rotates.  
**Fix:** Add `maxAge` to the `encode()` call:
```typescript
const impersonationToken = await encode({
  token: { ... },
  secret: process.env.NEXTAUTH_SECRET!,
  maxAge: 60 * 30, // 30 minutes
});
```

## 🟡 Medium Risks

### 9. Hardcoded Hospital Data in AI Engine
Doctor names, schedules, fees in `lib/ai.ts` are specific to Crest Care Hospital. If this runs for another tenant, they'll receive wrong information.

### 10. `getDefaultOrganizationId()` Creates Org Automatically
If a webhook arrives for an unregistered number, this function creates a "Crest Care Hospital" org automatically. This is a data pollution risk.

### 11. No Input Sanitization on Staff/Doctor Names
Staff and Doctor names are stored as-is. XSS is mitigated by React's rendering but stored data could be exploited in exports or email templates.

---

# 11. FINAL GO-LIVE PLAN

## Exact Launch Sequence

### DAY BEFORE LAUNCH

- [ ] Rotate all exposed API keys and tokens
- [ ] Set up Upstash Redis
- [ ] Set up Railway worker deployment
- [ ] Set all env variables in Vercel
- [ ] Run `prisma db push` against production DB
- [ ] Enable pgvector extension in Supabase
- [ ] Run `npm run create:super-admin` with production DB
- [ ] Create first hospital org and admin user
- [ ] Admin completes onboarding wizard
- [ ] Insert WhatsApp number mapping into `whatsapp_numbers` table
- [ ] Run `npm run seed:knowledge` for the hospital
- [ ] Configure Meta webhook URL to production domain

### DAY OF LAUNCH

- [ ] Verify Vercel deployment is healthy (check Functions tab)
- [ ] Verify Railway worker is running (check logs: `[Worker] Started listening...`)
- [ ] Send a test WhatsApp message and verify full flow
- [ ] Log in to dashboard and confirm lead appears
- [ ] Test follow-up cron endpoint manually
- [ ] Check Super Admin dashboard shows org as ACTIVE (green)
- [ ] Announce go-live to hospital staff
- [ ] Monitor Vercel logs for first 30 minutes

## Recommended Production Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Vercel Edge   │    │  Railway Worker  │    │    Supabase      │
│   (Next.js)     │    │  (BullMQ)        │    │  (PostgreSQL)    │
│                 │    │                  │    │  + pgvector      │
│  /api/webhook   │───▶│  scripts/worker  │───▶│                  │
│  /dashboard     │    │                  │    └──────────────────┘
│  /super-admin   │    └──────────────────┘
│  /api/cron/*    │              │                ┌──────────────────┐
└─────────────────┘              │                │  Upstash Redis   │
         │                       └───────────────▶│  (BullMQ Queue)  │
         │                                        └──────────────────┘
         ▼
  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
  │   OpenAI    │    │    Meta     │    │  cron-job.org│
  │  GPT-4o-mini│    │ WhatsApp API│    │  (Cron trigger)│
  └─────────────┘    └─────────────┘    └──────────────┘
```

## Scaling Strategy

| Scale Level | Action |
|---|---|
| 0-10 hospitals | Current architecture is fine |
| 10-50 hospitals | Add Redis cluster; upgrade Supabase to Pro |
| 50-200 hospitals | Add multiple Railway workers; shard knowledge_chunks by org |
| 200+ hospitals | Move to dedicated DB per tier; add CDN for static assets |

## Monitoring Strategy

1. **Vercel Functions tab** — watch for 5xx errors and timeout warnings
2. **Railway logs** — check worker for failed job counts
3. **Super Admin dashboard** — watch `failureCount` on WhatsApp credentials
4. **Upstash console** — monitor queue depth (should stay near 0)
5. **Supabase logs** — watch for slow queries

## Rollback Strategy

If something breaks after deployment:
1. **Vercel:** Deployments tab → select previous deployment → **Promote to Production**
2. **Railway:** Deployments → previous version → **Redeploy**
3. **DB:** No automatic rollback (since using `db push`). Fix forward with a new `db push`.

---

## DAY OF LAUNCH CHECKLIST ✅

```
INFRASTRUCTURE
[ ] Vercel deployment green (no build errors)
[ ] Railway worker online and logging "Started listening..."
[ ] Upstash Redis connected (check worker startup log)
[ ] Supabase database accessible (test with prisma studio)

SECRETS & SECURITY  
[ ] All old API keys revoked
[ ] NEXTAUTH_SECRET set to random 32-char string
[ ] ENCRYPTION_KEY set to stable 64-char hex string
[ ] REDIS_URL pointing to Upstash (rediss://)
[ ] NEXTAUTH_URL pointing to live domain
[ ] WHATSAPP_VERIFY_TOKEN matches Meta webhook config

DATABASE
[ ] All tables present in Supabase
[ ] pgvector extension enabled
[ ] Knowledge chunks seeded for hospital
[ ] WhatsApp number mapping in whatsapp_numbers table

WHATSAPP
[ ] Meta webhook verified (GET returns challenge)
[ ] Webhook subscribed to "messages" field
[ ] Test message received and replied to

AUTH
[ ] Super Admin can log in at /super-admin
[ ] Hospital Admin can log in at /dashboard
[ ] Staff user can log in and see leads
[ ] Onboarding flow completes without error

LEADS & AI
[ ] Test lead appears in dashboard after WhatsApp message
[ ] Lead priority correctly classified
[ ] AI reply received by the patient
[ ] Follow-up cron returns { success: true }
[ ] Call outcome can be logged from dashboard

MONITORING
[ ] Vercel logs visible and streaming
[ ] No uncaught errors in last deployment
[ ] Super Admin org shows ACTIVE status (green)
```

---

*Report generated by Antigravity AI — Complete code analysis of 40+ files across the cicrm repository.*
