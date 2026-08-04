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

> **Heads up:** Hostinger's hPanel "Environment Variables" menu is **only for
> Node.js / Docker** apps, not PHP shared hosting. For PHP, use a `.env` file
> (recommended) or a `.htaccess` `SetEnv` directive. Both are wired up in
> `api.php` automatically.

### A. Create `chat/.env` with your API key

In the `chat/` folder, create a file called **`.env`** (note the leading dot)
containing:

```ini
MINIMAX_API_KEY=sk-cp--xI4K_bB0LzzdPbChxcUg3rBybjJ7VfY3KhB4aUXQbVFN1afE5QrEDIgWHxR_rwNEOk8a3juGQwyIrETakPOTsAzcj9gAD851Ig-D72lvpeVeBsZuI8d8j8
```

That's the only line required to get the bot working. A full template lives
in `chat/.env.example` (the real `.env` is excluded from git and blocked from
web access by `.htaccess`).

**How to create it on Hostinger:**

- **File Manager**: hPanel → Files → File Manager → navigate to
  `public_html/chat/` → **+ File** → name it `.env` → paste the line above.
- **SFTP**: connect, `cd public_html/chat`, `nano .env`, paste, save.
- **SSH**: same as SFTP, just use the terminal directly.

### B. (Optional) Add more env vars to `.env`

```ini
# Lead notifications (optional)
LEAD_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
LEAD_EMAIL_TO=you@youremail.com
LEAD_EMAIL_FROM=wordpress@yourdomain.com

# Override defaults (only if you know what you're doing)
# MINIMAX_BASE_URL=https://api.minimax.io/v1
# MINIMAX_MODEL=MiniMax-M3
# CHAT_DEBUG=0
```

### C. (Alternative) `.htaccess` `SetEnv` directive

If you'd rather not keep a `.env` file, you can put the key in
`public_html/.htaccess` instead. **Edit, don't replace, your existing
`.htaccess` — add this line near the top:**

```apache
SetEnv MINIMAX_API_KEY "sk-cp--xI4K_bB0LzzdPbChxcUg3rBybjJ7VfY3KhB4aUXQbVFN1afE5QrEDIgWHxR_rwNEOk8a3juGQwyIrETakPOTsAzcj9gAD851Ig-D72lvpeVeBsZuI8d8j8"
```

`.htaccess` `SetEnv` is read by Apache on every request, so PHP picks it up
via `getenv()` / `$_SERVER`. Works on every Hostinger PHP plan.

### D. Upload the `chat/` folder

The repo already has the `chat/` directory committed. If you're deploying via
SFTP/File Manager, just upload it to `public_html/chat/`. If you're using
Hostinger's Git integration, the latest commit already includes everything.

Final layout should be:

```
public_html/
├── index.html
├── chat/
│   ├── .env              ← CREATE THIS with your key
│   ├── api.php
│   ├── chat-widget.css
│   ├── chat-widget.js
│   ├── embed.js
│   ├── system-prompt.php
│   ├── .htaccess         (blocks web access to .env, .json, .log, .md)
│   └── .env.example
├── pages/
└── …
```

### E. Permissions

The PHP backend writes to `leads.json`, `conversations.log`, `php-error.log`,
and `rate-limit.json`. Files are created on first use with mode 0640. Make
sure the `chat/` directory is writable by the PHP user:

```bash
chmod 755 chat/
```

If your Hostinger plan uses suPHP / a different PHP user, files are created
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
