# ✅ Tickbox

Playful, no-signup checklists. Make lists, check things off, watch the confetti fly.
Everything is stored in the visitor's browser (`localStorage`) — **no backend, no accounts, no tracking.**

A static tool for **tickbox.toolwizhub.com**.

---

## Features

- **Multiple lists** with per-list progress rings in the sidebar
- **Add / check / uncheck / edit / delete** items inline
- **Drag to reorder** open items
- **Per-list progress bar** + 🎉 **confetti** when a list hits 100%
- **Templates** — project setup, projects-to-pick-up, packing, groceries, reading, habits
- **Share via link** — the whole list is encoded into the URL hash; the recipient gets their own copy (no server involved)
- **Copy as Markdown** — paste straight into GitHub issues, Slack, notes
- **Auto-saves** to `localStorage`; reload-safe
- Fully **responsive** + respects `prefers-reduced-motion`

## Files

```
tickbox/
├── index.html   # markup + meta/OG tags
├── styles.css   # playful theme (no framework)
├── app.js       # all logic — state, render, drag, share, export, confetti
└── README.md
```

No build step. No dependencies. Open `index.html` and it works.

## Run locally

```bash
cd tickbox
python3 -m http.server 8080
# → http://localhost:8080
```

(Any static server works; you can also just open `index.html` directly, though the share-clipboard API prefers a real origin.)

## Deploy to Cloudflare Pages (tickbox.toolwizhub.com)

### Option A — Wrangler CLI
```bash
cd tickbox
npx wrangler pages deploy . --project-name=tickbox
```

### Option B — Dashboard
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. Name the project `tickbox`, drag the `tickbox/` folder contents in, deploy.

### Point the subdomain
1. In the Pages project → **Custom domains** → **Set up a custom domain** → enter `tickbox.toolwizhub.com`.
2. Cloudflare auto-creates the proxied CNAME on the `toolwizhub.com` zone (it manages that zone already).
3. Wait for the cert to issue (usually a minute or two) → done.

## Data & privacy

All data lives in the browser under the `tickbox:v1` localStorage key. Clearing site data wipes it.
Share links carry the list contents inside the URL (base64) — they are **not** stored anywhere by us.

## Roadmap ideas

- Light/dark toggle
- Due dates / reminders
- Sub-items (nested checklists)
- Optional sync (only if accounts ever get added)
