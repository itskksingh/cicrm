# Crest Care AI CRM - Master Agent Guide

---

## 1. PROJECT GOAL

Build a mobile-first AI-powered hospital CRM that:

- Handles WhatsApp leads automatically
- Prioritizes urgent patients
- Enables instant calling and conversion

---

## 2. SYSTEM FLOW

Facebook Ads → WhatsApp → Webhook → AI → CRM → Staff → Conversion

---

## 3. CORE MODULES

### 3.1 WhatsApp API

- Receive messages
- Send replies

### 3.2 AI Engine

- Detect problem
- Classify lead
- Generate reply

### 3.3 Lead Engine

- Assign department
- Score priority (Hot/Warm/Cold)

### 3.4 CRM Dashboard

- Show leads
- Enable calling
- Track conversion

---

## 4. LEAD PRIORITY RULES

HOT:

- bleeding
- severe pain
- surgery intent

WARM:

- consultation
- mild symptoms

COLD:

- general inquiry

---

## 5. MOBILE UX RULES

- HOT leads at top
- Call button must be primary
- One-tap call action
- Show waiting time
- Show AI recommendation

---

## 6. CALL FLOW

1. Tap Call
2. Call happens
3. After call → show:

- Converted
- Follow-up
- Not interested

---

## 7. AI OUTPUT FORMAT

{ department: "surgery", priority: "hot", action: "call_now", reason: "severe symptoms" }

---

## 8. DESIGN RULES

- No hard borders
- Use white space
- Color-coded priority:
  - Red = Hot
  - Yellow = Warm
  - Blue = Cold

---

## 9. DEVELOPMENT PHASES

Phase 1:

- Webhook
- AI reply
- Basic UI

Phase 2:

- Lead scoring
- Assignment
- Call tracking

Phase 3:

- Automation
- Analytics

---

## 10. FINAL RULE

This system is NOT a CRM.

It is a PATIENT CONVERSION SYSTEM.

## 11. AUTHENTICATION SYSTEM

Purpose: Control staff access to CRM dashboard.

Roles:

- Admin → full control
- Caller → handle leads only

---

Login Flow:

1. Staff logs in via email/password
2. System verifies credentials
3. Session created
4. Redirect to dashboard

---

Permissions:

Admin:

- View all leads
- Manage staff
- View analytics

Caller:

- View assigned leads
- Call patients
- Update status

---

Security Rules:

- Only authenticated users can access dashboard
- Protect all API routes
- Use role-based access control
