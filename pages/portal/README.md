# Client Portal — Farber Inc

Private, branded access to client-specific SEO / AEO / GEO audit deliverables. Lives on `farberinc.media/pages/portal/` and is composed of static HTML files plus downloadable assets.

Each audit gets its own unguessable URL — anyone with the link can view it, no login required. The portal landing page lists active audits for prospects and clients to navigate.

---

## Folder structure

```
pages/portal/
├── index.html              ← portal landing page (public, in sitemap)
├── README.md               ← this file
├── _admin/
│   └── index.html          ← internal Farber roster (unguessable, NOT in sitemap)
└── [CLIENT-AUDIT-ID]/
    ├── index.html          ← the audit page (noindex, NOT in sitemap)
    └── assets/
        ├── *.pdf           ← optional PDF deliverable
        └── *.pptx          ← optional PPTX deliverable
```

---

## How to add a new client audit

### Step 1 — Pick an audit ID

Use the pattern `[CLIENT-CODE]-[YEAR]-[LICENSE-OR-RANDOM]`:

- `CRN-2026-173563` — CRN Construction, 2026, license number 173563
- `ACME-2026-7K3M` — ACME Corp, 2026, random 4-char suffix
- `BILT-2026-A8F2` — Bilt Construction, random suffix

Keep IDs **unguessable** for private audits (use a random suffix). For demo/sample audits, a human-readable ID is fine.

### Step 2 — Create the folder

```bash
mkdir -p pages/portal/[AUDIT-ID]/assets
```

### Step 3 — Copy the template

The fastest way to make a new audit page is to copy the existing CRN example:

```bash
cp pages/portal/CRN-2026-173563/index.html pages/portal/[AUDIT-ID]/index.html
cp pages/portal/CRN-2026-173563/assets/* pages/portal/[AUDIT-ID]/assets/
```

Then edit the new `index.html` and replace:

- `<title>` and meta tags (description, canonical URL)
- Cover page client name + project tagline
- All section content
- Download link paths in the bottom download bar (`./assets/...`)

### Step 4 — Drop the deliverables

Drop the PDF and PPTX (and any other files) into `assets/`:

```bash
cp /path/to/client-report.pdf pages/portal/[AUDIT-ID]/assets/
cp /path/to/client-deck.pptx pages/portal/[AUDIT-ID]/assets/
```

The download bar at the bottom of each audit page links to `./assets/*` — adjust filenames in the HTML if you change them.

### Step 5 — Add the audit card to the landing page

Edit `pages/portal/index.html`. Inside the `audit-grid` div, add a new `<a class="audit-card" href="./[AUDIT-ID]/">...</a>` block following the existing pattern. Include:

- Type (Residential Contractor / SaaS / eCommerce / etc.)
- Client name
- Service area (city / region)
- Date prepared
- 1-sentence description
- "Open Audit" CTA

### Step 6 — Add to the admin roster

Edit `pages/portal/_admin/index.html` and add a new row to the table with:

- Client name
- Audit ID
- URL (`https://www.farberinc.media/pages/portal/[AUDIT-ID]/`)
- Date prepared
- Status (Active / Revoked)
- Recipient contact (email or company)
- Notes

### Step 7 — Commit and push

```bash
git add pages/portal/
git commit -m "Add [CLIENT-NAME] audit to client portal"
git push origin main
```

Hostinger will auto-deploy within a minute or two.

---

## Security model

This is a **static site**, not an authenticated app. Security works through unguessable URLs:

- Audit IDs use random suffixes (`CRN-2026-173563` is guessable by license lookup, prefer `CRN-2026-7K3M` patterns for private work)
- The admin roster at `_admin/` is itself unguessable. Treat that URL like a password.
- The audit pages have `<meta name="robots" content="noindex, nofollow">` to prevent search engine indexing.
- The CRN page is intentionally **not in `sitemap.xml`** — only the public portal landing is.

### When this model breaks

You should upgrade to a real authenticated portal when:
- You have **more than ~10 active audits** and want to track who's viewed what
- You need **per-client accounts** with their own login
- You want to **revoke access** instantly (without file deletion)
- Compliance requires **audit logging** of who accessed what

### Recommended upgrade path

1. Move the static assets to Netlify / Vercel / Cloudflare Pages (free tier handles this easily)
2. Add **Supabase Auth** (free tier: 50k monthly users) or **Clerk** ($25/mo) for login
3. Add a `clients` table linking user accounts to audit IDs
4. Replace the static download links with signed URLs that expire

Estimated time: 1–2 weeks of focused work. Cost: $0–$50/mo.

---

## Admin roster

The Farber-only audit list lives at `pages/portal/_admin/`. URL kept private — share via secure channel only.

The roster is a static HTML table. To update it, edit the file and commit. There's no real authentication, so:

- Do not link to it from any public page
- Do not put it in `sitemap.xml`
- Treat the URL as a shared secret among the Farber team

---

## Naming and metadata conventions

### Audit IDs

- Use uppercase
- Use hyphens, not underscores
- Format: `[CLIENT]-[YEAR]-[SUFFIX]`
- Suffix is either a license/registration number (if public) or 4 random alphanumeric characters

### Dates

Always ISO format (`2026-09-21`). This sorts correctly and is unambiguous.

### File naming

`[client-slug]-[deliverable-type].ext`
Examples:
- `crn-construction-farber-recommendations.pdf`
- `crn-construction-farber-recommendations.pptx`

Lowercase, hyphens, no spaces. Matches existing CRN example.

---

## Common tasks

**Revoke access to an audit (without deleting files):**
Replace the audit's `index.html` with a "This audit has been revoked" page. Or add HTTP Basic Auth via `.htaccess` for just that subdirectory.

**Export the roster as CSV:**
The roster HTML table can be copy-pasted into a spreadsheet, or scripted via `curl` + `html2text`.

**Add a new asset type (e.g., ZIP, DOCX, XLSX):**
1. Drop the file in `assets/`
2. Add a new download card to the audit page (copy the existing PDF/PPTX cards)
3. Update `.htaccess` if you need to override the MIME type for the new extension

**Quick visual diff between audits:**
Use `diff` against the CRN template to spot what changed.

---

## Contact

Questions about this folder structure? Find the person who set it up — check the most recent commit on `main`.
