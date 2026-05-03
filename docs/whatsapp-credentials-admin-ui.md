# WhatsApp Credentials Admin UI — Implementation Summary

**Branch:** `saas-v1`
**Date:** 2026-05-03
**Scope:** Secure backend APIs + service layer + admin UI for managing per-organization WhatsApp credentials.

---

## Constraints Applied

- All work confined to branch `saas-v1`
- `accessToken` is **never** returned in API responses or frontend state
- Existing WhatsApp message flow untouched
- Admin-only access (`role === "admin"`) enforced at every layer
- Existing NextAuth session used throughout
- All mutations routed through secure server-side APIs

---

## 1. Backend API Routes

**File:** `app/api/integrations/whatsapp/route.ts`

Four HTTP handlers created on a single route file:

| Method   | Purpose                                      |
|----------|----------------------------------------------|
| `GET`    | Returns health fields + `hasAccessToken` bool — never raw token |
| `POST`   | Creates or upserts credentials               |
| `PATCH`  | Alias to POST for update semantics           |
| `DELETE` | Removes credentials for the org              |

### Auth + RBAC Check (shared across all handlers)

```typescript
async function authenticateAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user)                             return { error: "Unauthorized",                     status: 401 };
  if (session.user.role?.toLowerCase() !== "admin") return { error: "Forbidden: Admin access required", status: 403 };
  if (!session.user.organizationId)               return { error: "Organization not found in session", status: 400 };
  return { organizationId: session.user.organizationId };
}
```

`organizationId` is **always sourced from the server session** — never from the request body or query string.

### GET Response Shape (no token)

```json
{
  "phoneNumberId": "102345678901234",
  "lastSuccessAt": "2026-05-03T10:30:00Z",
  "lastFailureAt": null,
  "failureCount": 0,
  "createdAt": "2026-05-01T08:00:00Z",
  "updatedAt": "2026-05-03T10:00:00Z",
  "hasAccessToken": true
}
```

---

## 2. Service Layer

**File:** `lib/services/whatsapp-credentials.ts`

Centralises all credential logic. The API route is a thin HTTP wrapper — all business logic lives here.

### Functions

| Function                   | Responsibility                                              |
|----------------------------|-------------------------------------------------------------|
| `getMaskedCredentials(orgId)` | Fetch + strip token before returning                     |
| `upsertCredentials(orgId, phoneNumberId, accessToken)` | Validate → encrypt → DB upsert |
| `deleteCredentials(orgId)` | Delete + handle not-found gracefully                        |

### Encryption on Write

```typescript
const encryptedToken = encrypt(accessToken.trim());
// Stored as "iv_hex:ciphertext_hex" (AES-256-CBC)
```

Reuses the existing `lib/encryption.ts` helper — backward compatible with any pre-existing plain-text credentials.

---

## 3. Audit Logging

Added inside `lib/services/whatsapp-credentials.ts`.

### Event Types

```typescript
type CredentialAction = "CREDENTIAL_CREATED" | "CREDENTIAL_UPDATED" | "CREDENTIAL_DELETED";
```

### Log Format

```
[AUDIT] 2026-05-03T02:05:12.341Z | action=CREDENTIAL_CREATED | orgId=clx1abc2def | phoneNumberId=102345678901234
[AUDIT] 2026-05-03T08:15:44.912Z | action=CREDENTIAL_UPDATED | orgId=clx1abc2def | phoneNumberId=102345678901234
[AUDIT] 2026-05-03T09:30:01.007Z | action=CREDENTIAL_DELETED | orgId=clx1abc2def
```

### Token Safety

The `AuditEvent` TypeScript interface has **no `accessToken` field** — it is impossible to log the token at compile time.

```typescript
interface AuditEvent {
  action: CredentialAction;
  organizationId: string;
  phoneNumberId?: string;
  timestamp: string;
  // ← no accessToken field — by design
}
```

`CREDENTIAL_UPDATED` vs `CREDENTIAL_CREATED` is determined by a lightweight `findUnique` pre-check before the upsert.

---

## 4. Admin Page

### Page (Server Component)

**File:** `app/dashboard/integrations/page.tsx`

- Runs `getServerSession` server-side
- Redirects unauthenticated users → `/login`
- Redirects non-admin users → `/dashboard`
- Renders `<IntegrationsManager />` only after both checks pass

### IntegrationsManager (Client Component)

**File:** `app/dashboard/integrations/IntegrationsManager.tsx`

#### Sections

**A) Status Card**
- Connected Phone Number ID
- Health badge (see below)
- Last success timestamp
- Failure count

**B) Credentials Form**
- `phoneNumberId` text input
- `accessToken` password input (placeholder shows `••••••••` when token exists)
- Save button with spinner animation

**C) Danger Zone**
- Two-step confirmation panel (no browser `confirm()` dialog)
- Step 1: Shows description + "Remove Credentials" button
- Step 2: Expands red warning banner + "Yes, Remove Credentials" / "Cancel" buttons
- Success message after deletion acknowledges env fallback

---

## 5. Health Indicator

Three-state visual indicator driven by `failureCount` and `lastSuccessAt`:

| Condition                              | Dot Colour | Badge Text      |
|----------------------------------------|------------|-----------------|
| `failureCount === 0` AND has success   | 🟢 Green   | **Active**      |
| `failureCount` between 1–3             | 🟡 Yellow  | **Degraded**    |
| `failureCount > 3` OR no success ever  | 🔴 Red     | **Issue**       |
| No credentials configured              | ⚪ Slate   | **Not Configured** |

---

## 6. Form UX & Validation

**Frontend (before any API call):**
- `phoneNumberId.trim()` empty → shows inline error, blocks submit
- `accessToken.trim()` empty → shows inline error, blocks submit
- `if (saving) return` guard prevents duplicate submissions on Save
- `if (deleting) return` guard prevents duplicate submissions on Delete

**API response errors** surface inline below the form.

**Success messages** auto-dismiss after **5 seconds** (`setTimeout`).

**Save button** is disabled while `saving || deleting` to prevent cross-action race conditions.

---

## 7. Security Validation

### Defence-in-Depth for `/dashboard/integrations`

| Layer     | Mechanism                                                   | Outcome for non-admin |
|-----------|-------------------------------------------------------------|-----------------------|
| Middleware (Edge) | `token.role !== 'admin'` in `adminOnlyPaths`       | `302` → `/dashboard`  |
| Page SSR  | `getServerSession` + `redirect()`                           | `302` → `/dashboard`  |
| API Route | `authenticateAdmin()` on every handler                      | `401` or `403`        |

**Fix applied in this session:** `/dashboard/integrations` was missing from `middleware.ts` `adminOnlyPaths`. Added:

```typescript
const adminOnlyPaths = ['/dashboard/settings', '/dashboard/doctors', '/dashboard/integrations']
```

### Decryption in Worker

`lib/db/whatsapp-credentials.ts` → `getWhatsAppCredentials()` decrypts inline:
```typescript
if (credentials?.accessToken) {
  credentials.accessToken = decrypt(credentials.accessToken);
}
```
Decrypted token lives in memory only for the duration of the API call. Worker logs only the `organizationId`, never the token value.

---

## File Map

```
app/
  api/
    integrations/
      whatsapp/
        route.ts               ← HTTP handlers (GET/POST/PATCH/DELETE)
  dashboard/
    integrations/
      page.tsx                 ← Server component, role-gated
      IntegrationsManager.tsx  ← Client UI (status, form, danger zone)

lib/
  services/
    whatsapp-credentials.ts   ← Service layer (encrypt, validate, audit log)

middleware.ts                  ← Edge guard (updated to include /integrations)
```

---

## Existing Files (Unchanged)

| File | Role |
|------|------|
| `lib/encryption.ts` | AES-256-CBC encrypt/decrypt |
| `lib/db/whatsapp-credentials.ts` | DB read layer + health update + validation |
| `lib/whatsapp.ts` | Sends WhatsApp message with credential injection |
| `scripts/worker.ts` | BullMQ worker — reads decrypted creds at job time |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth config with `organizationId` + `role` in JWT |
