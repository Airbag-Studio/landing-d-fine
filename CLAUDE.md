# D-Fine Landing Page — Claude Code Context

## Project Overview

- **Product:** D-Fine — iOS + Apple Watch app that tracks vitamin D synthesis (sun, food, supplements)
- **Format:** Single-page scrollable landing, English, single CTA (App Store download)
- **Built by:** Airbag Studio Srl
- **Tech stack:** Static HTML + Tailwind CSS (CDN) + minimal vanilla JS for scroll animations
- **No frameworks, no build step, no React** — just `index.html` + `assets/`
- Hostable on any static host (GitHub Pages, Netlify, Vercel)

---

## Design Philosophy

**Reference brand:** Oura Ring — scientific but warm. Data without anxiety.

**Anti-patterns to AVOID:**
- Purple/blue gradients on white (the default AI look)
- Inter font used generically everywhere
- Generic rounded cards with drop shadows
- Stock illustration / flat icon style
- Too many animations or scroll effects
- SaaS template feel

**D-Fine's visual identity:**
- Warm solar palette: amber, gold, soft orange — transitioning to deeper, quieter tones for contrast sections
- Clean typography with generous whitespace — the page breathes
- Confidence without flashiness — feels like a health product designed by people who care about craft
- Photography/mockups: real app screenshots (placeholders for now)
- Mobile-first responsive design

---

## Design Tokens

| Token | Value |
|-------|-------|
| Font | System font stack or a single high-quality sans-serif. SF Pro Display feel if possible; Inter acceptable but must not look generic — use weight/size contrast to avoid blandness |
| Primary accent | Amber/gold (~`#F59E0B` or warmer) |
| Background (light) | Warm off-white, not pure white (`#FAFAF8` or similar) |
| Background (dark) | Deep warm dark for contrast sections (`#1C1A17` or similar) |
| Text primary | Near-black with warm undertone (`#18160F`) |
| Text secondary | Muted warm gray |
| Max content width | ~1100px centered |
| Section padding | Generous vertical rhythm — sections breathe |

---

## Copy Source

- All approved copy lives in `docs/D-Fine_Landing_Page_Copy.md`
- Voice & Tone: `docs/D-Fine_Voice_and_Tone_Guide.md`
- Section structure: `docs/D-Fine_Landing_Page_Structure.md`
- Strategic messaging (Italian): `docs/D-Fine_Messaggi_Landing_Page.md`
- **Do NOT rewrite copy** — use it verbatim from the approved document
- Tone filter: *"Would a calm, informed coach say this while showing you your health dashboard?"*

**Vocabulary rules:**
- Use: synthesize, track, understand, your skin, your sun, calibrated, personalized, science-based, passive, automatic, precise, real data, daily, trend
- Never use: AI-powered, revolutionary, hack, optimize, unlock, supercharge, game-changer, deficiency alert, diagnose, treatment

---

## Page Structure (6 sections)

1. **Hero** — Headline + subtitle + iPhone/Watch mockup + App Store CTA (above the fold)
2. **The Problem** — Why vitamin D deficiency is invisible and common. Coach tone, no alarm.
3. **The Solution** — Sun + Food + Supplements = one IU number. The core differentiator.
4. **How It Works** — Automatic (Watch measures Time in Daylight) + Calibrated to you (skin type, SPF, location, etc.)
5. **Trust** — Science-based (NIH/Holick, no "AI") + Privacy (no account, iCloud only) + Apple native
6. **Closing CTA + Footer** — Headline "Your sun. Your skin. Your number." + App Store badge + legal footer

---

## File Structure

```
d-fine-landing/
├── CLAUDE.md
├── index.html          # The landing page (single file)
├── assets/
│   ├── images/         # Screenshots, mockups, app icon (placeholders for now)
│   └── favicon.ico
├── docs/               # Brief documents — read-only reference
│   ├── D-Fine_Messaggi_Landing_Page.md
│   ├── D-Fine_Voice_and_Tone_Guide.md
│   ├── D-Fine_Landing_Page_Copy.md
│   └── D-Fine_Landing_Page_Structure.md
└── README.md
```

---

## Implementation Rules

- **Single HTML file** with embedded Tailwind via CDN — no build tools
- **Vanilla JS only** — scroll-triggered fade-ins, nothing else
- **Images:** placeholder boxes with descriptive `alt` text until real screenshots are provided
- **App Store badge:** Apple's official "Download on the App Store" SVG/PNG badge
- **Semantic HTML:** `<header>`, `<main>`, `<section>`, `<footer>` — proper hierarchy
- **Accessibility:** proper contrast ratios, alt texts, aria-labels where needed
- **Performance:** no heavy assets, lazy-load images, minimal JS
- **CTA appears twice:** in the Hero and in the closing section — nowhere else

---

## Workflow

1. Read all docs first — understand brand, tone, and structure
2. Plan the visual approach before writing any code
3. Build section by section, starting from Hero
4. Pause for review after each section before moving to the next
5. Use MCP design tools (Page Design Guide, AIDesigner) for visual guidance when needed

---

## Notes from Brief Documents

- The supplement angle ("finally know if your dose is right") is a strong differentiator — woven into Section 3
- iOS-only is a **design choice**, not a limitation — communicate it with confidence
- Algorithm = science (NIH, Holick) — never "AI"
- Legal disclaimer ("not medical advice") lives **only in the footer** — never in body copy
- Features left out intentionally (not needed for acquisition): monthly trend heatmap, smart notifications, 3D globe, algorithm detail
