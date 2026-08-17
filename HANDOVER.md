# Handover — The 10-Minute Cart (Blinkit Impulse-Buying Study)

Last updated: 2026-08-17. Written for whoever picks this project up next — a
teammate, a future you, or an AI assistant in a fresh session with no memory of how
this was built.

## What this is

An interactive web survey + behavioural mini-experiment for a Consumer Behaviour
course project studying impulse buying triggered by quick-commerce app design
(Blinkit). Built around the Stimulus–Organism–Response framework: realistic app
vignettes (Stimulus) → a paired likelihood + felt-state rating (Response / Organism)
→ a real clickable shopping simulation that logs actual behaviour rather than
self-report.

Source design docs live one level up, outside this repo: `../blinkit-impulse-buying-project-blueprint.md`
(the original academic-depth study design) and `../QuickCommerce_ImpulseBuying_ConceptNote.pdf`
(the S-O-R concept note). Treat both as historical context — the live app has
diverged from both in scope (see "What changed" below); the code is the source of
truth for what's actually being asked today.

## Live links

| What | Where |
|---|---|
| Live study | https://blinkit-impulse-buying-study.vercel.app |
| Admin dashboard | https://blinkit-impulse-buying-study.vercel.app/admin |
| GitHub repo | https://github.com/siddheshnevagi/blinkit-impulse-buying-study (public) |
| Vercel project | `jira-rice2` team → `blinkit-impulse-buying-study` |
| Database | Supabase, connected via Vercel's native Supabase integration (Storage tab) |

**Admin password:** not stored in this file since the repo is public — it's in
Vercel's Environment Variables (`ADMIN_PASSWORD`) and was shared with you directly in
chat when it was generated. If it's lost, reset it: `vercel env rm ADMIN_PASSWORD`
then `vercel env add ADMIN_PASSWORD` for each environment, or via the Vercel
dashboard's Environment Variables page — then hit `/admin` again with the new value.

## Data snapshot as of this writing

124 respondents (74 completed, 50 in progress), 107 mobile / 17 desktop, ~3 min
average completion time. **Do not run bulk `DELETE FROM respondents` or similar —
this is live collected data, not test data.** If you need to test something against
the live database, tag the session (`?src=your-test-name`) and clean up only that
exact row afterward, matched by UUID.

## Current survey flow (4 parts)

1. **Demographics** — age group, gender, occupation
2. **Usage habits** — order frequency, categories bought, self-reported unplanned share
3. **Scenarios** — 7 vignettes (E1–E7), each a real Blinkit dark-pattern moment shown as
   a phone mock, with **two** ratings per scenario:
   - `likelihood` (Response): "I would add this to my cart" — 1 Very unlikely to 5 Very likely
   - `organism` (Organism): the felt internal state driving that action — urgency,
     rationalization, effortlessness, mood, heuristic trust, annoyance, or habitual
     ease, worded specifically per scenario — 1 Strongly disagree to 5 Strongly agree
   - Plus decision time (ms) and whether they changed their answer, captured silently
4. **Cart simulator** — a real clickable mini shopping app. Task: "buy milk and eggs."
   Everything else they add, every category browsed, every checkout view, every trip
   back to shopping, and the exact moment a fee threshold is crossed gets logged as an
   event (see `cart_sim_events`) plus rolled up into a summary row.

Landing → thank-you screen. No consent/screening gate, no order-history walkthrough,
no Likert battery, no 2×2 experiment, no debrief — all removed (see changelog).

## Architecture

- **Frontend**: plain HTML/CSS/JS, no framework, no build step. `public/js/app.js` is
  a tiny step-router; each screen is a component in `public/js/components/`.
- **Backend**: Express, running as a single Vercel serverless function
  (`api/index.js` → `server/app.js`). Static files under `public/` are served
  directly by Vercel (see `vercel.json`), not by the function.
- **Database**: Postgres via Supabase, connected through Vercel's native Supabase
  marketplace integration. `server/db/db.js` reads `POSTGRES_URL` (auto-injected by
  that integration) with `DATABASE_URL` as a manual fallback.
- **Deploy**: every push to `main` on GitHub auto-deploys via Vercel's Git
  integration. No manual deploy step.

## Repo layout

```
webapp/
  api/index.js              Vercel serverless entry point (imports server/app.js)
  server/
    app.js                  Express app: routes + error handler (no .listen())
    server.js               local dev entry point
    db/schema.sql            full schema, applied via /admin/api/migrate (idempotent)
    db/db.js                 pg connection pool
    routes/api.js            respondent-facing endpoints
    routes/admin.js          password-gated stats + Excel export + /migrate
    export/buildWorkbook.js   builds the Excel workbook
  vercel.json                static-file + serverless routing config
  public/
    index.html, css/styles.css
    js/app.js                 step router
    js/api.js                 API client (has a localStorage demo-mode fallback)
    js/data/scenarios.js       the 7 scenarios — situation, mock UI, likelihood + organism text
    js/data/catalog.js         cart-simulator product catalog + trigger tags
    js/data/items.js           Likert item definitions — no longer rendered anywhere,
                                kept only because nothing currently reads it; safe to
                                delete if you want to fully retire that capability
    js/components/*            one file per screen
    admin/index.html            admin dashboard
```

## Database — active vs. legacy tables

`server/db/schema.sql` still defines tables for modules that were removed from the
live flow. They exist (for `/admin/api/migrate` idempotency and to avoid a risky
`DROP TABLE` on a live database) but are **never written to or read from** by current
code. Don't be confused by their presence:

**Actively used:** `respondents`, `profile`, `usage_habits`, `scenario_responses`
(now includes `organism_value`, `item3_value`, `item4_value` — see "Model 2" below),
`cart_sim_summary`, `cart_sim_events`.

**Legacy / always empty going forward:** `order_history_meta`, `order_history_items`,
`likert_responses`, `experiment_responses`, `debrief`. The Excel export
(`buildWorkbook.js`) already excludes these — it only surfaces the active tables.

## Excel export

`GET /admin/api/export.xlsx` (password-protected). Four sheets: **Codebook** (plain-
language description of every column), **Respondents_Wide** (one row per respondent —
the sheet to import into Jamovi/SPSS/Excel for analysis), **Scenarios_Long** (tidy
long-format scenario data, useful for item-level work), **Cart_Sim_Events** (the full
click-by-click behavioural log with a JSON `meta` column of event-specific detail).

## Running locally

Requires Node 20.6+ (nothing installed on the original dev machine — see the "no
runtime" note below if that's still true for you).

```bash
cd webapp
npm install
cp .env.example .env   # fill in DATABASE_URL (Transaction pooler string) + ADMIN_PASSWORD
npm run dev:env
```

First run against a fresh database: `curl -X POST http://localhost:3000/admin/api/migrate -u admin:<ADMIN_PASSWORD>`.

## Known quirks

- **Supabase direct connection (port 5432) only resolves over IPv6** in most
  environments, including Vercel's serverless functions. Always use the
  **Transaction pooler** connection (port 6543) if configuring `DATABASE_URL`
  manually. The Vercel-Supabase native integration's `POSTGRES_URL` already points
  at the pooler, so this only matters if you bypass that integration.
- The pooler's connection string embeds `?sslmode=require`, which makes the `pg`
  driver derive its own strict TLS settings and ignore an explicit
  `ssl: { rejectUnauthorized: false }` option — throws "self-signed certificate in
  certificate chain". Fixed in `server/db/db.js` by stripping `sslmode` from the
  connection string before constructing the pool and driving SSL purely through the
  explicit option. If you ever see that error again, this is almost certainly why.
- Async DOM re-renders in the frontend mean `document.querySelector(...)` right after
  a `.click()` can race the actual state update — if you're scripting UI tests,
  await a short delay (~300ms) before asserting on the new screen's content.

## What changed, roughly in order

1. Built the original full design: consent/screening, demographics, usage, order-
   history walkthrough, 8-scenario battery (likelihood + agreement), cart simulator,
   a randomised 2×2 experiment, a full Likert battery (S-O-R constructs, trait
   impulsivity, self-control, regret), and a debrief.
2. Migrated the backend from local SQLite to Postgres/Supabase for a real Vercel
   deployment; fixed the IPv6/SSL pooler issues above.
3. Progressively trimmed the survey for completion rate: removed consent/screening,
   removed 6 demographic/usage fields, removed the order-history walkthrough, removed
   the 2×2 experiment, the entire Likert battery, and the debrief — leaving cart
   checkout as the final step.
4. Removed the redundant per-scenario "agreement" question (it correlated too closely
   with likelihood to justify the extra tap) and one scenario (E8, unsolicited promo
   pop-up), and stripped all "time to complete" language from the UI.
5. Fixed a real bug where going back and forward through scenarios or the cart
   simulator silently discarded answers (state lived in local variables that reset on
   re-render instead of on the persistent session object).
6. Massively expanded cart-simulator event logging: category browsing, checkout/shop
   round-trips, explicit fee-threshold-crossing events, and a "how many times had they
   seen the bill" tag on every add/remove — so the full "saw the fee, went back, added
   more" behavioural path is directly queryable instead of inferred.
7. Trimmed the Excel export to match the live flow (dropped ~85 dead columns from
   removed modules).
8. **Brought back a second scenario question**, this time explicitly framed as the
   S-O-R **Organism** construct (felt urgency / mood / heuristic trust / annoyance /
   effortlessness) rather than generic "agreement" — distinct wording per scenario,
   added as a new `organism_value` column via an additive migration that left all
   prior respondent data untouched.
9. **"Model 2" (2026-08-18):** each scenario's single Organism item is now backed by
   3 items instead of 1 — the existing item plus 2 new ones, all measuring the same
   construct (`PU`/`PS`/`PP`/`PA`/`HT`/`NA`/`CE`, one per scenario). New items render
   directly below the existing 2 on the same scenario screen; nothing moved or was
   removed. Added `item3_value`/`item4_value` columns to `scenario_responses` (additive
   migration, existing rows get NULL) and new construct-score + `II_composite` DV
   columns to the `Respondents_Wide` export sheet. Spec: `../Fresh Start/model2-survey-spec.md`.

## If you're picking this up cold

- Read `README.md` first for the deployment/setup mechanics this file doesn't repeat.
- Check `server/db/schema.sql` top-to-bottom before touching the database — every
  migration is a comment explaining why, appended in order rather than rewritten, so
  the file itself is a changelog of every schema decision.
- Before running any destructive-sounding command against production, check the
  respondent count first (`GET /admin/api/stats`) and confirm it's what you expect.
