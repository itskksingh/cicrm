# WhatsApp AI CRM - Compliance Architecture

## Overview
To prevent WhatsApp API bans and ensure strictly no medical advice is provided by the AI, we implemented a **7-Layer Compliance Architecture**. This serves as a "middleware guard" to filter and monitor all incoming user queries and outbound AI responses.

## The 7 Layers of Compliance

### 1. Input Intent Classifier
**File:** `lib/classifier/index.ts`
Analyzes the incoming user message using regex and categorizes it into one of five intents:
- `EMERGENCY`: Severe conditions (e.g., chest pain, accident, bleeding).
- `DANGEROUS`: Queries asking for medicine, treatments, or diagnosis.
- `RISKY`: Statements sharing medical symptoms (e.g., pain, fever).
- `INFO`: Basic queries regarding doctor availability or fees.
- `SAFE`: Basic hospital timings or booking requests.

### 2. Risk Scoring Engine
**File:** `lib/compliance/risk-scorer.ts`
Assigns a numerical risk score (`0-100`) based on the message content.
- `90-100`: Emergency keywords.
- `70-90`: Dangerous medical advice-seeking keywords.
- `40-70`: Risky symptom-sharing keywords.
- `0-40`: Info or Safe queries.

### 3. Policy Engine
**File:** `lib/policy-engine/index.ts`
Acts as the core control layer that evaluates the classified intent.
- If the intent is `DANGEROUS`, `RISKY`, or `EMERGENCY`, it immediately halts AI generation and routes to safe, hard-coded fallback messages (e.g., `SAFE_REDIRECT_MESSAGE`).
- Hard-coded constants are managed in `lib/compliance/constants.ts`.

### 4. Controlled AI Response Engine
**File:** `lib/ai.ts`
The system prompt for `gpt-4o-mini` has been strictly tightened to serve exclusively as a hospital receptionist.
**Core AI Rules:**
- NEVER diagnose diseases or interpret symptoms.
- NEVER suggest medicine or treatments.
- Keep responses short (1-3 lines).
- ONLY use the pre-defined mapping of doctors and departments.
- Always try to redirect to an appointment booking.

### 5. Output Sanitizer
**File:** `lib/sanitizer/index.ts`
Scans the AI's generated response before transmission.
- Blocks phrases like "you have", "medicine", "treatment", "you should take", etc.
- If a banned phrase is detected, the AI's response is thrown out and replaced by a safe redirect message.

### 6. Auto Disclaimer Engine
**File:** `lib/compliance/disclaimer.ts`
Automatically appends mandatory medical disclaimers to outgoing messages.
- Pre-pends an introductory warning on the **very first message** of a conversation.
- Appends a brief safety footer to **every** outgoing message.

### 7. Failsafe Mode
**File:** `lib/compliance/failsafe.ts`
Triggers an immediate human handover if extreme risk is detected.
- Evaluates if the `riskScore > 70` or if the `Output Sanitizer` blocked a response.
- Automatically updates the lead status to `ASSIGNED` and logs an emergency `HOT` priority note to alert hospital staff.

## Integration (Worker)
**File:** `scripts/worker.ts`
All 7 compliance layers are integrated into the async job worker that processes WhatsApp webhooks. 
- Intercepts incoming webhook data before database changes.
- Evaluates constraints and conditionally fires the AI response generation.
- Enforces output sanitization and applies the auto-disclaimer directly before pushing to the Meta WhatsApp API.
