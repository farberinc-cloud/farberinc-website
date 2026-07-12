# Farber.Inc Brand Guidelines

A practical reference for designers, developers, and content authors working on
the Farber.Inc site. All values here are exposed as CSS custom properties on `:root`
in `css/styles.css` and should be used directly via `var(--name)`.

---

## 1. Brand Colors

### Primary (the three that matter)
| Token | Hex | Usage |
|---|---|---|
| `--navy` | `#0A1628` | Primary background, brand text, hero overlays |
| `--gold` | `#B8860B` | Brand accent, CTAs, highlights, dividers |
| `--cream` | `#FAF8F5` | Page text on dark, soft backgrounds, "warm" tone |

### Secondary
| Token | Hex | Usage |
|---|---|---|
| `--navy-light` | `#1A2A4A` | Slightly lighter navy for layering |
| `--gold-light` | `#D4A437` | Hover state for gold CTAs |
| `--gold-dark` | `#8B6914` | Pressed state for gold |
| `--cream-dark` | `#F0EDE8` | Subtle "off-white" panels |

### Gradient intermediates (used by `--gradient-blue-cream`)
| Token | Hex | Where it sits in the gradient |
|---|---|---|
| `--blue-mid` | `#1a3a5e` | 30% stop — the "middle blue" |
| `--blue-light` | `#4a6890` | 60% stop — the "light blue" |
| `--blue-pale` | `#6b85a8` | (reserved, currently unused) |
| `--cream-tinted` | `#e8dcc4` | 85% stop — the warm transition into cream |

---

## 2. Brand Gradients

### `--gradient-blue-cream` (PRIMARY)
```css
linear-gradient(135deg,
  #0A1628 0%,    /* navy — upper-left */
  #1a3a5e 30%,   /* blue-mid */
  #4a6890 60%,   /* blue-light */
  #e8dcc4 85%,   /* cream-tinted — warm transition */
  #faf8f5 100%   /* cream — lower-right */
)
```
**Use for**: premium cards, "Related Resources" blocks, blog cross-link panels,
anywhere the brand's blue and cream must both be visible. Gold accents
(`--gold` for headings and links) remain readable across the full gradient.

**Text rules** when using this gradient:
- Headings: `var(--cream)` (sits in the upper-left blue area)
- Subheadings/labels: `var(--gold)` (visible across the full gradient)
- Body links: `var(--gold)` (visible on both blue and cream)
- Add a subtle `text-shadow: 0 1px 2px rgba(10, 22, 40, 0.3)` for legibility

### `--gradient-blue-deep`
```css
linear-gradient(135deg,
  #0A1628 0%,
  #1a3a5e 50%,
  #2c4d6b 100%
)
```
**Use for**: dark-themed cards, contact panels, anywhere the gradient should
stay in the blue family without transitioning to cream. Cream text works
throughout.

### `--gradient-blue-soft`
```css
linear-gradient(180deg,
  rgba(10, 22, 40, 0.92) 0%,
  rgba(10, 22, 40, 0.78) 40%,
  rgba(10, 22, 40, 0.88) 100%
)
```
**Use for**: overlays on top of hero videos or images, where the brand
navy needs to dominate the foreground while letting some of the background
show through. Gold radial-gradient accents are layered on top of this.

---

## 3. Typography

| Token | Value | Use |
|---|---|---|
| `--font-headline` | `'Playfair Display', Georgia, serif` | H1–H3, hero text |
| `--font-body` | `'Inter', sans-serif` | Body, paragraphs, links |
| `--font-accent` | `'Montserrat', sans-serif` | Eyebrow labels, uppercase tags |

### Type scale
| Token | Value | Use |
|---|---|---|
| `--text-h1` | `3.75rem` | Page titles |
| `--text-h2` | `3rem` | Section H2s |
| `--text-h3` | `2rem` | Card H3s |
| `--text-h4` | `1.5rem` | Card H4s, large body |
| `--text-body` | `1rem` | Default body |
| `--text-small` | `0.875rem` | Captions, footer links |
| `--text-label` | `0.75rem` | Eyebrow labels (uppercase, tracked) |

---

## 4. Spacing scale
`--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (24px),
`--space-xl` (32px), `--space-2xl` (64px).

## 5. Radii
`--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px).

## 6. Shadows
`--shadow-sm` (0 1px 2px), `--shadow-md` (0 4px 12px), `--shadow-lg` (0 12px 32px).

---

## 7. Iconography

- Single sprite in `icons/farber-inc-icon.svg` + inline `<svg>` blocks in the head of each page
- All icons use the brand gold (`#B8860B`) or cream (`#FAF8F5`) — never random colors
- Logo: gold F.I ring on navy fill — viewBox 512x512, never modify the proportions

---

## 8. Voice & tone
- Direct, no fluff
- Senior-expert positioning ("Farber.Inc is the boutique practice that does
  three things — AI Business Consulting, SEO, and AEO/GEO — and we do them
  at a senior level")
- Specifics over generalities: named cities, named AI engines, concrete
  timelines, real industries
- Avoid: "in today's digital landscape", "unleash the power of", "game-changer"

---

## 9. Don'ts
- ❌ Don't use white text on cream — the bug the crosslink card had before
- ❌ Don't introduce new colors outside the palette
- ❌ Don't use icons in colors other than gold, cream, or white
- ❌ Don't put cream on cream (low contrast)
- ❌ Don't put navy text on navy
- ❌ Don't use gradients outside the three defined in this doc
- ❌ Don't write content without naming specific entities (cities, AI engines, industries, timelines)
