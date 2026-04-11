# Design System Documentation: The Editorial Estate

## 1. Overview & Creative North Star: "The Digital Curator"
This design system moves beyond the utility of property management to establish a "Digital Curator" experience. For the Canadian landlord, trust is not built through complex grids, but through clarity, composure, and an editorial sensibility.

**The Creative North Star** is defined by **Structured Serenity**. We break the "SaaS Template" look by utilizing intentional asymmetry, expansive negative space, and a sophisticated layering of surfaces. By replacing harsh structural lines with tonal shifts, we create an environment that feels like a premium architectural portfolio rather than a spreadsheet. This is professional efficiency, elevated.

---

## 2. Colors: Tonal Architecture
Our palette focuses on "Deep Navy" for authority and "Warm Gold" for prestige. We move away from flat UI by treating color as a light source.

### Core Palette
- **Primary (`#041534`):** The foundation. Used for high-level navigation and "The Anchor" elements.
- **Primary Container (`#1B2A4A`):** The functional primary. Use this for major interactive zones.
- **Secondary (`#7B5804`):** Our gold accent. Reserved for "Moment of Truth" actions and high-value status.
- **Tertiary (`#001C07`):** A deep, organic green used for "Compliant" and "Settled" states.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
1. **Background Color Shifts:** Placing a `surface-container-low` card against a `surface` background.
2. **Negative Space:** Using the spacing scale to create "islands" of information.
3. **Subtle Tonal Transitions:** Moving from `surface` to `surface-variant`.

### Signature Textures & Glassmorphism
To avoid a "cheap" flat look, use **Signature Textures**:
- **The Golden Glow:** Apply a subtle radial gradient (Primary to Primary Container) on major CTAs.
- **The Frosted Pane:** For floating modals or dropdowns, use `surface-container-lowest` at 80% opacity with a `20px` backdrop-blur. This allows property data to "bleed" through the UI, softening the experience.

---

## 3. Typography: The Editorial Scale
We use a dual-typeface system to balance authority with readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern "architectural" feel. Use `display-lg` through `headline-sm` to create a rhythmic, editorial hierarchy that guides the landlord’s eye.
*   **Body & Titles (Inter):** The workhorse. Inter provides maximum legibility for complex CAD $ lease data and provincial compliance text.

**The Hierarchy Goal:** Use high-contrast sizing (e.g., a `display-sm` header next to `body-md` metadata) to create an intentional, asymmetrical layout that feels custom-designed.

---

## 4. Elevation & Depth: Tonal Layering
We reject the standard "Drop Shadow" in favor of **Natural Light Physics**.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. 
- **Base Layer:** `surface` (#f8f9fd)
- **Section Layer:** `surface-container-low` (#f2f3f7)
- **Interactive Layer:** `surface-container-lowest` (#ffffff)
This "white-on-light-gray" nesting creates a soft lift that feels integrated, not pasted.

### Ambient Shadows
If a shadow is required for a floating element (e.g., a "New Lease" FAB):
- **Color:** Use a tinted version of `on-surface` (Deep Navy) at 6% opacity.
- **Blur:** 24px–48px. Shadows must be "whisper-thin" and highly diffused.

### The "Ghost Border" Fallback
Where accessibility requires a container (e.g., form inputs), use a **Ghost Border**: `outline-variant` at 15% opacity. Never use 100% opaque borders.

---

## 5. Components: Refined Primitives

### Buttons
- **Primary:** `primary` background with `on-primary` text. 8px corner radius. No border. Apply a subtle 10% vertical gradient to give it "weight."
- **Secondary (Gold):** `secondary-fixed` background. Reserved for revenue-generating actions (e.g., "Collect Rent").
- **Tertiary:** No background. `primary` text. Use for low-emphasis navigation.

### Cards & Lists
**Rule:** No dividers. 
- Use `surface-container-highest` for list headers and `surface-container-lowest` for individual property rows.
- **CAD $ Formatting:** Amounts should be bolded using `title-md` and right-aligned to create a strong vertical "currency column."

### Province Badges (AB, ON, BC)
- Small, `label-sm` caps. 
- Style: `surface-variant` background with `on-surface-variant` text. 
- Shape: `full` (pill-shaped) to contrast against the 8px rounded corners of the cards.

### Input Fields
- Background: `surface-container-lowest`.
- Border: "Ghost Border" (`outline-variant` @ 20%).
- Active State: The border transitions to `secondary` (Gold) at 100% opacity.

### Specialized Component: The "Compliance Ledger"
A custom list component for Canadian regulatory tasks. It uses a `surface-bright` background and a vertical "Progress Ribbon" on the left edge (using `tertiary` for success or `error` for overdue) to show compliance status without boxing in the content.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical margins (e.g., more padding on the left than the right in hero sections) to create an editorial feel.
- **Do** format all currency as `CAD $X,XXX.XX` using the `title-md` token for the numbers and `label-sm` for the "CAD" prefix.
- **Do** use `backdrop-blur` on all mobile navigation overlays to maintain a sense of space.

### Don't:
- **Don't** use 1px solid lines to separate content; use `surface-container` shifts instead.
- **Don't** use pure black (#000000) for text; always use `on-surface` (#191c1f) to maintain the "Deep Navy" tonal warmth.
- **Don't** use "Alert Red" for everything; reserve `error` for legal/compliance failures and use `secondary` (Gold) for general warnings.