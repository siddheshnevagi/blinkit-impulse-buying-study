# The 10-Minute Cart — Blinkit Impulse-Buying Study

An interactive web survey + behavioural mini-experiment that collects data for the
Consumer Behaviour group project on impulse buying triggered by quick-commerce app
design (Blinkit, Zepto, Swiggy Instamart). It combines a standard Likert questionnaire
with real interaction data: decision-timing on vignettes, click-level events from a
working shopping-cart simulator, and a randomised 2×2 causal experiment.

## What it collects (design summary)

| # | Module | Type | What it maps to |
|---|--------|------|------------------|
| 1 | Screening & consent | gate | 18+, used a Q-commerce app in last 3 months |
| 2 | Demographics | direct | age, gender, city type, occupation, income band |
| 3 | Usage & habits | direct | apps used, tenure, frequency, order value, categories, self-reported unplanned share, usual triggers |
| 4 | Order-history walkthrough | direct + derived | last real order, item-by-item planned / reminder-impulse / true-impulse split (Stern, 1962) |
| 5 | Scenario battery E1–E8 | vignette + behavioural | 8 realistic Blinkit moments (scarcity, threshold nudges, recs, festive merchandising, pack-size anchoring, fee stacking, habit reactivation, unsolicited promos) — likelihood + agreement + **decision time** |
| 6 | Cart simulator | **behavioural (revealed)** | a real, clickable mini shopping app; every add/remove is logged, giving an actual unplanned-share-of-basket number to sit next to the self-reported one |
| 7 | 2×2 experiment | causal | delivery-speed (10 min vs tomorrow) × scarcity cue (present/absent) on one product, randomised between subjects — purchase intention, urge, deliberation, **page dwell time** |
| 8 | Likert batteries | direct | Scarcity/time cues, Promotions, Convenience, Personalisation (stimuli) · Urgency/arousal, Enjoyment (organism) · Impulse-buying tendency, Self-control (trait) · Urge, Impulse-buying behaviour (response) · Regret (welfare) |
| 9 | Debrief | qualitative | open-ended trigger question, optional email for results |

Every module writes to its own table (see `server/db/schema.sql`); the codebook and
column meanings are also baked into the Excel export automatically (`Codebook` sheet).

## Requirements

- **Node.js 20.6 or newer** (for local dev's `--env-file` flag; the app itself runs on
  any modern Node). Check with `node --version`; download from
  [nodejs.org](https://nodejs.org) if needed.
- A **Postgres database** — this project is built for [Supabase](https://supabase.com)'s
  free tier, but any Postgres connection string works.

## Live deployment (Vercel + Supabase)

This is how the hosted version runs, and how to redeploy or fork it:

1. **Create a Supabase project** (free tier) at [supabase.com](https://supabase.com) →
   New project. Once it's up, go to **Project Settings → Database → Connection string**
   and copy the **Transaction pooler** URI (port `6543`) — this is the one that works
   from serverless functions. It looks like:
   `postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres`
2. **Import the repo into Vercel** (New Project → import this GitHub repo). Vercel
   auto-detects `vercel.json` (static files served from `public/`, `api/index.js` as
   the serverless function for all `/api/*` and `/admin/api/*` traffic).
3. In the Vercel project's **Settings → Environment Variables**, add:
   - `DATABASE_URL` — the Supabase connection string from step 1
   - `ADMIN_PASSWORD` — whatever you want the `/admin` password to be
   Redeploy after adding them (or they apply to the next deploy automatically).
4. **Initialize the schema once**, from anywhere with `curl`:
   ```bash
   curl -X POST https://<your-app>.vercel.app/admin/api/migrate -u admin:<ADMIN_PASSWORD>
   ```
   This is idempotent — safe to run again after any future schema changes.
5. Open `https://<your-app>.vercel.app` — the whole study works end to end, and
   `/admin` shows live response counts plus the Excel download.

No other setup is needed. There's no build step (plain HTML/CSS/JS front end), so
every push to the connected GitHub branch redeploys automatically via Vercel.

## Run it locally

```bash
cd webapp
npm install
cp .env.example .env   # then fill in DATABASE_URL and ADMIN_PASSWORD
npm run dev:env
```

Then open **http://localhost:3000** for the study, and **http://localhost:3000/admin**
for the dashboard + Excel download. The first time against a fresh database, initialize
the schema the same way as production:
```bash
curl -X POST http://localhost:3000/admin/api/migrate -u admin:<ADMIN_PASSWORD>
```

If you just want to preview the UI without a database, `npm start` (no `DATABASE_URL`)
still serves the front end fine — only the `/api/*` calls will fail, and the front end
will fall back to its local demo mode (see the note at the bottom of this file).

## Data export

`GET /admin/api/export.xlsx` (password-protected) returns a workbook with:

- **Codebook** — every construct, item, and what it maps to in the S-O-R model.
- **Respondents_Wide** — one row per respondent, one column per item/field. This is
  the sheet to import into Jamovi/JASP/SPSS/Excel for Cronbach's alpha, correlation,
  regression, mediation and the ANOVA on the experiment.
- **Likert_Long**, **Scenarios_Long** — tidy long-format versions of the same data,
  useful for R/Python or for computing item-level response-time statistics.
- **Order_History_Items** — the item-by-item planned/reminder/impulse classification.
- **Cart_Sim_Events** — the full click-by-click log from the shopping simulator
  (every add, remove, and checkout view, with a running cart total and timestamp),
  in case you want to reconstruct individual shopping paths rather than just the
  summary numbers already pivoted into Respondents_Wide.

Before analysis, filter `status == 'completed'` in Respondents_Wide to drop partial
sessions (or keep them and treat `status` as a screening variable — your call).

## Project layout

```
webapp/
  api/
    index.js              Vercel serverless entry point (imports server/app.js)
  server/
    app.js                the Express app (routes + error handler, no .listen())
    server.js             local dev entry point — imports app.js and calls .listen()
    db/schema.sql          full relational schema (PostgreSQL / Supabase)
    db/db.js               pg connection pool + migrate() helper
    routes/api.js          respondent-facing endpoints (create, save-per-section, complete)
    routes/admin.js         password-gated stats + Excel export + /migrate
    export/buildWorkbook.js  builds the multi-sheet .xlsx
  vercel.json             static files from public/, API rewrites to api/index.js
  public/
    index.html, css/styles.css   the study itself (no build step, no framework)
    js/app.js                     step router / state machine
    js/api.js                     API client (falls back to a local demo mode if no server is reachable)
    js/data/items.js               single source of truth for every Likert item
    js/data/scenarios.js           the E1-E8 vignette content
    js/data/catalog.js             cart-simulator product catalog + trigger tags
    js/data/experiment.js          2x2 experiment content + condition assignment
    js/components/*                one file per screen
    admin/index.html                admin dashboard
```

## Notes on the design choices

- **Randomisation happens server-side**, the instant a respondent starts, and is
  stored immediately — this is what makes the experiment (module 7) a legitimate
  between-subjects design rather than something a respondent could game.
- **Decision-time and dwell-time are captured everywhere it's meaningful** (scenario
  battery, experiment page, individual Likert items in the battery) as low-cost
  indirect measures — fast, low-deliberation answers are themselves a finding.
- **The cart simulator is the most important behavioural instrument in the study.**
  It gives you an actual, revealed unplanned-share-of-basket figure to compare against
  the self-reported one from the usage section — a validity check the original
  paper-and-Likert design can't do on its own.
- **Demo mode**: if `public/js/api.js` can't reach `/api/...` (e.g. you open
  `index.html` directly as a file, or the server isn't running), it transparently
  switches to storing answers in the browser's `localStorage` so you can still preview
  and click through the whole study. This is for design review only — always run the
  real server for actual data collection.
