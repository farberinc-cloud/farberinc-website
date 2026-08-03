# Farber.Inc Chat Widget — Setup

A floating, AI-powered chat widget for `farberinc.media` that answers questions
about Farber.Inc's services, explains **SEO, AEO, and GEO** in plain English,
and offers to capture lead details when the prospect is ready.

- **Frontend**: vanilla HTML/CSS/JS — no build step, no framework
- **Backend**: `api.php` proxies to **MiniMax (model `MiniMax-M3`)** using your
  Subscription Key
- **Brand**: matched to Farber.Inc palette (navy `#0A1628`, gold `#B8860B`,
  cream `#FAF8F5`) and Playfair Display / Inter / Montserrat typography
- **Lead capture**: post-answer in-chat prompt + smart one-ask-on-close behavior
- **Lead storage**: appends to `chat/leads.json`; optionally emails or POSTs to
  a webhook

---

## Files

| File | Purpose |
|---|---|
| `embed.js` | Drop this single script tag into every page that needs the widget. |
| `chat-widget.css` | Brand-matched styles for the bubble and panel. |
| `chat-widget.js` | Self-contained widget UI (bubble, panel, streaming, lead capture). |
| `api.php` | Backend proxy to MiniMax. Validates input, rate-limits, stores leads. |
| `system-prompt.php` | The bot's "brain" — brand voice, services, FAQ, guardrails. Edit to retune. |
| `.htaccess` | Hardens the folder: blocks direct access to `*.json` and `*.log`. |
| `leads.json` | Auto-created on first lead. **Not web-accessible** thanks to `.htaccess`. |
| `conversations.log` | Append-only transcript summary. Useful for QA. |

---

## 1. Install on Hostinger

### A. Set the environment variable

The `MINIMAX_API_KEY` must be set in the server environment. Two options:

**Option 1 — hPanel (recommended for Hostinger)**:

1. Log in to **hPanel** → **Advanced** → **Cron Jobs** (or **Environment Variables**,
   depending on your Hostinger version — the wording changed in 2025).
2. Add a variable: `MINIMAX_API_KEY = sk-cp-…` (your Subscription Key).
3. **Restart PHP** (hPanel → Hosting → Manage → Restart PHP / Clear cache).

**Option 2 — `.user.ini` at the site root** (fallback if env vars aren't
available in your Hostinger plan):

Create or edit `public_html/.user.ini`:

```ini
MINIMAX_API_KEY=sk-cp-your-key-here
```

`.user.ini` is read by PHP-FPM on every request; no restart needed.

### B. (Optional) Webhook + email notifications for leads

In the same env-var location, add any of:

```
LEAD_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
LEAD_EMAIL_TO=you@youremail.com
LEAD_EMAIL_FROM=wordpress@yourdomain.com
```

- `LEAD_WEBHOOK_URL` — POSTed JSON to this URL whenever a lead is captured.
  Works with Slack incoming webhooks, Discord, Zapier, Make, HubSpot, etc.
- `LEAD_EMAIL_TO` — sends a plain-text email via PHP `mail()`.
- `LEAD_EMAIL_FROM` — required by some mail servers; defaults to
  `wordpress@<your-host>`.

### C. Upload the `chat/` folder

Upload the entire `chat/` directory into your site's document root (typically
`public_html/chat/`) so the final layout is:

```
public_html/
├── index.html
├── chat/
│   ├── api.php
│   ├── chat-widget.css
│   ├── chat-widget.js
│   ├── embed.js
│   ├── system-prompt.php
│   └── .htaccess
├── pages/
└── …
```

### D. Inject the embed snippet

Add this single line **before `</body>` on every page that should have the
widget** (index.html, all service pages, all blog pages, all city/geo pages).
Do NOT add to `pages/legal/*.html` (noindex pages).

```html
<script src="/chat/embed.js" defer></script>
```

If your site is served from a subdirectory, change the path accordingly
(e.g. `/subdir/chat/embed.js`).

### E. Permissions

The PHP backend writes to `leads.json`, `conversations.log`, `php-error.log`,
and `rate-limit.json`. Make sure the PHP user can write to the `chat/`
directory:

```bash
chmod 755 chat/
# Files inside are created with mode 0640 by api.php — that's fine.
```

If your Hostinger plan uses suPHP / different PHP user, the file is created
automatically on the first chat / lead / ping.

---

## 2. Verify it works

1. Visit any page on the site. The bottom-right should show a navy bubble with
   a gold "F.I" chat icon.
2. Click it. You should see a panel open with the welcome message and four
   quick-reply chips.
3. Click a chip, or type a question like "What's the difference between SEO
   and AEO?". The bot should answer using Farber.Inc's voice and point to the
   relevant service or page.
4. After the first reply, the bot should politely offer to capture your name
   and email.
5. Click the launcher to close the panel. The smart close bar should appear
   once, asking if you want to share details.
6. Submit a lead. Check `chat/leads.json` via SFTP to confirm it was saved.

### Troubleshooting

| Symptom | Fix |
|---|---|
| Bubble doesn't appear | Hard-refresh (Cmd/Ctrl-Shift-R). Check browser console for 404s on `embed.js` / `chat-widget.js` / `chat-widget.css`. |
| "Server misconfigured" | `MINIMAX_API_KEY` is not set or PHP can't see it. Add it to hPanel environment variables and restart PHP, or use `.user.ini`. |
| Bot replies with stack trace or PHP warning | Check `chat/php-error.log`. Common cause: `system-prompt.php` syntax error after editing. |
| CORS error in console | The page and API are on different origins. Either serve them from the same origin, or set `MINIMAX_CORS_ORIGINS=https://your-site` in env vars. |
| 429 "Too many questions" | Rate limit hit (30 chat / 10 min per session). Wait, or raise the limit in `api.php` (search for `$limitChat`). |
| Leads not arriving via webhook | Curl the webhook URL directly with the same JSON shape to confirm it's reachable from Hostinger. |

---

## 3. Updating the bot

To change the bot's voice, knowledge, or guardrails, edit
`chat/system-prompt.php`. The file holds a single PHP heredoc string —
modify the text and re-upload the file. No rebuild needed.

---

## 4. Optional: viewing leads

Easiest path: SFTP into your Hostinger account, download `chat/leads.json`.

If you want a nicer UI, point `LEAD_WEBHOOK_URL` at:

- **Slack / Discord / MS Teams** — get notified in real time
- **Zapier / Make** — fan out to a Google Sheet, Airtable, HubSpot, etc.
- **A Google Apps Script Web App** — append to a Google Sheet directly

Anywhere that accepts a JSON POST will work.

---

## 5. Security notes

- `MINIMAX_API_KEY` is held only on the server. The browser never sees it.
- Input is sanitized: messages are capped at 4,000 chars, capped at 20 turns,
  and stripped of any non-`{role, content}` shape.
- Per-session rate limit: 30 chat / 10 minutes, 10 leads / 10 minutes.
- `leads.json`, `conversations.log`, `php-error.log`, and `rate-limit.json`
  are blocked from direct web access by `.htaccess`.
- Output has CORS restricted to same-origin by default; widen with the
  `MINIMAX_CORS_ORIGINS` env var if you serve the chat from a subdomain.

---

Built by **Mavis** for **Randy Farber / Farber.Inc** · 2026
