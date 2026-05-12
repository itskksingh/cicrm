# Multi-Tenant WhatsApp Routing Implementation

This document summarizes the changes made to enable multi-tenant routing based on incoming WhatsApp business numbers.

## 1. Database Schema
Added the `WhatsAppNumber` model to map specific WhatsApp Business numbers to Organizations.

- **Model**: `WhatsAppNumber`
  - `phoneNumber`: Unique string (normalized E.164 format).
  - `organizationId`: Relation to `Organization`.
- **Changes**: Updated `Organization` model to include a reverse relation `whatsappNumbers`.

## 2. Utility Layer
Created `lib/db/whatsapp.ts` to handle organization lookups.
- **Function**: `getOrganizationByWhatsAppNumber(phoneNumber)`
  - Returns `{ organizationId, organization }` or `null`.

## 3. Webhook Extraction & Normalization
Updated the primary webhook handler to capture the receiver's context.
- **File**: `app/api/webhook/route.ts`
- **Logic**:
  - Extracts `display_phone_number` from `value.metadata`.
  - Normalizes it by removing `+` and spaces.
  - Resolves the `organizationId` before adding to the queue.

## 4. Background Processing (Worker)
Updated the BullMQ worker to enforce data isolation.
- **File**: `scripts/worker.ts`
- **Changes**:
  - Receives `organizationId` from the job payload.
  - Scopes all Prisma queries (`Lead`, `Message`) to the `organizationId`.
  - Scopes AI knowledge searches to the specific organization.

## 5. Knowledge Base Isolation
Updated the vector search logic to respect tenant boundaries.
- **File**: `lib/knowledge.ts`
- **Logic**: Added `WHERE "organizationId" = ${organizationId} OR "organizationId" IS NULL` to the vector search raw SQL query.

## 6. Implementation Checklist
- [x] Prisma Model added
- [x] Database synced (`db push`)
- [x] Normalization logic in Webhook
- [x] Multi-tenant lookup utility
- [x] Worker isolation logic
- [x] Knowledge search isolation
