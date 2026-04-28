# Design System Specification: The Clinical Concierge

## 1. Overview & Creative North Star
The philosophy of this design system is **"Precision Fluidity."** In a high-stakes hospital CRM environment, data density is often the enemy of clarity. This system rejects the "cluttered spreadsheet" aesthetic in favor of a high-end editorial experience. We treat patient data and lead management with the same intentionality as a luxury publication—utilizing balanced white space, sophisticated tonal layering, and an authoritative typographic scale.

The goal is to move beyond "functional" to "intuitive." By breaking the rigid grid through subtle shifts in surface depth and eliminating harsh containment lines, we create an interface that feels like a living, breathing assistant rather than a static database.

---

## 2. Colors & Surface Logic
We utilize a sophisticated palette that grounds the clinical nature of the work in deep, trustworthy tones while providing high-action signals for lead management.

### The Palette
- **Primary Clinical Blue:** `primary` (#005FB8) for core brand actions.
- **Hot Leads:** `tertiary` (#EF4444) – a vibrant, urgent crimson that commands attention without causing visual fatigue.
- **Warm Leads:** Custom status using `on-tertiary-fixed-variant` tones for a sophisticated amber.
- **Cold Leads:** `secondary` (#3B82F6) – a bright, stable blue to signify long-term nurturing.
- **Neutral Base:** `neutral` (#F8FAFC) – a clean, cool-tinted white for foundations.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
Structure is achieved through:
- **Tonal Transitions:** Use `surface-container-low` for the main canvas and `surface-container-lowest` (pure white) for interactive cards.
- **Proximity:** Grouping related data points through the Standard Spacing Scale (Level 2) rather than boxes.

### The "Glass & Gradient" Rule
To elevate the CRM from "utility" to "premium," main CTAs and global navigation should employ a subtle gradient transition from `primary` (#005FB8) to `primary_container`. For floating panels (e.g., patient quick-views), apply **Glassmorphism**: use a semi-transparent `surface` color with a `20px` backdrop blur to maintain context while focusing on the task.

---

## 3. Typography: Editorial Authority
We use **Inter** as our core typeface across all roles (Headline, Body, and Label), treating it with editorial rigor. The hierarchy is designed to make complex medical data scannable at a glance.

- **Display & Headlines:** Use `headline-lg` (2rem) for page titles. These should be set with a slightly tighter letter-spacing (-0.02em) to feel "custom" and authoritative.
- **Data Pairs:** Labels use `label-md` in all-caps for metadata, while the data itself uses `title-sm` to ensure the "answer" is more prominent than the "question."
- **Readability:** Body text (`body-md`) must never exceed a 65-character line length to prevent eye fatigue during long shifts.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often "dirty." In this system, we achieve depth through physical stacking of color tokens.

### The Layering Principle
- **Level 0 (Background):** `surface` (#F8FAFC).
- **Level 1 (Sectioning):** `surface-container-low` for sidebar or secondary panels.
- **Level 2 (Cards):** `surface-container-lowest` (#ffffff) for the primary workspace.
- **Level 3 (Interactive):** `surface-bright` for hover states.

### Ambient Shadows
When an element must float (e.g., a "New Lead" modal), use an **Ambient Shadow**:
- **Blur:** 24px - 32px.
- **Opacity:** 4% - 6%.
- **Color:** Use a tint of `on-surface` rather than pure black to keep the UI feeling "airy."

### The "Ghost Border" Fallback
If contrast testing requires a boundary, use a **Ghost Border**: `outline-variant` at 15% opacity. This provides a "suggestion" of a line without breaking the fluidity of the layout.

---

## 5. Components

### Cards & Leads
- **Structure:** Forbid divider lines within cards. Use the standard spacing scale (Level 2) to separate lead info from contact details.
- **Corner Radius:** Use the Moderate scale (Level 2) for all containers and internal nested elements to maintain a professional yet approachable feel.
- **Lead Indicators:** Use a thick vertical accent (4px) on the left edge of the card using the lead's status color (Red/Blue) to denote priority at a glance.

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), white text, Moderate (Level 2) radius.
- **Secondary:** `surface-container-high` background with `on-surface` text. No border.
- **Tertiary:** Pure text with a subtle underline appearing only on hover.

### Input Fields
- **Style:** Use "Inert" styling. No background color; only a subtle `outline-variant` Ghost Border. Upon focus, the border transitions to a 2px `primary` stroke with a soft glow.
- **Density:** In data-heavy CRM views, use the standard spacing scale to ensure comfort while maintaining editorial clarity.

### Status Chips
- **Hot/Warm/Cold:** Use the `container` tokens (e.g., `tertiary_container` for Hot Leads). The text should be the `on-container` variant to ensure a sophisticated, low-contrast but highly legible "tonal" look.

---

## 6. Do's and Don'ts

### Do
- **Do** prioritize "negative space" over "borders." If a layout feels messy, increase the spacing to Level 3 locally before considering a line.
- **Do** use `title-lg` for patient names to provide an immediate anchor point for the eye.
- **Do** use `surface-dim` for "disabled" states to keep the interface looking clean rather than "broken."

### Don't
- **Don't** use pure black (#000000) for text. Always use `on-surface` to maintain a premium, soft-contrast feel.
- **Don't** use standard "drop shadows." If a card doesn't have a shadow, its depth must be defined by its background color difference.
- **Don't** use icons without labels in the main navigation. In a hospital setting, clarity is more important than minimalism.

## 10. Authentication UI

Login Screen:
- Centered layout
- Large inputs
- Minimal distractions

Buttons:
- Primary gradient button
- Full width

---

Staff Dashboard Entry:
- Welcome message
- Role display
- Quick stats cards

---

Staff Management:
- Clean list view
- Simple forms
- Modal-based creation

---

UX Priority:
- Fast login
- No friction
- Immediate action access