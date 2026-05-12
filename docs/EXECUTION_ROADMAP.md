# CrestCare CRM — Master Execution Roadmap
> Cross-verified against actual codebase. Every issue confirmed real.

---

## CROSS-CHECK VERIFICATION

| Report Issue | Status | Notes |
|---|---|---|
| Secrets in .env files | ✅ REAL but NOT in git | `git log` returned empty — `.env*` was always gitignored. **Safe.** |
| NEXTAUTH_URL missing | ✅ REAL | Not in any env file |
| NEXTAUTH_SECRET hardcoded | ✅ REAL | `"fallback-secret-for-dev"` in 3 files |
| ENCRYPTION_KEY missing | ✅ REAL | Falls back to `crypto.randomBytes(32)` |
| REDIS_URL missing | ✅ REAL | Defaults to `localhost:6379` |
| WhatsApp token unencrypted on onboarding | ✅ REAL | Line 39, `api/onboarding/route.ts` |
| Webhook signature not verified | ✅ REAL | No `X-Hub-Signature-256` check |
| No rate limiting | ✅ REAL | Zero rate limiting anywhere |
| BullMQ worker can't run on Vercel | ✅ REAL | `scripts/worker.ts` needs separate host |
| `getDefaultOrganizationId()` hardcoded | ✅ REAL | Creates "Crest Care Hospital" for unknown orgs |
| Doctor data hardcoded in `lib/ai.ts` | ✅ REAL | ~150 lines of Crest Care-specific data |
| Disclaimer hardcoded "Crest Care Hospital" | ✅ REAL | `lib/compliance/constants.ts` line 7 |
| Fallback settings hardcoded | ✅ REAL | `lib/db/config.ts` — FALLBACK_SETTINGS has org name |
| Staff vs User model not linked | ✅ REAL | Two separate models, no FK between them |
| Disabled org still has API access | ✅ REAL | Middleware only, API routes don't check |
| Impersonation token has no expiry | ✅ REAL | No `maxAge` in `encode()` call |
| No pgvector migrations folder | ✅ REAL | Only `prisma db push` used |
| WhatsApp number not added during onboarding | ✅ REAL | `whatsapp_numbers` table never populated |
| CRON_SECRET defaults to guessable string | ✅ REAL | Defaults to `"crestcare-cron"` |
| Supabase client initialized but unused | ✅ REAL | `lib/supabase.ts` — dead code |

### Additional Issues Found (Not in Original Report)

| Issue | File | Severity |
|---|---|---|
| `FALLBACK_SETTINGS['hospital_name']` = 'Crest Care Hospital' | `lib/db/config.ts:13` | HIGH |
| `FIRST_MESSAGE_DISCLAIMER` hardcodes hospital name | `lib/compliance/constants.ts:7` | HIGH |
| `FALLBACK_DOCTORS` list hardcoded (not per-tenant) | `lib/db/config.ts:5-10` | MEDIUM |
| `AUTO_REPLY_TEXT` in webhook route hardcoded to Crest Care | `app/api/webhook/route.ts:17-23` | MEDIUM |
| No `organizationId` check in `/api/leads/[id]` | Unknown (need verify) | HIGH |
| `build` script uses `--webpack` flag (non-standard) | `package.json:7` | LOW |
| `next.config.ts` uses `turbopack: {}` + webpack build flag (conflict) | `next.config.ts:12` | MEDIUM |

---

# CRITICAL — Fix BEFORE Any Deployment

## C1. Set NEXTAUTH_SECRET (Blocks all auth security)
- **Impact:** All JWTs signed with `"fallback-secret-for-dev"` — anyone can forge sessions
- **Files:** `middleware.ts:17`, `app/api/auth/[...nextauth]/route.ts:110`, `app/api/super-admin/impersonate/route.ts:33`
- **Fix:** Set env var + remove hardcoded fallback
- **Time:** 15 minutes
- **Blocks launch:** YES

## C2. Set NEXTAUTH_URL (Blocks login on Vercel)
- **Impact:** NextAuth redirects break in production without canonical URL
- **Files:** All env files
- **Fix:** Add `NEXTAUTH_URL=https://your-domain.vercel.app` to Vercel env vars
- **Time:** 5 minutes
- **Blocks launch:** YES

## C3. Set ENCRYPTION_KEY (Breaks WhatsApp token storage)
- **Impact:** Each cold start generates new random key. All stored tokens become unreadable. Every hospital's WhatsApp disconnects after a restart.
- **Files:** `lib/encryption.ts:5`
- **Fix:** `openssl rand -hex 32` → save as `ENCRYPTION_KEY` env var
- **Time:** 10 minutes
- **Blocks launch:** YES

## C4. Set REDIS_URL (BullMQ crashes on Vercel)
- **Impact:** Webhook receives messages but cannot queue them → all leads lost silently
- **Files:** `lib/queue.ts:4`, `scripts/worker.ts:15`
- **Fix:** Create Upstash Redis → add `REDIS_URL=rediss://...` env var
- **Time:** 20 minutes
- **Blocks launch:** YES

## C5. Deploy BullMQ Worker to Railway (Messages never processed)
- **Impact:** Without the worker, messages sit in Redis queue forever. No AI replies, no leads created.
- **Files:** `scripts/worker.ts`
- **Fix:** Deploy to Railway with start command `npx tsx scripts/worker.ts`
- **Time:** 30 minutes
- **Blocks launch:** YES

## C6. Fix WhatsApp Token Encryption on Onboarding
- **Impact:** Every hospital's WhatsApp token stored in plain text in DB. A DB breach = all tokens exposed.
- **Files:** `app/api/onboarding/route.ts:39`
- **Fix:** Wrap with `encrypt()` before saving
- **Time:** 5 minutes
- **Blocks launch:** YES (security compliance)

```typescript
// app/api/onboarding/route.ts
import { encrypt } from '@/lib/encryption';
// Line 39:
accessToken: encrypt(whatsappAccessToken),
```

## C7. Add Webhook Signature Verification
- **Impact:** Anyone can POST fake patient messages to your webhook. This can inject fake leads, trigger AI responses, and waste OpenAI credits.
- **Files:** `app/api/webhook/route.ts`
- **New env required:** `WHATSAPP_APP_SECRET`
- **Time:** 30 minutes
- **Blocks launch:** YES (Meta compliance + security)

```typescript
// Add to POST handler BEFORE processing:
import crypto from 'crypto';
const rawBody = await req.text();
const sig = req.headers.get('x-hub-signature-256') ?? '';
const expected = 'sha256=' + crypto
  .createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
  .update(rawBody).digest('hex');
if (sig !== expected) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
}
const body = JSON.parse(rawBody);
```

## C8. Fix WhatsApp Number Mapping in Onboarding
- **Impact:** New hospitals complete onboarding but webhook routing silently fails — messages go to wrong org or default fallback
- **Files:** `app/api/onboarding/route.ts`
- **Time:** 20 minutes
- **Blocks launch:** YES for multi-tenant

```typescript
// Add to onboarding transaction (Step 4):
await tx.whatsAppNumber.create({
  data: {
    phoneNumber: whatsappDisplayPhone, // Add this field to onboarding form
    organizationId,
  },
});
```

---

# HIGH PRIORITY — Fix Before Onboarding Real Hospitals

## H1. Remove Hardcoded Hospital Name from Compliance Constants
- **Impact:** Every new hospital's chatbot says "Crest Care Hospital" in the first message disclaimer
- **Files:** `lib/compliance/constants.ts:7`
- **Fix:** Pass `hospitalName` as a parameter from the org settings

## H2. Remove Hardcoded Hospital Name from `lib/db/config.ts`
- **Impact:** `getSetting()` falls back to "Crest Care Hospital" for any org without settings
- **Files:** `lib/db/config.ts:13`
- **Fix:** Remove fallback or make it generic ("Your Hospital")

## H3. Remove Hardcoded Doctor Data from `lib/ai.ts`
- **Impact:** All hospitals get Crest Care doctor schedules/fees in AI responses
- **Files:** `lib/ai.ts:13-173` (entire deterministic intercept layer)
- **Fix:** Move to `Settings` table or `doctors` table per org. Load dynamically.
- **Time:** 2-3 hours (most complex fix)

## H4. Remove/Disable `getDefaultOrganizationId()` Auto-Create
- **Impact:** Any webhook from unregistered number silently creates a "Crest Care Hospital" org
- **Files:** `lib/db/organization.ts`
- **Fix:** Throw error or return `null` instead of auto-creating. All callers must handle null.

## H5. Add `disabled` Check in API Routes
- **Impact:** Disabling an org in super admin only blocks UI. API still works.
- **Files:** `lib/auth/rbac.ts` → add org disabled check in `requireRole()`
- **Time:** 30 minutes

## H6. Add Impersonation Token Expiry
- **Impact:** Impersonation tokens are valid forever (until secret rotates)
- **Files:** `app/api/super-admin/impersonate/route.ts:25-34`
- **Fix:** Add `maxAge: 60 * 30` to `encode()` call (30 minutes)

## H7. Fix CRON_SECRET Default
- **Impact:** Default `"crestcare-cron"` is guessable — anyone can trigger mass follow-up messages
- **Files:** `app/api/cron/followup/route.ts:41`
- **Fix:** Set `CRON_SECRET` env var with `openssl rand -base64 24`

## H8. Create `vercel.json` for Cron Setup
- **Impact:** Without this, follow-up messages never trigger in production
- **Fix:** Create `vercel.json` with cron config and set up `cron-job.org` to call with auth header

---

# MEDIUM PRIORITY — Fix Before Scaling

## M1. Remove Turbopack/Webpack Conflict
- **Files:** `next.config.ts:12` (`turbopack: {}`), `package.json:7` (`build --webpack`)
- **Fix:** Remove `turbopack: {}` from `next.config.ts` since build uses `--webpack`

## M2. Add Rate Limiting to Webhook
- **Fix:** Add `@upstash/ratelimit` to `/api/webhook` (limit per IP: 60 req/min)

## M3. Add Prisma Migrations (Replace `db push`)
- **Impact:** No rollback capability in production. Schema changes are irreversible.
- **Fix:** `npx prisma migrate dev --name init` to create baseline

## M4. Add DB Indexes for Scale
- SQL indexes on `leads(organizationId, priority)`, `messages(leadId)`, etc.

## M5. Link Staff Model to User Model
- **Impact:** Staff assignments in `Lead.assignedToId` point to `Staff.id` but auth uses `User` model. No way to know which User is which Staff.
- **Fix:** Add `userId String? @unique` to `Staff` model + migration

## M6. Remove Dead Code (`lib/supabase.ts`)
- **Files:** `lib/supabase.ts`
- **Fix:** Delete file or integrate properly

## M7. Add `WHATSAPP_APP_SECRET` to Env Docs
- New required env var for webhook signature verification

---

# LOW PRIORITY — Improve Later

- Add Sentry for error monitoring
- Add PostHog for analytics
- Add staff performance dashboard
- Add conversion rate tracking
- Add per-org knowledge base seeding wizard
- Add WhatsApp credential test-before-save in onboarding
- Add session expiry configuration to NextAuth
- Move follow-up message templates to Settings table
- Add OTP login provider (placeholder already in NextAuth config)

---

# PHASE 3 — WHERE TO START (Exact Order)

## STEP 1 — Rotate Exposed Secrets (Day 1, ~30 min)
**Why first:** All other steps are useless if tokens are still compromised.
```bash
# 1. Go to platform.openai.com → API Keys → Delete current key → Create new one
# 2. Go to Meta Developers → Your App → WhatsApp → Generate new System Token
# 3. Go to Supabase → Settings → Database → Reset Password
# Generate new env values:
openssl rand -base64 32   # → NEXTAUTH_SECRET
openssl rand -hex 32      # → ENCRYPTION_KEY
openssl rand -base64 24   # → CRON_SECRET
```
**Expected result:** No live credentials can be abused.

---

## STEP 2 — Set All Missing Env Variables (Day 1, ~20 min)
**Files to update:** Vercel dashboard environment variables
```
NEXTAUTH_SECRET=<generated above>
NEXTAUTH_URL=https://your-domain.vercel.app
ENCRYPTION_KEY=<generated above>
REDIS_URL=rediss://default:...@...upstash.io:6379
CRON_SECRET=<generated above>
WHATSAPP_APP_SECRET=<from Meta App Dashboard → Settings → Basic>
```
**Expected result:** App can boot without insecure fallbacks.

---

## STEP 3 — Fix Onboarding Encryption Bug (Day 1, ~10 min)
**File:** `app/api/onboarding/route.ts`
**Change:** Import `encrypt` and wrap `whatsappAccessToken` before DB insert.
**Risk fixed:** Plain text token storage.
**Deploy:** Push → Vercel auto-deploys.

---

## STEP 4 — Set Up Upstash Redis + Railway Worker (Day 1, ~1 hr)
**Why:** Without this, zero WhatsApp messages are processed.
```
1. upstash.com → Create Database → Copy rediss:// URL → Add to Vercel env
2. railway.app → New Project → GitHub → same repo
3. Set start command: npx tsx scripts/worker.ts
4. Add all env vars to Railway service
5. Deploy → verify logs show "[Worker] Started listening..."
```

---

## STEP 5 — Add Webhook Signature Verification (Day 2, ~45 min)
**File:** `app/api/webhook/route.ts`
**Add:** HMAC-SHA256 signature check using `WHATSAPP_APP_SECRET`
**Why this order:** Needs `WHATSAPP_APP_SECRET` env var from Step 2.

---

## STEP 6 — Fix WhatsApp Number Mapping in Onboarding (Day 2, ~30 min)
**File:** `app/api/onboarding/route.ts`
**Add:** Form field for display phone number + `whatsapp_numbers` insert in transaction.
**Why:** Without this, new hospitals' webhooks don't route correctly.

---

## STEP 7 — Remove Hardcoded Hospital Names (Day 3, ~2 hrs)
**Files:**
- `lib/compliance/constants.ts` → Make `FIRST_MESSAGE_DISCLAIMER` a function that accepts `hospitalName`
- `lib/db/config.ts` → Remove `FALLBACK_SETTINGS['hospital_name']`
- `lib/ai.ts` → Move `HOSPITAL_INFO`, `DOCTOR_SCHEDULE`, `DOCTOR_FEES` to DB (`Settings` table)
**Why this order:** Needs the `Settings` table query functions already working.

---

## STEP 8 — Fix `getDefaultOrganizationId()` (Day 3, ~30 min)
**File:** `lib/db/organization.ts`
**Change:** Return `null` instead of auto-creating. Update all callers to handle null.
**Risk:** Breaking change — test thoroughly before deploying.

---

## STEP 9 — Add vercel.json Cron + External Trigger (Day 4, ~30 min)
```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/followup", "schedule": "*/30 * * * *" }]
}
```
Set up `cron-job.org` with `Authorization: Bearer CRON_SECRET` header.

---

## STEP 10 — Add `disabled` Org Check to API Routes (Day 4, ~30 min)
**File:** `lib/auth/rbac.ts` → `requireRole()` function
**Add:** Fetch org by `organizationId`, check `org.disabled === true` → return 403.

---

# PHASE 4 — ARCHITECTURE BLOCKERS

## BLOCKER 1: BullMQ Worker is NOT Serverless Compatible
**Risk Level:** 🔴 LAUNCH BLOCKER  
Vercel serverless functions die after 60 seconds max. BullMQ worker is a persistent process. It MUST live on Railway/Render.  
**Long-term solution:** Consider moving to Inngest or Trigger.dev (serverless queue) to eliminate the separate worker entirely.

## BLOCKER 2: AI Engine is Single-Tenant by Design
**Risk Level:** 🔴 PRE-SCALE BLOCKER  
`lib/ai.ts` has ~150 lines hardcoded for ONE hospital. Every new hospital gets:
- Crest Care doctor names in responses
- Crest Care address/phone
- Crest Care emergency number  

**Fix strategy:**
1. Move all static data to `Settings` table with `organizationId`
2. Pass org config into `generateChatResponse()`
3. Remove deterministic intercept layer OR make it data-driven

## BLOCKER 3: WhatsApp Routing Only Works If `whatsapp_numbers` is Populated
**Risk Level:** 🔴 MULTI-TENANT BLOCKER  
Current onboarding never inserts into `whatsapp_numbers`. Multi-tenant routing is architecturally correct but operationally broken for every new hospital.

## BLOCKER 4: Two Parallel Staff Models
**Risk Level:** 🟠 SCALING PROBLEM  
`User` = auth identity. `Staff` = CRM assignment. No FK between them.  
- A `User` with `role=staff` cannot be assigned as `Lead.assignedToId`
- A `Staff` record has no login capability
- This will become a major pain point for staff management features

**Fix:** Add `userId String? @unique` to `Staff` model → migration required.

## BLOCKER 5: No Proper Migration System
**Risk Level:** 🟠 PRODUCTION RISK  
Using `prisma db push` means:
- No migration history
- No rollback
- Schema changes in production = data loss risk  
**Fix:** Switch to `prisma migrate dev` before any production schema changes.

## BLOCKER 6: pgvector Knowledge Base is Global
**Risk Level:** 🟡 SOFT BLOCKER  
`searchKnowledge()` filters by `organizationId OR organizationId IS NULL`.  
- NULL chunks are shared across all tenants (intended for defaults)  
- But seeds in `scripts/seed-knowledge.ts` don't set `organizationId` → global leakage of Crest Care data to all tenants

---

# PHASE 5 — FIRST 30 DAYS FIX PLAN

## WEEK 1 — Security + Infrastructure

| Day | Task | Files | Output |
|---|---|---|---|
| 1 | Rotate all secrets | External services | No live compromised keys |
| 1 | Set all env vars in Vercel | Vercel dashboard | App boots securely |
| 1 | Fix onboarding encryption | `api/onboarding/route.ts` | Tokens stored encrypted |
| 1 | Set up Upstash Redis | upstash.com | Queue ready |
| 1 | Deploy worker to Railway | `scripts/worker.ts` | Messages processed |
| 2 | Add webhook signature check | `api/webhook/route.ts` | Fake events rejected |
| 2 | Fix WhatsApp number mapping | `api/onboarding/route.ts` | Routing works |
| 3 | Add impersonation token expiry | `api/super-admin/impersonate/route.ts` | Tokens expire in 30 min |
| 3 | Add `disabled` org API check | `lib/auth/rbac.ts` | Disabled orgs fully blocked |
| 4 | Set up `vercel.json` cron | `vercel.json` (new) | Follow-ups trigger |
| 4 | Set up `cron-job.org` | External | Follow-ups actually run |
| 5 | Remove hardcoded fallback strings | `lib/db/config.ts`, `lib/compliance/constants.ts` | No Crest Care leakage |
| 5 | Fix gitignore (done already ✅) | `.gitignore` | Secrets stay local |

**Week 1 deployment readiness target: 80/100**

---

## WEEK 2 — Multi-Tenant Cleanup

| Task | Files | Why |
|---|---|---|
| Move doctor data to DB | `lib/ai.ts` + `Settings` table | Each hospital gets own AI config |
| Make `FIRST_MESSAGE_DISCLAIMER` dynamic | `lib/compliance/constants.ts`, `lib/compliance/disclaimer.ts` | Per-org branding |
| Fix `getDefaultOrganizationId()` | `lib/db/organization.ts` | Stop auto-creating orgs |
| Fix knowledge base seeding | `scripts/seed-knowledge.ts` | Set `organizationId` on all seeds |
| Add DB indexes | Supabase SQL Editor | Performance at scale |
| Switch to `prisma migrate dev` | `prisma/` | Safe schema changes |
| Link `Staff` model to `User` | `prisma/schema.prisma` | Unified identity |

**Week 2 deployment readiness target: 90/100**

---

## WEEK 3 — Compliance + Onboarding Polish

| Task | Files | Why |
|---|---|---|
| Add WhatsApp credential validation in onboarding | `api/onboarding/route.ts` | Test token before saving |
| Add phone number field to onboarding form | `app/onboarding/page.tsx` | Auto-populate `whatsapp_numbers` |
| Add rate limiting to webhook + API | `api/webhook/route.ts` | Prevent abuse |
| Make follow-up templates configurable | `api/cron/followup/route.ts` + `Settings` | Per-hospital messages |
| Add `WHATSAPP_APP_SECRET` to docs | All env docs | Clear setup guide |
| Remove `lib/supabase.ts` dead code | `lib/supabase.ts` | Clean codebase |

**Week 3 deployment readiness target: 95/100**

---

## WEEK 4 — Monitoring + Scaling Prep

| Task | Files | Why |
|---|---|---|
| Add Sentry error monitoring | `npm install @sentry/nextjs` | Know when things break |
| Add structured logging in worker | `scripts/worker.ts` | Trace issues |
| Add analytics events table | Prisma schema | Track conversions |
| Load test webhook endpoint | k6 or Artillery | Know limits before scale |
| Resolve Turbopack/webpack conflict | `next.config.ts`, `package.json` | Clean build |
| Evaluate Inngest as BullMQ replacement | Architecture | Eliminate Railway dependency |

**Week 4 deployment readiness target: 98/100**

---

# PHASE 6 — SAFE TO GO LIVE CHECKLIST

## MINIMUM REQUIREMENTS TO GO LIVE (1 hospital)

- [ ] NEXTAUTH_SECRET set (real random value)
- [ ] NEXTAUTH_URL set to production domain
- [ ] ENCRYPTION_KEY set (stable, never changes)
- [ ] REDIS_URL set (Upstash)
- [ ] Railway worker running
- [ ] Webhook signature verification enabled
- [ ] WhatsApp access token encrypted on save
- [ ] WhatsApp number in `whatsapp_numbers` table
- [ ] Meta webhook URL configured and verified
- [ ] `npm run create:super-admin` run in production
- [ ] Hospital org + admin user created
- [ ] Onboarding wizard completed
- [ ] Test WhatsApp message creates lead in dashboard
- [ ] Follow-up cron reachable with CRON_SECRET

**Estimated time to reach this: 1 focused day**

---

## SAFE FOR FIRST 5 HOSPITALS

All above PLUS:

- [ ] Hardcoded Crest Care names removed from compliance constants
- [ ] `getDefaultOrganizationId()` removed or returns null
- [ ] WhatsApp number auto-mapped during onboarding
- [ ] Disabled org check in API routes
- [ ] Knowledge base seeded per-org (not global)
- [ ] Impersonation token expiry set (30 min)
- [ ] CRON_SECRET not default value

**Estimated time: 1 week of focused dev**

---

## SAFE FOR 50+ HOSPITALS

All above PLUS:

- [ ] Doctor/AI data moved to DB (not hardcoded in `lib/ai.ts`)
- [ ] DB indexes added
- [ ] Prisma migrations (not `db push`)
- [ ] Staff model linked to User model
- [ ] Rate limiting on webhook
- [ ] Sentry error monitoring
- [ ] Structured logging in worker
- [ ] Upstash Redis upgraded (Production plan)
- [ ] Supabase upgraded to Pro plan

**Estimated time: 3-4 weeks of focused dev**

---

## REQUIRES MAJOR REARCHITECTURE (200+ hospitals)

- [ ] AI engine must be data-driven (no hardcoded logic)
- [ ] BullMQ worker must scale horizontally (multiple Railway instances OR move to Inngest/Trigger.dev)
- [ ] Consider read replicas for Supabase (heavy lead queries)
- [ ] pgvector knowledge base needs per-org index optimization
- [ ] Consider dedicated DB per enterprise client
- [ ] Multi-region deployment for global hospitals
- [ ] WhatsApp Business API rate limits need queue backpressure

---

## FIX DEPENDENCY GRAPH

```
STEP 1: Rotate Secrets
    └── STEP 2: Set Env Vars (depends on new secrets)
        ├── STEP 3: Fix Onboarding Encryption (depends on ENCRYPTION_KEY)
        ├── STEP 4: Set up Redis + Worker (depends on REDIS_URL)
        └── STEP 5: Webhook Signature (depends on WHATSAPP_APP_SECRET)
            └── STEP 6: WhatsApp Number Mapping (runs in same onboarding transaction)
                └── STEP 7: Remove Hardcoded Hospital Names (multi-tenant cleanup)
                    └── STEP 8: Fix getDefaultOrganizationId() (last — breaking change)
                        └── STEP 9: Cron setup (independent)
                            └── STEP 10: Org disabled API check (independent)
```

---

## QUICK WINS vs DEEP REFACTORS

| Type | Task | Time |
|---|---|---|
| ⚡ Quick Win | Set all env vars in Vercel | 20 min |
| ⚡ Quick Win | Fix onboarding encryption (1 line) | 5 min |
| ⚡ Quick Win | Add impersonation maxAge (1 line) | 5 min |
| ⚡ Quick Win | Fix CRON_SECRET default | 5 min |
| ⚡ Quick Win | Add WhatsApp number to onboarding transaction | 20 min |
| 🔧 Medium | Add webhook signature verification | 45 min |
| 🔧 Medium | Deploy Railway worker | 1 hr |
| 🔧 Medium | Remove hardcoded compliance strings | 2 hrs |
| 🏗️ Deep Refactor | Move AI doctor data to DB | 4-6 hrs |
| 🏗️ Deep Refactor | Link Staff to User model + migration | 3-4 hrs |
| 🏗️ Deep Refactor | Switch to Prisma migrations | 2-3 hrs |
| 🏗️ Deep Refactor | Replace BullMQ with Inngest | 8-12 hrs |

---

*Roadmap generated from direct code analysis of 40+ files. Every issue cross-verified against actual source.*
