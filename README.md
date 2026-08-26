# Shopee Link Converter

A free, static web app that turns any pasted `shopee.sg` link into a commission-tracked affiliate link — instantly, in the browser.

## How it works

Shopee attributes commission based on the `utm_source=an_<affiliate_id>` / `utm_medium=affiliates` parameters on a link (this is the exact format your affiliate dashboard generates — a `shope.ee` shortlink is just a redirect wrapper around those same params).

The app:

1. Accepts bulk-pasted links (one per line) in any format: product (`...-i.{shopId}.{itemId}`), `/product/{shopId}/{itemId}`, shop (`/shop/{id}`), or search/category pages.
2. Strips all existing tracking params from the original link — so nobody else's affiliate ID steals your attribution.
3. Appends your affiliate parameters (`utm_source=an_14312450026&utm_medium=affiliates&utm_campaign=-&utm_content=----&af_siteid=an_14312450026&pid=affiliates`).
4. Shows each converted link as a clickable card (opens Shopee in a new tab) with a per-row copy button, plus a sticky "Copy all" bar to grab every link at once for broadcasts.

Shortlinks (`shope.ee/...`) can't be expanded client-side — the app flags them and asks you to open and copy the full URL instead.

## Files

```
index.html   — layout, Tailwind CDN, design
style.css    — custom animations and polish
app.js       — URL parsing + UI logic (affiliate ID constant at top)
```
The affiliate ID (`14312450026`) is fixed and hardcoded in `app.js` — users only paste links and get converted links back; they can't change the ID.

## Deploy (free)

No build step needed — just host the folder:

- **Netlify:** drag-and-drop the folder at app.netlify.com/drop
- **Vercel:** `vercel` CLI or import the repo — static build, no config
- **GitHub Pages:** push to a repo → Settings → Pages → deploy from the branch

## Roadmap

- **v2:** real `shope.ee` shortlinks via the official Shopee Affiliate Open API (requires App ID + Secret from the affiliate dashboard's Open API section; adds a small serverless function to keep the secret safe).

## Disclaimer

Always verify attribution in your Shopee Affiliate dashboard (Click/Conversion reports) after posting. Affiliate terms and tracking rules are subject to change by Shopee.
