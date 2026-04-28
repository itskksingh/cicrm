# Crest Care AI CRM - AI Assistant Guidelines

## 1. Project Goal & Identity
You are building the "Crest Care AI CRM." Be aware that this is **NOT** a traditional CRM; it is a fast-paced **Patient Conversion System**.
- **Core Loop:** Facebook Ads → WhatsApp → Webhook → AI → CRM → Staff → Conversion.
- **Mobile-First Validation:** Hospital staff will use this on mobile devices in high-stress environments. Every component you build must be mobile-first and optimized for quick tap actions.
- **Primary Goal:** Enable staff to triage and instantly call urgent patients. The "Call" button must always be the most accessible action.

## 2. Tech Stack & Environment
- **Framework:** Next.js (App Router), React, Tailwind CSS, TypeScript.
- **IMPORTANT NEXT.JS RULES:** Read `AGENTS.md`. This project uses a newer Next.js version with breaking changes compared to older training data. When in doubt regarding caching, routing, or APIs, check `node_modules/next/dist/docs/`.
- **Styling:** Strict Tailwind CSS. All aesthetic decisions must adhere to the Design System below.

## 3. Design System: "Precision Fluidity"
Reject the "cluttered spreadsheet" aesthetic. The UI must be highly authoritative, airy, and utilize an editorial style.

- **Colors:**
  - **Primary Action (CTAs):** Clinical Blue (`#005FB8`).
  - **Hot Leads:** Urgent Crimson (`#EF4444`).
  - **Warm Leads:** Amber.
  - **Cold Leads:** Stable Blue (`#3B82F6`).
  - **Backgrounds:** Clean neutral foundations like `#F8FAFC` and pure white `#FFFFFF` cards.
- **The No-Line Rule (CRITICAL):**
  - **DO NOT** use standard `border-solid`, `border`, or 1px dividing lines to separate layout elements or cards.
  - Structure must be achieved using white space (large padding/margins) and tonal shifts (e.g., a white card on a gray background).
- **Glassmorphism & Depth:**
  - Main CTAs use a soft gradient.
  - Floating panels (like patient modals) must use Glassmorphism (semi-transparent backgrounds with `backdrop-blur-xl` or similar).
  - Do not use harsh black drop shadows. Use Ambient Shadows (large blur, very low opacity e.g. 4-6%, tinted with the text color).
- **Typography (Inter Font):**
  - Text must never be pure black (`#000000`). Use soft dark slates (`text-slate-800` etc.) to reduce eye strain.
  - Max line length for body text is 65 characters (`max-w-prose` or similar).
  - Labels should be scannable (uppercase, small), while the data itself should be large and prominent.

## 4. Functional Layout Rules
- **Lead Priority Cards:** Let hot leads dominate the top of the feed. Cards should feature a thick (4px) left-side colored border/accent to signify priority status (Red/Amber/Blue).
- **Inputs:** Form inputs should have NO background fill and NO harsh borders unless focused. When focused, they should glow with a `primary` tint.
- **Call Flow:** 
  1. Show wait times and AI recommendations.
  2. Implement one-tap calling.
  3. Immediately prompt for outcome after a call (Converted, Follow Up, Not Interested).

## 5. Development Instructions for the Agent
- Whenever you are asked to build a component, cross-reference these styling rules.
- Do not build generic "placeholder" designs. Follow the premium guidelines heavily.
- Read through `agents/agents.md` and `agents/design.md` for extended deep dives into specific workflows if you need more context during generation.
