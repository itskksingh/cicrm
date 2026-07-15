# Safe WhatsApp Messaging Architecture

## Enforced inbound flow

```text
Patient message
  -> HMAC webhook verification
  -> Meta phone-number-ID tenant lookup
  -> active-tenant and service-window eligibility
  -> tenant-only RAG retrieval
  -> AI draft or deterministic policy response
  -> medical safety decision
  -> WhatsApp channel policy decision
  -> send, human escalation, or refusal
```

## Security invariants

- Unknown, disabled, or mismatched tenants are rejected before RAG or AI.
- Patient-facing RAG never reads global (`organizationId IS NULL`) chunks.
- Outbound messages use only the active organization's stored credentials.
- Environment/global WhatsApp credentials are not a SaaS sending fallback.
- Free-form bot, staff, and scheduled follow-up messages require a patient
  message less than 24 hours old.
- Emergency, medical-advice, risky, and sanitized AI responses trigger a human
  handoff. Unsafe AI text is never sent.
- Invalid or empty AI drafts are refused and escalated.

## Current consent scope

This implementation supports patient-initiated service conversations. The
patient's inbound message is the consent basis for relevant replies during the
24-hour customer-service window.

Business-initiated messages outside that window are deliberately blocked.
Before enabling them, implement organization-scoped Meta-approved templates,
purpose-specific consent records, opt-out handling, template-status sync, and
delivery-status processing through the same central sender.

## Central enforcement points

- `app/api/webhook/route.ts`: authenticates Meta and resolves the tenant.
- `lib/knowledge.ts`: enforces tenant-only retrieval.
- `lib/messaging/policy.ts`: pure channel and medical policy decisions.
- `lib/messaging/safe-send.ts`: revalidates tenant, lead, service window, and
  tenant credentials immediately before the external send.
- `lib/messaging/handoff.ts`: records human handoff and lead priority.
- `scripts/worker.ts`: orchestrates the pipeline without sending directly.

No new outbound path should call `lib/whatsapp.ts` directly. It is the low-level
transport and must remain behind `sendSafeServiceMessage`.
