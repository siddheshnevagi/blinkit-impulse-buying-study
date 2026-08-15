-- Blinkit Impulse-Buying Study — relational schema (PostgreSQL / Supabase)
-- One row per respondent in `respondents`; everything else hangs off respondent_id.
-- Long/tidy tables (likert_responses, scenario_responses, cart_sim_events) are best
-- for analysis software; the Excel export additionally pivots them into wide sheets
-- (one row per respondent, one column per item) for regression / SEM / Cronbach's alpha.
-- Applied on demand via the password-gated POST /admin/api/migrate endpoint (idempotent —
-- safe to run more than once), so no separate migration tooling is required.

CREATE TABLE IF NOT EXISTS respondents (
  id                      SERIAL PRIMARY KEY,
  uuid                    TEXT NOT NULL UNIQUE,
  started_at              TEXT NOT NULL,
  completed_at            TEXT,
  consent_given           INTEGER NOT NULL DEFAULT 0,
  status                  TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | completed | screened_out | abandoned
  device_type             TEXT,
  user_agent              TEXT,
  source                  TEXT,                                 -- e.g. whatsapp, instagram, direct (from ?src=)
  exp_delivery_condition  TEXT,                                  -- fast | slow
  exp_scarcity_condition  TEXT,                                  -- present | absent
  duration_seconds        INTEGER
);

CREATE TABLE IF NOT EXISTS profile (
  respondent_id  INTEGER PRIMARY KEY REFERENCES respondents(id) ON DELETE CASCADE,
  age_group      TEXT,
  gender         TEXT,
  city_type      TEXT,
  occupation     TEXT,
  income_band    TEXT
);

CREATE TABLE IF NOT EXISTS usage_habits (
  respondent_id                INTEGER PRIMARY KEY REFERENCES respondents(id) ON DELETE CASCADE,
  apps_used                    TEXT,  -- JSON array
  primary_app                  TEXT,
  months_using                 TEXT,
  frequency                    TEXT,
  typical_order_value_band     TEXT,
  categories_bought            TEXT,  -- JSON array
  unplanned_share_selfreport   TEXT,
  usual_triggers                TEXT  -- JSON array
);

CREATE TABLE IF NOT EXISTS order_history_meta (
  respondent_id           INTEGER PRIMARY KEY REFERENCES respondents(id) ON DELETE CASCADE,
  last_order_total_value  REAL,
  last_order_item_count   INTEGER,
  last_order_platform     TEXT,
  last_order_time_band    TEXT,
  last_order_occasion     TEXT
);

CREATE TABLE IF NOT EXISTS order_history_items (
  id                        SERIAL PRIMARY KEY,
  respondent_id             INTEGER NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  item_seq                  INTEGER NOT NULL,
  item_label                TEXT NOT NULL,
  in_mind_before_opening    INTEGER NOT NULL, -- 0/1
  decided_within_seconds    INTEGER NOT NULL, -- 0/1
  classification            TEXT NOT NULL     -- planned | reminder_impulse | true_impulse
);

CREATE TABLE IF NOT EXISTS likert_responses (
  id                 SERIAL PRIMARY KEY,
  respondent_id      INTEGER NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  section_code       TEXT NOT NULL,
  item_code          TEXT NOT NULL,
  item_text          TEXT NOT NULL,
  value              INTEGER NOT NULL,
  response_time_ms   INTEGER,
  UNIQUE(respondent_id, item_code)
);

CREATE TABLE IF NOT EXISTS scenario_responses (
  id                 SERIAL PRIMARY KEY,
  respondent_id      INTEGER NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  scenario_code      TEXT NOT NULL,
  likelihood_value   INTEGER NOT NULL,
  decision_time_ms   INTEGER,
  changed_mind       INTEGER DEFAULT 0,
  UNIQUE(respondent_id, scenario_code)
);

-- Each scenario now asks a single likelihood question instead of a paired
-- likelihood+agreement question (the agreement rating was redundant with the
-- likelihood rating in practice). Drops the column on deployments created before
-- this change; a no-op on fresh installs.
ALTER TABLE scenario_responses DROP COLUMN IF EXISTS agreement_value;

CREATE TABLE IF NOT EXISTS experiment_responses (
  respondent_id             INTEGER PRIMARY KEY REFERENCES respondents(id) ON DELETE CASCADE,
  delivery_condition        TEXT,
  scarcity_condition        TEXT,
  pi1 INTEGER, pi2 INTEGER, pi3 INTEGER,
  exu1 INTEGER, exu2 INTEGER, exu3 INTEGER,
  manipulation_check        INTEGER,
  deliberation_selfreport   INTEGER,
  page_dwell_ms             INTEGER,
  decision                  TEXT -- yes | no | maybe
);

CREATE TABLE IF NOT EXISTS cart_sim_events (
  id                      SERIAL PRIMARY KEY,
  respondent_id           INTEGER NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  event_seq               INTEGER NOT NULL,
  event_type              TEXT NOT NULL, -- add_to_cart | remove_from_cart | category_filter | checkout_viewed
                                          -- | back_to_shop | threshold_crossed | place_order
  product_id              TEXT,
  product_name            TEXT,
  product_price           REAL,
  product_tags            TEXT, -- JSON array
  cart_total_at_event     REAL,
  timestamp_offset_ms     INTEGER,
  meta                    TEXT  -- JSON object, event-type-specific extra detail (see README)
);

-- Full click-by-click log gets a `meta` column for event-specific detail (category
-- browsed, which threshold was crossed and in which direction, how many times checkout
-- had already been seen at the moment of an add/remove). A no-op on fresh installs.
ALTER TABLE cart_sim_events ADD COLUMN IF NOT EXISTS meta TEXT;

CREATE TABLE IF NOT EXISTS cart_sim_summary (
  respondent_id                        INTEGER PRIMARY KEY REFERENCES respondents(id) ON DELETE CASCADE,
  final_cart_total                     REAL,
  final_item_count                     INTEGER,
  planned_items_added                  INTEGER,
  unplanned_items_added                INTEGER,
  crossed_free_delivery_threshold      INTEGER,
  items_added_after_threshold_nudge    INTEGER,
  items_added_after_any_checkout_view  INTEGER,
  checkout_view_count                  INTEGER,
  shop_return_count                    INTEGER,
  categories_browsed_count             INTEGER,
  categories_browsed                   TEXT, -- JSON array, in the order first browsed
  clicked_scarcity_item                INTEGER,
  clicked_recommended_item             INTEGER,
  clicked_festive_item                 INTEGER,
  clicked_bought_earlier_item          INTEGER,
  total_time_ms                        INTEGER,
  noticed_fees                         INTEGER
);

-- New behavioural-path columns: how many times the fee breakdown was seen, how many
-- times the respondent bounced back to shopping, and which category rails they
-- browsed. A no-op on fresh installs.
ALTER TABLE cart_sim_summary ADD COLUMN IF NOT EXISTS items_added_after_any_checkout_view INTEGER;
ALTER TABLE cart_sim_summary ADD COLUMN IF NOT EXISTS checkout_view_count INTEGER;
ALTER TABLE cart_sim_summary ADD COLUMN IF NOT EXISTS shop_return_count INTEGER;
ALTER TABLE cart_sim_summary ADD COLUMN IF NOT EXISTS categories_browsed_count INTEGER;
ALTER TABLE cart_sim_summary ADD COLUMN IF NOT EXISTS categories_browsed TEXT;

CREATE TABLE IF NOT EXISTS debrief (
  respondent_id         INTEGER PRIMARY KEY REFERENCES respondents(id) ON DELETE CASCADE,
  biggest_trigger_text  TEXT,
  reduce_orders_text    TEXT,
  email                 TEXT
);

CREATE INDEX IF NOT EXISTS idx_likert_respondent ON likert_responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_scenario_respondent ON scenario_responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_cartevents_respondent ON cart_sim_events(respondent_id);
CREATE INDEX IF NOT EXISTS idx_orderitems_respondent ON order_history_items(respondent_id);
