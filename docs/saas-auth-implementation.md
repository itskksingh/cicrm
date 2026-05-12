# SaaS Authentication System — Implementation Reference

> **Branch:** `saas-v1`
> **Date:** 2026-05-02
> **Status:** Complete (Phase 1 — Email/Password Auth)
> **Author:** Antigravity AI (Gemini / Claude)

---

## Overview

This document records every change made to implement a multi-tenant, role-based authentication system on top of the existing CrestCare Hospital CRM. All changes were additive — no existing production logic was removed or broken.

---

## Step 1 — Prisma User Model

**File changed:** `prisma/schema.prisma`

### What was added

A new `User` model was created at the bottom of the schema to support authentication. It is designed to handle both current (email/password) and future (OTP/phone) login flows.

```prisma
model User {
  id             String       @id @default(uuid())
  email          String?      @unique   // optional — OTP users may not have email
  password       String?                // null for future OTP-only users
  phone          String?      @unique   // OTP login identifier (reserved for future)
  role           String       @default("staff")
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@map("users")
}
```

The `Organization` model was also updated to include the reverse relation:

```prisma
model Organization {
  ...
  users  User[]   // ← added
  ...
}
```

### Why all fields are optional

- `email` and `password` are optional to allow future OTP-only users who log in via phone.
- `phone` is optional to allow current email/password users who don't need a phone field.
- This makes the model forward-compatible with zero future migrations.

### DB Sync

Schema was pushed to Supabase using:

```bash
npx prisma db push
npx prisma generate
```

---

## Step 2 — Authentication Dependencies

**Files changed:** `package.json`, `package-lock.json`

### Packages installed

| Package | Version | Purpose |
|---|---|---|
| `next-auth` | ^4.24.14 | Session management + provider framework |
| `bcrypt` | ^6.0.0 | Password hashing and comparison |
| `@types/bcrypt` | ^6.0.0 | TypeScript type definitions for bcrypt |

```bash
npm install next-auth bcrypt
npm install -D @types/bcrypt
```

---

## Step 3 — NextAuth Configuration

**File created:** `app/api/auth/[...nextauth]/route.ts`

### What it does

- Sets up NextAuth with the **Credentials Provider** (email + password)
- Uses `bcrypt.compare()` to validate the password against the stored hash
- Uses **JWT session strategy** (stateless — no DB session table needed)
- Extends the NextAuth session type to include `id`, `role`, and `organizationId`

### Session structure

```
JWT Token (stored in cookie)
├── id             → User.id
├── email          → User.email
├── role           → User.role  ("admin" | "staff")
└── organizationId → User.organizationId
```

Accessed in any server component or API route via:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const session = await getServerSession(authOptions);
// session.user.id
// session.user.role
// session.user.organizationId
```

### OTP Placeholder

A clearly marked comment block exists inside the `providers` array to show where the future OTP provider will be added:

```typescript
providers: [
  CredentialsProvider({ ... }), // current: email/password

  // ─── OTP PROVIDER PLACEHOLDER ───────────────────────────────
  // OTP provider will be added here.
  // Steps: accept { phone, otp } → verify OTP → lookup by phone
  // User model already supports this via phone field.
  // ─────────────────────────────────────────────────────────────
],
```

---

## Step 4 — Login Page

**File created:** `app/login/page.tsx`

### What it does

- Client component (`"use client"`)
- Two fields: `email` and `password`
- Calls `signIn("credentials", { email, password, redirect: false })`
- On success → `router.push("/dashboard")` + `router.refresh()`
- On failure → displays the error message from NextAuth
- Shows a loading state during submission

### signIn flow

```
User submits form
  → signIn("credentials", { email, password, redirect: false })
    → NextAuth routes to authorize() callback
      → prisma.user.findUnique({ where: { email } })
        → bcrypt.compare(password, user.password)
          → returns { id, email, role, organizationId }
            → JWT created, cookie set
              → router.push("/dashboard")
```

---

## Step 5 — Middleware (Auth + Tenant Protection)

**File modified:** `middleware.ts`

### What was added

Two new protection layers were merged into the existing tenant-detection middleware:

#### Layer 1 — Auth guard (all dashboard routes)
```typescript
if (pathname.startsWith('/dashboard')) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

#### Layer 2 — Role guard (admin-only routes)
```typescript
const adminOnlyPaths = ['/dashboard/settings', '/dashboard/doctors']
const isAdminRoute = adminOnlyPaths.some((p) => pathname.startsWith(p))
if (isAdminRoute && token.role !== 'admin') {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### How tenant + auth work together

```
Incoming Request
  │
  ├─ 1. Extract subdomain → set x-tenant-subdomain header (existing logic)
  ├─ 2. Extract x-tenant-id header (existing logic)
  ├─ 3. If /dashboard/* → check JWT token exists (auth guard)
  ├─ 4. If /dashboard/settings or /dashboard/doctors → check role = admin
  └─ 5. NextResponse.next() with enriched headers
```

The tenant headers are always set regardless of auth status. Auth is checked after tenant resolution and only for dashboard routes. This means:
- Public routes → tenant headers set, no auth check
- Webhook routes → unaffected entirely
- Dashboard routes → tenant headers + auth check
- Admin routes → tenant headers + auth check + role check

---

## Step 6 — Session-Based Organization Isolation

**Files modified:** `app/api/leads/route.ts`, `app/api/messages/route.ts`

### Problem solved

Previously, all DB queries used `getDefaultOrganizationId()` which returned the same org for everyone. In a multi-tenant SaaS, each logged-in user should only see data for their own organization.

### Pattern used (leads example)

**Before:**
```typescript
const leads = await getLeadsByPriority(); // always default org
```

**After:**
```typescript
const session = await getServerSession(authOptions);
const organizationId = session?.user?.organizationId ?? undefined;
const leads = await getLeadsByPriority(organizationId);
// Falls back to getDefaultOrganizationId() inside the function if undefined
```

### Fallback safety

The DB functions (`getLeadsByPriority`, `saveMessage`, etc.) already accepted an optional `organizationId?` parameter and fell back to `getDefaultOrganizationId()` if not provided. This means:
- Webhook calls (no session) → still work via fallback
- Logged-in staff → get their org's data only

---

## Step 7 — Role-Based Access Control (RBAC)

**File created:** `lib/auth/rbac.ts`
**Files modified:** `middleware.ts`, `app/dashboard/settings/page.tsx`, `app/dashboard/doctors/page.tsx`

### RBAC helper (`lib/auth/rbac.ts`)

Two utility functions were created as a single reusable module:

#### `requireRole()` — for API routes

```typescript
import { requireRole, ROLES } from "@/lib/auth/rbac";

export async function GET() {
  const result = await requireRole([ROLES.ADMIN]);
  if (result instanceof NextResponse) return result; // auto 401 or 403
  const { organizationId } = result; // safe to proceed
}
```

Returns `NextResponse` (401/403) if the check fails, otherwise returns `{ session, organizationId, role }`.

#### `getSessionWithRole()` — for Server Component pages

```typescript
import { getSessionWithRole, ROLES } from "@/lib/auth/rbac";

export default async function AdminPage() {
  const session = await getSessionWithRole([ROLES.ADMIN]);
  if (!session) return <div>403 — Access Denied</div>;
  // render page
}
```

Returns `null` if check fails, otherwise returns the full session.

### Role permissions matrix

| Route | `admin` | `staff` |
|---|---|---|
| `/dashboard` | ✅ | ✅ |
| `/dashboard/leads` | ✅ | ✅ |
| `/dashboard/chats` | ✅ | ✅ |
| `/dashboard/settings` | ✅ | ❌ → redirect `/dashboard` |
| `/dashboard/doctors` | ✅ | ❌ → redirect `/dashboard` |

### Defense-in-depth

Role checks are enforced at **two layers**:

| Layer | Location | Enforced by | On failure |
|---|---|---|---|
| Edge (fast) | `middleware.ts` | `getToken().role` | HTTP redirect |
| Server (safe) | `page.tsx` | `getSessionWithRole()` | 403 UI render |

---

## Step 8 — Admin Creation Script

**File created:** `scripts/create-admin.ts`
**File modified:** `package.json` (added `create:admin` script)

### What it does

- Resolves or creates the default organization (`Crest Care Hospital`)
- Checks if a user with the given email already exists (idempotent)
- Hashes the password using `bcrypt` with cost factor 12
- Creates the user with `role: "admin"`
- Never logs the plain password

### Usage

```bash
# Default credentials (admin@crestcare.com / Admin@123)
npm run create:admin

# Custom credentials via env vars
$env:ADMIN_EMAIL="you@hospital.com"; $env:ADMIN_PASSWORD="YourPass123"; npm run create:admin
```

### Default credentials created

| Field | Value |
|---|---|
| Email | `admin@crestcare.com` |
| Password | `Admin@123` |
| Role | `admin` |
| Organization | Crest Care Hospital |

> ⚠️ Change the default password immediately in production.

---

## Step 9 — OTP Readiness (Design Only)

No new code was written. This step confirmed the system is already prepared for OTP:

### Schema readiness ✅

```prisma
model User {
  phone    String?  @unique  // ← OTP login identifier, already in schema
  email    String?  @unique  // ← optional, OTP users don't need this
  password String?           // ← null for OTP-only users
}
```

### NextAuth readiness ✅

The OTP provider placeholder is inside `providers: []` in `route.ts`. When implementing:
1. Add `CredentialsProvider({ name: "OTP", credentials: { phone, otp } })`
2. Verify OTP against Redis/DB temp store
3. Lookup `User` by `phone`
4. Return same session shape → zero changes to JWT callbacks or middleware

---

## File Map — All Changes in saas-v1

```
cicrm/
├── prisma/
│   └── schema.prisma              ← MODIFIED: added User model + Organization.users[]
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts       ← CREATED: NextAuth config (Credentials + OTP placeholder)
│   │   ├── leads/
│   │   │   └── route.ts           ← MODIFIED: reads organizationId from session
│   │   └── messages/
│   │       └── route.ts           ← MODIFIED: passes organizationId to saveMessage
│   ├── login/
│   │   └── page.tsx               ← CREATED: email/password login UI
│   └── dashboard/
│       ├── settings/
│       │   └── page.tsx           ← MODIFIED: admin-only role guard added
│       └── doctors/
│           └── page.tsx           ← MODIFIED: admin-only role guard added
├── lib/
│   └── auth/
│       └── rbac.ts                ← CREATED: requireRole() + getSessionWithRole()
├── middleware.ts                  ← MODIFIED: auth guard + role guard merged with tenant logic
├── scripts/
│   └── create-admin.ts           ← CREATED: admin user seeding script
└── package.json                   ← MODIFIED: added next-auth, bcrypt, create:admin script
```

---

## Environment Variables Required

Add these to `.env.local`:

```env
# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## What's Next (Phase 2)

- [ ] Implement OTP login (phone + SMS verification)
- [ ] Add staff management UI (admin creates/invites staff users)
- [ ] Lock `/api/leads` and `/api/messages` behind `requireRole` for non-webhook callers
- [ ] Add session-based org isolation to remaining DB modules (`staff.ts`, `calls.ts`)
- [ ] Add logout button to dashboard header
