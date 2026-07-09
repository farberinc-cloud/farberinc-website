# Farber.Inc Deployment Bundle — `farberinc/`

## What's in this bundle
Static HTML/CSS/JS site for **farberinc.media**, optimized for Hostinger shared hosting.

```
farberinc/
├── index.html                    ← homepage (Organization + WebSite + LocalBusiness + FAQPage schema)
├── robots.txt                    ← allows ChatGPT-User, PerplexityBot, anthropic-ai
├── sitemap.xml                   ← 31 URLs (legal pages removed)
├── site.webmanifest
├── css/styles.css                (untouched)
├── js/main.js                    (untouched)
├── icons/
│   ├── favicon.ico, 16/32/48/96/192/512x512.png  (favicons)
│   ├── apple-touch-icon.png
│   ├── farber-inc-icon.svg       ← NEW (downloaded from brand repo)
│   ├── farber-inc-logo.png       ← NEW (300×300 RGBA, from brand repo)
│   └── og-image.png              ← NEW (1200×630 social share card)
├── images/                       (empty)
└── pages/
    ├── geo-locations.html
    ├── geo/                      ← 25 city pages (FAQPage + BreadcrumbList + Service + ProfessionalService)
    ├── services/                 ← 5 service pages (Service + FAQPage schema on 4)
    └── legal/                    ← 2 agreement pages (noindex)
```

## How to deploy to Hostinger

### Option A — Upload via Hostinger File Manager (easiest)
1. Log in to hPanel → **File Manager** → open `public_html/`
2. Upload `farberinc-fixed.zip` to `public_html/`
3. Right-click the zip → **Extract** → files go into `public_html/farberinc/`
4. Move the *contents* of `public_html/farberinc/` up one level into `public_html/` (so `index.html` is at the web root), OR point your domain's document root to `public_html/farberinc/` in hPanel → **Hosting** → **Domains** → click your domain → **Document Root**.

### Option B — SFTP (faster for repeated updates)
```bash
# from your local machine, after unzipping farberinc-fixed.zip
scp -r farberinc/* user@your-hostinger-server:/home/user/public_html/
```

### Option C — GitHub Pages / Netlify / Vercel (future-proof)
Push this folder to a GitHub repo (e.g. `farberinc-cloud/farberinc-website`) and connect Hostinger's Git integration or Netlify for auto-deploy on every commit.

## Critical changes from the original bundle

### 🔴 Removed (security / compliance)
- `ninja-daytona-script.js` from NinjaTech AI's Daytona build tool — leaked into 10 files. **This was a third-party tracker that didn't belong in production.** All instances stripped.
- `aggregateRating: 5.0 / 47` from index.html LocalBusiness schema — **violates Google's review-markup spam policy** (no actual reviews anywhere on the site). Removed.
- `https://myninja.ai/referral/...` affiliate link in `pages/services/intelligent-ai.html` line 398 — links to a **competing AI product** (NinjaTech's "SuperNinja AI"). **LEFT IN PLACE for your review — strip or keep based on your affiliate relationship with NinjaTech.**

### ✅ Schema fixes
- All 110 JSON-LD blocks validated as legal JSON.
- Missing logo URL fixed: `icons/logo-full.svg` (didn't exist) → `icons/farber-inc-icon.svg` (real, downloaded from `farber-inc-brand` repo).
- `FAQPage` schema added to `index.html` and the 4 service pages that have FAQ sections (was missing — major AEO gap).
- Index.html schema blocks kept separate for now (Organization / WebSite / LocalBusiness). Can be merged into a single `@graph` block later if desired.

### ✅ SEO meta
- All 34 page titles ≤ 60 chars (was 22 over the limit, worst case 78).
- All 34 meta descriptions ≤ 150 chars (was 10 over the limit, worst case 174).

### ✅ Social / AEO
- `og:image` (1200×630) + `og:image:width`, `og:image:height`, `og:image:alt` added to all 34 pages.
- `og:site_name`, `og:locale` added to all pages.
- `twitter:image` + `twitter:image:alt` added to all pages.
- New `icons/og-image.png` — Farber.Inc brand card with logo, headline, and tagline.

### ✅ Robots / Sitemap
- `sitemap.xml`: removed the two noindex legal pages (contradicting `robots.txt` Disallow). Updated `lastmod` to today.
- `robots.txt` untouched (already correct).

### 🧹 Cleanup
- `data-aos="fade-up"` etc. attributes stripped from all 25 geo pages + `geo-locations.html` (AOS library was never loaded, attributes were dead code).
- `index.html` canonical normalized: `https://www.farberinc.media` → `https://www.farberinc.media/` (trailing slash).

## Still on your plate

1. **Replace the placeholder brand content** in `index.html` About section with your real story / photos.
2. **Review the NinjaTech affiliate link** in `intelligent-ai.html` line 398.
3. **Local-content differentiation** on the 25 geo pages — they currently share near-identical copy. Recommend 200–400 unique words per city (local market context, industries, neighborhoods, case-study references). This avoids the "doorway page" risk Google penalizes.
4. **Real review source** — when you have Google Business Profile reviews wired up, you can re-add `aggregateRating` legitimately.
5. **GA4 event tracking** — currently only default `page_view` fires. Consider adding: form_submit, phone_click, email_click, scroll_depth, cta_click — that's the standard visibility / conversion intelligence layer that makes the GA4 investment actually pay off.

## Verify post-deploy

After uploading, run these checks:

```bash
# 1. Lint all schema
curl -s https://search.google.com/test/rich-results  # paste your deployed URLs

# 2. Verify meta lengths render correctly
curl -s https://www.farberinc.media | grep -E '<title>|<meta name="description"'

# 3. Confirm no ninja leak in production
curl -s https://www.farberinc.media | grep "ninja"  # should be empty (except for the affiliate CTA on intelligent-ai.html)

# 4. Sitemap reachability
curl -I https://www.farberinc.media/sitemap.xml

# 5. OG image is reachable
curl -I https://www.farberinc.media/icons/og-image.png
```

Built: 2026-07-09 · By: Mavis · For: Randy Farber / Farber.Inc