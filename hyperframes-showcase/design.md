# aivU — Design System

Brand: aivU — AI-powered real-time exercise posture correction.
Mood: premium, futuristic, confident, human-centered tech.

## Colors

| Role | Hex | Usage |
|------|-----|-------|
| Canvas | `#0D0D14` | All scene backgrounds |
| Card Surface | `#13131F` | Glass panels, cards, overlays |
| Elevated Surface | `#1A1A2E` | Accent surfaces, inputs |
| Accent Violet | `#7B2FD6` | Primary action, borders, indicator |
| Accent Light | `#9B59FF` | Headlines, glow peaks, brand name |
| Accent Border | `#5A1FA8` | Subtle structural borders |
| Status Green | `#22C55E` | Correct, success, positive |
| Status Yellow | `#EAB308` | Warning, caution |
| Status Red | `#EF4444` | Error, incorrect, negative |
| Text Primary | `#F1F1FF` | All body and headline text |
| Text Muted | `#9999BB` | Secondary labels, metadata (brightened for video contrast) |

## Typography

| Role | Family | Weight | Size (video) |
|------|--------|--------|--------------|
| Display Headlines | DM Sans | 900 | 120–180px |
| Large Headlines | DM Sans | 700–800 | 80–120px |
| Body Text | DM Sans | 350–400 | 26–36px |
| Data / Metrics | JetBrains Mono | 500 | 24–32px |
| Labels / Metadata | JetBrains Mono | 400 | 16–20px |

Dark-background optical corrections:
- Body weight 350 instead of 400 (light-on-dark reads heavier)
- Line-height +0.08 beyond default
- Letter-spacing +0.005em on display sizes

Key type feature: `font-variant-numeric: tabular-nums` on all numeric displays.

## Corners & Depth

- Card border-radius: 16px
- Button border-radius: 12px
- Modal / overlay border-radius: 24px
- Glassmorphism: `backdrop-filter: blur(12px)`, border `1px solid rgba(123, 47, 214, 0.2)`
- Glow tiers: sm (12px spread), md (20px), lg (32px) — all tinted `rgba(123, 47, 214, 0.25–0.45)`

## Motion

- Primary eases: power3.out, expo.out, power2.inOut
- Stagger base: 100–150ms
- Ambient motion on every decorative element (breathe, drift, pulse)
- No two adjacent tweens share the same ease
- Scene entrances: 3+ distinct eases and directions per scene
- Exits: banned except on final scene

## Avoid

- Gradient text (background-clip: text)
- Full-screen linear gradients on dark backgrounds (H.264 banding)
- Pure #000 or #fff — always tint toward violet
- Centered-and-floating layouts — anchor to edges, use zone-based composition
- Identical-card grids without hierarchy
