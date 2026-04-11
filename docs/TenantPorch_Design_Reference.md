# TenantPorch — Design Reference (Extracted from Google Stitch)

This file contains all design tokens, Tailwind config, and component HTML extracted from the Stitch mockups.
Use this as the single source of truth for styling. No external files needed.

---

## DESIGN SYSTEM

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
---

## TAILWIND CONFIG

```javascript
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "surface-container-lowest": "#ffffff",
                    "surface-dim": "#d9dade",
                    "tertiary-container": "#003312",
                    "tertiary-fixed-dim": "#4ae176",
                    "secondary-container": "#fdcd74",
                    "surface-variant": "#e1e2e6",
                    "surface-tint": "#4f5e81",
                    "primary-container": "#1b2a4a",
                    "primary": "#041534",
                    "inverse-primary": "#b7c6ee",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-surface": "#191c1f",
                    "on-primary-fixed-variant": "#384668",
                    "tertiary-fixed": "#6bff8f",
                    "error-container": "#ffdad6",
                    "on-tertiary-container": "#00a94c",
                    "on-secondary-fixed": "#271900",
                    "secondary-fixed": "#ffdea6",
                    "on-primary": "#ffffff",
                    "surface-container-low": "#f2f3f7",
                    "on-tertiary-fixed": "#002109",
                    "on-secondary": "#ffffff",
                    "surface-container-highest": "#e1e2e6",
                    "outline": "#75777f",
                    "outline-variant": "#c5c6cf",
                    "secondary-fixed-dim": "#eec068",
                    "surface-container-high": "#e7e8ec",
                    "primary-fixed": "#d9e2ff",
                    "error": "#ba1a1a",
                    "surface-bright": "#f8f9fd",
                    "on-background": "#191c1f",
                    "secondary": "#7b5804",
                    "tertiary": "#001c07",
                    "background": "#f8f9fd",
                    "on-surface-variant": "#45464e",
                    "surface-container": "#edeef2",
                    "on-primary-container": "#8392b7",
                    "inverse-on-surface": "#eff1f5",
                    "on-tertiary": "#ffffff",
                    "on-secondary-fixed-variant": "#5d4200",
                    "inverse-surface": "#2e3134",
                    "surface": "#f8f9fd",
                    "on-tertiary-fixed-variant": "#005321",
                    "on-primary-fixed": "#0a1a3a",
                    "on-secondary-container": "#785601",
                    "primary-fixed-dim": "#b7c6ee"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Manrope"],
                    "body": ["Inter"],
                    "label": ["Inter"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, .headline { font-family: 'Manrope', sans-serif; }
        .glass-effect {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.8);
        }
    </style>
```

---

## SCREEN: landing_page_desktop

<body class="bg-surface text-on-surface">
<!-- TopAppBar -->
<nav class="fixed top-0 z-50 w-full px-6 py-4 h-16 flex justify-between items-center bg-slate-50/80 backdrop-blur-xl">
<div class="text-xl font-manrope font-bold text-blue-950 tracking-tight">TenantPorch</div>
<div class="hidden md:flex gap-8 items-center">
<a class="text-blue-950 font-bold border-b-2 border-amber-600 transition-all" href="#">Properties</a>
<a class="text-blue-800/60 hover:text-amber-600 transition-colors duration-200" href="#">How it Works</a>
<a class="text-blue-800/60 hover:text-amber-600 transition-colors duration-200" href="#">Pricing</a>
</div>
<div class="flex items-center gap-4">
<button class="p-2 text-on-surface-variant hover:text-secondary transition-colors">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-2 text-on-surface-variant hover:text-secondary transition-colors">
<span class="material-symbols-outlined">settings</span>
</button>
<div class="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high">
<img alt="User avatar" class="w-full h-full object-cover" data-alt="professional portrait of a Canadian real estate professional in a bright modern office setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAx0tdbFRl7TU3O8SOAP860gwGmXHiDbAiT_Rmv5wOMUWOta_kqK5KQFzJ053AWJ-yeMEqkYjOe_qR8yFujDW8e2EyMkwnFnDAY-FvRzWAZOjscSfCcFl13UlCXMNl1tPQm80pGHkyVV7O9l0CSzRFDJ6LYasi0FldD8N7SxqEbChqO1brpxetClnrIfQYWIHdfhZp2WuxM9_mpuBKNdWMBtizcV798FbL4Lowu-u5qPWOK5tYSd_ubdJ_9Oa02OvY0IgEaCdR_RSIM"/>
</div>
</div>
</nav>
<main class="pt-16">
<!-- Hero Section -->
<section class="relative overflow-hidden bg-surface py-24 px-6">
<div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
<div class="space-y-8 z-10">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-medium">
<span class="w-2 h-2 rounded-full bg-secondary"></span>
                        Trusted across Canada
                    </div>
<h1 class="text-6xl md:text-7xl font-extrabold text-primary tracking-tight leading-[1.1]">
                        Property Management <span class="text-secondary">Made Simple</span>
</h1>
<p class="text-xl text-on-surface-variant max-w-lg font-light leading-relaxed">
                        Built for Canadian landlords. Province-compliant. Tenant-friendly. Manage your portfolio with architectural precision.
                    </p>
<div class="flex flex-wrap gap-4">
<button class="px-8 py-4 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10">
                            Start Free
                        </button>
<button class="px-8 py-4 bg-secondary-fixed text-on-secondary-fixed rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all">
                            See Pricing
                        </button>
</div>
<div class="flex gap-4 pt-4">
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase rounded-full tracking-widest">AB</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase rounded-full tracking-widest">ON</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase rounded-full tracking-widest">BC</span>
</div>
</div>
<div class="relative">
<div class="absolute -top-12 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-2xl shadow-primary/5 transform lg:rotate-2 border border-outline-variant/10">
<img alt="Dashboard interface" class="rounded-lg w-full" data-alt="clean minimal property management dashboard showing rental income charts and upcoming maintenance tasks with deep navy accents" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeM3RYcwbTnrLEeX59MHABH-fTeJE7Wxu7ZAHGqOrK1ZyCGs1V4bWTve7HCFzIgZVQss8ZhvcF8UpcWcWZO6rGgW-UoA73vwX2ffKjEclNAAYkmGVXO3AvQt_auF2m5vWcTV5IFN6ZBzkRW4EaQvKhJfvlf81roDXVGteA8lgR8SG8rgBHsJOOGeovjvTiW0xKluHLTDUacDaP3P1nM14GgTPz6YyOi-I1APoK7miRN3V9IcF2pjlTb6gOvyHQtqY6ZspEtJc2zf6c"/>
</div>
<div class="absolute -bottom-8 -left-8 bg-white p-6 rounded-xl shadow-xl border border-outline-variant/10 hidden md:block">
<div class="flex items-center gap-4">
<div class="w-12 h-12 bg-tertiary-container/10 rounded-full flex items-center justify-center text-tertiary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">payments</span>
</div>
<div>
<p class="text-xs text-on-surface-variant">Recent Rent Collection</p>
<p class="text-lg font-bold text-primary">CAD $2,450.00</p>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- Social Proof -->
<section class="py-12 bg-surface-container-low border-y border-outline-variant/10">
<div class="max-w-7xl mx-auto px-6">
<p class="text-center text-on-surface-variant font-medium mb-8">Trusted by 200+ Canadian landlords across the provinces</p>
<div class="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
<div class="text-2xl font-black italic tracking-tighter">METROBASE</div>
<div class="text-2xl font-black italic tracking-tighter">MAPLEHOUSING</div>
<div class="text-2xl font-black italic tracking-tighter">CDNPROPS</div>
<div class="text-2xl font-black italic tracking-tighter">LAKEVIEW MGMT</div>
</div>
</div>
</section>
<!-- Features Bento Grid -->
<section class="py-24 px-6 max-w-7xl mx-auto">
<div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
<div class="max-w-2xl">
<h2 class="text-4xl font-bold text-primary mb-4">Precision tools for modern management</h2>
<p class="text-on-surface-variant">We've replaced the chaos of spreadsheets with an editorial, structured flow designed for efficiency.</p>
</div>
<div class="text-secondary font-bold flex items-center gap-2 cursor-pointer group">
                    View all features <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
<!-- Feature 1 -->
<div class="md:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/5 flex flex-col justify-between min-h-[320px] hover:shadow-md transition-shadow">
<div>
<div class="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center text-secondary mb-6">
<span class="material-symbols-outlined">payments</span>
</div>
<h3 class="text-2xl font-bold text-primary mb-3">Rent Collection</h3>
<p class="text-on-surface-variant leading-relaxed">Automated CAD transfers directly to your account. No more chasing cheques or e-transfers.</p>
</div>
</div>
<!-- Feature 2 -->
<div class="md:col-span-2 bg-primary p-8 rounded-xl shadow-sm flex flex-col justify-between min-h-[320px] text-white overflow-hidden relative">
<div class="z-10">
<div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white mb-6">
<span class="material-symbols-outlined">handyman</span>
</div>
<h3 class="text-2xl font-bold mb-3">Maintenance Tracking</h3>
<p class="text-blue-100/70 leading-relaxed">Centralized ticketing system for tenants and contractors. Track status from report to resolution.</p>
</div>
<div class="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
</div>
<!-- Feature 3 -->
<div class="md:col-span-1 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/5 hover:shadow-md transition-shadow">
<div class="w-10 h-10 bg-surface-container text-primary rounded-lg flex items-center justify-center mb-6">
<span class="material-symbols-outlined">description</span>
</div>
<h3 class="text-xl font-bold text-primary mb-2">Document Vault</h3>
<p class="text-sm text-on-surface-variant">Encrypted storage for leases, IDs, and insurance.</p>
</div>
<!-- Feature 4 -->
<div class="md:col-span-3 bg-surface-container-low p-8 rounded-xl shadow-sm border border-outline-variant/5 flex flex-col md:flex-row gap-8 items-center">
<div class="flex-1">
<div class="w-10 h-10 bg-tertiary/10 text-tertiary rounded-lg flex items-center justify-center mb-6">
<span class="material-symbols-outlined">gavel</span>
</div>
<h3 class="text-2xl font-bold text-primary mb-3">Compliance Tools</h3>
<p class="text-on-surface-variant">Automated province-specific forms (Ontario Standard Lease, BC Form RTB-1) updated to the latest regulations.</p>
</div>
<div class="flex-shrink-0 bg-white p-4 rounded-lg shadow-sm border border-outline-variant/10 w-full md:w-64">
<div class="flex justify-between items-center mb-4">
<span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Compliance Status</span>
<span class="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] rounded-full">ACTIVE</span>
</div>
<div class="space-y-3">
<div class="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div class="h-full bg-tertiary-fixed-dim w-3/4"></div>
</div>
<p class="text-[10px] text-on-surface-variant">RTB Form Filing: 75% Complete</p>
</div>
</div>
</div>
</div>
</section>
<!-- Pricing Section -->
<section class="py-24 bg-surface-container-low px-6">
<div class="max-w-7xl mx-auto">
<div class="text-center mb-16">
<h2 class="text-4xl font-bold text-primary mb-4">Pricing that scales with you</h2>
<p class="text-on-surface-variant">Simple, transparent plans with no hidden Canadian "convenience" fees.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<!-- Free -->
<div class="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 flex flex-col">
<div class="mb-8">
<h3 class="text-xl font-bold text-primary mb-2">Free</h3>
<div class="flex items-baseline gap-1">
<span class="text-sm font-medium text-on-surface-variant">CAD $</span>
<span class="text-4xl font-black text-primary">0</span>
</div>
<p class="text-sm text-on-surface-variant mt-2">Up to 2 units</p>
</div>
<ul class="space-y-4 mb-10 flex-grow">
<li class="flex items-center gap-3 text-sm text-on-surface">
<span class="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                                Essential Rent Tracking
                            </li>
<li class="flex items-center gap-3 text-sm text-on-surface">
<span class="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                                Document Storage (1GB)
                            </li>
<li class="flex items-center gap-3 text-sm text-on-surface">
<span class="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                                Community Support
                            </li>
</ul>
<button class="w-full py-3 border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors">Start Free</button>
</div>
<!-- Pro -->
<div class="bg-primary p-8 rounded-xl border border-primary shadow-2xl shadow-primary/20 flex flex-col relative scale-105 z-10">
<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary px-4 py-1 rounded-full text-xs font-bold tracking-widest">MOST POPULAR</div>
<div class="mb-8">
<h3 class="text-xl font-bold text-white mb-2">Pro</h3>
<div class="flex items-baseline gap-1">
<span class="text-sm font-medium text-blue-200">CAD $</span>
<span class="text-4xl font-black text-white">15</span>
<span class="text-sm text-blue-200">/unit/mo</span>
</div>
<p class="text-sm text-blue-200 mt-2">Best for growing portfolios</p>
</div>
<ul class="space-y-4 mb-10 flex-grow">
<li class="flex items-center gap-3 text-sm text-white">
<span class="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
                                Automated Rent Collection
                            </li>
<li class="flex items-center gap-3 text-sm text-white">
<span class="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
                                Province-Specific Forms
                            </li>
<li class="flex items-center gap-3 text-sm text-white">
<span class="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
                                Maintenance Workflows
                            </li>
<li class="flex items-center gap-3 text-sm text-white">
<span class="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
                                Priority Email Support
                            </li>
</ul>
<button class="w-full py-3 bg-secondary text-on-secondary font-bold rounded-lg hover:opacity-90 transition-opacity">Get Started</button>
</div>
<!-- Business -->
<div class="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 flex flex-col">
<div class="mb-8">
<h3 class="text-xl font-bold text-primary mb-2">Business</h3>
<div class="flex items-baseline gap-1">
<span class="text-sm font-medium text-on-surface-variant">CAD $</span>
<span class="text-4xl font-black text-primary">12</span>
<span class="text-sm text-on-surface-variant">/unit/mo</span>
</div>
<p class="text-sm text-on-surface-variant mt-2">50+ units (volume pricing)</p>
</div>
<ul class="space-y-4 mb-10 flex-grow">
<li class="flex items-center gap-3 text-sm text-on-surface">
<span class="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                                Everything in Pro
                            </li>
<li class="flex items-center gap-3 text-sm text-on-surface">
<span class="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                                Custom Accounting Exports
                            </li>
<li class="flex items-center gap-3 text-sm text-on-surface">
<span class="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                                Dedicated Portfolio Manager
                            </li>
<li class="flex items-center gap-3 text-sm text-on-surface">
<span class="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                                Multi-user Permissions
                            </li>
</ul>
<button class="w-full py-3 border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors">Contact Sales</button>
</div>
</div>
</div>
</section>
<!-- Testimonials -->
<section class="py-24 px-6 max-w-7xl mx-auto">
<h2 class="text-3xl font-bold text-center text-primary mb-16 italic">"The editorial interface makes my monthly reports feel like a high-end portfolio presentation."</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-12">

---

## SCREEN: landing_page_mobile

<body class="bg-surface text-on-surface antialiased overflow-x-hidden selection:bg-secondary-fixed selection:text-on-secondary-fixed">
<!-- TopNavBar -->
<nav class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl fixed top-0 z-50 w-full flex justify-between items-center px-6 py-4 h-16">
<div class="text-xl font-manrope font-bold text-blue-950 dark:text-white tracking-tight">TenantPorch</div>
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-blue-800/60 dark:text-blue-300/60" data-icon="notifications">notifications</span>
<span class="material-symbols-outlined text-blue-800/60 dark:text-blue-300/60" data-icon="settings">settings</span>
<div class="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
<img alt="User avatar" data-alt="Close-up portrait of a professional male business owner in his 40s with a warm confident expression, soft office lighting background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaB5L7OyM5Lc5LLS4R_prPglbOH1cQNiICSirBsvxdveN6XNcjL-qY-heX39PQxo3ufH8WsAZQkgs8CrP6nKnfHK-2iuq5tYp28QYKlOelwFN79JY7iGimrwEKbqyhTPTzomzQTqVwLHjyT2Zgrx_U0cd_A6j9qgFI7rfxQziMKc4ZGwaGakHbxfveoacWOij_fGuHyvKfn9KSc3EViVpENHRS-hhVmAPz19A_1mjK4JIYdWNSNJVVVuc2cPxzKKvtba2SJBhqVdNh"/>
</div>
</div>
</nav>
<main class="pt-16 pb-32">
<!-- Hero Section -->
<section class="px-6 py-12 flex flex-col gap-8 bg-gradient-to-b from-slate-100 to-transparent">
<div class="space-y-4">
<span class="inline-block px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-widest">Digital Curator</span>
<h1 class="text-4xl font-extrabold text-primary leading-[1.1] tracking-tight">
                    Structured Serenity for Canadian Landlords.
                </h1>
<p class="text-on-surface-variant text-lg leading-relaxed">
                    Elevate your property portfolio with an editorial management experience. Composed, clear, and compliant.
                </p>
</div>
<div class="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl">
<img alt="Modern minimalist Canadian apartment" class="w-full h-full object-cover" data-alt="Interior of a modern luxury Canadian apartment with large windows showing a city skyline, minimalist wood furniture, and soft morning sunlight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8X1YwehxFJ5V3WtEdyxzFxxYQSmI0Jby_aju3qB55ekska8PQjy-ifPtSzOggVUZ3lt__ejwIo7NOHY0cXC1N6XWlYiOKTU6Hiaxd7gi72fbKfBIVvwZAvI10eVz52nsxJLQCxI7o9BPmO-XK_V3DtV-zNUnNFfvv7MTSOyJu4ifsTiN5A2_Tk3CETuPiFABBOkfCXLFyWeUXZZy37q3HaSTXwW4tc9IVJ9efHypXtxtsWM427SWxKIMOrqyZGFS7C4ke7AiOUZVL"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
<div class="absolute bottom-4 left-4 flex gap-2">
<span class="bg-surface-variant/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold uppercase">ON</span>
<span class="bg-surface-variant/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold uppercase">BC</span>
<span class="bg-surface-variant/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold uppercase">AB</span>
</div>
</div>
</section>
<!-- Feature Cards (Single Column) -->
<section class="px-6 py-12 flex flex-col gap-10">
<div class="space-y-2">
<h2 class="text-2xl font-bold text-primary">The Curated Toolkit</h2>
<div class="h-1 w-12 bg-secondary rounded-full"></div>
</div>
<!-- Bento Card 1 -->
<div class="bg-surface-container-low rounded-3xl p-6 flex flex-col gap-4 border border-outline-variant/10">
<div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-secondary-fixed">
<span class="material-symbols-outlined" data-icon="domain">domain</span>
</div>
<h3 class="text-xl font-bold text-primary">Portfolio Architecture</h3>
<p class="text-on-surface-variant text-sm leading-relaxed">
                    Organize multi-unit dwellings with architectural precision. Visualized data for effortless oversight across provinces.
                </p>
</div>
<!-- Bento Card 2 -->
<div class="bg-surface-container-lowest rounded-3xl p-6 flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10">
<div class="w-12 h-12 rounded-xl bg-tertiary-container flex items-center justify-center text-tertiary-fixed">
<span class="material-symbols-outlined" data-icon="payments">payments</span>
</div>
<h3 class="text-xl font-bold text-primary">Rent Collection</h3>
<p class="text-on-surface-variant text-sm leading-relaxed">
                    Automated CAD $ settlement with integrated compliance ledgers for every transaction. Settled with a single tap.
                </p>
</div>
<!-- Bento Card 3 -->
<div class="bg-surface-container-low rounded-3xl p-6 flex flex-col gap-4 border border-outline-variant/10">
<div class="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-white">
<span class="material-symbols-outlined" data-icon="description">description</span>
</div>
<h3 class="text-xl font-bold text-primary">Lease Composition</h3>
<p class="text-on-surface-variant text-sm leading-relaxed">
                    Provincial-standard lease agreements generated instantly. Editorial clarity meets legal compliance.
                </p>
</div>
</section>
<!-- Pricing Tiers -->
<section class="px-6 py-12 bg-primary text-on-primary">
<div class="mb-10 text-center space-y-4">
<h2 class="text-3xl font-bold">Invest in Order</h2>
<p class="text-on-primary-container">Scale your serenity as your portfolio grows.</p>
</div>
<div class="flex flex-col gap-6">
<!-- Basic Card -->
<div class="bg-primary-container p-8 rounded-3xl border border-outline-variant/10 flex flex-col gap-6">
<div>
<h4 class="text-sm font-bold uppercase tracking-widest text-on-primary-container">The Artisan</h4>
<div class="mt-2 flex items-baseline gap-1">
<span class="text-xs text-on-primary-container">CAD</span>
<span class="text-4xl font-bold">$29</span>
<span class="text-sm text-on-primary-container">/mo</span>
</div>
</div>
<ul class="space-y-4 text-sm text-on-primary-container">
<li class="flex items-center gap-3"><span class="material-symbols-outlined text-xs" data-icon="check">check</span> Up to 5 Units</li>
<li class="flex items-center gap-3"><span class="material-symbols-outlined text-xs" data-icon="check">check</span> Standard Lease Templates</li>
<li class="flex items-center gap-3"><span class="material-symbols-outlined text-xs" data-icon="check">check</span> Basic Financial Reports</li>
</ul>
<button class="w-full py-4 bg-white text-primary rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95">Select Plan</button>
</div>
<!-- Pro Card (Featured) -->
<div class="bg-surface-container-lowest text-on-surface p-8 rounded-3xl border-2 border-secondary-fixed flex flex-col gap-6 relative overflow-hidden shadow-2xl">
<div class="absolute top-0 right-0 bg-secondary-fixed px-4 py-1 rounded-bl-xl text-[10px] font-black text-on-secondary-fixed uppercase tracking-tighter">Most Curated</div>
<div>
<h4 class="text-sm font-bold uppercase tracking-widest text-secondary">The Estate</h4>
<div class="mt-2 flex items-baseline gap-1">
<span class="text-xs text-on-surface-variant font-medium">CAD</span>
<span class="text-4xl font-bold text-primary">$89</span>
<span class="text-sm text-on-surface-variant">/mo</span>
</div>
</div>
<ul class="space-y-4 text-sm text-on-surface-variant">
<li class="flex items-center gap-3"><span class="material-symbols-outlined text-xs text-secondary" data-icon="check">check</span> Unlimited Units</li>
<li class="flex items-center gap-3"><span class="material-symbols-outlined text-xs text-secondary" data-icon="check">check</span> Multi-Province Compliance</li>
<li class="flex items-center gap-3"><span class="material-symbols-outlined text-xs text-secondary" data-icon="check">check</span> Advanced Ledger Exports</li>
<li class="flex items-center gap-3"><span class="material-symbols-outlined text-xs text-secondary" data-icon="check">check</span> Priority Maintenance Sync</li>
</ul>
<button class="w-full py-4 bg-secondary text-white rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-secondary/20">Elevate Now</button>
</div>
</div>
</section>
<!-- Compliance Section (Editorial Layout) -->
<section class="px-6 py-16 space-y-8">
<h2 class="text-3xl font-bold text-primary max-w-[280px]">Regulatory confidence, by design.</h2>
<div class="relative bg-surface-bright p-6 rounded-3xl border-l-8 border-tertiary">
<p class="text-on-surface-variant italic text-sm leading-relaxed">
                    "TenantPorch transformed our Ontario portfolio from a mess of spreadsheets to a composed, compliant business model."
                </p>
<div class="mt-6 flex items-center gap-4">
<img alt="Landlord Profile" class="w-10 h-10 rounded-full grayscale" data-alt="Professional profile headshot of a middle-aged woman with a kind smile, minimalist grey studio background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr7_RK_Z3csX5nHjo84It3hzQw2ccDZfWlWgvub1Wvui-sauzRVtFdpyQwY1SLnwA1L2a5IuJNfONoqvfryGVeCSqbUSi25aU6_-7l2dFe-6_GEZrOW6-4yggVlywIrfuV-TXjq_e4mZ2do-IcvgpE466xvLwuAM_sGRxt1dyZL4Wz7fqCMIB3kFD4vPrZ_BUDcM7DTSK3gnYxSCeXKRgk3oQOv7p7EPX0cEBbor5zYvAydTE18I7ih0ERMpicsOSgm0cDOqYBP92D"/>
<div>
<p class="text-xs font-bold text-primary">Sarah Jennings</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-widest">Toronto Estates</p>
</div>
</div>
</div>
</section>
<!-- Mobile Optimized Footer -->
<footer class="px-6 py-12 bg-surface-container-high flex flex-col gap-8">
<div class="space-y-4">
<div class="text-2xl font-black text-primary italic">TenantPorch</div>
<p class="text-xs text-on-surface-variant leading-relaxed">
                    Sophisticated property management for the modern Canadian landlord. Built in Vancouver, scaled for the world.
                </p>
</div>
<div class="grid grid-cols-2 gap-8">
<div class="space-y-4">
<p class="text-[10px] font-bold text-primary uppercase tracking-widest">Resources</p>
<ul class="text-sm text-on-surface-variant space-y-2">
<li>Legal Guide</li>
<li>Tax Filing</li>
<li>Support</li>
</ul>
</div>
<div class="space-y-4">
<p class="text-[10px] font-bold text-primary uppercase tracking-widest">Connect</p>
<ul class="text-sm text-on-surface-variant space-y-2">
<li>Twitter</li>
<li>LinkedIn</li>
<li>Contact</li>
</ul>
</div>
</div>
<div class="pt-8 border-t border-outline-variant/30 text-[10px] text-on-surface-variant/60 text-center uppercase tracking-widest">
                © 2024 TenantPorch. All rights reserved.
            </div>
</footer>
</main>
<!-- BottomNavBar (Mobile Shell) -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] border-t border-slate-200/10 flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<div class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 transition-all scale-90 duration-200">
<span class="material-symbols-outlined" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Dashboard</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Properties</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Finance</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800">
<span class="material-symbols-outlined" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Mainten.</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800">
<span class="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">More</span>
</div>
</nav>
<!-- Sticky Start Free CTA -->
<div class="fixed bottom-24 left-6 right-6 z-[60]">
<button class="w-full h-14 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 active:scale-95 transition-all">
<span>Start Free Trial</span>
<span class="material-symbols-outlined text-secondary-fixed" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</body></html>
---

## SCREEN: landlord_dashboard_desktop

<body class="bg-surface text-on-surface">
<!-- Layout Wrapper -->
<div class="flex min-h-screen">
<!-- SideNavBar (Desktop) -->
<aside class="h-screen w-64 hidden lg:flex flex-col left-0 top-0 fixed bg-primary dark:bg-slate-950 z-40 shadow-xl shadow-blue-950/20 py-6">
<div class="px-6 mb-8">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
<span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">domain</span>
</div>
<div>
<h1 class="text-2xl font-black text-white italic tracking-tight">TenantPorch</h1>
<p class="text-[10px] text-blue-200/60 uppercase tracking-widest font-bold">Canadian Property Mgmt</p>
</div>
</div>
</div>
<nav class="flex-1 flex flex-col gap-1 overflow-y-auto">
<a class="bg-blue-900 dark:bg-slate-800 text-white rounded-lg px-4 py-3 mx-4 flex items-center gap-3 transition-all translate-x-1" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">dashboard</span>
<span class="font-headline font-medium text-sm">Dashboard</span>
</a>
<a class="text-blue-200/70 hover:text-white hover:bg-blue-900/50 dark:hover:bg-slate-800/50 px-4 py-3 mx-4 rounded-lg flex items-center gap-3 transition-all" href="#">
<span class="material-symbols-outlined">domain</span>
<span class="font-headline font-medium text-sm">Properties</span>
</a>
<a class="text-blue-200/70 hover:text-white hover:bg-blue-900/50 dark:hover:bg-slate-800/50 px-4 py-3 mx-4 rounded-lg flex items-center gap-3 transition-all" href="#">
<span class="material-symbols-outlined">groups</span>
<span class="font-headline font-medium text-sm">Tenants</span>
</a>
<a class="text-blue-200/70 hover:text-white hover:bg-blue-900/50 dark:hover:bg-slate-800/50 px-4 py-3 mx-4 rounded-lg flex items-center gap-3 transition-all" href="#">
<span class="material-symbols-outlined">payments</span>
<span class="font-headline font-medium text-sm">Financials</span>
</a>
<a class="text-blue-200/70 hover:text-white hover:bg-blue-900/50 dark:hover:bg-slate-800/50 px-4 py-3 mx-4 rounded-lg flex items-center gap-3 transition-all" href="#">
<span class="material-symbols-outlined">handyman</span>
<span class="font-headline font-medium text-sm">Maintenance</span>
</a>
<a class="text-blue-200/70 hover:text-white hover:bg-blue-900/50 dark:hover:bg-slate-800/50 px-4 py-3 mx-4 rounded-lg flex items-center gap-3 transition-all" href="#">
<span class="material-symbols-outlined">description</span>
<span class="font-headline font-medium text-sm">Documents</span>
</a>
<a class="text-blue-200/70 hover:text-white hover:bg-blue-900/50 dark:hover:bg-slate-800/50 px-4 py-3 mx-4 rounded-lg flex items-center gap-3 transition-all" href="#">
<span class="material-symbols-outlined">mail</span>
<span class="font-headline font-medium text-sm">Messages</span>
</a>
<a class="text-blue-200/70 hover:text-white hover:bg-blue-900/50 dark:hover:bg-slate-800/50 px-4 py-3 mx-4 rounded-lg flex items-center gap-3 transition-all" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-headline font-medium text-sm">Settings</span>
</a>
</nav>
<div class="px-4 mt-auto">
<button class="w-full bg-secondary text-white py-3 px-4 rounded-lg font-headline font-bold text-sm shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform">
<span class="material-symbols-outlined text-sm">add_circle</span>
                    Add Property
                </button>
</div>
</aside>
<!-- Main Canvas -->
<main class="flex-1 lg:ml-64 transition-all">
<!-- TopNavBar -->
<header class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl docked full-width sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 h-16 border-b border-slate-200/50">
<div class="flex items-center gap-6">
<div class="flex items-center gap-2">
<span class="text-xl font-headline font-bold text-primary dark:text-white tracking-tight">TenantPorch</span>
</div>
<div class="hidden md:flex items-center px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/20 gap-2 cursor-pointer hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined text-secondary text-lg">location_city</span>
<span class="text-sm font-medium text-on-surface">The Oakwood Portfolio</span>
<span class="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
</div>
</div>
<div class="flex items-center gap-4">
<div class="flex gap-2">
<button class="p-2 text-on-surface-variant hover:text-secondary transition-colors relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
</button>
<button class="p-2 text-on-surface-variant hover:text-secondary transition-colors">
<span class="material-symbols-outlined">settings</span>
</button>
</div>
<div class="h-8 w-[1px] bg-outline-variant/30 mx-1"></div>
<div class="flex items-center gap-3">
<div class="text-right hidden sm:block">
<p class="text-xs font-bold text-on-surface">James Harrison</p>
<p class="text-[10px] text-on-surface-variant">Standard Landlord</p>
</div>
<img alt="User avatar" class="w-10 h-10 rounded-full border-2 border-white shadow-sm" data-alt="portrait of a middle-aged professional man with a kind smile, studio lighting, clean background, high quality photography" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtE0M5ky34XIzPlqKhZiH3tgDQqqWR4Rrv9CVd1G96aS533jJBasnrAVbu4KCzlgoif8mfMAE8-cUVZq3qD8r4UM_zFv4QLB7s2DuJLpv7ZHObtQ53qRGOkoMXnGAjCkuJ752Aw9le2bfB9DtS6uXDPA-qMYEwfveBmUQO6kh2GV4kQy0WR-d5VlPm_nk8t4fD0ha7L6bCdxRq-LhQbBSIlW_9zYKaeaziAB43ZXhEj7UgT0MlbqmU2u_sm7wSN5P73Gy2YoP4ksLF"/>
</div>
</div>
</header>
<!-- Dashboard Content -->
<div class="p-6 lg:p-10 space-y-8 max-w-[1440px] mx-auto">
<!-- Welcome Section -->
<section class="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h2 class="text-3xl font-headline font-extrabold text-primary tracking-tight">Portfolio Overview</h2>
<p class="text-on-surface-variant font-body">Manage your Toronto and Vancouver residential assets.</p>
</div>
<div class="flex gap-3">
<button class="bg-surface-container-lowest text-primary px-5 py-2.5 rounded-lg font-headline font-semibold text-sm border border-outline-variant/30 shadow-sm hover:bg-surface-container transition-colors">
                            Generate Report
                        </button>
<button class="bg-secondary text-white px-5 py-2.5 rounded-lg font-headline font-semibold text-sm shadow-md shadow-secondary/20 hover:scale-[0.98] transition-transform flex items-center gap-2">
<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">payments</span>
                            Collect Rent
                        </button>
</div>
</section>
<!-- Onboarding Checklist (Dismissible) -->
<section class="bg-primary text-white rounded-2xl p-6 relative overflow-hidden">
<div class="absolute top-0 right-0 p-4">
<button class="text-white/40 hover:text-white">
<span class="material-symbols-outlined">close</span>
</button>
</div>
<div class="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
<div class="lg:w-1/3">
<h3 class="text-xl font-headline font-bold mb-2">Welcome to your Curator Dashboard</h3>
<p class="text-blue-200/80 text-sm">Finish setting up your profile to enable automatic rent collection and legal document generation.</p>
</div>
<div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
<div class="bg-white/10 rounded-xl p-4 border border-white/5 flex items-start gap-3">
<span class="material-symbols-outlined text-tertiary-fixed">check_circle</span>
<div>
<p class="text-xs font-bold">Profile Verified</p>
<p class="text-[10px] text-white/60">Legal identity confirmed</p>
</div>
</div>
<div class="bg-white/10 rounded-xl p-4 border border-white/5 flex items-start gap-3">
<span class="material-symbols-outlined text-amber-400">pending</span>
<div>
<p class="text-xs font-bold">Connect Bank</p>
<p class="text-[10px] text-white/60">Required for CAD payments</p>
</div>
</div>
<div class="bg-white/10 rounded-xl p-4 border border-white/5 flex items-start gap-3">
<span class="material-symbols-outlined text-white/30">radio_button_unchecked</span>
<div>
<p class="text-xs font-bold">Upload Leases</p>
<p class="text-[10px] text-white/60">Start tracking compliance</p>
</div>
</div>
</div>
</div>
<!-- Decorative element -->
<div class="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
</section>
<!-- KPI Row -->
<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
<!-- KPI Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-tertiary-fixed-dim shadow-sm">
<div class="flex justify-between items-start mb-4">
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Rent Collected</p>
<span class="text-[10px] font-bold text-tertiary px-2 py-0.5 bg-tertiary/10 rounded-full">+12.4%</span>
</div>
<p class="text-2xl font-headline font-extrabold text-primary"><span class="text-sm font-medium opacity-60 mr-1 text-on-surface-variant">CAD</span>$42,850.00</p>
<p class="text-xs text-on-surface-variant mt-2">v.s. last month ($38,120)</p>
</div>
<!-- KPI Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-error shadow-sm">
<div class="flex justify-between items-start mb-4">
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Outstanding</p>
<span class="text-[10px] font-bold text-error px-2 py-0.5 bg-error/10 rounded-full">+2.1%</span>
</div>
<p class="text-2xl font-headline font-extrabold text-primary"><span class="text-sm font-medium opacity-60 mr-1 text-on-surface-variant">CAD</span>$3,400.00</p>
<p class="text-xs text-on-surface-variant mt-2">4 Tenants overdue</p>
</div>
<!-- KPI Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-secondary shadow-sm">
<div class="flex justify-between items-start mb-4">
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Utilities Pending</p>
<span class="text-[10px] font-bold text-on-surface-variant px-2 py-0.5 bg-surface-container rounded-full">Stable</span>
</div>
<p class="text-2xl font-headline font-extrabold text-primary"><span class="text-sm font-medium opacity-60 mr-1 text-on-surface-variant">CAD</span>$1,215.40</p>
<p class="text-xs text-on-surface-variant mt-2">3 hydro, 1 gas invoice</p>
</div>
<!-- KPI Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary shadow-sm">
<div class="flex justify-between items-start mb-4">
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vacancy Rate</p>
<span class="text-[10px] font-bold text-tertiary px-2 py-0.5 bg-tertiary/10 rounded-full">-1.5%</span>
</div>
<p class="text-2xl font-headline font-extrabold text-primary">2.4<span class="text-sm font-medium opacity-60 ml-1">%</span></p>
<p class="text-xs text-on-surface-variant mt-2">1 unit currently vacant</p>
</div>
</section>
<!-- Bento Grid Content -->
<div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
<!-- Property Collection Status (Asymmetric Grid) -->
<div class="xl:col-span-8 space-y-6">
<div class="flex justify-between items-center">
<h3 class="text-xl font-headline font-bold text-primary">Unit Status <span class="text-on-surface-variant font-medium text-sm ml-2">— The Oakwood Portfolio</span></h3>
<button class="text-sm font-bold text-secondary flex items-center gap-1 hover:underline">
                                View Map
                                <span class="material-symbols-outlined text-sm">open_in_new</span>
</button>
</div>
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
<!-- Unit Card Paid -->
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 hover:border-tertiary/30 transition-all group">
<div class="flex justify-between mb-3">
<span class="text-xs font-bold text-on-surface-variant">Unit 101</span>
<span class="w-2.5 h-2.5 bg-tertiary rounded-full shadow-[0_0_8px_rgba(0,28,7,0.3)]"></span>
</div>
<p class="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">Tenant</p>
<p class="text-sm font-bold text-primary truncate mb-3">Marcus Thorne</p>
<div class="flex justify-between items-center">
<span class="text-[10px] bg-tertiary/10 text-tertiary font-bold px-2 py-0.5 rounded-full uppercase">Paid</span>
<span class="text-xs font-extrabold text-primary">$1,850</span>
</div>
</div>
<!-- Unit Card Paid -->
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 hover:border-tertiary/30 transition-all">
<div class="flex justify-between mb-3">
<span class="text-xs font-bold text-on-surface-variant">Unit 102</span>
<span class="w-2.5 h-2.5 bg-tertiary rounded-full shadow-[0_0_8px_rgba(0,28,7,0.3)]"></span>
</div>
<p class="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">Tenant</p>
<p class="text-sm font-bold text-primary truncate mb-3">Elena Gilbert</p>
<div class="flex justify-between items-center">
<span class="text-[10px] bg-tertiary/10 text-tertiary font-bold px-2 py-0.5 rounded-full uppercase">Paid</span>
<span class="text-xs font-extrabold text-primary">$2,100</span>
</div>
</div>
<!-- Unit Card Overdue -->
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-2 border-error/20 hover:border-error/40 transition-all">
<div class="flex justify-between mb-3">
<span class="text-xs font-bold text-on-surface-variant">Unit 201</span>
<span class="w-2.5 h-2.5 bg-error rounded-full shadow-[0_0_8px_rgba(186,26,26,0.3)] animate-pulse"></span>
</div>
<p class="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">Tenant</p>
<p class="text-sm font-bold text-primary truncate mb-3">Jordan Peterson</p>
<div class="flex justify-between items-center">
<span class="text-[10px] bg-error/10 text-error font-bold px-2 py-0.5 rounded-full uppercase">Overdue</span>
<span class="text-xs font-extrabold text-error">$1,550</span>
</div>
</div>
<!-- Unit Card Vacant -->
<div class="bg-surface-container-low border border-dashed border-outline-variant p-4 rounded-xl transition-all">
<div class="flex justify-between mb-3">
<span class="text-xs font-bold text-on-surface-variant">Unit 202</span>
<span class="w-2.5 h-2.5 bg-outline-variant rounded-full"></span>
</div>
<p class="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">Status</p>
<p class="text-sm font-bold text-on-surface-variant truncate mb-3 italic">Unoccupied</p>
<div class="flex justify-between items-center">
<span class="text-[10px] bg-outline-variant/20 text-on-surface-variant font-bold px-2 py-0.5 rounded-full uppercase">Vacant</span>
<button class="text-[10px] text-secondary font-bold hover:underline">List Unit</button>
</div>

---

## SCREEN: landlord_dashboard_mobile

<body class="bg-surface text-on-surface min-h-screen pb-24">
<!-- Top Navigation Bar -->
<header class="bg-slate-50/80 backdrop-blur-xl fixed top-0 z-50 w-full flex justify-between items-center px-6 py-4 h-16">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary" data-icon="menu">menu</span>
<span class="text-xl font-manrope font-bold text-blue-950 tracking-tight">TenantPorch</span>
</div>
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-blue-900" data-icon="notifications">notifications</span>
<img alt="User avatar" class="w-8 h-8 rounded-full border border-outline-variant/20" data-alt="professional portrait of a property manager in a clean modern office setting with soft natural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcwzzpdid3Fi_GfgqzeHd145Ap3QpIqR7epXcVwitxcwfuiAJpjYCwu71rvdOw6uCmsmBh5dZmuhtMD75Y4eeXAefmplUn63hXrF82BOUNtcFJJDH_WqtVVM9HMC6AcCSL9xPkcpo1jtYH5pVJiRT--ySrOXjgt13JaT-9sL9sef1P7imBZaa29cjDyrSSCkURHSjFQas-tJvPN5EQLZYRyNcJTpsQ-WjbpfSawFg2EGw16DNXjfesbrTaxKDnp1fA7PWrSXcTAtNd"/>
</div>
</header>
<!-- Main Content Canvas -->
<main class="pt-20 px-5 space-y-6">
<!-- Greeting & Summary -->
<section class="mt-4">
<h1 class="text-2xl font-manrope font-extrabold tracking-tight text-primary">Good Morning, Alex</h1>
<p class="text-on-surface-variant font-body text-sm">You have 3 maintenance requests pending today.</p>
</section>
<!-- KPI Asymmetric Bento Grid -->
<section class="grid grid-cols-2 gap-4">
<div class="col-span-2 bg-primary-container p-5 rounded-xl text-white flex flex-col justify-between h-36 relative overflow-hidden">
<div class="z-10">
<span class="text-xs font-label uppercase tracking-widest opacity-70">Total Portfolio Value</span>
<p class="text-3xl font-manrope font-bold mt-1">CAD $4,280,000.00</p>
</div>
<div class="flex justify-between items-end z-10">
<span class="bg-tertiary px-2 py-1 rounded-full text-[10px] font-bold">+2.4% vs last month</span>
<span class="material-symbols-outlined text-secondary text-4xl" data-icon="account_balance" style="font-variation-settings: 'FILL' 1;">account_balance</span>
</div>
<!-- Subtle Gradient Texture -->
<div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
</div>
<div class="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
<span class="material-symbols-outlined text-secondary" data-icon="payments">payments</span>
<div>
<p class="text-[10px] font-label text-on-surface-variant uppercase">Rent Collected</p>
<p class="text-lg font-manrope font-bold text-primary">CAD $12,450.00</p>
</div>
</div>
<div class="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
<span class="material-symbols-outlined text-tertiary-container" data-icon="task_alt">task_alt</span>
<div>
<p class="text-[10px] font-label text-on-surface-variant uppercase">Compliance</p>
<p class="text-lg font-manrope font-bold text-primary">98% Secure</p>
</div>
</div>
</section>
<!-- Property Status Section - Scrollable Glassmorphism Cards -->
<section class="space-y-4">
<div class="flex justify-between items-center">
<h2 class="text-lg font-manrope font-bold text-primary">Property Status</h2>
<button class="text-xs font-semibold text-secondary">View All</button>
</div>
<div class="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 no-scrollbar">
<!-- Card 1 -->
<div class="min-w-[280px] bg-white rounded-xl shadow-[0_4px_24px_rgba(4,21,52,0.04)] border border-outline-variant/10 p-4">
<img alt="The Heights Luxury Living" class="w-full h-32 object-cover rounded-lg mb-4" data-alt="modern luxury apartment building exterior with glass balconies and sunset reflections on windows" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAN5BN0pDV81KVNVQ-v7dO4Av7euA3R7ixS7SUQJ3ib9QP1_nxo3Io9Wccj81CX4ncqCIlxyyuEZJY5UcfY-lczQfWGWLvesPlG2xBUKhby-MFQvS1SMaFZG3zNAyRb0pJbOu0WzVZ94xkqlNU4j63cN7HjZSwC4ugKISf8PosK89d4utZ_Tb8NTqAF9mEEY2ZKRl0fxl2S0QhC2wFOznqHoIKqs6MeQbgBw6dh0DFGn76JZjBfTb51Ur7Z2zMk5tdOj7fjAAIdgtLT"/>
<div class="flex justify-between items-start">
<div>
<h3 class="font-manrope font-bold text-primary">The Heights ON</h3>
<p class="text-xs text-on-surface-variant">12 Units • Toronto</p>
</div>
<span class="bg-surface-variant text-[10px] font-label px-2 py-1 rounded-full uppercase">ON</span>
</div>
<div class="mt-4 pt-4 border-t border-surface-container flex justify-between items-center">
<span class="text-xs font-medium text-tertiary flex items-center gap-1">
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
                            Fully Leased
                        </span>
<p class="text-sm font-bold text-primary">CAD $32,400.00</p>
</div>
</div>
<!-- Card 2 -->
<div class="min-w-[280px] bg-white rounded-xl shadow-[0_4px_24px_rgba(4,21,52,0.04)] border border-outline-variant/10 p-4">
<img alt="Harbor View Residences" class="w-full h-32 object-cover rounded-lg mb-4" data-alt="scenic aerial view of waterfront residential houses with blue water and lush green gardens" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKDMX9bRdrve58h6s7pkueLP8sf-zEKOXOTGE9j7K1B_6_pZdN1R1yftD3YiPEc7RuY8JOiVQF30zxYKxi3usAXEDESr17enooBoiz7wNkz7CeMEFzlSD0P30EIdL2PU8ZwkOJgyw0cFQ8xupRsp3WOM2-BtWGb5WqkSiboGcT-05WOU3OIGl-o-bwexCavdfurglCtvsDzmZf-FgpRRnzF-YNaNwCMygLXt2XGN0fe5iTXkC6pl2ZJQzCKpYYF0KKrpt70J0Ro034"/>
<div class="flex justify-between items-start">
<div>
<h3 class="font-manrope font-bold text-primary">Harbor View BC</h3>
<p class="text-xs text-on-surface-variant">8 Units • Vancouver</p>
</div>
<span class="bg-surface-variant text-[10px] font-label px-2 py-1 rounded-full uppercase">BC</span>
</div>
<div class="mt-4 pt-4 border-t border-surface-container flex justify-between items-center">
<span class="text-xs font-medium text-secondary flex items-center gap-1">
<span class="w-2 h-2 rounded-full bg-secondary"></span>
                            2 Vacancies
                        </span>
<p class="text-sm font-bold text-primary">CAD $21,800.00</p>
</div>
</div>
</div>
</section>
<!-- Compliance Ledger (Specialized Component) -->
<section class="space-y-4">
<h2 class="text-lg font-manrope font-bold text-primary">Urgent Compliance</h2>
<div class="space-y-3">
<div class="relative bg-surface-bright p-4 rounded-lg flex justify-between items-center overflow-hidden border border-outline-variant/10">
<div class="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
<div class="pl-2">
<h4 class="text-sm font-semibold text-primary">Elevator Safety Inspection</h4>
<p class="text-xs text-on-surface-variant">The Heights • Overdue 2 days</p>
</div>
<button class="bg-secondary-fixed text-on-secondary-fixed text-xs font-bold px-3 py-1.5 rounded-lg">Resolve</button>
</div>
<div class="relative bg-surface-bright p-4 rounded-lg flex justify-between items-center overflow-hidden border border-outline-variant/10">
<div class="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
<div class="pl-2">
<h4 class="text-sm font-semibold text-primary">Lease Renewal: Unit 402</h4>
<p class="text-xs text-on-surface-variant">Harbor View • Expires in 14 days</p>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
</div>
</section>
<!-- Financial Insights Area Chart Placeholder -->
<section class="bg-surface-container-lowest p-5 rounded-2xl space-y-4 shadow-sm border border-outline-variant/5">
<div class="flex justify-between items-end">
<div>
<h2 class="text-lg font-manrope font-bold text-primary">Cash Flow</h2>
<p class="text-[10px] font-label text-on-surface-variant uppercase">Rolling 30 Days</p>
</div>
<div class="text-right">
<p class="text-xl font-manrope font-bold text-tertiary">+CAD $8,240</p>
</div>
</div>
<div class="h-24 w-full flex items-end gap-1 px-1">
<div class="flex-1 bg-surface-container-high rounded-t-sm h-12 opacity-40"></div>
<div class="flex-1 bg-surface-container-high rounded-t-sm h-16 opacity-40"></div>
<div class="flex-1 bg-surface-container-high rounded-t-sm h-14 opacity-40"></div>
<div class="flex-1 bg-secondary rounded-t-sm h-20"></div>
<div class="flex-1 bg-surface-container-high rounded-t-sm h-18 opacity-40"></div>
<div class="flex-1 bg-surface-container-high rounded-t-sm h-22 opacity-40"></div>
<div class="flex-1 bg-primary rounded-t-sm h-24"></div>
</div>
</section>
</main>
<!-- Floating Action Button -->
<button class="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-95">
<span class="material-symbols-outlined text-2xl" data-icon="add" style="font-variation-settings: 'wght' 600;">add</span>
</button>
<!-- Bottom Navigation Bar -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 rounded-xl px-2 py-1 scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="space_dashboard" style="font-variation-settings: 'FILL' 1;">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Maintenance</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</a>
</nav>
</body></html>
---

## SCREEN: landlord_documents_mobile

<body class="bg-surface text-on-surface min-h-screen pb-24">
<!-- Top Navigation Anchor -->
<header class="fixed top-0 z-50 w-full glass-header bg-slate-50/80 dark:bg-slate-950/80">
<div class="flex justify-between items-center w-full px-6 py-4 h-16">
<h1 class="text-xl font-headline font-bold text-blue-950 dark:text-white tracking-tight">TenantPorch</h1>
<div class="flex items-center gap-3">
<button class="text-blue-900 dark:text-blue-100 hover:text-amber-600 transition-colors duration-200">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button class="text-blue-900 dark:text-blue-100 hover:text-amber-600 transition-colors duration-200">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
</button>
<div class="w-8 h-8 rounded-full bg-surface-container overflow-hidden">
<img class="w-full h-full object-cover" data-alt="professional portrait of a property manager in a well-lit modern office environment" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGaX0vRMoS8THZF92g-AZFlrdK6N7Ev0Ycgbn70K5_08Jgc_BKchVBUgcd9eBMZOxNXwMaKI2Ljt_egTHGoTfZosgR6UUO5U0HJ-FhkU4xu-YsH0y3MlOP29K9sJREA24q8lufkV3RExOWZ8awPYcFar08FrnRERu41Pd6uID4Hnm-qdd8Og4Lu5DAxkeAsZxDYvZF77wXg7J3m7xkYgxvuKgTOOcNl4HSDs6ikr12yTnY4m7rrA54Wt31JithMUCbiu3YXksJ5O3t"/>
</div>
</div>
</div>
<div class="h-1 bg-gradient-to-b from-slate-100 to-transparent dark:from-slate-900"></div>
</header>
<main class="pt-20 px-4">
<!-- Editorial Header Section -->
<div class="mt-4 mb-8">
<span class="text-[10px] font-bold tracking-[0.2em] uppercase text-secondary mb-1 block">Repository</span>
<h2 class="text-3xl font-headline font-extrabold text-primary leading-tight">Compliance &amp; <br/>Documents</h2>
<p class="text-on-surface-variant text-sm mt-2 font-body max-w-[280px]">Manage legal agreements, provincial notices, and property inspections.</p>
</div>
<!-- Quick Action: Notice Generation (Editorial Bento Layout) -->
<section class="mb-8">
<div class="bg-primary-container rounded-xl p-5 relative overflow-hidden text-white mb-4">
<div class="relative z-10">
<h3 class="text-lg font-headline font-semibold mb-1">Generate Notice</h3>
<p class="text-on-primary-container text-xs mb-4">Draft compliant eviction or entry notices instantly.</p>
<button class="bg-secondary-fixed text-on-secondary-fixed px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform">
<span class="material-symbols-outlined text-sm" data-icon="add_circle">add_circle</span>
                        Create New Notice
                    </button>
</div>
<!-- Abstract visual element -->
<div class="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary opacity-20 blur-2xl rounded-full"></div>
</div>
<!-- Horizontal Scroll Quick Filters -->
<div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
<button class="whitespace-nowrap px-4 py-2 bg-surface-container-lowest rounded-full text-xs font-semibold text-primary outline outline-variant/20 shadow-sm">All Files</button>
<button class="whitespace-nowrap px-4 py-2 bg-surface-container-low rounded-full text-xs font-medium text-on-surface-variant">Leases</button>
<button class="whitespace-nowrap px-4 py-2 bg-surface-container-low rounded-full text-xs font-medium text-on-surface-variant">Tax Forms</button>
<button class="whitespace-nowrap px-4 py-2 bg-surface-container-low rounded-full text-xs font-medium text-on-surface-variant">Insurance</button>
</div>
</section>
<!-- Document Categories: Accordion Style -->
<section class="space-y-3 mb-8">
<!-- Accordion Item 1: Active Leases -->
<div class="bg-surface-container-low rounded-xl overflow-hidden">
<div class="flex items-center justify-between p-4 bg-surface-container-lowest">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
<span class="material-symbols-outlined text-primary" data-icon="description">description</span>
</div>
<div>
<p class="text-sm font-headline font-bold text-primary">Active Leases</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">12 Documents</p>
</div>
</div>
<span class="material-symbols-outlined text-on-surface-variant" data-icon="expand_more">expand_more</span>
</div>
<div class="p-2 space-y-2">
<div class="flex items-center justify-between p-3 bg-surface-container-lowest/50 rounded-lg">
<div class="flex flex-col">
<span class="text-xs font-medium text-primary">242 Rideau St - Unit 401</span>
<span class="text-[10px] text-on-surface-variant italic">Expires: Oct 2024</span>
</div>
<div class="flex gap-2">
<span class="px-2 py-1 bg-surface-variant rounded-full text-[9px] font-bold text-on-surface-variant">ON</span>
<span class="material-symbols-outlined text-lg text-primary" data-icon="download">download</span>
</div>
</div>
<div class="flex items-center justify-between p-3 bg-surface-container-lowest/50 rounded-lg">
<div class="flex flex-col">
<span class="text-xs font-medium text-primary">150 Main St - Unit 12</span>
<span class="text-[10px] text-on-surface-variant italic">Expires: Jan 2025</span>
</div>
<div class="flex gap-2">
<span class="px-2 py-1 bg-surface-variant rounded-full text-[9px] font-bold text-on-surface-variant">BC</span>
<span class="material-symbols-outlined text-lg text-primary" data-icon="download">download</span>
</div>
</div>
</div>
</div>
<!-- Accordion Item 2: Regulatory Notices -->
<div class="bg-surface-container-low rounded-xl overflow-hidden">
<div class="flex items-center justify-between p-4">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
<span class="material-symbols-outlined text-secondary" data-icon="gavel">gavel</span>
</div>
<div>
<p class="text-sm font-headline font-bold text-primary">Regulatory Notices</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">4 Pending Action</p>
</div>
</div>
<span class="material-symbols-outlined text-on-surface-variant" data-icon="expand_more">expand_more</span>
</div>
</div>
<!-- Accordion Item 3: Inspection Reports -->
<div class="bg-surface-container-low rounded-xl overflow-hidden">
<div class="flex items-center justify-between p-4">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
<span class="material-symbols-outlined text-tertiary" data-icon="assignment_turned_in">assignment_turned_in</span>
</div>
<div>
<p class="text-sm font-headline font-bold text-primary">Inspection Reports</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Updated 2d ago</p>
</div>
</div>
<span class="material-symbols-outlined text-on-surface-variant" data-icon="expand_more">expand_more</span>
</div>
</div>
</section>
<!-- Inspection List: Editorial Style -->
<section class="mb-12">
<div class="flex items-center justify-between mb-4">
<h3 class="text-base font-headline font-bold text-primary">Recent Inspections</h3>
<button class="text-xs font-semibold text-secondary">View All</button>
</div>
<div class="space-y-4">
<!-- Inspection Card 1 -->
<div class="relative pl-4 bg-surface-container-lowest rounded-xl p-4 shadow-sm">
<!-- Progress Ribbon -->
<div class="absolute left-0 top-0 bottom-0 w-1 bg-tertiary rounded-l-xl"></div>
<div class="flex justify-between items-start">
<div>
<div class="flex items-center gap-2 mb-1">
<span class="text-xs font-bold text-primary">Move-out Inspection</span>
<span class="text-[9px] bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full font-bold uppercase">Passed</span>
</div>
<p class="text-[11px] text-on-surface-variant font-medium">88 York St, Toronto • Sep 12, 2023</p>
</div>
<span class="material-symbols-outlined text-on-surface-variant" data-icon="chevron_right">chevron_right</span>
</div>
<div class="mt-3 flex items-center gap-4">
<div class="flex -space-x-2">
<div class="w-6 h-6 rounded bg-slate-200 overflow-hidden outline outline-2 outline-white">
<img class="w-full h-full object-cover" data-alt="interior photo of a clean modern apartment living room for inspection records" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKfJj7EgKvljda2uhkO7Okh8kuFpoVZm7CrAV2mirRXrebU8FUTEc_jrDfzXojHVFoDEhZiUFJkUV3XET6FEmYxu72Ciq015kO5YbJtMImT-MSKOQuLNeG-nsNQSwvxB8UKVq6YXk1mCUFVbpGjqlEJ-uDr9KKslVbrVkCsK2jyNge6wffE89yKkb9P0YZMuE9Nxrfyi2iYijqObWAT5LpV-o3QqfMmrjaRLoOX0EzQv5BTRLlIFhFQ9WyadFcuU2YWS63VGgmmPNJ"/>
</div>
<div class="w-6 h-6 rounded bg-slate-200 overflow-hidden outline outline-2 outline-white">
<img class="w-full h-full object-cover" data-alt="close up of a well-maintained kitchen countertop and appliances in a rental property" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUinvbUD3px6OXw35wNmI9QCiQMQI9X-9an47ELA0YEZ0wRWtcyd4kaDh5W8CRzRE-ntPEml1PoJ5_vqAChIZo5rpUqNd32JkoYvTHDKsN_yFBL1Nf8vuEij-pUfowQymvd5Wyrtht-0-JvUisXq-cCcN_8lt9CBDrZP8CGHMGtCL4eUO6TeOL4W1DZEMbA2sseyY9HwKl995DUO6x-j1XOSaAWDP0eZGgPTOA3S1O04JzjyL--XUnGGC6vY7nnNwAPqIzbuEdCB_m"/>
</div>
<div class="w-6 h-6 rounded bg-slate-100 flex items-center justify-center outline outline-2 outline-white text-[8px] font-bold text-on-surface-variant">+4</div>
</div>
<span class="text-[10px] text-on-surface-variant font-medium italic">Landlord: J. Smith</span>
</div>
</div>
<!-- Inspection Card 2 -->
<div class="relative pl-4 bg-surface-container-lowest rounded-xl p-4 shadow-sm opacity-80">
<div class="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl"></div>
<div class="flex justify-between items-start">
<div>
<div class="flex items-center gap-2 mb-1">
<span class="text-xs font-bold text-primary">Annual Safety Check</span>
<span class="text-[9px] bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-bold uppercase">Issues Found</span>
</div>
<p class="text-[11px] text-on-surface-variant font-medium">45 Laurier Ave, Ottawa • Aug 28, 2023</p>
</div>
<span class="material-symbols-outlined text-on-surface-variant" data-icon="chevron_right">chevron_right</span>
</div>
</div>
</div>
</section>
</main>
<!-- Navigation Shell: BottomNavBar -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] border-t border-slate-200/10 lg:hidden h-20 px-4 pb-safe flex justify-around items-center">
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined mb-1" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined mb-1" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined mb-1" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Financials</span>
</a>
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 scale-90 duration-200" href="#">
<span class="material-symbols-outlined mb-1" data-icon="description">description</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Documents</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined mb-1" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">More</span>
</a>
</nav>
</body></html>
---

## SCREEN: landlord_financials_mobile

<body class="bg-surface font-body text-on-surface min-h-screen flex flex-col max-w-[390px] mx-auto overflow-x-hidden pb-24">
<!-- Top Navigation Anchor -->
<header class="bg-slate-50/80 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 h-16 sticky top-0 z-50">
<h1 class="text-xl font-headline font-bold text-primary tracking-tight">Financials</h1>
<div class="flex gap-4">
<span class="material-symbols-outlined text-primary" data-icon="notifications">notifications</span>
<span class="material-symbols-outlined text-primary" data-icon="settings">settings</span>
</div>
</header>
<main class="flex-1 px-5 pt-4 space-y-6">
<!-- Revenue Chart Card -->
<section class="bg-primary rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-primary/10">
<div class="relative z-10">
<p class="text-on-primary-container font-label text-xs uppercase tracking-widest mb-1">Total Portfolio Revenue</p>
<div class="flex items-baseline gap-2">
<span class="text-white text-3xl font-headline font-extrabold tracking-tight">CAD $42,850.00</span>
<span class="text-tertiary-fixed text-sm font-medium">+12.4%</span>
</div>
<!-- Simplified Abstract Chart Representation -->
<div class="mt-8 h-32 flex items-end gap-2">
<div class="flex-1 bg-primary-container/40 rounded-t-lg h-[40%]"></div>
<div class="flex-1 bg-primary-container/40 rounded-t-lg h-[60%]"></div>
<div class="flex-1 bg-primary-container/40 rounded-t-lg h-[45%]"></div>
<div class="flex-1 bg-primary-container/40 rounded-t-lg h-[75%]"></div>
<div class="flex-1 bg-secondary rounded-t-lg h-[90%] shadow-[0_-4px_12px_rgba(123,88,4,0.3)]"></div>
<div class="flex-1 bg-primary-container/40 rounded-t-lg h-[65%]"></div>
<div class="flex-1 bg-primary-container/40 rounded-t-lg h-[55%]"></div>
</div>
<div class="flex justify-between mt-2 text-[10px] font-label text-on-primary-container uppercase tracking-tighter">
<span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span class="text-secondary font-bold">MAY</span><span>JUN</span><span>JUL</span>
</div>
</div>
<!-- Decorative Background Element -->
<div class="absolute -right-8 -top-8 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
</section>
<!-- Utility Billing Quick Flow -->
<section class="space-y-4">
<div class="flex justify-between items-center">
<h2 class="text-lg font-headline font-bold text-primary">Pending Utilities</h2>
<button class="text-secondary text-sm font-semibold flex items-center gap-1">
                    Process All <span class="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
</button>
</div>
<div class="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 snap-x">
<!-- Utility Card 1 -->
<div class="min-w-[280px] snap-center bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10">
<div class="flex justify-between mb-4">
<div class="p-2 bg-secondary-fixed rounded-xl">
<span class="material-symbols-outlined text-on-secondary-fixed" data-icon="bolt">bolt</span>
</div>
<span class="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter self-start">ON</span>
</div>
<h3 class="text-primary font-bold">Hydro - unit 402</h3>
<p class="text-on-surface-variant text-xs mb-4">128 Adelaide St, Toronto</p>
<div class="flex justify-between items-center border-t border-outline-variant/10 pt-4">
<span class="text-primary font-bold text-lg">CAD $142.80</span>
<button class="bg-secondary text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">Rebill Tenant</button>
</div>
</div>
<!-- Utility Card 2 -->
<div class="min-w-[280px] snap-center bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10">
<div class="flex justify-between mb-4">
<div class="p-2 bg-primary-fixed rounded-xl">
<span class="material-symbols-outlined text-on-primary-fixed" data-icon="water_drop">water_drop</span>
</div>
<span class="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter self-start">BC</span>
</div>
<h3 class="text-primary font-bold">Water - Main House</h3>
<p class="text-on-surface-variant text-xs mb-4">450 Robson St, Vancouver</p>
<div class="flex justify-between items-center border-t border-outline-variant/10 pt-4">
<span class="text-primary font-bold text-lg">CAD $89.15</span>
<button class="bg-secondary text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">Rebill Tenant</button>
</div>
</div>
</div>
</section>
<!-- Compliance Ledger / Transaction Table -->
<section class="space-y-4">
<h2 class="text-lg font-headline font-bold text-primary">Recent Transactions</h2>
<div class="bg-surface-container-low rounded-2xl overflow-hidden">
<div class="space-y-px">
<!-- Transaction Item -->
<div class="bg-surface-container-lowest p-4 flex items-center justify-between group">
<div class="flex items-center gap-4">
<div class="w-1 h-8 bg-tertiary rounded-full"></div>
<div>
<p class="text-sm font-bold text-primary">Rent: Unit 12B</p>
<p class="text-xs text-on-surface-variant">Confirmed • May 01</p>
</div>
</div>
<div class="text-right">
<p class="text-sm font-bold text-primary">CAD $2,450.00</p>
<span class="material-symbols-outlined text-tertiary-container text-xs" data-icon="check_circle" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
</div>
<!-- Transaction Item -->
<div class="bg-surface-container-lowest p-4 flex items-center justify-between">
<div class="flex items-center gap-4">
<div class="w-1 h-8 bg-secondary rounded-full"></div>
<div>
<p class="text-sm font-bold text-primary">Maintenance: HVAC</p>
<p class="text-xs text-on-surface-variant">Pending • May 02</p>
</div>
</div>
<div class="text-right">
<p class="text-sm font-bold text-primary">CAD $320.00</p>
<span class="material-symbols-outlined text-secondary-container text-xs" data-icon="pending" style="font-variation-settings: 'FILL' 1;">pending</span>
</div>
</div>
<!-- Transaction Item -->
<div class="bg-surface-container-lowest p-4 flex items-center justify-between">
<div class="flex items-center gap-4">
<div class="w-1 h-8 bg-tertiary rounded-full"></div>
<div>
<p class="text-sm font-bold text-primary">Rent: Unit 08</p>
<p class="text-xs text-on-surface-variant">Confirmed • Apr 30</p>
</div>
</div>
<div class="text-right">
<p class="text-sm font-bold text-primary">CAD $1,800.00</p>
<span class="material-symbols-outlined text-tertiary-container text-xs" data-icon="check_circle" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
</div>
<!-- Transaction Item -->
<div class="bg-surface-container-lowest p-4 flex items-center justify-between">
<div class="flex items-center gap-4">
<div class="w-1 h-8 bg-error rounded-full"></div>
<div>
<p class="text-sm font-bold text-primary">Strata Fee - ON</p>
<p class="text-xs text-error font-medium">Overdue • Apr 28</p>
</div>
</div>
<div class="text-right">
<p class="text-sm font-bold text-primary">CAD $540.22</p>
<span class="material-symbols-outlined text-error text-xs" data-icon="error" style="font-variation-settings: 'FILL' 1;">error</span>
</div>
</div>
</div>
</div>
<button class="w-full py-4 text-center text-sm font-bold text-primary-container border border-outline-variant/20 rounded-xl bg-surface-container-low">
                View All Financial Activity
            </button>
</section>
</main>
<!-- Bottom Navigation Shell -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined mb-1" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined mb-1" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 rounded-xl px-2 py-1 scale-90 transition-transform" href="#">
<span class="material-symbols-outlined mb-1" data-icon="account_balance_wallet" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Financials</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined mb-1" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Maintenance</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined mb-1" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">More</span>
</a>
</nav>
<!-- Contextual FAB - Collecting Rent / Financial Transaction -->
<button class="fixed bottom-24 right-6 w-14 h-14 bg-secondary text-white rounded-full flex items-center justify-center shadow-2xl z-40">
<span class="material-symbols-outlined text-2xl" data-icon="add">add</span>
</button>
</body></html>
---

## SCREEN: landlord_maintenance_mobile

<body class="bg-surface font-body text-on-surface antialiased max-w-[390px] mx-auto min-h-screen pb-24">
<!-- Top Navigation Bar -->
<header class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 h-16 docked full-width top-0 z-50">
<div class="text-xl font-manrope font-bold text-blue-950 dark:text-white tracking-tight">TenantPorch</div>
<div class="flex items-center gap-4">
<button class="text-blue-900 dark:text-blue-100 hover:text-amber-600 transition-colors duration-200">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<div class="w-8 h-8 rounded-full bg-primary-container overflow-hidden">
<img alt="User avatar" data-alt="Professional headshot of a property manager in business attire with a warm friendly expression" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB37vWZ855NgEyjfz-mOParAGrwlcvSy7GAu15b8AmRjsPGUlLuEXwzmZPGO-BdTsRTZzCDmJuL6jfXl86ZroG0GS6R2mxZJoD-qVYOuMJai57X_5UW6w-eKxM8PZ6wh0Dcg5RfVLi3bWt1AfZryhT45TBUVDb14N3S9khMwF5HF73pGENNZZl3uHRLPe6TyF5JbIVmLPbYnWaRrYebg0cDkAOx3MCYpov4PGi7Zgv3iPjkIvxt7_nDLa-SDqGB6vmL586IF5-d_7UA"/>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="px-5 pt-6 space-y-6">
<!-- Editorial Header -->
<div class="space-y-1">
<h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Maintenance</h1>
<p class="text-on-surface-variant font-medium text-sm">Managing 12 active requests across Ontario</p>
</div>
<!-- Status Filter Tabs -->
<div class="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
<button class="bg-primary text-on-primary px-5 py-2.5 rounded-full font-label text-sm font-semibold whitespace-nowrap">All Tasks</button>
<button class="bg-surface-container-low text-on-surface-variant px-5 py-2.5 rounded-full font-label text-sm font-medium whitespace-nowrap hover:bg-surface-container transition-colors">Pending</button>
<button class="bg-surface-container-low text-on-surface-variant px-5 py-2.5 rounded-full font-label text-sm font-medium whitespace-nowrap hover:bg-surface-container transition-colors">In Progress</button>
<button class="bg-surface-container-low text-on-surface-variant px-5 py-2.5 rounded-full font-label text-sm font-medium whitespace-nowrap hover:bg-surface-container transition-colors">Completed</button>
</div>
<!-- Urgent Alert Card (Asymmetric Layout) -->
<section class="bg-error-container/30 rounded-2xl p-5 relative overflow-hidden">
<div class="relative z-10 space-y-3">
<div class="flex items-center gap-2 text-on-error-container">
<span class="material-symbols-outlined text-xl" data-icon="warning" style="font-variation-settings: 'FILL' 1;">warning</span>
<span class="text-xs font-bold uppercase tracking-wider">Urgent Action Required</span>
</div>
<h3 class="font-headline text-xl font-bold text-primary">Burst Pipe: 423 King St.</h3>
<p class="text-on-surface-variant text-sm leading-relaxed">Reported 14 minutes ago by Unit 4B. Emergency plumber dispatched.</p>
<div class="pt-2">
<button class="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm w-full shadow-sm">Review Emergency Detail</button>
</div>
</div>
<div class="absolute -right-8 -top-8 opacity-10">
<span class="material-symbols-outlined text-[120px]" data-icon="plumbing">plumbing</span>
</div>
</section>
<!-- Compliance Ledger (Maintenance List) -->
<div class="space-y-4">
<h2 class="font-headline text-lg font-bold text-primary px-1">Active Requests</h2>
<!-- Maintenance Card 1 (Expanded Detail State) -->
<div class="bg-surface-container-lowest rounded-2xl p-5 relative transition-all active:scale-95 border border-outline-variant/10">
<div class="compliance-ribbon bg-secondary"></div>
<div class="flex justify-between items-start mb-3">
<div class="space-y-1 pl-2">
<div class="flex items-center gap-2">
<span class="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-black px-2 py-0.5 rounded-full uppercase">ON</span>
<span class="text-on-surface-variant text-xs font-medium">#MT-8821</span>
</div>
<h4 class="font-headline text-lg font-bold text-primary">HVAC System Repair</h4>
</div>
<div class="text-right">
<span class="text-xs font-label text-on-surface-variant block">Estimate</span>
<span class="font-bold text-primary text-lg">CAD $450.00</span>
</div>
</div>
<div class="bg-surface-container-low rounded-xl p-4 mt-4 space-y-4">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
<span class="material-symbols-outlined text-primary" data-icon="person">person</span>
</div>
<div>
<p class="text-xs text-on-surface-variant font-medium">Tenant</p>
<p class="text-sm font-bold text-primary">Marcus Thorne (Unit 302)</p>
</div>
</div>
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
<span class="material-symbols-outlined text-primary" data-icon="calendar_today">calendar_today</span>
</div>
<div>
<p class="text-xs text-on-surface-variant font-medium">Scheduled For</p>
<p class="text-sm font-bold text-primary">Oct 24, 2023 • 09:00 AM</p>
</div>
</div>
<div class="pt-2 flex gap-3">
<button class="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold text-sm">Approve Quote</button>
<button class="flex-none aspect-square bg-surface-container-highest flex items-center justify-center rounded-xl px-4">
<span class="material-symbols-outlined" data-icon="chat">chat</span>
</button>
</div>
</div>
</div>
<!-- Maintenance Card 2 (Standard State) -->
<div class="bg-surface-container-lowest rounded-2xl p-5 relative flex items-center justify-between border border-outline-variant/10">
<div class="compliance-ribbon bg-tertiary"></div>
<div class="flex items-center gap-4 pl-2">
<div class="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center">
<span class="material-symbols-outlined text-on-tertiary-container" data-icon="inventory">inventory</span>
</div>
<div>
<h4 class="font-headline text-md font-bold text-primary">Lock Replacement</h4>
<p class="text-xs text-on-surface-variant">1202 Maple Ave • Assigned</p>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
<!-- Maintenance Card 3 (Standard State) -->
<div class="bg-surface-container-lowest rounded-2xl p-5 relative flex items-center justify-between border border-outline-variant/10">
<div class="compliance-ribbon bg-secondary"></div>
<div class="flex items-center gap-4 pl-2">
<div class="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center">
<span class="material-symbols-outlined text-secondary" data-icon="water_drop">water_drop</span>
</div>
<div>
<h4 class="font-headline text-md font-bold text-primary">Leaky Faucet</h4>
<p class="text-xs text-on-surface-variant">88 Bay Street • Pending</p>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
</div>
<!-- FAB for New Request (Contextual) -->
<button class="fixed bottom-24 right-6 w-14 h-14 bg-secondary shadow-[0_8px_32px_rgba(123,88,4,0.3)] rounded-2xl flex items-center justify-center text-on-secondary z-40 transition-transform active:scale-95">
<span class="material-symbols-outlined text-3xl" data-icon="add">add</span>
</button>
</main>
<!-- Bottom Navigation Bar -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] border-t border-slate-200/10 flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-all" href="#">
<span class="material-symbols-outlined mb-1" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-all" href="#">
<span class="material-symbols-outlined mb-1" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-all" href="#">
<span class="material-symbols-outlined mb-1" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Financials</span>
</a>
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 scale-90 duration-200" href="#">
<span class="material-symbols-outlined mb-1" data-icon="build" style="font-variation-settings: 'FILL' 1;">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">Maintenance</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-all" href="#">
<span class="material-symbols-outlined mb-1" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase">More</span>
</a>
</nav>
</body></html>
---

## SCREEN: landlord_messages_mobile

<body class="bg-surface font-body text-on-surface antialiased overflow-hidden">
<!-- TopNavBar (Fixed Mobile Header) -->
<header class="fixed top-0 z-50 w-full h-16 bg-slate-50/80 backdrop-blur-xl flex justify-between items-center px-6">
<div class="flex items-center gap-3">
<h1 class="text-xl font-headline font-bold text-blue-950 tracking-tight">Messages</h1>
</div>
<div class="flex items-center gap-4">
<button class="relative text-blue-900 active:scale-95 transition-all">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></span>
</button>
<div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden">
<img alt="User avatar" data-alt="Close up portrait of a professional man in a navy suit with warm lighting against a blurred office background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF9LRZdyWU8zoyctfHEJIOu03Fbsd4d3TNKv6a2C5fCd_hkfzo4FodtXFVe95V0QuOE57Z19lJtglfNpHAS_-ZPsj9x9NjFRRbDpxsDXrPE6Uff6fQLgsoUldDVwATAX2L_Z7dSXHHV_rMx2L0NWTwc3KVKcD4SHVDc6hzSwNICp8kcFE_18pB0pa2qczTN2ikf97YyLSLFbZgFTvFckRRfgkYtBZdeuzC-dwBP8p6WQ-PlDYKiU0RcHyIfa6FnO4DnYlEb4BJT6p9"/>
</div>
</div>
</header>
<!-- Content Canvas -->
<main class="pt-16 pb-20 h-screen overflow-y-auto hide-scrollbar bg-surface-container-low">
<!-- Search & Filter Area -->
<div class="px-6 py-4 flex gap-3">
<div class="flex-1 flex items-center bg-surface-container-lowest rounded-xl px-4 py-2 shadow-sm border border-outline-variant/10">
<span class="material-symbols-outlined text-on-surface-variant text-sm" data-icon="search">search</span>
<input class="bg-transparent border-none focus:ring-0 text-sm w-full font-body" placeholder="Search conversations..." type="text"/>
</div>
<button class="w-11 h-11 flex items-center justify-center bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 text-primary active:scale-95 transition-all">
<span class="material-symbols-outlined" data-icon="tune">tune</span>
</button>
</div>
<!-- Notification Log Snippet (Recent Activity) -->
<div class="px-6 mb-6">
<div class="bg-primary-container p-4 rounded-xl flex items-center gap-4 relative overflow-hidden">
<!-- Golden Glow Texture -->
<div class="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50"></div>
<div class="relative z-10 w-10 h-10 flex items-center justify-center bg-secondary-fixed text-on-secondary-fixed rounded-lg">
<span class="material-symbols-outlined" data-icon="campaign">campaign</span>
</div>
<div class="relative z-10">
<p class="text-xs font-label uppercase tracking-widest text-secondary-fixed-dim opacity-80">Recent Alert</p>
<p class="text-sm font-headline font-semibold text-white">New maintenance request in ON</p>
</div>
<button class="relative z-10 ml-auto text-white">
<span class="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
<!-- Message Threads List -->
<div class="px-6 space-y-3">
<!-- Active/Unread Thread -->
<div class="bg-surface-container-lowest p-4 rounded-xl flex gap-4 border-l-4 border-secondary shadow-sm active:scale-95 transition-all cursor-pointer">
<div class="relative flex-shrink-0">
<img alt="Tenant Avatar" class="w-12 h-12 rounded-full object-cover" data-alt="Portrait of a smiling young woman with dark hair in a bright outdoor setting with soft sunlight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIgSD4-gLOGOsK7ZeQWY-cnILgoSrX4eAv1JDeay59Qj_8dp3War4SKgLLUbkinlf2nCl2xHFcKw14O7ZN8J7uJGhlu_TLc6IiOrWqUUmU6GJZ_AS2WEmATVeHAakgUzUSX2XjhrgvsMYCF1tVxBJwUQYI1cV-l6lHNPJl_fmq19Egw2k2-uiQcwVHEY7uy2alEc17hEqJtV70zxchNCDbuOZlJtEuE_0LbAAI4DmY9z3gs14LJOw4Y5AcUqFjYo_75RE25WAOYQQE"/>
<span class="absolute bottom-0 right-0 w-3 h-3 bg-tertiary-fixed-dim border-2 border-surface-container-lowest rounded-full"></span>
</div>
<div class="flex-1 min-w-0">
<div class="flex justify-between items-baseline mb-1">
<h3 class="font-headline font-bold text-primary truncate">Sarah Jenkins</h3>
<span class="text-[10px] font-label font-semibold text-secondary">2m ago</span>
</div>
<p class="text-sm text-on-surface-variant font-medium truncate">The kitchen faucet is still leaking after the last repair...</p>
<div class="flex items-center gap-2 mt-2">
<span class="bg-surface-container text-[10px] px-2 py-0.5 rounded-full font-label uppercase tracking-tighter text-on-surface-variant">ON</span>
<span class="text-[10px] text-on-surface-variant/60 font-medium">Unit 402 - Harbour St.</span>
</div>
</div>
</div>
<!-- Read Thread -->
<div class="bg-surface-container-lowest/60 p-4 rounded-xl flex gap-4 active:scale-95 transition-all cursor-pointer">
<div class="relative flex-shrink-0 grayscale">
<img alt="Tenant Avatar" class="w-12 h-12 rounded-full object-cover" data-alt="Modern professional portrait of a man with glasses wearing a white t-shirt against a grey studio background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPJqk3JhkBIMK3ydD57zu7NmKKj8ilX6H7FU-qUgc1_rjpTHk8QYOyzQwE2xOKT6BGwcBRCUx6-K04fMTKh8SvEw1UUS1bzOEmvgz7gDssj0T257ToJu8DFor4egV3IRbe6mHvpFgbBzYv5oB74FTfnKWzF2od9r3mFkoYVJBlA1vwKzNbE2j0u5NF5cXrTWWcY3VTmVV9OMHavMb0fAkl-OlZo-7czXkq0axW_tj_on49lc0Nzk-r_3jxLZAsd2-8z7yVugYrfQmI"/>
</div>
<div class="flex-1 min-w-0">
<div class="flex justify-between items-baseline mb-1">
<h3 class="font-headline font-semibold text-on-surface truncate">Marcus Thompson</h3>
<span class="text-[10px] font-label text-on-surface-variant/50">2h ago</span>
</div>
<p class="text-sm text-on-surface-variant/70 truncate">CAD $2,450.00 rent payment has been initiated successfully.</p>
<div class="flex items-center gap-2 mt-2">
<span class="bg-surface-container text-[10px] px-2 py-0.5 rounded-full font-label uppercase tracking-tighter text-on-surface-variant">AB</span>
<span class="text-[10px] text-on-surface-variant/40 font-medium">Lakeside Estates</span>
</div>
</div>
</div>
<!-- Unread Thread 2 -->
<div class="bg-surface-container-lowest p-4 rounded-xl flex gap-4 border-l-4 border-secondary shadow-sm active:scale-95 transition-all cursor-pointer">
<div class="relative flex-shrink-0">
<div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-headline font-bold">
                        GR
                    </div>
</div>
<div class="flex-1 min-w-0">
<div class="flex justify-between items-baseline mb-1">
<h3 class="font-headline font-bold text-primary truncate">George Rossi</h3>
<span class="text-[10px] font-label font-semibold text-secondary">Yesterday</span>
</div>
<p class="text-sm text-on-surface-variant font-medium truncate">When can I expect the new lease documents to arrive?</p>
<div class="flex items-center gap-2 mt-2">
<span class="bg-surface-container text-[10px] px-2 py-0.5 rounded-full font-label uppercase tracking-tighter text-on-surface-variant">BC</span>
<span class="text-[10px] text-on-surface-variant/60 font-medium">Skyline Tower</span>
</div>
</div>
</div>
<!-- Read Thread 2 -->
<div class="bg-surface-container-lowest/60 p-4 rounded-xl flex gap-4 active:scale-95 transition-all cursor-pointer">
<div class="relative flex-shrink-0 grayscale">
<img alt="Tenant Avatar" class="w-12 h-12 rounded-full object-cover" data-alt="A portrait of a thoughtful woman with natural lighting, soft shadows, and a neutral background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCazf0H4IQWq-eos3L19KnTNlUN3UHvWl-1LDQc8H76g0v1TWo6bO3qxAFkUKPB1SV3l0W3pBt66cLfCssY6FrLaaTT06Y7JSF11Zfc2Ib5_A2QABUcUegW77aw7n2dPipYP-W0rvkc_lQnR0bgb06PR-0PcrT3VepzvZr7iPowQ2t5FeXVIOi8nmIgzJC63tkc4AmtMUeNuR_0--l6TwKhOc5eZ9rpt1JtKiaEOL7ArELWFzLLpXnfdjdPjQ586ISiq76aDmsv_7bM"/>
</div>
<div class="flex-1 min-w-0">
<div class="flex justify-between items-baseline mb-1">
<h3 class="font-headline font-semibold text-on-surface truncate">Elena Vance</h3>
<span class="text-[10px] font-label text-on-surface-variant/50">Oct 24</span>
</div>
<p class="text-sm text-on-surface-variant/70 truncate">Thanks for the quick response on the parking issue!</p>
<div class="flex items-center gap-2 mt-2">
<span class="bg-surface-container text-[10px] px-2 py-0.5 rounded-full font-label uppercase tracking-tighter text-on-surface-variant">ON</span>
<span class="text-[10px] text-on-surface-variant/40 font-medium">Park View Lofts</span>
</div>
</div>
</div>
</div>
<!-- Compliance Ledger Mini-Section -->
<div class="px-6 mt-8 mb-4">
<h4 class="font-headline font-bold text-xs uppercase tracking-widest text-primary mb-4">Legal Compliance Notices</h4>
<div class="bg-surface-bright p-4 rounded-xl relative overflow-hidden flex flex-col gap-3 shadow-inner">
<!-- Vertical Progress Ribbon -->
<div class="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
<div class="pl-3">
<div class="flex justify-between items-start">
<span class="text-[10px] font-label font-bold text-error uppercase tracking-widest">Action Required</span>
<span class="material-symbols-outlined text-error text-lg" data-icon="priority_high">priority_high</span>
</div>
<p class="text-sm font-semibold text-primary mt-1">Tenant N12 Form - Unit 301</p>
<p class="text-xs text-on-surface-variant mt-1">Submission deadline approaching for Ontario Landlord Board.</p>
</div>
</div>
</div>
</main>
<!-- FAB for New Message -->
<button class="fixed right-6 bottom-24 w-14 h-14 bg-primary text-white rounded-full shadow-[0_8px_30px_rgb(4,21,52,0.3)] flex items-center justify-center z-50 active:scale-90 transition-all">
<span class="material-symbols-outlined text-3xl" data-icon="edit_square">edit_square</span>
</button>
<!-- BottomNavBar (Mobile Shell) -->
<nav class="fixed bottom-0 w-full h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl flex justify-around items-center px-4 pb-safe border-t border-slate-200/10 z-50">
<a class="flex flex-col items-center justify-center text-slate-500 active:scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 active:scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 active:scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</a>
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 rounded-xl px-4 py-1 active:scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="mail" style="font-variation-settings: 'FILL' 1;">mail</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Messages</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 active:scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</a>
</nav>
</body></html>
---

## SCREEN: landlord_properties_mobile

<body class="bg-surface text-on-surface antialiased pb-24">
<!-- Top Navigation Bar -->
<header class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl fixed top-0 z-50 w-full px-6 py-4 h-16 flex justify-between items-center bg-gradient-to-b from-slate-100 to-transparent">
<span class="text-xl font-manrope font-bold text-blue-950 dark:text-white tracking-tight">TenantPorch</span>
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-blue-900 dark:text-blue-100">notifications</span>
<div class="w-8 h-8 rounded-full bg-surface-variant overflow-hidden">
<img alt="User avatar" data-alt="professional portrait of a confident property manager in business attire with a warm smile, natural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBdGX9jBPG1VgARjqNck4fE5v27FX0k6XseJvSjzezWqRP8cqVic4qt9z58tzegZOaS98F3NMAi2X70o3nJ6lP2WwowkLvYti3Q4wSi3vDFdGOE2t8h0ewbsEcwtVg-1a1h5I_W7kqod6lhE9SLqNiQBN22AcJ3sNUQpe6pMm5hPVQ0e9K5AmEdHEcBdcazV6U9Foi27ZUt7art-sQA9WXY9gXFEF5E4Y-stAaWiMhvO3pO6D9U70Lm1j-Qb76Ebg0HRkSXi5C2jeg"/>
</div>
</div>
</header>
<main class="mt-20 px-4 space-y-6">
<!-- Editorial Header Section -->
<section class="pt-2">
<div class="flex items-end justify-between mb-2">
<h1 class="text-3xl font-extrabold text-primary tracking-tight leading-none">Portfolio</h1>
<span class="text-secondary font-semibold text-sm">3 Total Units</span>
</div>
<div class="h-1 w-12 bg-secondary rounded-full"></div>
</section>
<!-- Search and Filter (Task Focused) -->
<div class="flex gap-2">
<div class="flex-1 bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-3 outline outline-1 outline-variant/20 shadow-sm">
<span class="material-symbols-outlined text-on-surface-variant text-sm">search</span>
<input class="bg-transparent border-none p-0 text-sm focus:ring-0 w-full placeholder:text-on-surface-variant/50" placeholder="Search address..." type="text"/>
</div>
<button class="bg-surface-container-lowest p-3 rounded-xl outline outline-1 outline-variant/20 shadow-sm">
<span class="material-symbols-outlined text-on-surface-variant">tune</span>
</button>
</div>
<!-- Property Grid (Asymmetric Mobile Optimization) -->
<div class="space-y-4">
<!-- Property Card 1 -->
<div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm outline outline-1 outline-variant/10">
<div class="relative h-48">
<img class="w-full h-full object-cover" data-alt="modern luxury townhouse in Toronto with brick facade and large windows during soft morning light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDynsURZPThFDQN4ToB4XFpjQaHDF3ueGibqnl2PUnxmIqVAZlvCJarmU3IoYMZoc6UpyfyjVyg-IOCcx3qkBOHmGqsDDIDhkztR5feInjcoD8yYb4zjfhpnQC-5sRXio0p_alSU-2W8sCHIQtZFYdUKJJ1J7Z9gmL1WGR-J6YnErcrBqiclu-ma3Jtd1jAXyOch7mXs3cePUyiM2z035X4PeaNmwcBjw8bYiBYXu2o06-ey4_1BC0IyyYzRTgVFSh08uIRDiHEms2t"/>
<div class="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span class="text-[10px] font-bold uppercase tracking-wider text-on-surface">ON</span>
</div>
<div class="absolute bottom-3 right-3 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
<span class="text-[10px] font-medium opacity-80 block leading-none mb-1">CAD</span>
                        $4,250.00
                    </div>
</div>
<div class="p-5">
<div class="mb-4">
<h3 class="text-xl font-bold text-primary mb-1">The Wellington Suites</h3>
<p class="text-on-surface-variant text-sm flex items-center gap-1">
<span class="material-symbols-outlined text-sm">location_on</span> 142 Wellington St W, Toronto
                        </p>
</div>
<div class="grid grid-cols-3 gap-2 border-t border-surface-variant pt-4">
<div class="text-center">
<span class="text-[10px] text-on-surface-variant uppercase font-semibold">Beds</span>
<p class="font-bold text-primary">3</p>
</div>
<div class="text-center">
<span class="text-[10px] text-on-surface-variant uppercase font-semibold">Baths</span>
<p class="font-bold text-primary">2.5</p>
</div>
<div class="text-center">
<span class="text-[10px] text-on-surface-variant uppercase font-semibold">Area</span>
<p class="font-bold text-primary">1,450 <span class="text-[8px]">SQFT</span></p>
</div>
</div>
</div>
</div>
<!-- Property Card 2 (Compact State) -->
<div class="bg-surface-container-low rounded-2xl p-4 flex gap-4 items-center">
<div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
<img class="w-full h-full object-cover" data-alt="scandinavian style minimalist house exterior with light wood panels and glass railings" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8cW204TS6fOfiQu14vKudDURhsKzenWlmzO3-Dh_ARkPT7vj38eArSaoM2GlezowtG-c7zv2z6CG76lw63l5_nXWpGW9_yNjc7rBUcqhLo5-mJcF0zCOYCxProaSGXSbAmIQZGaOxgJJes0TWYgpidP5UIQow2ARYZdAk7PSqp2PN7jqdATSRSOHduZFDpW1lJstrGo0VHK4ultChkNA6PmxwDVavMdya72k9oHUPofEC3Mpv6JBx4bS5c_ECe96Kc6xtaIqFMmOv"/>
</div>
<div class="flex-1">
<div class="flex justify-between items-start">
<h3 class="font-bold text-primary">Maple Ridge House</h3>
<span class="text-[10px] bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-bold">BC</span>
</div>
<p class="text-xs text-on-surface-variant mb-2">2234 Shaughnessy St, Coquitlam</p>
<div class="flex justify-between items-center">
<p class="text-sm font-bold text-primary">CAD $2,800.00</p>
<span class="material-symbols-outlined text-on-surface-variant">expand_more</span>
</div>
</div>
</div>
<!-- Property Card 3 (Compliance Ledger style) -->
<div class="bg-surface-container-lowest rounded-2xl p-4 flex gap-4 items-center border-l-4 border-error">
<div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 grayscale">
<img class="w-full h-full object-cover" data-alt="suburban family home in Calgary during sunset with warm exterior lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlUndLXxrdTCRgu-1xwupLr2WaJe1YNdBqHQbN3x1G4yltB1GA-C9HkpnebfrZruXnYEBgp5EYHdcxSgoqeivRXd3hDXH3dXgo4ehTPS9o9UUMH7HT_9OW2fsZ9bE0I6i5Nr-GdboMQ7UOTEsdNzET3ds_twCMfnac8kDId2gAtbcz3dbeBqeJrqCry0Qy10XW2Ni2K0fpCF5VrkKKtoAoKYtcVpMxjihglv9j_i_SCsHfYWDOfGqAKiU2hG5QhvzeR3vi87KtmGXd"/>
</div>
<div class="flex-1">
<div class="flex justify-between items-start">
<h3 class="font-bold text-primary">Bow River View</h3>
<span class="text-[10px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full font-bold">AB</span>
</div>
<p class="text-xs text-error font-medium mb-2 flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">warning</span> Maintenance Overdue
                    </p>
<div class="flex justify-between items-center">
<p class="text-sm font-bold text-primary">CAD $1,950.00</p>
<span class="material-symbols-outlined text-on-surface-variant">expand_more</span>
</div>
</div>
</div>
</div>
</main>
<!-- FAB: Add Property -->
<button class="fixed right-6 bottom-24 bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-40">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">add</span>
</button>
<!-- Bottom Navigation Bar (Mandatory Shell) -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl flex justify-around items-center h-20 px-4 pb-safe lg:hidden border-t border-slate-200/10 shadow-[0_-4px_24px_rgba(4,21,52,0.06)]">
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 scale-90 duration-200" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Maintenance</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</a>
</nav>
</body></html>
---

## SCREEN: landlord_tenants_mobile

<body class="bg-surface text-on-surface min-h-screen pb-24">
<!-- Top Navigation Anchor -->
<header class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl docked full-width top-0 z-50 flex justify-between items-center w-full px-6 py-4 h-16 bg-gradient-to-b from-slate-100 to-transparent">
<h1 class="text-xl font-manrope font-bold text-blue-950 dark:text-white tracking-tight">Tenants</h1>
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-blue-900 dark:text-blue-100" data-icon="search">search</span>
<div class="w-8 h-8 rounded-full overflow-hidden border-2 border-secondary/20">
<img alt="User avatar" data-alt="close-up portrait of a professional property manager with a friendly smile, clean studio background, professional lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGbjs16rtq3YWY2v-_7B8fxjXK1FhAcl78FSszW-ZguITa8Ttc3yYShHoUJKRyoofSuhbXLCY1bEY5ExJrxDYIVCaDX24q6zZLHYVgEoikHbtqs4TkcrtRDJNBv-7_qkolWGbKzkyNb7ptMSFy-m9czWjl5Pe5M5Qjpxd-dunfLbvD0Ki5mT5FRvaUEO8Dkatorz8LiS2SpyF6JManlmnXFKvpzc6cFJ0dmrP3cqvIvE4Veqah1pKuktA2BNH4cKlMgGbp-7aoLi6G"/>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="px-5 pt-4 space-y-6">
<!-- Summary Dashboard (Editorial Asymmetry) -->
<section class="grid grid-cols-2 gap-4">
<div class="col-span-2 bg-primary-container p-6 rounded-2xl relative overflow-hidden">
<div class="relative z-10">
<span class="text-on-primary-container text-xs uppercase tracking-widest font-label">Active Portfolio</span>
<h2 class="text-3xl font-headline font-extrabold text-white mt-1">24 Tenants</h2>
<div class="mt-4 flex items-center gap-2">
<span class="bg-tertiary text-tertiary-fixed text-[10px] px-2 py-0.5 rounded-full font-bold">98% RETENTION</span>
</div>
</div>
<div class="absolute -right-4 -bottom-4 opacity-10">
<span class="material-symbols-outlined text-9xl" style="font-variation-settings: 'FILL' 1;">groups</span>
</div>
</div>
</section>
<!-- Search & Filter (Surface Container Low) -->
<div class="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
<button class="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">All Units</button>
<button class="bg-surface-container-low text-on-surface-variant px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">Lease Ending</button>
<button class="bg-surface-container-low text-on-surface-variant px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap">Pending Payment</button>
</div>
<!-- Compliance Ledger Style Tenant List -->
<div class="space-y-4">
<!-- Tenant Item 1: Active/Settled -->
<div class="bg-surface-container-lowest rounded-xl overflow-hidden flex shadow-sm">
<div class="w-1.5 bg-tertiary"></div> <!-- Progress Ribbon -->
<div class="p-4 flex-1">
<div class="flex justify-between items-start mb-3">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full overflow-hidden">
<img alt="Sarah Jenkins" data-alt="headshot of a smiling young woman in a casual denim shirt, soft natural indoor lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvPi-5p26Vh3_0syn1urQkCcXt7vIvNDf2tePMr0nsxEYhq9EMV-GCrjTgH5J6ZrkNzTs_uMADnRZi0CD1IEj4v2QByWBco6_JJfDW8JsOTT5u2Y9RgT2eX6aOChuJKJ3dsw1lOt0dj-KW_zdjtvmO4cvcQJ7TXBop9AqBgeqVXlcXwldH0svNYIHYT9g3thrFCDmRduxN5OO_daWHDEmhcOZPLxQLWjpBH1s8LTNGL13_2qJg4eLdrP0fabrhdH2m6DqUKLSQL4w_"/>
</div>
<div>
<h3 class="font-headline font-bold text-primary">Sarah Jenkins</h3>
<p class="text-xs text-on-surface-variant">Unit 402 • Sunset Heights</p>
</div>
</div>
<span class="bg-surface-variant text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">ON</span>
</div>
<!-- Quick Contact Bar -->
<div class="flex items-center justify-between pt-3 border-t border-surface-container">
<div class="flex gap-2">
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-primary">
<span class="material-symbols-outlined text-sm">mail</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-primary">
<span class="material-symbols-outlined text-sm">call</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-primary">
<span class="material-symbols-outlined text-sm">chat_bubble</span>
</button>
</div>
<div class="text-right">
<span class="text-[10px] text-on-surface-variant block uppercase font-label">Rent Status</span>
<span class="text-sm font-bold text-primary">CAD $2,450.00</span>
</div>
</div>
</div>
</div>
<!-- Tenant Item 2: Attention Needed -->
<div class="bg-surface-container-lowest rounded-xl overflow-hidden flex shadow-sm">
<div class="w-1.5 bg-secondary"></div> <!-- Progress Ribbon (Warning) -->
<div class="p-4 flex-1">
<div class="flex justify-between items-start mb-3">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full overflow-hidden">
<img alt="Marcus Thorne" data-alt="middle-aged man with glasses, professional business casual attire, neutral background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzsoLTv_grGobFvJ_8PtZpEQlUu5KZh5OVQf6ZApTkL4LKot8J8QbcMYG0CjmlIoii0kEpqRL9_8uZJb5MEsqT0M9f1DY0J9sdBu7CTf8RpVw2W_CWBjGVhm5QzgUec4Ut45K8LUGFoxJ0oHOdn-5i-Fy0sxu9hgfcq452vhO-S8Dr63mDtHZ8gRMhWQFKJL51XWTRCZ8lWnH1kEp41XfUCy1KDVJYnypvW6q_XRDWabZP_1HSm-CP9PqG11VQZLAtK3WKUBaQCrwu"/>
</div>
<div>
<h3 class="font-headline font-bold text-primary">Marcus Thorne</h3>
<p class="text-xs text-on-surface-variant">Unit 105 • The Bentley</p>
</div>
</div>
<span class="bg-surface-variant text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">BC</span>
</div>
<div class="bg-secondary-container/20 p-2 rounded-lg mb-3 flex items-center gap-2">
<span class="material-symbols-outlined text-secondary text-sm">event_repeat</span>
<p class="text-[10px] font-medium text-on-secondary-container">Lease expires in 14 days • Review Renewal</p>
</div>
<div class="flex items-center justify-between pt-3 border-t border-surface-container">
<div class="flex gap-2">
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-primary">
<span class="material-symbols-outlined text-sm">mail</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-primary">
<span class="material-symbols-outlined text-sm">call</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-white">
<span class="material-symbols-outlined text-sm">history_edu</span>
</button>
</div>
<div class="text-right">
<span class="text-[10px] text-on-surface-variant block uppercase font-label">Rent Status</span>
<span class="text-sm font-bold text-primary">CAD $3,100.00</span>
</div>
</div>
</div>
</div>
<!-- Tenant Item 3: Error/Alert -->
<div class="bg-surface-container-lowest rounded-xl overflow-hidden flex shadow-sm">
<div class="w-1.5 bg-error"></div> <!-- Progress Ribbon (Error) -->
<div class="p-4 flex-1">
<div class="flex justify-between items-start mb-3">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full overflow-hidden">
<img alt="Elena Rodriguez" data-alt="smiling young woman with curly hair in a vibrant office setting, blurred modern background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIuG3nx3O5gtZB4Hkhl67Uve3uOwxAJfaZjJupK4NBMTtujk_w6Bp3O0x449a9m46RGxwbtfFLgD1GloFqODhQJT7fNF3QVfWffbYYf4tD8HRlDQnJLhebKUa5milquaTurpMSHDo6ty-wZw4JYUhf3exi9X_F6glYO0zRV9iq7wKqcva4PdoowreUdFGJRFoQk-0PyUnJ0n-7u7JgHOTIPvFjz5G2t553jR4ADmdT2-EkjyfgviCCrT6UKlhn4DAM7Ne5jNSRtrV3"/>
</div>
<div>
<h3 class="font-headline font-bold text-primary">Elena Rodriguez</h3>
<p class="text-xs text-on-surface-variant">Unit 202 • Oakwood Lofts</p>
</div>
</div>
<span class="bg-surface-variant text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">AB</span>
</div>
<div class="flex items-center justify-between pt-3 border-t border-surface-container">
<div class="flex gap-2">
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-primary">
<span class="material-symbols-outlined text-sm">mail</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-primary">
<span class="material-symbols-outlined text-sm">call</span>
</button>
</div>
<div class="text-right">
<span class="text-[10px] text-error block uppercase font-bold font-label">Overdue 3 Days</span>
<span class="text-sm font-bold text-error">CAD $1,875.00</span>
</div>
</div>
</div>
</div>
</div>
<!-- Additional Actions -->
<button class="w-full py-4 bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center gap-2 text-on-surface-variant font-medium">
<span class="material-symbols-outlined">person_add</span>
<span>Add New Tenant</span>
</button>
</main>
<!-- BottomNavBar (Mobile-Specific) -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden border-t border-slate-200/10">
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
<span class="material-symbols-outlined text-2xl" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</div>
<div class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 scale-90 duration-200">
<span class="material-symbols-outlined text-2xl" data-icon="groups" style="font-variation-settings: 'FILL' 1;">groups</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Tenants</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
<span class="material-symbols-outlined text-2xl" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
<span class="material-symbols-outlined text-2xl" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
<span class="material-symbols-outlined text-2xl" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</div>
</nav>
<!-- Floating Action for Quick Add -->
<button class="fixed right-6 bottom-24 w-14 h-14 bg-secondary rounded-full flex items-center justify-center shadow-xl shadow-blue-950/20 z-40">
<span class="material-symbols-outlined text-white text-3xl">add</span>
</button>
</body></html>
---

## SCREEN: onboarding_desktop

<body class="bg-surface text-on-surface min-h-screen flex flex-col">
<!-- Top Navigation Suppression (Transactional Page) -->
<!-- As per logic: suppressed TopNavBar/BottomNavBar/SideNav for Onboarding journey -->
<main class="flex-grow flex items-center justify-center p-6 md:p-12">
<div class="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
<!-- Side Panel: Brand & Context -->
<div class="lg:col-span-4 space-y-8">
<div class="flex items-center gap-3">
<div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
<span class="material-symbols-outlined text-2xl" data-icon="domain">domain</span>
</div>
<span class="text-2xl font-headline font-extrabold tracking-tight text-primary">TenantPorch</span>
</div>
<div class="space-y-4">
<h1 class="text-4xl font-headline font-extrabold text-primary leading-tight">Secure your portfolio’s future.</h1>
<p class="text-on-surface-variant text-lg leading-relaxed">Join the network of elite Canadian landlords managing high-compliance property portfolios with Structured Serenity.</p>
</div>
<!-- Step Indicator (Bento-style list) -->
<nav class="space-y-3">
<div class="flex items-center gap-4 p-4 rounded-xl bg-surface-container-highest/30">
<div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
<span class="font-headline font-semibold text-primary">Account Details</span>
</div>
<div class="flex items-center gap-4 p-4 rounded-xl opacity-40">
<div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center font-bold text-sm">2</div>
<span class="font-headline font-semibold">Jurisdiction</span>
</div>
<div class="flex items-center gap-4 p-4 rounded-xl opacity-40">
<div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center font-bold text-sm">3</div>
<span class="font-headline font-semibold">First Property</span>
</div>
<div class="flex items-center gap-4 p-4 rounded-xl opacity-40">
<div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center font-bold text-sm">4</div>
<span class="font-headline font-semibold">Invite Tenants</span>
</div>
</nav>
</div>
<!-- Main Wizard Canvas -->
<div class="lg:col-span-8">
<!-- Progress Bar Top -->
<div class="mb-8 w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div class="bg-secondary h-full w-1/4 transition-all duration-500"></div>
</div>
<!-- Form Card -->
<div class="bg-surface-container-lowest rounded-2xl shadow-[0_24px_48px_rgba(4,21,52,0.06)] p-8 md:p-12">
<!-- Step 1: Account (Current View) -->
<div class="space-y-8" id="step-1">
<div class="space-y-2">
<h2 class="text-2xl font-headline font-bold text-primary">Establish Your Identity</h2>
<p class="text-on-surface-variant">We use this information to generate legally compliant documentation for your region.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-2">
<label class="text-sm font-label font-medium text-on-surface-variant">Full Legal Name</label>
<input class="w-full px-4 py-3 rounded-lg bg-surface-container-low border-0 outline outline-2 outline-outline-variant/20 focus:outline-secondary focus:ring-0 transition-all text-on-surface placeholder:text-outline/50" placeholder="Johnathan Doe" type="text"/>
</div>
<div class="space-y-2">
<label class="text-sm font-label font-medium text-on-surface-variant">Business Email</label>
<input class="w-full px-4 py-3 rounded-lg bg-surface-container-low border-0 outline outline-2 outline-outline-variant/20 focus:outline-secondary focus:ring-0 transition-all text-on-surface placeholder:text-outline/50" placeholder="j.doe@example.ca" type="email"/>
</div>
<div class="col-span-full space-y-2">
<label class="text-sm font-label font-medium text-on-surface-variant">Create Secure Password</label>
<input class="w-full px-4 py-3 rounded-lg bg-surface-container-low border-0 outline outline-2 outline-outline-variant/20 focus:outline-secondary focus:ring-0 transition-all text-on-surface placeholder:text-outline/50" placeholder="••••••••••••" type="password"/>
<p class="text-[10px] text-outline uppercase tracking-widest font-semibold">Security: High Complexity Required</p>
</div>
</div>
<div class="pt-4 flex justify-end items-center gap-6">
<span class="text-sm text-outline font-medium">Already have an account? <a class="text-primary font-bold hover:text-secondary transition-colors" href="#">Sign in</a></span>
<button class="bg-primary text-on-primary px-10 py-4 rounded-lg font-headline font-bold hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/10">
                                Continue to Step 2
                            </button>
</div>
</div>
<!-- Step 2: Hidden/Mock State (Province Selector) -->
<div class="hidden space-y-8" id="step-2">
<div class="space-y-2">
<h2 class="text-2xl font-headline font-bold text-primary">Select Primary Jurisdiction</h2>
<p class="text-on-surface-variant">Rental laws vary significantly by province. We'll tailor your compliance ledger accordingly.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
<!-- Province Card: Ontario -->
<button class="group p-6 rounded-xl bg-surface-container-low border-2 border-transparent hover:border-secondary transition-all text-left flex flex-col h-full">
<span class="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit mb-4">ON</span>
<h3 class="text-lg font-headline font-bold text-primary mb-2">Ontario</h3>
<p class="text-sm text-on-surface-variant leading-snug">RTA compliant leases and LTB automated filings included.</p>
</button>
<!-- Province Card: Alberta -->
<button class="group p-6 rounded-xl bg-surface-container-low border-2 border-transparent hover:border-secondary transition-all text-left flex flex-col h-full">
<span class="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit mb-4">AB</span>
<h3 class="text-lg font-headline font-bold text-primary mb-2">Alberta</h3>
<p class="text-sm text-on-surface-variant leading-snug">Residential Tenancy Act templates with automated rent increases.</p>
</button>
<!-- Province Card: BC -->
<button class="group p-6 rounded-xl bg-surface-container-low border-2 border-transparent hover:border-secondary transition-all text-left flex flex-col h-full">
<span class="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit mb-4">BC</span>
<h3 class="text-lg font-headline font-bold text-primary mb-2">British Columbia</h3>
<p class="text-sm text-on-surface-variant leading-snug">RTB compliance and security deposit management features.</p>
</button>
</div>
</div>
<!-- Step 3 Overlay Preview: Property Details -->
<!-- This would be dynamic in a real app, here for design preview -->
<div class="hidden pt-12 mt-12 border-t border-outline-variant/10" id="step-3-preview">
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
<div class="space-y-4">
<h3 class="font-headline font-bold text-primary">Property Setup</h3>
<div class="bg-surface-container-low p-6 rounded-xl compliance-ledger-border">
<div class="flex gap-4 items-start">
<div class="bg-surface-container-highest p-3 rounded-lg">
<span class="material-symbols-outlined text-primary" data-icon="home_work">home_work</span>
</div>
<div>
<div class="text-sm font-label text-outline mb-1 uppercase tracking-wider">Draft Asset</div>
<div class="text-lg font-headline font-bold text-primary">Unassigned Property</div>
</div>
</div>
</div>
</div>
<div class="flex items-center justify-center bg-surface-container-high/20 rounded-2xl p-8">
<img alt="Modern architecture" class="rounded-xl shadow-lg w-full h-48 object-cover" data-alt="Modern architectural house exterior with large glass windows and clean lines under a clear blue sky, professional architectural photography" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoMvIFd44X-DH3KKfVDH45l8rBJBSybPdtMcvBCiNFNGnvAHq3eX_BqKyBlvC7pUG1QH9_oG9rSos_YANUn42TcXd02XLBq96Wl2jseNS06j_3CPNPNDBZ-NIVi2UnvOgcIBX-4R6tr75Gxzd_0MnPagG_HDvCyu4yvNgCWlQdGmt9wH_8NRfrPGsmp1N5eLqz8Gz1CyYjaKkGtdeyN5ObhKshYyXZavYv5lG7lnQs85O0lAXFmKvZ4c25Ac4rpPjIDHLZC-wul-pH"/>
</div>
</div>
</div>
</div>
<!-- Editorial Bottom Note -->
<div class="mt-12 text-center max-w-lg mx-auto">
<p class="text-sm text-outline leading-relaxed italic">
                        "The Digital Curator for Canada's most discerning landlords. 
                        Trusted by property owners across ON, AB, and BC for institutional-grade portfolio oversight."
                    </p>
</div>
</div>
</div>
</main>
<!-- Visual Embellishment: Background Elements -->
<div class="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl opacity-50"></div>
<div class="fixed bottom-0 left-0 -z-10 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-30"></div>
<!-- Script Placeholder (Mandated No-JS rule, so states are visual-only) -->
<!-- The prompt requested Step 1-4, I have visualized Step 1 as active and hinted at the rest via layout/opacity -->
</body></html>
---

## SCREEN: onboarding_mobile

<body class="bg-surface text-on-surface min-h-screen flex flex-col items-center overflow-x-hidden">
<!-- Progress Indicator - Top Fixed -->
<nav class="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md px-6 py-4">
<div class="flex items-center justify-between mb-4">
<span class="text-xs font-bold headline-font text-primary tracking-widest uppercase">TenantPorch</span>
<span class="text-xs font-medium text-on-surface-variant">Step 02 of 04</span>
</div>
<div class="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
<div class="h-full bg-secondary w-1/2 rounded-full transition-all duration-500"></div>
</div>
</nav>
<!-- Main Content Canvas -->
<main class="w-full max-w-[390px] pt-24 pb-32 px-6 flex flex-col min-h-screen">
<!-- Editorial Header Section -->
<header class="mb-10">
<h1 class="text-4xl headline-font font-extrabold text-primary leading-tight tracking-tight mb-3">
                Regional <br/>Focus.
            </h1>
<p class="text-on-surface-variant leading-relaxed font-body">
                Select your primary province of operation to customize provincial compliance documents and tax settings.
            </p>
</header>
<!-- Asymmetric Bento Grid for Province Selection -->
<section class="flex flex-col gap-4">
<!-- Province Card: Ontario (Active State Example) -->
<button class="relative group w-full text-left overflow-hidden rounded-xl bg-surface-container-lowest p-5 border-2 border-secondary shadow-sm transition-all duration-200">
<div class="flex justify-between items-start">
<div>
<div class="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">ON</div>
<h3 class="headline-font text-xl font-bold text-primary">Ontario</h3>
<p class="text-xs text-on-surface-variant mt-1">LTB Compliance &amp; Standard Leases</p>
</div>
<span class="material-symbols-outlined text-secondary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
<!-- Subtle Gradient Accent -->
<div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/5 to-transparent rounded-full -mr-16 -mt-16"></div>
</button>
<!-- Province Card: British Columbia -->
<button class="w-full text-left overflow-hidden rounded-xl bg-surface-container-low p-5 hover:bg-surface-container-high transition-all duration-200">
<div class="flex justify-between items-start">
<div>
<div class="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">BC</div>
<h3 class="headline-font text-xl font-bold text-primary">British Columbia</h3>
<p class="text-xs text-on-surface-variant mt-1">RTB Guidelines &amp; Security Deposits</p>
</div>
<span class="material-symbols-outlined text-on-surface-variant opacity-30">arrow_forward_ios</span>
</div>
</button>
<!-- Province Card: Alberta -->
<button class="w-full text-left overflow-hidden rounded-xl bg-surface-container-low p-5 hover:bg-surface-container-high transition-all duration-200">
<div class="flex justify-between items-start">
<div>
<div class="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">AB</div>
<h3 class="headline-font text-xl font-bold text-primary">Alberta</h3>
<p class="text-xs text-on-surface-variant mt-1">RTA Standards &amp; Inspection Lists</p>
</div>
<span class="material-symbols-outlined text-on-surface-variant opacity-30">arrow_forward_ios</span>
</div>
</button>
<!-- Other Provinces Option -->
<button class="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-transparent border border-outline-variant/30 text-on-surface-variant hover:border-outline-variant transition-all">
<span class="text-sm font-medium">Other Provinces &amp; Territories</span>
<span class="material-symbols-outlined text-sm">expand_more</span>
</button>
</section>
<!-- Contextual Information Card -->
<div class="mt-8 p-6 rounded-2xl bg-primary text-white relative overflow-hidden">
<div class="relative z-10">
<div class="flex items-center gap-2 mb-2 text-secondary-fixed">
<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">verified_user</span>
<span class="text-[10px] font-bold uppercase tracking-widest headline-font">Canadian Regulatory Shield</span>
</div>
<p class="text-sm text-on-primary-container leading-snug">
                    TenantPorch automatically updates your lease templates based on the latest <span class="text-white font-semibold">2024 Provincial Legislation</span>.
                </p>
</div>
<!-- Background Image Texture -->
<div class="absolute inset-0 opacity-10 bg-center bg-cover" data-alt="abstract geometric pattern with subtle lines and architectural shapes in deep navy and charcoal tones" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDngLc1j2ws167oIHmxxL-c9ytQBdvJ8D9mdaSF4zXNC3KgzWOFd_LFyitxLn1p8CULdugVM3CTA9nPzSYO9iYcHGFPetGspG33XvysR54D4rMvT5StMgRZDDFZVl_h4STk6VF8yoiY0cHmyYFePptemQAak6MHnwOeFeU2VHRGd0blJZznzswMSjNDAT0_5E_QyhTVKd8XaVHmNKMWknzR-M01--FLz9NajrEYmIzjKi_JQl-a9VcUeqP8qtmMKIzzevkDrkb3FmsL')">
</div>
</div>
</main>
<!-- Bottom Action Area -->
<footer class="fixed bottom-0 left-0 w-full p-6 bg-surface-bright/90 backdrop-blur-2xl z-50">
<div class="flex gap-4 items-center">
<button class="w-14 h-14 flex items-center justify-center rounded-xl bg-surface-container-high text-primary hover:bg-surface-container-highest transition-all">
<span class="material-symbols-outlined">arrow_back</span>
</button>
<button class="flex-1 h-14 bg-primary text-white rounded-xl headline-font font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                Continue to Property Details
                <span class="material-symbols-outlined">arrow_forward</span>
</button>
</div>
<div class="mt-4 flex justify-center">
<div class="h-1 w-24 bg-on-surface/10 rounded-full"></div>
</div>
</footer>
<!-- Anti-Standard Detail: Floating Help Trigger -->
<button class="fixed bottom-28 right-6 w-12 h-12 bg-white shadow-2xl rounded-full flex items-center justify-center text-secondary border border-secondary/10 active:scale-90 transition-all z-40">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">help_center</span>
</button>
</body></html>
---

## SCREEN: tenant_dashboard_desktop

<body class="bg-surface text-on-surface">
<!-- SideNavBar (Execution from JSON) -->
<aside class="fixed h-screen flex flex-col gap-2 py-6 bg-blue-950 dark:bg-slate-950 h-screen w-64 hidden lg:flex left-0 top-0 z-40 shadow-xl shadow-blue-950/20">
<div class="px-6 mb-8">
<h1 class="text-2xl font-black text-white italic">TenantPorch</h1>
<p class="font-manrope font-medium text-sm text-blue-200/70">Canadian Property Mgmt</p>
</div>
<nav class="flex-1 space-y-1">
<!-- Active State Logic: Dashboard is active -->
<a class="bg-blue-900 dark:bg-slate-800 text-white rounded-lg px-4 py-3 mx-4 flex items-center gap-3 translate-x-1 duration-150 font-manrope font-medium text-sm" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-4 flex items-center gap-3 transition-all font-manrope font-medium text-sm hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="domain">domain</span>
<span>Properties</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-4 flex items-center gap-3 transition-all font-manrope font-medium text-sm hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="payments">payments</span>
<span>Financials</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-4 flex items-center gap-3 transition-all font-manrope font-medium text-sm hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="handyman">handyman</span>
<span>Maintenance</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-4 flex items-center gap-3 transition-all font-manrope font-medium text-sm hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span>Documents</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-4 flex items-center gap-3 transition-all font-manrope font-medium text-sm hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="mail">mail</span>
<span>Messages</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-4 flex items-center gap-3 transition-all font-manrope font-medium text-sm hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
</nav>
<div class="px-6 mt-auto">
<button class="w-full py-3 px-4 bg-amber-500 text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors">
<span class="material-symbols-outlined" data-icon="add_home">add_home</span>
<span>Add Property</span>
</button>
</div>
</aside>
<!-- TopNavBar (Execution from JSON) -->
<header class="flex justify-between items-center w-full px-6 py-4 h-16 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl docked full-width top-0 z-50 lg:pl-72 fixed">
<div class="flex items-center gap-4">
<div class="hidden md:flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
<span class="material-symbols-outlined text-on-surface-variant text-sm" data-icon="location_on">location_on</span>
<span class="text-sm font-medium text-on-surface-variant">The Bentley Tower, Unit 1402</span>
<span class="material-symbols-outlined text-on-surface-variant text-sm" data-icon="expand_more">expand_more</span>
</div>
</div>
<div class="flex items-center gap-6">
<div class="flex items-center gap-4 text-blue-800/60">
<button class="hover:text-amber-600 transition-colors duration-200 relative">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></span>
</button>
<button class="hover:text-amber-600 transition-colors duration-200">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
</button>
</div>
<div class="h-8 w-8 rounded-full overflow-hidden border-2 border-surface-variant">
<img alt="User avatar" data-alt="Close-up professional headshot of a smiling young man in a clean casual shirt against a neutral office background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7InXvxF3ia7gOsCOaAsbNLKWwndntg2th1Ub-7Wgih1gVdP2CzL70qjysb2DrhtLNFOe5ZmUSwAE4YCHjJA1ObypYjob_RxHByzWdi4nDLSW_oBMWfUTMwIpsVm-8zO4-XtA916er8uELWccK1e403Dd_JG49ERWXKpQ4UrmJjPqXFQLPfEzBvzO-Rui8vo-Mhnl7Z0ot98WZv0dMFO9Kcp_wZiG6WzQ4c2C3JgqN_KKO6cV27704MhOPebMm4y8lmR16I4Z7O6rr"/>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="lg:ml-64 pt-24 pb-20 px-8 min-h-screen">
<div class="max-w-7xl mx-auto">
<!-- Hero Section: Welcome & Status -->
<section class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
<!-- Welcome Card (Asymmetric) -->
<div class="lg:col-span-8 relative overflow-hidden rounded-3xl bg-primary text-white p-10 flex flex-col justify-end min-h-[320px] shadow-2xl">
<img alt="Interior" class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40" data-alt="Modern minimalist living room with large windows showing a city skyline at sunset with warm orange and purple tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqrM5qkKjLD4Dv-KlNJicjOQRnzTfPCRMEE_fphU-Tl3d7UZ-MNiUPJW5kMHfLC68SwGNdZYoX8_u6UWJRFVVINDQfY28vnrcpHwPBnb2DxdRJhPfd2LKu4a4M4RJDiclw949LI3NPKILsV57XhIIJD1LTwvZv9XBtANbL12ljMIPAPqFHb7w_wx1nUFiIkpRUMlRWPNA29kiT1wUSMVcunKWyVBBgEaBs_aBJEDakyNFrzRQs7iF12wCSltH9_ZAc-QQxa-WN_sL8"/>
<div class="relative z-10">
<span class="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4">Current Residence</span>
<h2 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Welcome home, Marcus</h2>
<p class="text-blue-100 text-lg opacity-80 flex items-center gap-2">
<span class="material-symbols-outlined" data-icon="apartment">apartment</span>
                            1001 Bay Street, Unit 1402, Toronto, ON M5S 3A6
                        </p>
</div>
</div>
<!-- Rent Status Card -->
<div class="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between border border-outline-variant/10 shadow-sm relative overflow-hidden">
<div class="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16"></div>
<div>
<div class="flex justify-between items-start mb-6">
<h3 class="font-headline font-bold text-xl">Monthly Rent</h3>
<span class="px-3 py-1 bg-tertiary/10 text-tertiary-container rounded-full text-xs font-bold uppercase">Settled</span>
</div>
<div class="flex items-baseline gap-1 mb-1">
<span class="text-label-sm font-medium text-on-surface-variant">CAD</span>
<span class="text-4xl font-extrabold text-primary">$2,850.00</span>
</div>
<p class="text-sm text-on-surface-variant font-medium">Due: October 1st, 2023</p>
</div>
<button class="mt-8 w-full py-4 bg-secondary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95">
<span class="material-symbols-outlined" data-icon="account_balance_wallet" data-weight="fill">account_balance_wallet</span>
<span>Pay Rent Now</span>
</button>
</div>
</section>
<!-- Grid Layout: Quick Actions & Feeds -->
<section class="grid grid-cols-1 lg:grid-cols-12 gap-8">
<!-- Quick Action Grid (Bento Style) -->
<div class="lg:col-span-7 grid grid-cols-2 gap-4">
<div class="bg-surface-container-low p-6 rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer group">
<div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-primary" data-icon="history">history</span>
</div>
<h4 class="font-bold text-primary">Payment History</h4>
<p class="text-xs text-on-surface-variant mt-1">Review past transactions and receipts</p>
</div>
<div class="bg-surface-container-low p-6 rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer group">
<div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-primary" data-icon="handyman">handyman</span>
</div>
<h4 class="font-bold text-primary">Maintenance</h4>
<p class="text-xs text-on-surface-variant mt-1">Request repairs or report issues</p>
</div>
<div class="bg-surface-container-low p-6 rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer group">
<div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-primary" data-icon="gavel">gavel</span>
</div>
<h4 class="font-bold text-primary">Digital Lease</h4>
<p class="text-xs text-on-surface-variant mt-1">View terms and compliance docs</p>
</div>
<div class="bg-surface-container-low p-6 rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer group">
<div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-primary" data-icon="chat">chat</span>
</div>
<h4 class="font-bold text-primary">Contact Owner</h4>
<p class="text-xs text-on-surface-variant mt-1">Message your property manager</p>
</div>
</div>
<!-- Right Column: Compliance & Countdown -->
<div class="lg:col-span-5 space-y-8">
<!-- Lease Countdown -->
<div class="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
<div class="flex justify-between items-center mb-6">
<h3 class="font-headline font-bold text-lg">Lease Remaining</h3>
<span class="text-xs font-bold text-on-surface-variant">Expires Aug 2024</span>
</div>
<div class="relative pt-1">
<div class="flex mb-2 items-center justify-between">
<div>
<span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary-fixed">
                                        10 Months Left
                                    </span>
</div>
<div class="text-right">
<span class="text-xs font-semibold inline-block text-secondary">
                                        82%
                                    </span>
</div>
</div>
<div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-surface-container-high">
<div class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary" style="width:82%"></div>
</div>
</div>
</div>
<!-- Activity Feed (Compliance Ledger Style) -->
<div class="bg-surface-bright rounded-3xl overflow-hidden shadow-sm">
<div class="px-8 py-6 bg-surface-container-highest flex justify-between items-center">
<h3 class="font-headline font-bold text-lg">Recent Activity</h3>
<button class="text-xs font-bold text-primary hover:underline">View All</button>
</div>
<div class="divide-y divide-outline-variant/10">
<!-- Activity Item 1 -->
<div class="flex items-center gap-4 px-8 py-4 hover:bg-surface-container-low transition-colors">
<div class="w-1 h-8 bg-tertiary rounded-full"></div>
<div class="flex-1">
<p class="text-sm font-semibold text-primary">September Rent Paid</p>
<p class="text-xs text-on-surface-variant">Confirmed • 2 days ago</p>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
<!-- Activity Item 2 -->
<div class="flex items-center gap-4 px-8 py-4 hover:bg-surface-container-low transition-colors">
<div class="w-1 h-8 bg-amber-500 rounded-full"></div>
<div class="flex-1">
<p class="text-sm font-semibold text-primary">Maintenance: HVAC Update</p>
<p class="text-xs text-on-surface-variant">In Progress • 3 days ago</p>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
<!-- Activity Item 3 -->
<div class="flex items-center gap-4 px-8 py-4 hover:bg-surface-container-low transition-colors">
<div class="w-1 h-8 bg-tertiary rounded-full"></div>
<div class="flex-1">
<p class="text-sm font-semibold text-primary">Insurance Policy Uploaded</p>
<p class="text-xs text-on-surface-variant">Verified • 1 week ago</p>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
<!-- Activity Item 4 -->
<div class="flex items-center gap-4 px-8 py-4 hover:bg-surface-container-low transition-colors">
<div class="w-1 h-8 bg-tertiary rounded-full"></div>
<div class="flex-1">
<p class="text-sm font-semibold text-primary">Message: Welcome Letter</p>
<p class="text-xs text-on-surface-variant">Read • 2 weeks ago</p>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
<!-- Activity Item 5 -->
<div class="flex items-center gap-4 px-8 py-4 hover:bg-surface-container-low transition-colors">
<div class="w-1 h-8 bg-outline-variant rounded-full"></div>
<div class="flex-1">
<p class="text-sm font-semibold text-primary">Lease Commenced</p>
<p class="text-xs text-on-surface-variant">Completed • 3 weeks ago</p>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
</div>
</div>
</div>
</section>
</div>
</main>
<!-- BottomNavBar (Execution from JSON for Mobile) -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<!-- Active Tab: Dashboard -->
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">DASHBOARD</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">PROPERTIES</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">FINANCIALS</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">MAINTENANCE</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">MORE</span>
</a>
</nav>
</body></html>
---

## SCREEN: tenant_dashboard_mobile

<body class="bg-surface text-on-surface min-h-screen pb-24">
<!-- Top Navigation Anchor -->
<nav class="bg-slate-50/80 backdrop-blur-xl fixed top-0 z-50 flex justify-between items-center w-full px-6 py-4 h-16">
<span class="text-xl font-manrope font-bold text-blue-950 tracking-tight">TenantPorch</span>
<div class="flex gap-4 items-center">
<span class="material-symbols-outlined text-blue-900" data-icon="notifications">notifications</span>
<div class="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
<img alt="User avatar" class="w-full h-full object-cover" data-alt="Close-up portrait of a young professional woman with a friendly smile, natural lighting, soft office background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqyeVYMrdqVVgNP7kzJTlQ0NEQg5r4DZneOof-JWVLyCXQliQwrJDSHOrkqAkj_iaqI59c-LeolcaGFtN6mE16LpejqgAlmYRDX_WVqPvNlPnOwOAAbdupE0rNHWBAlr9IryfyGiJ5euIOrRR59mjGI-CBZp991GgR7KpSUF2W-CU6PPkX21EXSl6JG1pBMCbe5VWPMc0whRsXnblk2mo1g4Rh6-5HLoimngGY_JehHQfbB5oyJPcpo_qmmk4Hr8C4STuIAS0oEbfn"/>
</div>
</div>
</nav>
<!-- Main Content Area -->
<main class="pt-20 px-6 space-y-6">
<!-- Welcome Section -->
<header>
<p class="text-on-surface-variant font-label text-sm uppercase tracking-wider">Welcome back,</p>
<h1 class="text-3xl font-manrope font-extrabold text-primary tracking-tight">Elena Vance</h1>
</header>
<!-- Rent Status Card (Signature Component) -->
<div class="relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-xl">
<!-- Subtle Texture Background -->
<div class="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary opacity-90"></div>
<div class="relative z-10 space-y-4">
<div class="flex justify-between items-start">
<div>
<p class="text-on-primary-container text-xs font-medium uppercase tracking-widest">Next Rent Due</p>
<p class="text-2xl font-manrope font-bold mt-1">October 01, 2024</p>
</div>
<span class="bg-tertiary text-tertiary-fixed text-[10px] font-bold px-3 py-1 rounded-full uppercase">On Track</span>
</div>
<div class="pt-2">
<p class="text-on-primary-container text-xs">Amount Outstanding</p>
<div class="flex items-baseline gap-1">
<span class="text-sm font-label text-secondary-fixed">CAD</span>
<span class="text-4xl font-manrope font-extrabold">$2,450.00</span>
</div>
</div>
<button class="w-full bg-secondary text-white font-manrope font-bold py-3 rounded-xl shadow-lg shadow-black/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
<span class="material-symbols-outlined text-lg" data-icon="payments">payments</span>
                    Pay Rent Now
                </button>
</div>
</div>
<!-- Quick Action Grid (Asymmetric Layout) -->
<section class="grid grid-cols-2 gap-4">
<div class="bg-surface-container-low p-4 rounded-2xl flex flex-col justify-between aspect-square border border-outline-variant/10">
<div class="bg-surface-container-lowest w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-primary" data-icon="handyman">handyman</span>
</div>
<div>
<h3 class="font-manrope font-bold text-primary">Request Repair</h3>
<p class="text-[11px] text-on-surface-variant mt-1 leading-tight">Submit a new maintenance ticket</p>
</div>
</div>
<div class="space-y-4">
<div class="bg-surface-container-low p-4 rounded-2xl flex items-center gap-3 border border-outline-variant/10">
<div class="bg-secondary-fixed w-8 h-8 rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-on-secondary-fixed text-sm" data-icon="description">description</span>
</div>
<span class="font-manrope font-semibold text-sm text-primary">View Lease</span>
</div>
<div class="bg-surface-container-low p-4 rounded-2xl flex items-center gap-3 border border-outline-variant/10">
<div class="bg-tertiary-fixed w-8 h-8 rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-on-tertiary-fixed text-sm" data-icon="chat">chat</span>
</div>
<span class="font-manrope font-semibold text-sm text-primary">Message Manager</span>
</div>
</div>
</section>
<!-- Activity Feed (Editorial Style) -->
<section class="space-y-4">
<div class="flex justify-between items-end">
<h2 class="text-xl font-manrope font-bold text-primary">Recent Activity</h2>
<button class="text-secondary font-semibold text-xs">View History</button>
</div>
<!-- Compliance Ledger Items -->
<div class="space-y-3">
<!-- Activity Item 1 -->
<div class="bg-surface-bright rounded-xl p-4 flex items-center gap-4 border-l-4 border-tertiary shadow-sm">
<div class="flex-1">
<p class="text-xs text-on-surface-variant">Payment Received</p>
<p class="font-manrope font-bold text-primary">September Rent Paid</p>
<p class="text-[10px] text-on-surface-variant mt-1">Ref: #TP-98210 • Sept 01, 2024</p>
</div>
<div class="text-right">
<p class="font-manrope font-bold text-primary">CAD $2,450.00</p>
<span class="text-[9px] uppercase tracking-tighter text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded">Success</span>
</div>
</div>
<!-- Activity Item 2 -->
<div class="bg-surface-bright rounded-xl p-4 flex items-center gap-4 border-l-4 border-secondary-fixed shadow-sm">
<div class="flex-1">
<p class="text-xs text-on-surface-variant">Maintenance Update</p>
<p class="font-manrope font-bold text-primary">Kitchen Faucet Repair</p>
<p class="text-[10px] text-on-surface-variant mt-1">Assigned to PlumbCo • Scheduled for tomorrow</p>
</div>
<div class="text-right">
<span class="material-symbols-outlined text-secondary" data-icon="schedule">schedule</span>
</div>
</div>
<!-- Activity Item 3 -->
<div class="bg-surface-bright rounded-xl p-4 flex items-center gap-4 border-l-4 border-outline-variant shadow-sm opacity-80">
<div class="flex-1">
<p class="text-xs text-on-surface-variant">Document Shared</p>
<p class="font-manrope font-bold text-primary">Updated Building Rules</p>
<p class="text-[10px] text-on-surface-variant mt-1">Shared by Management • 3 days ago</p>
</div>
<div class="text-right">
<span class="material-symbols-outlined text-on-surface-variant" data-icon="download">download</span>
</div>
</div>
</div>
</section>
<!-- Promotion / Feature Card -->
<div class="bg-surface-container-high rounded-2xl overflow-hidden mt-8">
<div class="p-6 space-y-2">
<span class="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">New Feature</span>
<h3 class="text-xl font-manrope font-bold text-primary">Furniture Insurance</h3>
<p class="text-sm text-on-surface-variant leading-relaxed">Protect your belongings with our partner rates starting at $12/month.</p>
<button class="text-secondary font-bold text-sm flex items-center gap-1 pt-2">
                    Learn More <span class="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
<div class="h-24 bg-cover bg-center" data-alt="Minimalist modern living room with warm lighting, designer furniture, and soft plants, cozy atmosphere" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBkCkFolOkswd72qHcYvxUulMwLUyaOdh87wMww69ETBcxEtM9cvOZ5eZEfUjfAp27FZCHm7vXPIlt7LH_tyEStOUZBAAshjITWZpO6T2U_IH3FqdHrecECnNZf8klQglyhcqs6iMSLZHz-uAoSz5SGSuFgx3GccrbRKAw9JcTQ-YuDpmq9WUK-GByHp7IUCtl_uEXJbgF2HSFmjKkAN6hpAiGdhKxjip0VYRAIHpdvQ7ln3r-IvmCDR0aje55LJpOcqoPBnCPoUWOG')"></div>
</div>
</main>
<!-- Bottom Navigation Shell -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden border-t border-slate-200/10">
<!-- Active Tab: Dashboard (Home) -->
<div class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 rounded-xl px-2 py-1 scale-90">
<span class="material-symbols-outlined" data-icon="space_dashboard" style="font-variation-settings: 'FILL' 1;">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Home</span>
</div>
<!-- Inactive Tab -->
<div class="flex flex-col items-center justify-center text-slate-500 active:bg-slate-100">
<span class="material-symbols-outlined" data-icon="payments">payments</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Payments</span>
</div>
<!-- Inactive Tab -->
<div class="flex flex-col items-center justify-center text-slate-500 active:bg-slate-100">
<span class="material-symbols-outlined" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Maintenance</span>
</div>
<!-- Inactive Tab -->
<div class="flex flex-col items-center justify-center text-slate-500 active:bg-slate-100">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Docs</span>
</div>
<!-- Inactive Tab -->
<div class="flex flex-col items-center justify-center text-slate-500 active:bg-slate-100">
<span class="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</div>
</nav>
</body></html>
---

## SCREEN: tenant_documents_desktop

<body class="bg-surface font-body text-on-surface flex min-h-screen">
<!-- SideNavBar (Authority: JSON & Design System) -->
<aside class="h-screen w-64 hidden lg:flex flex-col left-0 top-0 fixed bg-primary dark:bg-slate-950 shadow-xl shadow-blue-950/20 z-50">
<div class="px-6 py-8">
<h1 class="text-2xl font-black text-white italic font-headline">TenantPorch</h1>
<p class="text-blue-200/50 text-[10px] uppercase tracking-widest font-bold mt-1">Canadian Property Mgmt</p>
</div>
<nav class="flex-1 flex flex-col gap-2 py-2">
<!-- Active State Logic: Documents is current -->
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all font-headline font-medium text-sm flex items-center gap-3" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
                Dashboard
            </a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all font-headline font-medium text-sm flex items-center gap-3" href="#">
<span class="material-symbols-outlined" data-icon="domain">domain</span>
                Properties
            </a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all font-headline font-medium text-sm flex items-center gap-3" href="#">
<span class="material-symbols-outlined" data-icon="groups">groups</span>
                Tenants
            </a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all font-headline font-medium text-sm flex items-center gap-3" href="#">
<span class="material-symbols-outlined" data-icon="payments">payments</span>
                Financials
            </a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all font-headline font-medium text-sm flex items-center gap-3" href="#">
<span class="material-symbols-outlined" data-icon="handyman">handyman</span>
                Maintenance
            </a>
<a class="bg-blue-900 dark:bg-slate-800 text-white rounded-lg px-4 py-3 mx-2 translate-x-1 duration-150 font-headline font-medium text-sm flex items-center gap-3" href="#">
<span class="material-symbols-outlined" data-icon="description">description</span>
                Documents
            </a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all font-headline font-medium text-sm flex items-center gap-3" href="#">
<span class="material-symbols-outlined" data-icon="mail">mail</span>
                Messages
            </a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all font-headline font-medium text-sm flex items-center gap-3" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
                Settings
            </a>
</nav>
<div class="p-4 mt-auto">
<button class="w-full bg-secondary text-on-secondary py-3 rounded-lg font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-secondary/20">
<span class="material-symbols-outlined" data-icon="add">add</span>
                Add Property
            </button>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="flex-1 lg:ml-64 bg-surface min-h-screen">
<!-- TopAppBar (Authority: JSON) -->
<header class="flex justify-between items-center w-full px-8 py-4 h-16 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
<div class="flex items-center gap-4">
<h2 class="text-xl font-headline font-bold text-primary tracking-tight">Tenant Documents</h2>
<div class="hidden md:flex gap-6 ml-8">
<a class="text-primary font-bold border-b-2 border-secondary font-headline text-sm py-1" href="#">Properties</a>
</div>
</div>
<div class="flex items-center gap-4">
<button class="p-2 text-on-primary-container hover:text-secondary transition-colors">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button class="p-2 text-on-primary-container hover:text-secondary transition-colors">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
</button>
<div class="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
<img alt="User avatar" data-alt="close-up portrait of a professional property manager in a modern office with soft bokeh background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmkcf5OzBQBYXWO5FX1WusFYVja6m7wOqZTR4U-K-DdlPMbGb86Ecynuvn1xj2aW4GkmA8OlsNUjRVmgn2Q9aNE1lMd5NQVdz9869FRPWPHaJac0ORR1grPUVFgne1mIhRR71bW_TzbG-R6VddigLFdYDnoyUfFmYB6Sk6FeuwocQ0FSAMCSKmhR3sRuqU11ozSL1OEnqdwls6usSDtaJGBqx3VBP_H7tBOHTUxr7OO4CEgi1HIcgrYVKEMzEsmzrczDJ2_b60uCso"/>
</div>
</div>
</header>
<div class="p-8 max-w-7xl mx-auto">
<!-- Breadcrumbs & Editorial Header -->
<div class="mb-12">
<div class="flex items-center gap-2 text-on-surface-variant text-xs mb-4 uppercase tracking-widest font-label font-semibold">
<span>Portfolio</span>
<span class="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
<span>1242 Bay St, Toronto</span>
<span class="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
<span class="text-primary">Documents</span>
</div>
<h3 class="text-4xl md:text-5xl font-headline font-extrabold text-primary tracking-tighter leading-tight max-w-2xl">
                    Regulatory &amp; Lease <br/><span class="text-secondary italic">Asset Repository</span>
</h3>
</div>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-12 gap-6">
<!-- Compliance Ledger (Left Side) -->
<div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
<div class="bg-surface-container-low rounded-xl p-6 shadow-sm">
<div class="flex items-center justify-between mb-6">
<h4 class="font-headline font-bold text-lg text-primary">Compliance Status</h4>
<span class="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase">Ontario (ON)</span>
</div>
<div class="space-y-4">
<div class="bg-surface-container-lowest p-4 rounded-lg compliance-ledger-border shadow-sm flex items-center justify-between">
<div>
<p class="text-xs font-label font-bold text-on-surface-variant uppercase mb-1">Status</p>
<p class="font-headline font-bold text-primary">Fully Compliant</p>
</div>
<span class="material-symbols-outlined text-tertiary text-3xl" data-icon="verified" style="font-variation-settings: 'FILL' 1;">verified</span>
</div>
<div class="p-4 border-l-4 border-secondary bg-white rounded-lg shadow-sm">
<p class="text-xs font-label font-bold text-on-surface-variant uppercase mb-1">Renewal Notice</p>
<p class="font-headline font-bold text-primary">Due in 42 Days</p>
</div>
</div>
</div>
<!-- Upload Area (Glassmorphism inspired) -->
<div class="bg-primary p-1 rounded-xl shadow-2xl">
<div class="bg-primary-container rounded-lg p-8 border-2 border-dashed border-outline-variant/20 flex flex-col items-center text-center">
<div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
<span class="material-symbols-outlined text-secondary text-3xl" data-icon="cloud_upload">cloud_upload</span>
</div>
<h5 class="font-headline font-bold text-white text-lg mb-2">Upload Documents</h5>
<p class="text-on-primary-container text-sm mb-6 px-4">Insurance, Tenant ID, or supporting Schedule B amendments.</p>
<button class="w-full bg-secondary-fixed text-on-secondary-fixed py-3 rounded-lg font-headline font-bold text-sm hover:scale-[0.98] transition-transform">
                                Browse Files
                            </button>
</div>
</div>
</div>
<!-- Document Grid (Right Side) -->
<div class="col-span-12 lg:col-span-8">
<div class="flex items-center justify-between mb-6">
<div class="flex gap-4">
<button class="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold font-label uppercase">All Files</button>
<button class="px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-full text-xs font-bold font-label uppercase transition-colors">Recent</button>
</div>
<div class="flex items-center gap-2 text-on-surface-variant">
<span class="material-symbols-outlined" data-icon="search">search</span>
<input class="bg-transparent border-none text-sm font-medium focus:ring-0" placeholder="Search files..." type="text"/>
</div>
</div>
<div class="space-y-3">
<!-- Category: Lease -->
<div class="bg-surface-container-low p-3 px-6 rounded-t-xl text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center justify-between">
<span>Primary Lease Agreements</span>
<span>2 Items</span>
</div>
<div class="bg-white hover:bg-surface-container-lowest transition-all p-5 shadow-sm flex items-center gap-6 group">
<div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-2xl" data-icon="description">description</span>
</div>
<div class="flex-1">
<h6 class="font-headline font-bold text-primary">Standard Ontario Lease V4.pdf</h6>
<p class="text-xs text-on-surface-variant">Lease • Signed Jul 12, 2023 • 4.2 MB</p>
</div>
<div class="flex items-center gap-3">
<button class="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
<span class="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span> View
                                </button>
<button class="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
<span class="material-symbols-outlined text-[18px]" data-icon="download">download</span>
</button>
</div>
</div>
<!-- Category: Schedules -->
<div class="bg-surface-container-low p-3 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-4">
<span>Schedules &amp; Riders</span>
</div>
<div class="bg-white hover:bg-surface-container-lowest transition-all p-5 shadow-sm flex items-center gap-6 group">
<div class="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-2xl" data-icon="article">article</span>
</div>
<div class="flex-1">
<h6 class="font-headline font-bold text-primary">Schedule A - Additional Terms.docx</h6>
<p class="text-xs text-on-surface-variant">Schedule A • Last edited Aug 01, 2023 • 1.1 MB</p>
</div>
<div class="flex items-center gap-3">
<button class="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
<span class="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span> View
                                </button>
<button class="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
<span class="material-symbols-outlined text-[18px]" data-icon="download">download</span>
</button>
</div>
</div>
<!-- Category: Inspections -->
<div class="bg-surface-container-low p-3 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-4">
<span>Inspections &amp; Reports</span>
</div>
<div class="bg-white hover:bg-surface-container-lowest transition-all p-5 shadow-sm flex items-center gap-6 group">
<div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-2xl" data-icon="content_paste_search">content_paste_search</span>
</div>
<div class="flex-1">
<h6 class="font-headline font-bold text-primary">Move-In Inspection Report.pdf</h6>
<p class="text-xs text-on-surface-variant">Inspections • Completed Jul 01, 2023 • 8.5 MB</p>
</div>
<div class="flex items-center gap-3">
<button class="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
<span class="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span> View
                                </button>
<button class="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
<span class="material-symbols-outlined text-[18px]" data-icon="download">download</span>
</button>
</div>
</div>
<!-- Financials / Receipts -->
<div class="bg-surface-container-low p-3 px-6 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-4">
<span>Bills &amp; Receipts</span>
</div>
<div class="bg-white hover:bg-surface-container-lowest transition-all p-5 shadow-sm flex items-center gap-6 group rounded-b-xl">
<div class="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-on-surface-variant group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-2xl" data-icon="receipt_long">receipt_long</span>
</div>
<div class="flex-1">
<h6 class="font-headline font-bold text-primary">First Month Rent Receipt.pdf</h6>
<p class="text-xs text-on-surface-variant">Receipts • CAD $2,850.00 • Jul 15, 2023</p>
</div>
<div class="flex items-center gap-3">
<button class="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
<span class="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span> View
                                </button>
<button class="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center gap-1 text-xs font-bold">
<span class="material-symbols-outlined text-[18px]" data-icon="download">download</span>
</button>
</div>
</div>
</div>
</div>
</div>
<!-- Footer Compliance Note -->
<footer class="mt-16 pt-8 border-t border-surface-container-highest flex flex-col md:flex-row justify-between items-center text-on-surface-variant text-[11px] font-medium tracking-wide uppercase">
<div class="flex items-center gap-4 mb-4 md:mb-0">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]" data-icon="security">security</span> AES-256 Encrypted Storage</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]" data-icon="gavel">gavel</span> LTB Compliant Records</span>
</div>
<p>© 2024 TenantPorch Canadian Asset Management. All Documents Archived for 7 Years.</p>
</footer>
</div>
</main>
<!-- BottomNavBar (Authority: JSON - Mobile Only) -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl flex justify-around items-center h-20 px-4 pb-safe lg:hidden shadow-[0_-4px_24px_rgba(4,21,52,0.06)] border-t border-slate-200/10">
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</a>
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Documents</span>

---

## SCREEN: tenant_documents_mobile

<body class="bg-surface text-on-surface min-h-screen pb-24">
<!-- TopAppBar -->
<header class="bg-slate-50/80 backdrop-blur-xl fixed top-0 z-50 flex justify-between items-center w-full px-6 py-4 h-16">
<h1 class="text-xl font-manrope font-bold text-blue-950 tracking-tight">TenantPorch</h1>
<div class="flex gap-4">
<span class="material-symbols-outlined text-blue-900" data-icon="notifications">notifications</span>
<span class="material-symbols-outlined text-blue-900" data-icon="settings">settings</span>
</div>
</header>
<main class="pt-20 px-6 max-w-[390px] mx-auto">
<!-- Hero Editorial Section -->
<section class="mb-8">
<h2 class="text-3xl font-headline font-extrabold text-primary tracking-tight mb-2">Documents</h2>
<p class="text-on-surface-variant font-body text-sm leading-relaxed">Centralized access to your Canadian lease agreements and compliance records.</p>
</section>
<!-- Compliance Banner (Editorial Estate style) -->
<div class="bg-surface-container-low p-4 rounded-xl mb-8 flex items-center gap-4">
<div class="bg-secondary p-2 rounded-lg">
<span class="material-symbols-outlined text-white" data-icon="gavel" style="font-variation-settings: 'FILL' 1;">gavel</span>
</div>
<div>
<p class="text-[11px] font-label text-secondary uppercase tracking-widest font-bold">Ontario RTA Compliance</p>
<p class="text-sm font-body font-semibold text-primary">All documents up to date</p>
</div>
</div>
<!-- Accordion Category List -->
<div class="space-y-4">
<!-- Category 1: Active Leases -->
<div class="group">
<div class="bg-surface-container-high px-5 py-4 rounded-xl flex justify-between items-center">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary" data-icon="description">description</span>
<span class="font-headline font-semibold text-primary">Active Leases</span>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="expand_more">expand_more</span>
</div>
<!-- Expanded Files List -->
<div class="mt-2 space-y-2">
<div class="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
<div class="flex items-center gap-4">
<div class="w-10 h-10 bg-primary-container/10 flex items-center justify-center rounded-lg">
<span class="material-symbols-outlined text-primary" data-icon="picture_as_pdf">picture_as_pdf</span>
</div>
<div>
<h4 class="text-sm font-semibold text-primary">Standard Ontario Lease</h4>
<p class="text-[10px] text-on-surface-variant">Modified Feb 12, 2024 • 1.2 MB</p>
</div>
</div>
<button class="w-10 h-10 flex items-center justify-center text-secondary hover:bg-secondary-fixed transition-colors rounded-full">
<span class="material-symbols-outlined" data-icon="download">download</span>
</button>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
<div class="flex items-center gap-4">
<div class="w-10 h-10 bg-primary-container/10 flex items-center justify-center rounded-lg">
<span class="material-symbols-outlined text-primary" data-icon="picture_as_pdf">picture_as_pdf</span>
</div>
<div>
<h4 class="text-sm font-semibold text-primary">Addendum A - Pets</h4>
<p class="text-[10px] text-on-surface-variant">Modified Jan 05, 2024 • 450 KB</p>
</div>
</div>
<button class="w-10 h-10 flex items-center justify-center text-secondary hover:bg-secondary-fixed transition-colors rounded-full">
<span class="material-symbols-outlined" data-icon="download">download</span>
</button>
</div>
</div>
</div>
<!-- Category 2: Insurance & ID -->
<div class="group">
<div class="bg-surface-container-low px-5 py-4 rounded-xl flex justify-between items-center opacity-80">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary" data-icon="verified_user">verified_user</span>
<span class="font-headline font-semibold text-primary">Insurance &amp; ID</span>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
</div>
<!-- Category 3: Inspection Reports -->
<div class="group">
<div class="bg-surface-container-low px-5 py-4 rounded-xl flex justify-between items-center opacity-80">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary" data-icon="fact_check">fact_check</span>
<span class="font-headline font-semibold text-primary">Inspection Reports</span>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
</div>
<!-- Category 4: Financial Records -->
<div class="group">
<div class="bg-surface-container-low px-5 py-4 rounded-xl flex justify-between items-center opacity-80">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary" data-icon="receipt_long">receipt_long</span>
<span class="font-headline font-semibold text-primary">Tax Receipts (T5)</span>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
</div>
</div>
<!-- Empty State / Suggestion UI Pattern -->
<section class="mt-12 p-8 border-2 border-dashed border-outline-variant/30 rounded-3xl flex flex-col items-center text-center">
<img alt="Upload" class="w-24 h-24 mb-4 rounded-2xl grayscale" data-alt="minimalist abstract 3D shapes representing paperwork organized in a clean white space with soft shadows" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD5SLG1fDMydQtHVCzhD-K8h7d7U-T8znPSjKOeVSvXgDGHGnA2v7fYDX0RDr31kujvnUg5wm8cJx1nw0oXbGaB9rSKtBTGkwcUspOX4OMPOX-1h5i3_U8tY1bK2ld3ln3qycK-l8kkPRq10TjLTRmmRAKZqoqyIqRGYevwagX3gKcBc4YZFl9xerfaoTeanNUYintx4z3T7L2xujCQDaEc1ssyklIpT8B_FARfHgs_FQcNrp9pKOdGkgRS1zxL-MW7wZslojvkJ3S"/>
<h3 class="font-headline font-bold text-primary">Missing something?</h3>
<p class="text-xs text-on-surface-variant font-body mb-6">Upload a new document or request a digital signature from your tenant.</p>
<button class="bg-primary text-white px-6 py-3 rounded-full font-headline font-bold text-sm flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]" data-icon="upload">upload</span>
                Upload Document
            </button>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden border-t border-slate-200/10">
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500" href="#">
<span class="material-symbols-outlined" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Maintenance</span>
</a>
<!-- Active Tab: Documents (mapped to 'More' contextually or as a specific sub-state) -->
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 rounded-xl px-2 py-1 scale-90" href="#">
<span class="material-symbols-outlined" data-icon="description" style="font-variation-settings: 'FILL' 1;">description</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</a>
</nav>
</body></html>
---

## SCREEN: tenant_invite_desktop

<body class="bg-surface font-body text-on-surface antialiased">
<!-- Top Navigation Suppression: Not shown for transactional flow as per instructions -->
<main class="min-h-screen flex flex-col lg:flex-row editorial-asymmetry py-12 gap-12 lg:gap-24">
<!-- Left Column: Editorial Content & Lease Summary -->
<section class="flex-1 flex flex-col justify-center">
<header class="mb-12">
<div class="mb-6">
<span class="text-secondary font-headline font-extrabold text-2xl italic tracking-tight">TenantPorch</span>
</div>
<h1 class="font-headline text-5xl font-extrabold text-primary tracking-tight leading-[1.1] mb-6">
                    You've been invited to join <span class="text-secondary">Maple Ridge Estates</span> on TenantPorch
                </h1>
<p class="text-on-surface-variant text-lg max-w-lg leading-relaxed">
                    Welcome to your new digital home. Manage your lease, automate rent payments, and request maintenance with Canadian precision.
                </p>
</header>
<!-- Lease Summary Card: Tonal Layering -->
<div class="bg-surface-container-low rounded-xl p-8 max-w-xl relative overflow-hidden">
<!-- Compliance Ribbon -->
<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary"></div>
<div class="flex justify-between items-start mb-8">
<div>
<p class="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Lease Destination</p>
<h3 class="font-headline text-xl font-bold text-primary">8823 West Pender St, Unit 402</h3>
<p class="text-on-surface-variant text-sm">Vancouver, BC V6C 3E8</p>
</div>
<div class="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                        BC
                    </div>
</div>
<div class="grid grid-cols-2 gap-8 mb-8">
<div>
<p class="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Monthly Rent</p>
<div class="flex items-baseline gap-1">
<span class="text-xs font-medium text-on-surface-variant uppercase">CAD</span>
<span class="text-2xl font-bold text-primary">$3,450.00</span>
</div>
</div>
<div>
<p class="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Move-In Date</p>
<p class="text-lg font-semibold text-primary">Oct 15, 2023</p>
</div>
</div>
<div class="pt-6 border-t border-outline-variant/10 flex items-center gap-4">
<div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
<span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">verified_user</span>
</div>
<p class="text-sm text-on-surface-variant leading-snug">
                        Lease agreement has been pre-verified for <span class="font-bold text-primary">BC Residential Tenancy Act</span> compliance.
                    </p>
</div>
</div>
<div class="mt-12 hidden lg:block">
<img class="rounded-xl object-cover h-48 w-full grayscale opacity-40 hover:grayscale-0 transition-all duration-700" data-alt="wide shot of a bright modern living room with large windows overlooking a city skyline at midday soft high-end interior design" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTTr1_koLTeEx3aUxyAeYYGRNP9ssc2dKsLhzHSCXZ-55XS9-IyhOuF80ONV8T4JvOIO6heX59zGlJFrz45rI8FjXMd0Sf_mTU2di1ycOlWBeqRHnOF-2p9818Ru35fDnQJxdQW1Mm02Y639H8ubsFGKsGLcm1LkVO-AFhMg_anL9djYjukuYAQOJtDdEJPejG228BBFNfLPE5QT8Ly53H2hLUWl25dmr4zAc17p26Vdg4X4edYDSZe51zisjzeqEW3x3GTXdx-rQ8"/>
</div>
</section>
<!-- Right Column: Form Center -->
<section class="flex-1 flex items-center">
<div class="w-full max-w-md mx-auto bg-surface-container-lowest p-10 rounded-xl shadow-[0_24px_48px_rgba(4,21,52,0.06)] border border-outline-variant/10">
<div class="mb-8">
<h2 class="font-headline text-2xl font-bold text-primary mb-2">Create your account</h2>
<p class="text-on-surface-variant text-sm">Secure your residence on TenantPorch</p>
</div>
<form class="space-y-5">
<div class="grid grid-cols-2 gap-4">
<div class="space-y-2">
<label class="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">First Name</label>
<input class="w-full bg-surface-container-low border-none ring-1 ring-outline-variant/20 focus:ring-secondary rounded-lg px-4 py-3 text-sm transition-all duration-200 outline-none" placeholder="Julian" type="text"/>
</div>
<div class="space-y-2">
<label class="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Last Name</label>
<input class="w-full bg-surface-container-low border-none ring-1 ring-outline-variant/20 focus:ring-secondary rounded-lg px-4 py-3 text-sm transition-all duration-200 outline-none" placeholder="Vandervall" type="text"/>
</div>
</div>
<div class="space-y-2">
<label class="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
<input class="w-full bg-surface-container-low border-none ring-1 ring-outline-variant/20 focus:ring-secondary rounded-lg px-4 py-3 text-sm transition-all duration-200 outline-none" placeholder="j.vandervall@outlook.com" type="email"/>
</div>
<div class="space-y-2">
<label class="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
<input class="w-full bg-surface-container-low border-none ring-1 ring-outline-variant/20 focus:ring-secondary rounded-lg px-4 py-3 text-sm transition-all duration-200 outline-none" placeholder="••••••••••••" type="password"/>
</div>
<div class="flex items-start gap-3 py-2">
<input class="mt-1 rounded border-outline-variant text-secondary focus:ring-secondary h-4 w-4" type="checkbox"/>
<label class="text-xs text-on-surface-variant leading-relaxed">
                            I agree to the <a class="text-primary font-semibold underline decoration-secondary/30" href="#">Terms of Service</a> and acknowledge the <a class="text-primary font-semibold underline decoration-secondary/30" href="#">Privacy Policy</a> regarding my CAD residency data.
                        </label>
</div>
<button class="w-full bg-primary hover:bg-primary-container text-white font-headline font-bold py-4 rounded-lg transition-all duration-300 shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group">
                        Accept &amp; Join
                        <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
<div class="flex items-center gap-4 py-4">
<div class="flex-1 h-px bg-outline-variant/20"></div>
<span class="text-[10px] font-bold uppercase tracking-widest text-outline">or continue with</span>
<div class="flex-1 h-px bg-outline-variant/20"></div>
</div>
<div class="grid grid-cols-2 gap-4">
<button class="flex items-center justify-center gap-3 py-3 border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-colors text-sm font-medium">
<svg class="w-5 h-5" viewbox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path></svg>
                            Google
                        </button>
<button class="flex items-center justify-center gap-3 py-3 border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-colors text-sm font-medium">
<span class="material-symbols-outlined text-xl">ios</span>
                            Apple
                        </button>
</div>
</form>
<p class="mt-8 text-center text-sm text-on-surface-variant">
                    Already have an account? <a class="text-secondary font-bold hover:underline" href="#">Log in</a>
</p>
</div>
</section>
</main>
<!-- Footer: Editorial Signature -->
<footer class="editorial-asymmetry py-12 border-t border-outline-variant/10">
<div class="flex flex-col md:flex-row justify-between items-center gap-8">
<div class="flex items-center gap-8">
<div class="text-xs font-bold uppercase tracking-widest text-outline">© 2023 TenantPorch Inc.</div>
<div class="h-4 w-px bg-outline-variant/30"></div>
<div class="text-[10px] uppercase tracking-widest text-on-surface-variant">Secure Canadian Data Hosting</div>
</div>
<div class="flex gap-6">
<a class="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
<a class="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Compliance</a>
<a class="text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Help Center</a>
</div>
</div>
</footer>
<!-- Suppressed Nav Shells as per Relevance Check -->
</body></html>
---

## SCREEN: tenant_invite_mobile

<body class="bg-background font-body text-on-surface antialiased min-h-screen flex flex-col items-center justify-start overflow-x-hidden">
<!-- TopNavBar - Rendered as per JSON logic but focused for the sign-up context -->
<nav class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 h-16 sticky top-0 z-50">
<div class="text-xl font-headline font-bold text-blue-950 dark:text-white tracking-tight">TenantPorch</div>
<div class="flex gap-4">
<span class="material-symbols-outlined text-primary" data-icon="help">help</span>
</div>
</nav>
<main class="w-full max-w-[390px] px-6 py-8 flex flex-col gap-8">
<!-- Welcome Header -->
<header class="flex flex-col gap-2">
<h1 class="text-3xl font-headline font-extrabold tracking-tight text-primary">Welcome Home</h1>
<p class="text-on-surface-variant font-body">Skyline Management has invited you to join the portal for your new residence at <span class="font-semibold text-primary">The Pinnacle ON.</span></p>
</header>
<!-- Lease Summary Card - Asymmetric Layout -->
<section class="flex flex-col gap-4">
<div class="flex justify-between items-end">
<span class="font-headline font-bold text-sm tracking-widest text-on-surface-variant uppercase">Lease Summary</span>
<span class="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-label text-[10px] font-bold">ON</span>
</div>
<div class="surface-container-low p-6 rounded-xl flex flex-col gap-6 compliance-ribbon">
<div class="flex flex-col gap-1">
<span class="text-on-surface-variant text-xs font-medium">Monthly Rent</span>
<div class="flex items-baseline gap-1">
<span class="text-secondary text-sm font-label">CAD</span>
<span class="text-2xl font-headline font-extrabold text-primary">$2,450.00</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4">
<div class="flex flex-col gap-1">
<span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Start Date</span>
<span class="font-headline font-semibold text-primary">Nov 01, 2024</span>
</div>
<div class="flex flex-col gap-1">
<span class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Term</span>
<span class="font-headline font-semibold text-primary">12 Months</span>
</div>
</div>
<div class="bg-surface-container-lowest p-4 rounded-lg flex items-center gap-4">
<div class="h-10 w-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
<span class="material-symbols-outlined" data-icon="verified_user">verified_user</span>
</div>
<div>
<p class="text-xs font-headline font-bold text-primary">Compliance Verified</p>
<p class="text-[10px] text-on-surface-variant">Residential Tenancies Act Compliant</p>
</div>
</div>
</div>
</section>
<!-- Signup Form -->
<section class="flex flex-col gap-6">
<h2 class="font-headline font-bold text-lg text-primary">Create your account</h2>
<form class="flex flex-col gap-4">
<div class="flex flex-col gap-1.5">
<label class="text-xs font-label font-bold text-on-surface-variant ml-1">Full Legal Name</label>
<input class="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/20 focus:outline-secondary transition-all font-body" placeholder="As it appears on your ID" type="text"/>
</div>
<div class="flex flex-col gap-1.5">
<label class="text-xs font-label font-bold text-on-surface-variant ml-1">Email Address</label>
<input class="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none outline outline-1 outline-outline-variant/10 text-on-surface-variant font-body cursor-not-allowed" disabled="" type="email" value="j.landry@example.com"/>
</div>
<div class="flex flex-col gap-1.5">
<label class="text-xs font-label font-bold text-on-surface-variant ml-1">Create Password</label>
<div class="relative">
<input class="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/20 focus:outline-secondary transition-all font-body" placeholder="Min. 8 characters" type="password"/>
<span class="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant text-xl" data-icon="visibility">visibility</span>
</div>
</div>
<div class="flex items-start gap-3 mt-2 px-1">
<div class="mt-1">
<input class="rounded-md border-outline-variant/30 text-secondary focus:ring-secondary h-4 w-4" type="checkbox"/>
</div>
<p class="text-[11px] leading-relaxed text-on-surface-variant">
                        I agree to the <a class="text-primary font-bold" href="#">Terms of Service</a> and acknowledge the <a class="text-primary font-bold" href="#">Privacy Policy</a> regarding my Canadian tenancy data.
                    </p>
</div>
</form>
</section>
<!-- CTA Action -->
<section class="flex flex-col gap-4 pt-4 mb-20">
<button class="w-full h-14 bg-primary text-on-primary font-headline font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-95 transition-transform bg-gradient-to-b from-primary to-primary-container">
                Accept &amp; Join
                <span class="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
</button>
<p class="text-center text-xs text-on-surface-variant">
                Powered by <span class="font-bold">TenantPorch</span> Canada
            </p>
</section>
</main>
<!-- Contextual Information Island (Bottom) -->
<div class="fixed bottom-6 left-6 right-6 lg:hidden">
<div class="glass-effect p-4 rounded-2xl shadow-[0_-4px_24px_rgba(4,21,52,0.06)] border border-white/20 flex items-center gap-4">
<img alt="The Pinnacle ON" class="h-12 w-12 rounded-lg object-cover" data-alt="Modern architectural building facade with clean lines, large glass windows, and elegant evening lighting in an urban Canadian setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdL9NV9uDoGnCEUT59NZraelQMpaok-Ha0uEAdh3Wjo56JYWIvdPy5isWRxVhUubeDSzkDaBxdH54Y-fKWaH0vaezHWuh7pWAKsFO4sS7CIYspK5JVzCFGu21edB3fboxLcytlA7gdM3ChFy4nH3OHTYXxQx8CEA2D_YuLAIRHhPprKnyeYfD57vXbXAomZor0BUXV-6TDC08J2WlS8asq-uGaNptiAb686q2rqtEwVNPmM6hwE-kOR39NqN6XFUHoNirxlbK0NxKk"/>
<div class="flex flex-col">
<span class="text-[10px] font-bold text-secondary uppercase tracking-widest">Building Manager</span>
<span class="text-sm font-headline font-bold text-primary">Skyline Management Inc.</span>
</div>
</div>
</div>
</body></html>
---

## SCREEN: tenant_login_desktop

<body class="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center justify-center p-6">
<!-- Brand Header -->
<div class="mb-10 text-center">
<h1 class="font-headline font-extrabold text-3xl tracking-tight text-primary italic">
            TenantPorch <span class="not-italic font-medium text-on-surface-variant text-sm block mt-1 tracking-widest">by TenantPorch</span>
</h1>
</div>
<!-- Login Container -->
<main class="w-full max-w-[480px] space-y-8">
<!-- Primary Auth Card -->
<div class="bg-surface-container-lowest rounded-xl editorial-shadow p-8 md:p-12 transition-all duration-300">
<div class="mb-8">
<h2 class="font-headline font-bold text-2xl text-primary mb-2">Welcome Back</h2>
<p class="text-on-surface-variant text-sm">Access your Canadian property dashboard and manage your lease.</p>
</div>
<form class="space-y-6">
<!-- Email Field -->
<div class="space-y-2">
<label class="block text-sm font-semibold text-primary ml-1" for="email">Email</label>
<div class="relative">
<input class="w-full h-12 px-4 rounded-lg bg-surface-container-low ghost-border text-on-surface placeholder:text-outline/50 font-medium input-active-focus transition-all" id="email" placeholder="name@domain.ca" type="email"/>
</div>
</div>
<!-- Password Field -->
<div class="space-y-2">
<div class="flex justify-between items-center px-1">
<label class="block text-sm font-semibold text-primary" for="password">Password</label>
<a class="text-xs font-semibold text-secondary hover:underline" href="#">Forgot Password</a>
</div>
<div class="relative">
<input class="w-full h-12 px-4 rounded-lg bg-surface-container-low ghost-border text-on-surface placeholder:text-outline/50 font-medium input-active-focus transition-all" id="password" placeholder="••••••••" type="password"/>
</div>
</div>
<!-- Primary Login CTA -->
<button class="w-full h-14 bg-primary text-on-primary font-headline font-bold rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-gradient-to-b from-primary to-primary-container" type="submit">
                    Sign In
                    <span class="material-symbols-outlined text-xl">login</span>
</button>
</form>
<!-- Divider -->
<div class="relative my-8 flex items-center">
<div class="flex-grow border-t border-surface-variant"></div>
<span class="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-outline">or continue with</span>
<div class="flex-grow border-t border-surface-variant"></div>
</div>
<!-- Magic Link Option -->
<button class="w-full h-12 rounded-lg ghost-border bg-white text-primary font-semibold text-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 mb-4">
<span class="material-symbols-outlined text-lg">magic_button</span>
                Send a Magic Link
            </button>
</div>
<!-- Secondary Payment Option (One-Time) -->
<div class="relative overflow-hidden bg-surface-container rounded-xl p-1 ghost-border group">
<div class="bg-surface-container-lowest p-6 rounded-[10px] flex flex-col md:flex-row items-center justify-between gap-4">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">payments</span>
</div>
<div>
<h3 class="font-headline font-bold text-primary text-sm">Need to pay rent quickly?</h3>
<p class="text-on-surface-variant text-xs">No account required for guest payments.</p>
</div>
</div>
<button class="whitespace-nowrap px-6 py-3 bg-secondary text-on-secondary font-headline font-bold text-sm rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all">
                    Pay by Card (Guest)
                </button>
</div>
<!-- Compliance Ribbon Decor -->
<div class="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-full"></div>
</div>
<!-- Footer Links -->
<div class="flex flex-col items-center gap-6 mt-8">
<p class="text-on-surface-variant text-sm">
                Don't have an account? <a class="text-primary font-bold hover:underline" href="#">Contact your landlord</a>
</p>
<div class="flex gap-4 items-center">
<span class="text-[10px] font-bold text-outline-variant uppercase tracking-widest px-2 py-1 bg-surface-container-high rounded-full">ON</span>
<span class="text-[10px] font-bold text-outline-variant uppercase tracking-widest px-2 py-1 bg-surface-container-high rounded-full">AB</span>
<span class="text-[10px] font-bold text-outline-variant uppercase tracking-widest px-2 py-1 bg-surface-container-high rounded-full">BC</span>
<span class="text-[10px] font-bold text-outline-variant uppercase tracking-widest px-2 py-1 bg-surface-container-high rounded-full">QC</span>
</div>
<div class="w-full flex justify-between items-center pt-8 border-t border-surface-variant/30 text-[11px] font-medium text-outline uppercase tracking-wider">
<span>© 2024 TenantPorch Inc.</span>
<div class="flex gap-6">
<a class="hover:text-primary transition-colors" href="#">Privacy</a>
<a class="hover:text-primary transition-colors" href="#">Terms</a>
<a class="hover:text-primary transition-colors" href="#">Support</a>
</div>
</div>
</div>
</main>
<!-- Background Decorative Element (Asymmetric Editorial Style) -->
<div class="fixed top-0 right-0 -z-10 w-1/3 h-full opacity-10 pointer-events-none overflow-hidden">
<div class="absolute top-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-secondary-fixed-dim to-transparent blur-3xl"></div>
</div>
<div class="fixed bottom-0 left-0 -z-10 w-1/4 h-1/2 opacity-5 pointer-events-none overflow-hidden">
<div class="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary blur-3xl"></div>
</div>
</body></html>
---

## SCREEN: tenant_login_mobile

<body class="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center">
<div class="w-[390px] min-h-screen bg-surface-bright flex flex-col relative overflow-hidden">
<!-- Background Editorial Element -->
<div class="absolute -top-24 -right-24 w-64 h-64 bg-secondary-fixed opacity-20 blur-[100px] rounded-full"></div>
<div class="absolute top-1/2 -left-32 w-80 h-80 bg-primary-container opacity-5 blur-[120px] rounded-full"></div>
<!-- Content Canvas -->
<main class="flex-grow flex flex-col px-8 pt-20 pb-12 z-10">
<!-- Logo Section -->
<div class="mb-12">
<div class="flex items-center gap-3 mb-2">
<div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
<span class="material-symbols-outlined text-white text-2xl" data-icon="domain">domain</span>
</div>
<span class="text-2xl font-black text-primary italic tracking-tight">TenantPorch</span>
</div>
<h1 class="text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
                    Welcome back to <br/><span class="text-secondary">your home.</span>
</h1>
<p class="text-on-surface-variant mt-4 font-medium">Canadian Property Management Simplified.</p>
</div>
<!-- Login Form -->
<form class="space-y-6">
<div class="space-y-2">
<label class="text-sm font-semibold text-primary ml-1">Email Address</label>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60" data-icon="mail">mail</span>
<input class="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border-none outline outline-[1px] outline-outline-variant/20 focus:outline-secondary rounded-xl transition-all font-body text-on-surface placeholder:text-on-surface-variant/40" placeholder="name@email.com" type="email"/>
</div>
</div>
<div class="space-y-2">
<div class="flex justify-between items-center px-1">
<label class="text-sm font-semibold text-primary">Password</label>
<a class="text-xs font-bold text-secondary-fixed-dim hover:text-secondary transition-colors" href="#">Forgot?</a>
</div>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60" data-icon="lock">lock</span>
<input class="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border-none outline outline-[1px] outline-outline-variant/20 focus:outline-secondary rounded-xl transition-all font-body text-on-surface placeholder:text-on-surface-variant/40" placeholder="••••••••" type="password"/>
</div>
</div>
<!-- Primary Login Action -->
<button class="w-full h-14 bg-primary text-on-primary font-bold rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-8" type="submit">
<span>Sign In</span>
<span class="material-symbols-outlined text-xl" data-icon="arrow_forward">arrow_forward</span>
</button>
</form>
<!-- Separation Logic (No Borders) -->
<div class="flex items-center gap-4 my-10">
<div class="flex-grow h-[1px] bg-surface-variant"></div>
<span class="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest">or</span>
<div class="flex-grow h-[1px] bg-surface-variant"></div>
</div>
<!-- Alternative Actions -->
<div class="space-y-4">
<button class="w-full h-14 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
<span class="material-symbols-outlined" data-icon="payments">payments</span>
<span>Guest Rent Pay</span>
</button>
<button class="w-full h-14 bg-surface-container-low text-primary font-bold rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
<span class="material-symbols-outlined" data-icon="person_add">person_add</span>
<span>Register Account</span>
</button>
</div>
<!-- Compliance Footer -->
<div class="mt-auto pt-12 text-center space-y-4">
<div class="flex justify-center gap-2">
<span class="px-3 py-1 bg-surface-variant text-[10px] font-bold text-on-surface-variant rounded-full uppercase tracking-tighter">ON</span>
<span class="px-3 py-1 bg-surface-variant text-[10px] font-bold text-on-surface-variant rounded-full uppercase tracking-tighter">BC</span>
<span class="px-3 py-1 bg-surface-variant text-[10px] font-bold text-on-surface-variant rounded-full uppercase tracking-tighter">AB</span>
</div>
<p class="text-[10px] text-on-surface-variant/60 font-medium px-4">
                    TenantPorch complies with Canadian Residential Tenancy Acts &amp; PIPEDA. Securely encrypted.
                </p>
</div>
</main>
<!-- Decorative Image Context (Asymmetric Layout) -->
<div class="w-full h-24 mt-4 overflow-hidden rounded-t-[40px] relative">
<img alt="modern architecture" class="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply" data-alt="Modern minimalist Canadian apartment exterior with large windows and clean architectural lines in soft morning light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbsv3ElXKLFtXxtb5p838ZNeqvzYmxpEefSckfDmw1ZZYNG6EOW79WAIINz8MXi7oCg-rwud26gD3fnl5FZ9mQHgYF1mZSEOVVd8piAi_okicXVQd0WqVqNBpwcIKf-iEcUzEBmRBc-DoySvcohpVfvI8sBUn4qq4roA7z_JWhe2YE1EixVL9JugD6nE6nt4NwK5vq1gAjzr1nUr8CWtCiOStDKvahSkVDuu3dW3Qs3MtaPj4YkxizrFI0RvW_0k_-mH7dwYdWcZZi"/>
<div class="absolute inset-0 bg-gradient-to-t from-surface-bright via-transparent to-transparent"></div>
</div>
</div>
</body></html>
---

## SCREEN: tenant_maintenance_desktop

<body class="bg-surface-bright text-on-surface flex overflow-hidden h-screen">
<!-- SideNavBar (Authority: JSON & Design System) -->
<nav class="bg-blue-950 dark:bg-slate-950 h-screen w-64 hidden lg:flex flex-col left-0 top-0 fixed h-screen gap-2 py-6 shadow-xl shadow-blue-950/20 z-40">
<div class="px-6 mb-8">
<h1 class="text-2xl font-black text-white italic">TenantPorch</h1>
<p class="text-blue-200/50 text-xs font-medium uppercase tracking-widest mt-1">Canadian Property Mgmt</p>
</div>
<div class="flex-1 space-y-1">
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span class="font-manrope font-medium text-sm">Dashboard</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="domain">domain</span>
<span class="font-manrope font-medium text-sm">Properties</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="groups">groups</span>
<span class="font-manrope font-medium text-sm">Tenants</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="payments">payments</span>
<span class="font-manrope font-medium text-sm">Financials</span>
</a>
<!-- Active State Logic: Maintenance Page -->
<a class="bg-blue-900 dark:bg-slate-800 text-white rounded-lg px-4 py-3 mx-2 flex items-center gap-3 translate-x-1 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="handyman">handyman</span>
<span class="font-manrope font-medium text-sm">Maintenance</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span class="font-manrope font-medium text-sm">Documents</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="mail">mail</span>
<span class="font-manrope font-medium text-sm">Messages</span>
</a>
<a class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-manrope font-medium text-sm">Settings</span>
</a>
</div>
<div class="mt-auto px-4">
<button class="w-full bg-secondary text-on-secondary py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 hover:scale-105 transition-transform">
<span class="material-symbols-outlined text-sm" data-icon="add">add</span>
                Add Property
            </button>
</div>
</nav>
<!-- Main Content Canvas -->
<main class="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden">
<!-- Top Nav (Editorial Style) -->
<header class="flex justify-between items-center w-full px-8 py-4 h-16 bg-slate-50/80 backdrop-blur-xl z-30">
<h2 class="text-xl font-manrope font-extrabold text-blue-950 tracking-tight">Maintenance Hub</h2>
<div class="flex items-center gap-6">
<button class="text-blue-800/60 hover:text-amber-600 transition-colors">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<div class="flex items-center gap-3 pl-6 border-l border-outline-variant/20">
<div class="text-right">
<p class="text-sm font-bold text-primary">Marcus Thorne</p>
<p class="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase">Unit 402 • The Birchwood</p>
</div>
<img alt="User avatar" class="w-10 h-10 rounded-full object-cover ring-2 ring-surface-container-low" data-alt="Close-up headshot of a professional man in his 30s with a friendly expression, studio lighting, clean background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB50BPbyWWFAKeuQ1Q_S9d4-nc6s29xsmUWNFSXVMoDRM7jlygpcq1RfuSTwVVypmXdm9iu1mWjif_afCZSP4iEOmVyaD6wTzpyt5WGRMz8DnboJEgl7q7FxGjo9caKoYKIaGhbTPIUO70sRMYwMcggyYIu-_mSRq6XN9piRWnLQNGkzv9dh3GEZSAdNz4qGw90C5ph9zZZ7o6vZp8Mw_AJTihX27AjLKzt0jEXpeFEUPzZMVoxcejrQh6k1HuXskHwzsidDBzhABUO"/>
</div>
</div>
</header>
<div class="flex-1 flex overflow-hidden">
<!-- Sidebar: Active Requests -->
<aside class="w-96 bg-surface-container-low border-r border-outline-variant/10 flex flex-col">
<div class="p-6">
<div class="flex justify-between items-center mb-6">
<h3 class="text-lg font-bold text-primary">Requests</h3>
<button class="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-sm" data-icon="add_circle">add_circle</span>
                            New Request
                        </button>
</div>
<div class="space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-2 scrollbar-hide">
<!-- Card: Active -->
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm border-l-4 border-secondary ring-1 ring-black/5">
<div class="flex justify-between items-start mb-2">
<span class="bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">In Progress</span>
<p class="text-xs text-on-surface-variant">2h ago</p>
</div>
<h4 class="font-bold text-primary text-sm mb-1">Leaking Kitchen Faucet</h4>
<p class="text-xs text-on-surface-variant line-clamp-2 mb-3">The main tap in the kitchen is dripping constantly, causing water to pool...</p>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-xs text-secondary" data-icon="priority_high" style="font-variation-settings: 'FILL' 1;">priority_high</span>
<span class="text-[10px] font-bold text-secondary uppercase">Urgent</span>
</div>
</div>
<!-- Card: Inactive -->
<div class="bg-surface-container-lowest/50 p-4 rounded-xl border border-transparent hover:border-outline-variant/30 transition-all cursor-pointer">
<div class="flex justify-between items-start mb-2">
<span class="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">New</span>
<p class="text-xs text-on-surface-variant">Yesterday</p>
</div>
<h4 class="font-bold text-primary/80 text-sm mb-1">Bedroom Blinds Stuck</h4>
<p class="text-xs text-on-surface-variant line-clamp-2">The pulley mechanism on the south-facing bedroom window is jammed.</p>
</div>
<!-- Card: Resolved -->
<div class="bg-surface-container-lowest/30 p-4 rounded-xl border border-transparent opacity-60">
<div class="flex justify-between items-start mb-2">
<span class="bg-tertiary text-on-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Resolved</span>
<p class="text-xs text-on-surface-variant">3 days ago</p>
</div>
<h4 class="font-bold text-primary/80 text-sm mb-1">AC Filter Replacement</h4>
<p class="text-xs text-on-surface-variant line-clamp-2">Regular maintenance for unit 402 central air system.</p>
</div>
</div>
</div>
</aside>
<!-- Main Content: Detail View -->
<section class="flex-1 bg-surface-bright flex flex-col relative overflow-hidden">
<!-- Header of Detail -->
<div class="p-8 border-b border-outline-variant/10 flex justify-between items-end">
<div>
<div class="flex items-center gap-3 mb-2">
<span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Case #REQ-9921</span>
<span class="w-1 h-1 bg-outline-variant rounded-full"></span>
<span class="text-xs font-medium text-on-surface-variant">The Birchwood, Unit 402</span>
</div>
<h2 class="text-3xl font-black text-primary tracking-tight">Leaking Kitchen Faucet</h2>
</div>
<div class="flex gap-3">
<button class="bg-surface-container-low text-primary px-4 py-2 rounded-lg text-sm font-bold border border-outline-variant/20">Mark as Resolved</button>
<button class="bg-error-container text-on-error-container px-4 py-2 rounded-lg text-sm font-bold">Escalate</button>
</div>
</div>
<div class="flex-1 flex overflow-hidden">
<!-- Thread & Gallery Content -->
<div class="flex-1 flex flex-col p-8 overflow-y-auto scrollbar-hide gap-8">
<!-- Timeline/Status Ribbon -->
<div class="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-white ring-2 ring-surface-bright">
<span class="material-symbols-outlined text-xs" data-icon="check" style="font-variation-settings: 'FILL' 1;">check</span>
</div>
<div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white ring-2 ring-surface-bright">
<span class="material-symbols-outlined text-xs" data-icon="sync" style="font-variation-settings: 'FILL' 1;">sync</span>
</div>
<div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant ring-2 ring-surface-bright">
<span class="material-symbols-outlined text-xs" data-icon="calendar_today">calendar_today</span>
</div>
</div>
<div class="flex-1">
<p class="text-sm font-bold text-primary">In Progress</p>
<p class="text-xs text-on-surface-variant italic">Plumber dispatched. Expected arrival: Today, 2:00 PM - 4:00 PM EST</p>
</div>
</div>
<!-- Chat Style Messages -->
<div class="space-y-6">
<!-- Tenant Message -->
<div class="flex gap-4 max-w-2xl">
<img class="w-8 h-8 rounded-full object-cover self-end" data-alt="Tenant profile photo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIRniRlycnyVV-y-0jffWkWB0jgf3DFO_YA9g37trMz7xrN0S6nB7SL5pdXMPhwYlseJJg3HRrzI_ubFW5GzQJUb5ctKReOlpLMWxycDzDRrE_kwUjWEmdfxDAEAA6wJCAV-Wf30k5L8ibz1Ge_tWOsrB_MQh74uddd_DAchKlbm_EZe18HUFi0KgE1kuOR_fvhCuHVvWL21SHOPLC4gUIREXO51Q-DrQYw4HXYO8H3MqQgEH72Qe_FYfIvOB2K-gDohpzcrR7nFEZ"/>
<div class="bg-surface-container-low p-5 rounded-2xl rounded-bl-none">
<p class="text-sm text-on-surface leading-relaxed">
                                        Hello, the kitchen faucet started leaking significantly this morning. I've placed a bucket under it for now, but it's quite a heavy drip.
                                    </p>
<div class="mt-4 grid grid-cols-2 gap-2">
<div class="aspect-square bg-slate-200 rounded-lg overflow-hidden group relative">
<img class="w-full h-full object-cover" data-alt="Close up of a modern chrome kitchen faucet with water droplets, soft kitchen interior lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSATyzUrpzH4QKyfnwFxtRJ3Gx_ETb2w_M_VSWqg1pb-YoeNB9tIeY_nxC0a_imNOl0UHjjc7tOu73T694H8uy3zpFtYw-Zchm_vUGtH6jLEqNNM2tVBqOo5vxC-Shpv-FYgJquW4FxPaXpY6Ozfo8uSkiYfXutMg0Jam5urNE5-28AjNmN23wMCC0gXIHQgLyyj0HqpxOFrLy-XiGUnDmXQCltl3myI5Zeq8-al4epczrm74GDTYDNS_3kLUx2yqdyS3DuXRsGIU9"/>
<div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
<span class="material-symbols-outlined text-white" data-icon="zoom_in">zoom_in</span>
</div>
</div>
<div class="aspect-square bg-slate-200 rounded-lg overflow-hidden group relative">
<img class="w-full h-full object-cover" data-alt="Dripping tap in a kitchen, macro photography focusing on the water drop" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBojyD1gUnhY-Pu2PSNQPHWp0zKaUn2DCPJFxHrYIZEayyGMRc06CULDGZnoN7ywpoO77MuKSJLgH9Z_2EbB3Firo_6eH9ILolwSpiUJBPN5MI9y443P1pwLtiwFLYT2tW5jVfHJUYEEWBrXTSknYEZrGlv82JCOXCb5xNbmn5PmnHiACfFr4brJ-EqaDYiwkqln_OnYjUmfSkw3KcxveGGoVe8L3ciUgmyg4LOPH2D1Z0GMwLG8bwNlMqfpyGcsWNSRzgzGchUEumL"/>
<div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
<span class="material-symbols-outlined text-white" data-icon="zoom_in">zoom_in</span>
</div>
</div>
</div>
<p class="text-[10px] text-on-surface-variant mt-3 font-bold uppercase">Today, 08:12 AM</p>
</div>
</div>
<!-- Manager Message -->
<div class="flex gap-4 max-w-2xl ml-auto flex-row-reverse">
<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white self-end">
<span class="material-symbols-outlined text-xs" data-icon="support_agent">support_agent</span>
</div>
<div class="bg-primary text-on-primary p-5 rounded-2xl rounded-br-none shadow-lg shadow-primary/10">
<p class="text-sm leading-relaxed">
                                        Hi Marcus, thanks for the photos. I've contacted 'Swift Plumbing'. They'll be at Unit 402 between 2 PM and 4 PM today. Please ensure someone is there or provide access instructions.
                                    </p>
<p class="text-[10px] text-white/60 mt-3 font-bold uppercase">Today, 09:45 AM</p>
</div>
</div>
</div>
</div>
<!-- Right Column: Compliance & Metadata -->
<aside class="w-80 border-l border-outline-variant/10 p-8 flex flex-col gap-8 bg-surface-container-low/30">
<div>
<h4 class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Request Info</h4>
<div class="space-y-4">
<div>
<p class="text-xs text-on-surface-variant mb-1">Category</p>
<p class="text-sm font-bold text-primary">Plumbing</p>
</div>
<div>
<p class="text-xs text-on-surface-variant mb-1">Urgency</p>
<div class="flex items-center gap-2 text-secondary">
<span class="material-symbols-outlined text-sm" data-icon="priority_high" style="font-variation-settings: 'FILL' 1;">priority_high</span>
<p class="text-sm font-bold">Urgent</p>
</div>
</div>
<div>
<p class="text-xs text-on-surface-variant mb-1">Province Compliance</p>
<span class="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">ON - RTA Section 20</span>
</div>
</div>
</div>
<div class="pt-8 border-t border-outline-variant/10">
<h4 class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Assigned Vendor</h4>
<div class="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
<p class="text-sm font-bold text-primary">Swift Plumbing Ltd.</p>
<p class="text-xs text-on-surface-variant mb-3">Service ID: #4401-SP</p>
<button class="w-full text-secondary text-xs font-bold border border-secondary/20 py-2 rounded-lg hover:bg-secondary-fixed transition-colors">Call Vendor</button>
</div>
</div>
</aside>
</div>
<!-- Input Zone -->
<div class="p-6 bg-surface-container-lowest border-t border-outline-variant/10">
<div class="max-w-4xl mx-auto relative">
<textarea class="w-full bg-surface-container-low border-none rounded-2xl p-4 pr-16 text-sm focus:ring-2 focus:ring-secondary/50 min-h-[50px] resize-none overflow-hidden" placeholder="Type a message or update..."></textarea>
<div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
<button class="text-on-surface-variant hover:text-primary p-2">
<span class="material-symbols-outlined" data-icon="attach_file">attach_file</span>
</button>
<button class="bg-secondary text-on-secondary p-2 rounded-xl shadow-md hover:scale-105 transition-transform">
<span class="material-symbols-outlined" data-icon="send" style="font-variation-settings: 'FILL' 1;">send</span>
</button>
</div>
</div>
</div>
</section>
</div>
</main>
<!-- Modal Overlay (New Request Form Mockup) - Hidden by default but structured -->
<div class="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[60] flex items-center justify-center hidden">
<div class="bg-surface-bright w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
<div class="p-8 border-b border-outline-variant/10 flex justify-between items-center">
<h3 class="text-2xl font-black text-primary">New Maintenance Request</h3>
<button class="p-2 hover:bg-surface-container-low rounded-full">
<span class="material-symbols-outlined" data-icon="close">close</span>
</button>
</div>
<form class="p-8 space-y-6">

---

## SCREEN: tenant_maintenance_mobile

<body class="bg-surface text-on-surface min-h-screen pb-24">
<!-- Top Navigation Anchor -->
<nav class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl fixed top-0 z-50 flex justify-between items-center w-full px-6 py-4 h-16">
<div class="text-xl font-manrope font-bold text-blue-950 dark:text-white tracking-tight">TenantPorch</div>
<div class="flex gap-4 items-center">
<span class="material-symbols-outlined text-on-surface-variant cursor-pointer" data-icon="notifications">notifications</span>
<div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden">
<img alt="User avatar" class="w-full h-full object-cover" data-alt="professional headshot of a smiling man with clean background for user profile avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBryEYVrbQmuYoPhwafkrOOA3LIO_h5syvsPokFnwvYnr56FHappmHNYMBUyU5NhlFQE1H6rCkDC2QVG5FyxeHzLz0yHfF9OnAwj3mUM0w48W7UGvHIYv4FigDrp3RxiWjTBmwCArtePTgbLQiqdTY0ZZMbkPvQQxvzOH13jDvTlNcgC0xu4BxElQFps181K9s859Cw_eLashf64gUv-VdnQBSwLB4zXpZJ63j9Uk_LflkCCzqe5LEzJAV9Gzo3GblZdjXRHXWADJgr"/>
</div>
</div>
</nav>
<!-- Main Canvas -->
<main class="pt-20 px-5 space-y-6">
<!-- Header & Stats -->
<header class="space-y-1">
<h1 class="text-3xl font-headline font-extrabold text-primary tracking-tight">Maintenance</h1>
<p class="text-on-surface-variant text-sm font-body">Manage your requests for 428 Bay St.</p>
</header>
<!-- Status Filter - Asymmetric Layout -->
<div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
<button class="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold whitespace-nowrap shadow-sm">All Requests</button>
<button class="px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-medium whitespace-nowrap">Active (2)</button>
<button class="px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-medium whitespace-nowrap">Completed</button>
</div>
<!-- Compliance Ledger Style List -->
<div class="space-y-4">
<!-- Active Request Card -->
<div class="bg-surface-container-lowest rounded-xl overflow-hidden relative border-l-4 border-secondary flex flex-col transition-all active:scale-95 duration-150">
<div class="p-5">
<div class="flex justify-between items-start mb-3">
<span class="text-xs font-bold font-label uppercase tracking-widest text-secondary">In Progress</span>
<span class="text-xs text-on-surface-variant font-medium">May 12, 2024</span>
</div>
<h3 class="text-lg font-headline font-bold text-primary mb-1">Leaking Kitchen Faucet</h3>
<p class="text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">The faucet in the main kitchen has a steady drip that is increasing in volume. Water pooling under the sink.</p>
<div class="flex items-center gap-3 pt-4 border-t border-surface-container">
<div class="flex -space-x-2">
<div class="w-6 h-6 rounded-full border-2 border-surface-container-lowest overflow-hidden">
<img alt="Plumber" class="w-full h-full object-cover" data-alt="professional plumber in uniform working on pipes" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvF_1pWmLcJ-WcAq3xuH8LADJWzTxwiIuSn4Zotz1YoulP6zj2g0pHwP1yKnWjOcNA2bE5aW8Jcn96fYyF-vJ_98bgDeDF8bz22vJI1UjlcT_1n4wsC3kgHA4ppS5wYafiUR2wnkS38weaQxxjHB-5iuz-0-DOrVUl0AuCkqv2XdPKX5vHM49prJDqfuwv0i5SRKoRxyJoNphL9L8g3mVlOidCtlL92pH8PUpsR5CCzo94KL2I1odejOKh1kAaWAljjxpgjGBRSoMh"/>
</div>
</div>
<span class="text-xs font-medium text-on-surface">Alex (Pro-Plumbing) assigned</span>
</div>
</div>
</div>
<!-- Urgent/Action Card -->
<div class="bg-surface-container-lowest rounded-xl overflow-hidden relative border-l-4 border-error flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
<div class="p-5">
<div class="flex justify-between items-start mb-3">
<span class="px-2 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-bold uppercase">Urgent</span>
<span class="text-xs text-on-surface-variant font-medium">Today, 9:15 AM</span>
</div>
<h3 class="text-lg font-headline font-bold text-primary mb-1">Heating Outage</h3>
<p class="text-sm text-on-surface-variant leading-relaxed">Central heating is not engaging despite thermostat settings. Unit temperature is 16°C.</p>
<div class="mt-4 bg-surface-container-low p-3 rounded-lg flex items-start gap-3">
<span class="material-symbols-outlined text-error text-xl" data-icon="forum">forum</span>
<div>
<p class="text-xs font-bold text-primary">Landlord Message:</p>
<p class="text-xs text-on-surface-variant mt-0.5">Technician is en route, ETA 11:30 AM. Please ensure entry path is clear.</p>
</div>
</div>
</div>
</div>
<!-- Completed Card -->
<div class="bg-surface-container-low/50 rounded-xl overflow-hidden relative border-l-4 border-tertiary-fixed-dim opacity-75">
<div class="p-5 text-on-surface-variant">
<div class="flex justify-between items-start mb-3">
<span class="text-xs font-bold font-label uppercase tracking-widest text-on-tertiary-container">Resolved</span>
<span class="text-xs font-medium">Apr 28, 2024</span>
</div>
<h3 class="text-base font-headline font-semibold mb-1">Loose Balcony Railing</h3>
<p class="text-xs line-clamp-1">Corner post on the West balcony was wobbly...</p>
</div>
</div>
</div>
<!-- Conversation Details Section (Simplified inline for mobile flow) -->
<section class="mt-10 space-y-6 pb-8">
<div class="flex items-center justify-between">
<h2 class="text-xl font-headline font-bold text-primary">Active Discussion</h2>
<button class="text-secondary text-sm font-semibold">View History</button>
</div>
<div class="bg-surface-container-low p-4 rounded-2xl space-y-4">
<!-- User Message -->
<div class="flex flex-col items-end space-y-1">
<div class="bg-primary text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed">
                        Hi, I noticed the water pressure has also dropped since the leak started.
                    </div>
<span class="text-[10px] text-on-surface-variant mr-1">Sent 10:45 AM</span>
</div>
<!-- Assigned Pro Message -->
<div class="flex flex-col items-start space-y-1">
<div class="flex items-center gap-2 mb-1">
<img alt="Tech" class="w-5 h-5 rounded-full object-cover" data-alt="close up of a professional maintenance technician portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe_0IaZa0evDq0zElwrsAmmt4Xod6T5uh2T9tCET34T43URRux6xjTD-Lf6n7mgtTz3640JdEQCan5mZwL56Y4CMMp-ENxJJERbMyyibH-XWIeJmFS3Xc3VjaitWL8MduoHHgGRBWReJefNwIvT6FjWnSNTJd3HFzyj2Uwqw-z4M9ARYEHWXdsw-uHwtadz4-Me2EmkvLnQYodpVCqs1NbvbIUJofTM4diVUkmadGQiBGj2umSAltdOOhTZaOx_ZrAFyI8zKg5-ldT"/>
<span class="text-[10px] font-bold text-primary">Alex (Tech)</span>
</div>
<div class="bg-white text-on-surface p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-relaxed shadow-sm">
                        Thanks for the heads up. I'll check the main shut-off valve when I arrive. Should be there in 20 mins.
                    </div>
<span class="text-[10px] text-on-surface-variant ml-1">Received 10:48 AM</span>
</div>
</div>
</section>
</main>
<!-- FAB: Floating Bottom Sheet Trigger -->
<div class="fixed bottom-24 right-6 z-40">
<button class="w-14 h-14 bg-secondary rounded-full flex items-center justify-center text-white shadow-[0_12px_30px_rgba(123,88,4,0.3)] active:scale-95 transition-transform duration-200">
<span class="material-symbols-outlined text-3xl" data-icon="add">add</span>
</button>
</div>
<!-- Simulated Bottom Sheet (New Request Form) - Fixed at Bottom but Peek -->
<div class="fixed inset-x-0 bottom-0 z-[60] transform translate-y-[85%] bg-surface-container-lowest rounded-t-[32px] shadow-[0_-10px_40px_rgba(4,21,52,0.12)] border-t border-outline-variant/10 px-6 pt-2 pb-10 transition-transform duration-500 ease-in-out">
<div class="w-12 h-1.5 bg-surface-variant rounded-full mx-auto mb-8"></div>
<div class="flex justify-between items-center mb-6">
<h2 class="text-2xl font-headline font-extrabold text-primary">New Request</h2>
<button class="p-2 bg-surface-container rounded-full text-on-surface-variant">
<span class="material-symbols-outlined text-sm" data-icon="close">close</span>
</button>
</div>
<form class="space-y-6">
<div class="space-y-2">
<label class="text-xs font-bold text-primary uppercase tracking-wider ml-1">Category</label>
<div class="grid grid-cols-2 gap-3">
<button class="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-container-low border border-transparent hover:border-secondary transition-all group" type="button">
<span class="material-symbols-outlined text-secondary mb-2" data-icon="plumbing">plumbing</span>
<span class="text-xs font-semibold text-primary">Plumbing</span>
</button>
<button class="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-container-low border border-transparent hover:border-secondary transition-all" type="button">
<span class="material-symbols-outlined text-secondary mb-2" data-icon="bolt">bolt</span>
<span class="text-xs font-semibold text-primary">Electrical</span>
</button>
</div>
</div>
<div class="space-y-2">
<label class="text-xs font-bold text-primary uppercase tracking-wider ml-1">Description</label>
<textarea class="w-full rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary/50 placeholder:text-on-surface-variant/40 text-sm py-4 px-4" placeholder="Describe what's wrong..." rows="3"></textarea>
</div>
<div class="space-y-2">
<label class="text-xs font-bold text-primary uppercase tracking-wider ml-1">Upload Photo</label>
<div class="w-full h-32 rounded-xl bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-on-surface-variant/60">
<span class="material-symbols-outlined text-3xl mb-1" data-icon="add_a_photo">add_a_photo</span>
<span class="text-[10px] font-medium">Tap to capture issue</span>
</div>
</div>
<button class="w-full bg-secondary text-white font-headline font-bold py-4 rounded-xl shadow-lg shadow-secondary/20 flex items-center justify-center gap-2">
                Submit Request
                <span class="material-symbols-outlined text-sm" data-icon="send">send</span>
</button>
</form>
</div>
<!-- Bottom Navigation Bar -->
<nav class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl fixed bottom-0 w-full rounded-t-2xl z-50 border-t border-slate-200/10 shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</a>
<!-- ACTIVE TAB -->
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Maintenance</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400" href="#">
<span class="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</a>
</nav>
</body></html>
---

## SCREEN: tenant_payments_desktop

<body class="bg-surface font-body text-on-surface antialiased">
<!-- Layout Wrapper -->
<div class="flex min-h-screen">
<!-- SideNavBar (Execution from JSON) -->
<aside class="h-screen w-64 hidden lg:flex flex-col left-0 top-0 fixed bg-primary dark:bg-slate-950 shadow-xl shadow-blue-950/20 z-50 py-6">
<div class="px-6 mb-10">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
<span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">domain</span>
</div>
<div>
<h1 class="text-2xl font-black text-white italic tracking-tight">TenantPorch</h1>
<p class="text-[10px] text-blue-200/50 uppercase tracking-widest font-bold">Canadian Property Mgmt</p>
</div>
</div>
</div>
<nav class="flex-1 space-y-1">
<!-- Dashboard -->
<a class="flex items-center gap-3 text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span class="font-headline font-medium text-sm">Dashboard</span>
</a>
<!-- Properties -->
<a class="flex items-center gap-3 text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="domain">domain</span>
<span class="font-headline font-medium text-sm">Properties</span>
</a>
<!-- Financials (ACTIVE) -->
<a class="flex items-center gap-3 bg-blue-900 dark:bg-slate-800 text-white rounded-lg px-4 py-3 mx-2 translate-x-1 duration-150 shadow-lg shadow-black/20" href="#">
<span class="material-symbols-outlined" data-icon="payments" style="font-variation-settings: 'FILL' 1;">payments</span>
<span class="font-headline font-medium text-sm">Financials</span>
</a>
<!-- Maintenance -->
<a class="flex items-center gap-3 text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="handyman">handyman</span>
<span class="font-headline font-medium text-sm">Maintenance</span>
</a>
<!-- Messages -->
<a class="flex items-center gap-3 text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="mail">mail</span>
<span class="font-headline font-medium text-sm">Messages</span>
</a>
<!-- Settings -->
<a class="flex items-center gap-3 text-blue-200/70 hover:text-white px-4 py-3 mx-2 transition-all hover:bg-blue-900/50" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-headline font-medium text-sm">Settings</span>
</a>
</nav>
<div class="px-4 mt-auto">
<button class="w-full bg-secondary py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 hover:opacity-90 transition-all">
<span class="material-symbols-outlined">add_circle</span>
<span class="text-sm">Collect Rent</span>
</button>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="flex-1 ml-0 lg:ml-64 transition-all duration-300">
<!-- TopAppBar -->
<header class="flex justify-between items-center w-full px-8 py-4 h-20 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-xl">
<div class="flex flex-col">
<h2 class="text-2xl font-headline font-extrabold text-primary tracking-tight">Financial Overview</h2>
<p class="text-sm text-on-surface-variant font-medium">Account: #TP-88291 • Toronto, ON</p>
</div>
<div class="flex items-center gap-4">
<div class="flex gap-2 mr-4">
<button class="p-2 text-on-surface-variant hover:text-secondary transition-colors"><span class="material-symbols-outlined">notifications</span></button>
<button class="p-2 text-on-surface-variant hover:text-secondary transition-colors"><span class="material-symbols-outlined">help_outline</span></button>
</div>
<div class="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
<img alt="User avatar" class="w-10 h-10 rounded-full object-cover" data-alt="Close-up professional portrait of a smiling man in a business suit with soft natural office lighting background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDw4c_SCBRQ0EstX5Asb4UVzjZoKTTKz-vuCws6ERTq9hK8yEcvLZbX-d072U3e5lidpYEmz_YAvCTGy6127gqYMJ4Wc_mqNBhFpmN2usbLE5dUp-Ycfj5XzK6-5mR3eIlK4H2xXFKJ33W6a5wtGsoWYsu_pRq--nz1QManr3OJO-3FTGEklMUYWyPBN3FLGGfnaHYW5h9F3Abt5qDYwarHZJ_EpaXXz_IWxJlNv6lvx7BFDdaPbJ3KP-1HWJMcD9hO-biQfvWMwR2m"/>
<div class="hidden sm:block">
<p class="text-sm font-bold text-primary">Marcus Thompson</p>
<p class="text-xs text-on-surface-variant">Premium Tenant</p>
</div>
</div>
</div>
</header>
<!-- Page Content -->
<div class="px-8 pb-20 pt-4">
<!-- Bento Grid Layout -->
<div class="grid grid-cols-12 gap-6">
<!-- Balance Summary Card -->
<div class="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col justify-between border-l-4 border-secondary">
<div>
<span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Current Balance</span>
<div class="flex items-baseline gap-1 mt-2">
<span class="text-sm font-bold text-secondary">CAD</span>
<h3 class="text-4xl font-headline font-black text-primary tracking-tighter">$2,450.00</h3>
</div>
<p class="text-xs text-on-surface-variant mt-1">Due Date: October 1st, 2023</p>
</div>
<!-- Simple Mini Chart Placeholder -->
<div class="mt-8 h-20 w-full flex items-end gap-1">
<div class="flex-1 bg-surface-container-high h-12 rounded-t-sm"></div>
<div class="flex-1 bg-surface-container-high h-16 rounded-t-sm"></div>
<div class="flex-1 bg-surface-container-high h-10 rounded-t-sm"></div>
<div class="flex-1 bg-secondary h-20 rounded-t-sm"></div>
<div class="flex-1 bg-primary-container h-14 rounded-t-sm"></div>
<div class="flex-1 bg-surface-container-high h-18 rounded-t-sm"></div>
</div>
<div class="mt-4 flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase">
<span>Apr</span>
<span>May</span>
<span>Jun</span>
<span class="text-secondary">Jul</span>
<span>Aug</span>
<span>Sep</span>
</div>
</div>
<!-- Payment Execution Section -->
<div class="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
<div class="flex items-center justify-between mb-8">
<h4 class="text-xl font-headline font-bold text-primary">Pay Rent</h4>
<span class="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[10px] font-bold uppercase tracking-wider">Secure Payment</span>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-10">
<!-- Left: Form -->
<div class="space-y-6">
<div>
<label class="block text-xs font-bold text-on-surface-variant uppercase mb-2">Payment Amount</label>
<div class="relative">
<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
<span class="text-on-surface-variant font-bold">CAD $</span>
</div>
<input class="w-full pl-16 pr-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-lg font-headline font-bold text-primary focus:ring-secondary focus:border-secondary transition-all" type="text" value="2,450.00"/>
</div>
</div>
<div>
<label class="block text-xs font-bold text-on-surface-variant uppercase mb-3">Select Method</label>
<div class="space-y-3">
<label class="flex items-center justify-between p-4 bg-surface-bright border-2 border-secondary rounded-xl cursor-pointer">
<div class="flex items-center gap-3">
<input checked="" class="text-secondary focus:ring-secondary" name="method" type="radio"/>
<div class="flex flex-col">
<span class="text-sm font-bold text-primary">Interac E-transfer</span>
<span class="text-[10px] text-tertiary-fixed-dim uppercase font-bold">No Surcharge</span>
</div>
</div>
<span class="material-symbols-outlined text-secondary">check_circle</span>
</label>
<label class="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl cursor-pointer hover:bg-surface-variant/30 transition-all">
<div class="flex items-center gap-3">
<input class="text-secondary focus:ring-secondary" name="method" type="radio"/>
<div class="flex flex-col">
<span class="text-sm font-bold text-primary">Credit Card</span>
<span class="text-[10px] text-on-surface-variant font-medium">+4% Processing Fee</span>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant">payments</span>
</label>
<label class="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl cursor-pointer hover:bg-surface-variant/30 transition-all">
<div class="flex items-center gap-3">
<input class="text-secondary focus:ring-secondary" name="method" type="radio"/>
<div class="flex flex-col">
<span class="text-sm font-bold text-primary">Debit Card</span>
<span class="text-[10px] text-on-surface-variant font-medium">+4% Processing Fee</span>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant">credit_card</span>
</label>
</div>
</div>
</div>
<!-- Right: Live Summary -->
<div class="bg-primary text-white rounded-2xl p-8 flex flex-col justify-between shadow-2xl shadow-primary/20 relative overflow-hidden">
<!-- Background Texture -->
<div class="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
<div class="space-y-4 relative z-10">
<h5 class="text-sm font-bold text-blue-200/50 uppercase tracking-widest">Order Summary</h5>
<div class="flex justify-between items-center py-2">
<span class="text-blue-100/70 text-sm">Rent Amount</span>
<span class="font-bold">CAD $2,450.00</span>
</div>
<div class="flex justify-between items-center py-2 border-t border-white/10">
<span class="text-blue-100/70 text-sm">Surcharge (0%)</span>
<span class="font-bold">CAD $0.00</span>
</div>
<div class="flex justify-between items-center py-4 border-t border-white/20 mt-4">
<span class="text-white font-black text-lg">Total</span>
<span class="text-2xl font-black text-secondary">CAD $2,450.00</span>
</div>
</div>
<button class="w-full bg-secondary-fixed text-on-secondary-fixed py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all mt-8 relative z-10 shadow-lg shadow-black/40">
                                    Process Payment
                                </button>
<p class="text-[10px] text-center text-blue-200/40 mt-4 font-medium italic">Payments are protected by 256-bit SSL encryption</p>
</div>
</div>
</div>
<!-- Transaction History (Compliance Ledger) -->
<div class="col-span-12">
<div class="flex items-center justify-between mb-6 px-2">
<h4 class="text-2xl font-headline font-extrabold text-primary tracking-tight">Transaction History</h4>
<div class="flex gap-2">
<button class="px-4 py-2 bg-surface-container-low text-primary text-xs font-bold rounded-lg border border-outline-variant/10 hover:bg-surface-container-high transition-colors">Export CSV</button>
<button class="px-4 py-2 bg-surface-container-low text-primary text-xs font-bold rounded-lg border border-outline-variant/10 hover:bg-surface-container-high transition-colors">Filter Range</button>
</div>
</div>
<div class="overflow-hidden rounded-2xl bg-surface-container-low shadow-sm">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-high">
<th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Date</th>
<th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Description</th>
<th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Amount</th>
<th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">Status</th>
<th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Receipt</th>
</tr>
</thead>
<tbody class="bg-surface-container-lowest">
<!-- Row 1 -->
<tr class="hover:bg-surface-bright transition-colors group">
<td class="px-6 py-5 whitespace-nowrap compliance-ledger-border">
<p class="text-sm font-bold text-primary">Sep 01, 2023</p>
<p class="text-[10px] text-on-surface-variant">10:45 AM EST</p>
</td>
<td class="px-6 py-5">
<p class="text-sm font-medium text-primary">September Rent - Suite 402</p>
</td>
<td class="px-6 py-5">
<span class="text-sm font-bold text-primary">CAD $2,450.00</span>
</td>
<td class="px-6 py-5 text-center">
<span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-tertiary-fixed/30 text-on-tertiary-fixed-variant uppercase">Completed</span>
</td>
<td class="px-6 py-5 text-right">
<button class="text-primary hover:text-secondary transition-colors group-hover:scale-110 duration-200">
<span class="material-symbols-outlined">download</span>
</button>
</td>
</tr>
<!-- Row 2 -->
<tr class="hover:bg-surface-bright transition-colors group">
<td class="px-6 py-5 whitespace-nowrap compliance-ledger-border">
<p class="text-sm font-bold text-primary">Aug 01, 2023</p>
<p class="text-[10px] text-on-surface-variant">09:12 AM EST</p>
</td>
<td class="px-6 py-5">
<p class="text-sm font-medium text-primary">August Rent - Suite 402</p>
</td>
<td class="px-6 py-5">
<span class="text-sm font-bold text-primary">CAD $2,450.00</span>
</td>
<td class="px-6 py-5 text-center">
<span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-tertiary-fixed/30 text-on-tertiary-fixed-variant uppercase">Completed</span>
</td>
<td class="px-6 py-5 text-right">
<button class="text-primary hover:text-secondary transition-colors group-hover:scale-110 duration-200">
<span class="material-symbols-outlined">download</span>
</button>

---

## SCREEN: tenant_payments_mobile

<body class="bg-surface-bright text-on-surface min-h-screen pb-40">
<!-- Top Navigation Bar -->
<nav class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl fixed top-0 z-50 w-full px-6 py-4 h-16 flex justify-between items-center bg-gradient-to-b from-slate-100 to-transparent dark:from-slate-900">
<span class="text-xl font-manrope font-bold text-blue-950 dark:text-white tracking-tight">TenantPorch</span>
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-blue-900 dark:text-blue-100">notifications</span>
<div class="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
<img alt="User avatar" class="w-full h-full object-cover" data-alt="professional headshot of a smiling young adult renter in a minimalist apartment soft natural lighting high quality" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQu5l22kDsfaHBxeUqFbV4D8up5hVDW5yWflCDplRvYrcRxXFfYsFpdyU3oxsTqcAs8VgU9gO9JimhgubLfz3wxXhGTHXOqZzi7zlkAkJpNrVNTef7OwENK7NW9OwTpDh7t1W48nkmqw_TSbgV8Sb28TUSi7a0ChoRuMTASN5SGagM3_1cjUrqimgwUah6TpBFmih1L-ks4GiGNGebhCDovQBk11KFGSN5c2RuG4EZk8ahVjIIk1sIzl2k6v7i3bYLY19Ip9xpRovV"/>
</div>
</div>
</nav>
<!-- Main Content Canvas -->
<main class="pt-20 px-4 max-w-[390px] mx-auto">
<!-- Page Title -->
<header class="mb-6">
<h1 class="text-2xl font-black text-primary tracking-tight">Financials</h1>
<p class="text-on-surface-variant text-sm font-body">Overview of your CAD $ lease accounts</p>
</header>
<!-- Balance Card (The Digital Curator Style) -->
<section class="relative overflow-hidden rounded-xl bg-primary text-white p-6 mb-8 shadow-xl shadow-primary/20">
<div class="absolute -top-12 -right-12 w-32 h-32 bg-secondary rounded-full blur-3xl opacity-20"></div>
<div class="relative z-10">
<span class="text-xs font-label uppercase tracking-widest text-on-primary-container">Current Balance</span>
<div class="mt-2 flex items-baseline gap-1">
<span class="text-sm font-medium text-secondary-fixed-dim">CAD</span>
<h2 class="text-4xl font-extrabold tracking-tighter">2,150.00</h2>
</div>
<div class="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
<div>
<p class="text-[10px] uppercase opacity-60">Due Date</p>
<p class="text-sm font-semibold">Oct 01, 2023</p>
</div>
<div class="text-right">
<p class="text-[10px] uppercase opacity-60">Status</p>
<span class="inline-flex items-center gap-1 text-sm font-semibold text-secondary-fixed">
                            Pending <span class="material-symbols-outlined text-xs">info</span>
</span>
</div>
</div>
</div>
</section>
<!-- Quick Info Asymmetry Layout -->
<div class="grid grid-cols-2 gap-3 mb-8">
<div class="bg-surface-container-low p-4 rounded-xl">
<span class="material-symbols-outlined text-secondary mb-2">account_balance</span>
<p class="text-[10px] font-label uppercase text-on-surface-variant">Last Payment</p>
<p class="text-sm font-bold text-primary">CAD 2,150.00</p>
</div>
<div class="bg-surface-container-low p-4 rounded-xl">
<span class="material-symbols-outlined text-tertiary mb-2">verified_user</span>
<p class="text-[10px] font-label uppercase text-on-surface-variant">Next Auto-Pay</p>
<p class="text-sm font-bold text-primary">Enabled</p>
</div>
</div>
<!-- History Cards (Compliance Ledger Pattern) -->
<section class="space-y-4">
<div class="flex justify-between items-center mb-4">
<h3 class="text-lg font-bold text-primary">Payment History</h3>
<span class="text-xs text-secondary font-semibold">View All</span>
</div>
<!-- History Item 1 -->
<div class="relative bg-surface-container-lowest rounded-xl p-4 flex justify-between items-center shadow-sm">
<!-- Compliance Ribbon -->
<div class="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-tertiary"></div>
<div class="pl-3">
<p class="text-sm font-bold text-primary">September Rent</p>
<p class="text-[11px] text-on-surface-variant">Paid on Sep 01, 2023</p>
</div>
<div class="text-right">
<p class="text-sm font-bold text-primary">CAD 2,150.00</p>
<span class="text-[10px] font-label font-bold uppercase text-tertiary">Successful</span>
</div>
</div>
<!-- History Item 2 -->
<div class="relative bg-surface-container-lowest rounded-xl p-4 flex justify-between items-center shadow-sm">
<div class="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-tertiary"></div>
<div class="pl-3">
<p class="text-sm font-bold text-primary">August Rent</p>
<p class="text-[11px] text-on-surface-variant">Paid on Aug 01, 2023</p>
</div>
<div class="text-right">
<p class="text-sm font-bold text-primary">CAD 2,150.00</p>
<span class="text-[10px] font-label font-bold uppercase text-tertiary">Successful</span>
</div>
</div>
<!-- History Item 3 (Utilities) -->
<div class="relative bg-surface-container-lowest rounded-xl p-4 flex justify-between items-center shadow-sm">
<div class="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-tertiary"></div>
<div class="pl-3">
<p class="text-sm font-bold text-primary">Parking &amp; Utilities</p>
<p class="text-[11px] text-on-surface-variant">Paid on Jul 15, 2023</p>
</div>
<div class="text-right">
<p class="text-sm font-bold text-primary">CAD 145.50</p>
<span class="text-[10px] font-label font-bold uppercase text-tertiary">Successful</span>
</div>
</div>
</section>
</main>
<!-- Sticky Pay Now Button -->
<div class="fixed bottom-24 left-0 right-0 px-6 z-40 lg:hidden">
<button class="w-full bg-secondary text-on-secondary py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-2xl shadow-secondary/40 active:scale-95 transition-all">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">payments</span>
            Pay Now
        </button>
</div>
<!-- Bottom Navigation Bar (JSON Execution) -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<!-- Dashboard -->
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-all" href="#">
<span class="material-symbols-outlined" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</a>
<!-- Properties -->
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-all" href="#">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</a>
<!-- Financials (ACTIVE) -->
<a class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2 py-1 scale-90 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="account_balance_wallet" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</a>
<!-- Maintenance -->
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-all" href="#">
<span class="material-symbols-outlined" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Maintenance</span>
</a>
<!-- More -->
<a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 transition-all" href="#">
<span class="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</a>
</nav>
</body></html>
---

## SCREEN: tenant_profile_desktop

<body class="bg-surface font-body text-on-surface flex overflow-hidden h-screen">
<!-- SideNavBar (Execution from JSON) -->
<aside class="bg-blue-950 dark:bg-slate-950 h-screen w-64 hidden lg:flex flex-col left-0 top-0 fixed shadow-xl shadow-blue-950/20 py-6 z-50">
<div class="px-6 mb-8">
<h1 class="text-2xl font-black text-white italic tracking-tight">TenantPorch</h1>
<p class="text-blue-200/50 text-[10px] font-headline uppercase tracking-widest mt-1">Canadian Property Mgmt</p>
</div>
<nav class="flex-1 flex flex-col gap-2">
<div class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all cursor-pointer font-manrope font-medium text-sm">
<span class="material-symbols-outlined">dashboard</span>
<span>Dashboard</span>
</div>
<div class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all cursor-pointer font-manrope font-medium text-sm">
<span class="material-symbols-outlined">domain</span>
<span>Properties</span>
</div>
<div class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all cursor-pointer font-manrope font-medium text-sm">
<span class="material-symbols-outlined">groups</span>
<span>Tenants</span>
</div>
<div class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all cursor-pointer font-manrope font-medium text-sm">
<span class="material-symbols-outlined">payments</span>
<span>Financials</span>
</div>
<div class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all cursor-pointer font-manrope font-medium text-sm">
<span class="material-symbols-outlined">handyman</span>
<span>Maintenance</span>
</div>
<div class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all cursor-pointer font-manrope font-medium text-sm">
<span class="material-symbols-outlined">description</span>
<span>Documents</span>
</div>
<div class="text-blue-200/70 hover:text-white px-4 py-3 mx-2 flex items-center gap-3 transition-all cursor-pointer font-manrope font-medium text-sm">
<span class="material-symbols-outlined">mail</span>
<span>Messages</span>
</div>
<!-- Active State Logic: Mapping "Settings" as the current destination for "Tenant Profile" -->
<div class="bg-blue-900 dark:bg-slate-800 text-white rounded-lg px-4 py-3 mx-2 flex items-center gap-3 translate-x-1 duration-150 font-manrope font-medium text-sm">
<span class="material-symbols-outlined">settings</span>
<span>Settings</span>
</div>
</nav>
<div class="px-4 mt-auto">
<button class="w-full bg-secondary text-white py-3 rounded-lg font-manrope font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-secondary/20">
<span class="material-symbols-outlined text-sm">add_home</span>
                Add Property
            </button>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="flex-1 lg:ml-64 overflow-y-auto bg-surface-container-low min-h-screen">
<!-- TopAppBar (Execution from JSON) -->
<header class="bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center w-full px-8 py-4 h-16 fixed top-0 z-40 lg:w-[calc(100%-16rem)]">
<h2 class="text-xl font-manrope font-bold text-blue-950 dark:text-white tracking-tight">Profile Settings</h2>
<div class="flex items-center gap-6">
<nav class="hidden md:flex gap-8">
<a class="text-blue-950 dark:text-white font-bold border-b-2 border-amber-600 transition-colors duration-200 py-1 font-manrope" href="#">Properties</a>
</nav>
<div class="flex items-center gap-4 border-l border-outline-variant/20 pl-6">
<span class="material-symbols-outlined text-blue-900 dark:text-blue-100 hover:text-amber-600 transition-colors cursor-pointer">notifications</span>
<span class="material-symbols-outlined text-blue-900 dark:text-blue-100 hover:text-amber-600 transition-colors cursor-pointer">settings</span>
<img alt="User avatar" class="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-highest" data-alt="portrait of a professional young man in a clean studio setting with neutral background lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCenP-iKGJwJ68jhzmZfJpZVGiiLc7kINgiDq46C20UgG_rvb493Jj1aM-A8Ot8s3YT_8RAcBXv9LH7HRANvAKEp-4r2itGAZF1Czh93XYG69xjhzSltZWEiw4Flfbc30PnxVsml6hngbqHQRrhLkASJL_HOCy5WYY6rSWWhwSoo6N2-GZ-pxh_nqTqNtcMyafPqrgI14AtWDmFfbovb0f3QVj_mkgwPYoeTcYvY6l24fn1qbcuMXndQA22HZMP-1IJUStNonzH2DQl"/>
</div>
</div>
</header>
<!-- Profile Content Grid -->
<div class="pt-24 pb-12 px-8 max-w-6xl mx-auto">
<!-- Asymmetric Hero Section -->
<div class="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
<div class="md:col-span-4 flex flex-col gap-6">
<!-- Personal Info Sidecard (Read-only) -->
<div class="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(4,21,52,0.04)] flex flex-col items-center text-center">
<div class="relative mb-6">
<img alt="User profile large" class="w-32 h-32 rounded-xl object-cover shadow-lg" data-alt="high quality portrait of a male tenant smiling warmly against a soft blue architectural backdrop" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgiu6t4UhAFhQEgCTeVMuAjk73jtKsGccaGtZkIVqli2cyj9OSwCPwnkWVOj8tanO-vRDdnutUJx2x7E1MXGejlWAhRRWU1VRvmg84rjTn4HL14Zt4dVDdbw22qu3CV4M1IzCQC9vV9TE4sS_00ZOewSX02riyN380CBhC0n7BdqKvJHdm8Hh4sXKDSLeB4OVd-OUmGf12oKy_2lZMaxnbsZ5TOUjy_KtwNkaglA4qTHYvxz9SPmmKAD7yuCL53wZaSc4slDs-bJe3"/>
<div class="absolute -bottom-2 -right-2 bg-secondary p-2 rounded-lg text-white shadow-lg">
<span class="material-symbols-outlined text-base">verified</span>
</div>
</div>
<h3 class="font-headline text-2xl font-bold text-primary">Marcus Holloway</h3>
<p class="text-on-surface-variant font-medium text-sm mt-1">Tenant since Oct 2021</p>
<div class="mt-8 w-full space-y-4 text-left">
<div class="flex flex-col">
<span class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Current Residence</span>
<div class="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
<span class="material-symbols-outlined text-primary-container">apartment</span>
<span class="text-sm font-semibold text-primary">Unit 402, 185 Spadina Ave.</span>
</div>
</div>
<div class="flex flex-col">
<span class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Email Address</span>
<div class="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
<span class="material-symbols-outlined text-primary-container">mail</span>
<span class="text-sm font-semibold text-primary">m.holloway@domain.ca</span>
</div>
</div>
<div class="bg-tertiary/5 compliance-ledger-border p-4 mt-4">
<p class="text-xs font-semibold text-tertiary-container flex items-center gap-2">
<span class="material-symbols-outlined text-sm">verified_user</span>
                                    Compliance: ON (Ontario Standard)
                                </p>
</div>
</div>
</div>
</div>
<div class="md:col-span-8 flex flex-col gap-8">
<!-- Notification Settings -->
<section class="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(4,21,52,0.04)]">
<div class="flex items-center justify-between mb-8">
<div>
<h4 class="font-headline text-lg font-bold text-primary">Communication Preferences</h4>
<p class="text-on-surface-variant text-sm mt-1">Manage how you receive alerts and property updates.</p>
</div>
</div>
<div class="space-y-6">
<!-- Toggle 1 -->
<div class="flex items-center justify-between py-2">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
<span class="material-symbols-outlined">alternate_email</span>
</div>
<div>
<p class="font-semibold text-primary">Email Notifications</p>
<p class="text-xs text-on-surface-variant">Monthly invoices and maintenance confirmations.</p>
</div>
</div>
<button class="w-12 h-6 bg-secondary-container rounded-full relative flex items-center px-1">
<div class="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
</button>
</div>
<!-- Toggle 2 -->
<div class="flex items-center justify-between py-2">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
<span class="material-symbols-outlined">sms</span>
</div>
<div>
<p class="font-semibold text-primary">SMS Alerts</p>
<p class="text-xs text-on-surface-variant">Urgent emergency and maintenance entries.</p>
</div>
</div>
<button class="w-12 h-6 bg-surface-variant rounded-full relative flex items-center px-1">
<div class="w-4 h-4 bg-white rounded-full shadow-sm"></div>
</button>
</div>
<!-- Toggle 3 -->
<div class="flex items-center justify-between py-2">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
<span class="material-symbols-outlined">notifications_active</span>
</div>
<div>
<p class="font-semibold text-primary">App Push</p>
<p class="text-xs text-on-surface-variant">Real-time chat and document signing.</p>
</div>
</div>
<button class="w-12 h-6 bg-secondary-container rounded-full relative flex items-center px-1">
<div class="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
</button>
</div>
</div>
</section>
<!-- Emergency Contact Form -->
<section class="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(4,21,52,0.04)]">
<div class="mb-8">
<h4 class="font-headline text-lg font-bold text-primary">Emergency Contact</h4>
<p class="text-on-surface-variant text-sm mt-1">Required for provincial safety compliance.</p>
</div>
<div class="grid grid-cols-2 gap-6">
<div class="flex flex-col gap-2">
<label class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Contact Name</label>
<input class="bg-surface-container-low ghost-border rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none text-primary font-medium" placeholder="Sarah Holloway" type="text"/>
</div>
<div class="flex flex-col gap-2">
<label class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Relationship</label>
<input class="bg-surface-container-low ghost-border rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none text-primary font-medium" placeholder="Spouse" type="text"/>
</div>
<div class="col-span-2 flex flex-col gap-2">
<label class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Phone Number</label>
<input class="bg-surface-container-low ghost-border rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none text-primary font-medium" placeholder="+1 (416) 555-0129" type="tel"/>
</div>
</div>
<div class="mt-8 flex justify-end">
<button class="px-8 py-3 bg-primary text-white rounded-lg font-manrope font-bold text-sm active-glow hover:opacity-90 transition-all">Save Changes</button>
</div>
</section>
<!-- Password Security -->
<section class="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_24px_rgba(4,21,52,0.04)] border-l-4 border-secondary-container">
<div class="mb-8">
<h4 class="font-headline text-lg font-bold text-primary">Security &amp; Access</h4>
<p class="text-on-surface-variant text-sm mt-1">Update your password to keep your lease data secure.</p>
</div>
<div class="space-y-4 max-w-md">
<div class="flex flex-col gap-2">
<label class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">Current Password</label>
<input class="bg-surface-container-low ghost-border rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none" placeholder="••••••••••••" type="password"/>
</div>
<div class="flex flex-col gap-2">
<label class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant ml-1">New Password</label>
<input class="bg-surface-container-low ghost-border rounded-lg px-4 py-3 text-sm focus:ring-0 focus:border-secondary transition-all outline-none" placeholder="Enter new password" type="password"/>
</div>
<button class="mt-4 text-secondary font-manrope font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform">
                                Update Password <span class="material-symbols-outlined text-sm">arrow_forward_ios</span>
</button>
</div>
</section>
</div>
</div>
</div>
</main>
<!-- BottomNavBar (Execution from JSON - Mobile Only) -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 py-1">
<span class="material-symbols-outlined">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 py-1">
<span class="material-symbols-outlined">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 py-1">
<span class="material-symbols-outlined">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 py-1">
<span class="material-symbols-outlined">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Maintenance</span>
</div>
<!-- Active Mapping for "More" or "Profile" equivalent -->
<div class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2 scale-90 duration-200">
<span class="material-symbols-outlined">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</div>
</nav>
</body></html>
---

## SCREEN: tenant_profile_mobile

<body class="bg-surface font-body text-on-surface antialiased overflow-x-hidden no-scrollbar">
<!-- Top Navigation Anchor -->
<header class="bg-slate-50/80 backdrop-blur-xl docked full-width top-0 z-50 flex justify-between items-center w-full px-6 py-4 h-16">
<div class="text-xl font-manrope font-bold text-blue-950 tracking-tight">TenantPorch</div>
<div class="flex gap-4 items-center">
<span class="material-symbols-outlined text-blue-900" data-icon="notifications">notifications</span>
<div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
<img alt="User avatar" data-alt="Close-up portrait of a friendly man with a professional smile, warm natural lighting, high-end photography style" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDj7F6MlZJimPfcozEYldYSgnCWRQEnoqFWurDcJfuSxOqgCNAmygMH6cUbSHP3eIiw5l4PnP1rYioleRtIVv6ddyo3Za3bUNE609DFARLRaBOr7JKNF789jWTNV2fgTXHACxMJ_zRnv8efdQmMak02twtE2BWS72eDE3M9Wl6WDps3N0mXpkDUt4RH3hdaApiOS8dKDXm9LT7Abotkm8DAnAFb02H2igTlVOrT2qcVVOwGyYyhxStE2Jx8C3lQrrf83Rw9iYPIxT83"/>
</div>
</div>
</header>
<main class="pt-20 pb-32 px-5 space-y-6">
<!-- Hero Profile Header -->
<section class="relative space-y-4">
<div class="flex items-center gap-5">
<div class="relative">
<div class="w-20 h-20 rounded-2xl overflow-hidden shadow-sm">
<img alt="Tenant Portrait" data-alt="Professional headshot of a young adult male, soft daylight, blurred minimalist office background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMDjwffM7S8AS2vr_3NryTMLk2wzlgfAXnU1kWQQ_dkQIr47Zi8OeNsMCavZezSJ40XwHAckFu3k8zXOkYPlcKe9xoF_80_aXGezEt83NVKJQxj-DTtTmK6-5BNk-hn5fVXjEGyNzvWfUuw7j4axbDHmC71Q9bCV1lOuLq1ohMK1fIikJNwgj12CCXWkopJTirzGhS6L6BRsb58xouUsfnlDdEuBY9RFW8vMV46e56b36F2FSE05RjQ2gW4B8yEFMCxUKLY4Qz1w0n"/>
</div>
<div class="absolute -bottom-2 -right-2 bg-secondary p-1.5 rounded-lg text-white shadow-lg">
<span class="material-symbols-outlined text-sm" data-icon="edit">edit</span>
</div>
</div>
<div>
<h1 class="text-2xl font-headline font-extrabold text-primary tracking-tight">Marcus Thompson</h1>
<div class="flex items-center gap-1.5 mt-1">
<span class="inline-block w-2 h-2 rounded-full bg-tertiary"></span>
<p class="text-on-surface-variant font-medium text-sm">Active Tenant · ON</p>
</div>
</div>
</div>
</section>
<!-- Profile Sections Stack -->
<div class="space-y-4">
<!-- Personal Info Card -->
<section class="bg-surface-container-low rounded-2xl p-5 space-y-5">
<div class="flex items-center gap-2 mb-1">
<span class="material-symbols-outlined text-primary text-xl" data-icon="person">person</span>
<h2 class="font-headline font-bold text-lg text-primary">Personal Info</h2>
</div>
<div class="space-y-4">
<div class="space-y-1.5">
<label class="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider px-1">Legal Name</label>
<input class="w-full bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-secondary/50 focus:outline-secondary transition-all" type="text" value="Marcus Thompson"/>
</div>
<div class="space-y-1.5">
<label class="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider px-1">Email Address</label>
<input class="w-full bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-secondary/50 focus:outline-secondary transition-all" type="email" value="m.thompson@example.ca"/>
</div>
<div class="space-y-1.5">
<label class="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider px-1">Phone Number</label>
<div class="relative">
<input class="w-full bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-secondary/50 focus:outline-secondary transition-all" type="tel" value="+1 (416) 555-0198"/>
<span class="absolute right-4 top-3 text-xs font-bold text-tertiary">VERIFIED</span>
</div>
</div>
</div>
</section>
<!-- Emergency Contact Card -->
<section class="bg-surface-container-low rounded-2xl p-5 space-y-5">
<div class="flex items-center gap-2 mb-1">
<span class="material-symbols-outlined text-primary text-xl" data-icon="emergency">emergency</span>
<h2 class="font-headline font-bold text-lg text-primary">Emergency Contact</h2>
</div>
<div class="space-y-4">
<div class="grid grid-cols-2 gap-3">
<div class="space-y-1.5">
<label class="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider px-1">Contact Name</label>
<input class="w-full bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-secondary/50 transition-all" placeholder="Full Name" type="text"/>
</div>
<div class="space-y-1.5">
<label class="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider px-1">Relationship</label>
<input class="w-full bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-secondary/50 transition-all" placeholder="e.g. Partner" type="text"/>
</div>
</div>
<div class="space-y-1.5">
<label class="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider px-1">Emergency Phone</label>
<input class="w-full bg-surface-container-lowest border-none outline outline-1 outline-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-secondary/50 transition-all" placeholder="+1" type="tel"/>
</div>
</div>
</section>
<!-- Notifications Card -->
<section class="bg-surface-container-low rounded-2xl p-5 space-y-5">
<div class="flex items-center gap-2 mb-1">
<span class="material-symbols-outlined text-primary text-xl" data-icon="notifications_active">notifications_active</span>
<h2 class="font-headline font-bold text-lg text-primary">Notifications</h2>
</div>
<div class="space-y-4 divide-y divide-outline-variant/10">
<div class="flex items-center justify-between py-2">
<div class="space-y-0.5">
<p class="font-medium text-sm text-primary">Rent Reminders</p>
<p class="text-xs text-on-surface-variant">Push notification 3 days before</p>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
</label>
</div>
<div class="flex items-center justify-between pt-4 pb-2">
<div class="space-y-0.5">
<p class="font-medium text-sm text-primary">Maintenance Updates</p>
<p class="text-xs text-on-surface-variant">Real-time status for tickets</p>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
</label>
</div>
<div class="flex items-center justify-between pt-4 pb-2">
<div class="space-y-0.5">
<p class="font-medium text-sm text-primary">SMS Alerts</p>
<p class="text-xs text-on-surface-variant">Urgent building announcements</p>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input class="sr-only peer" type="checkbox"/>
<div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
</label>
</div>
</div>
</section>
</div>
<!-- Action Button -->
<button class="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/10 active:scale-95 transition-all">
            Save Changes
        </button>
<button class="w-full text-error font-headline font-semibold py-2 text-sm">
            Sign Out
        </button>
</main>
<!-- Bottom Navigation Bar (Active State: More/Profile context) -->
<nav class="fixed bottom-0 w-full rounded-t-2xl z-50 bg-white/90 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_24px_rgba(4,21,52,0.06)] flex justify-around items-center h-20 px-4 pb-safe lg:hidden">
<div class="flex flex-col items-center justify-center text-slate-500">
<span class="material-symbols-outlined" data-icon="space_dashboard">space_dashboard</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Dashboard</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500">
<span class="material-symbols-outlined" data-icon="home_work">home_work</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Properties</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500">
<span class="material-symbols-outlined" data-icon="account_balance_wallet">account_balance_wallet</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Financials</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-500">
<span class="material-symbols-outlined" data-icon="build">build</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Maintenance</span>
</div>
<!-- Active Tab: More (Mapping Tenant Profile to "More" or generic profile entry) -->
<div class="flex flex-col items-center justify-center text-amber-600 bg-amber-50 rounded-xl px-2 py-1 scale-90 transition-all duration-200">
<span class="material-symbols-outlined" data-icon="more_horiz">more_horiz</span>
<span class="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">More</span>
</div>
</nav>
</body></html>
---

