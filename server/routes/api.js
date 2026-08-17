import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { query } from '../db/db.js';

const router = Router();

async function getRespondentIdByUuid(uuid) {
  const { rows } = await query('SELECT id FROM respondents WHERE uuid = $1', [uuid]);
  return rows[0] ? rows[0].id : null;
}

async function requireRespondent(req, res, next) {
  try {
    const id = await getRespondentIdByUuid(req.params.uuid);
    if (!id) return res.status(404).json({ error: 'Unknown respondent' });
    req.respondentId = id;
    next();
  } catch (err) {
    next(err);
  }
}

function asyncRoute(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// --- create respondent ------------------------------------------------------
router.post('/respondents', asyncRoute(async (req, res) => {
  const uuid = randomUUID();
  const { deviceType, userAgent, source } = req.body || {};
  const deliveryCondition = Math.random() < 0.5 ? 'fast' : 'slow';
  const scarcityCondition = Math.random() < 0.5 ? 'present' : 'absent';

  await query(
    `INSERT INTO respondents (uuid, started_at, status, device_type, user_agent, source, exp_delivery_condition, exp_scarcity_condition)
     VALUES ($1, $2, 'in_progress', $3, $4, $5, $6, $7)`,
    [uuid, new Date().toISOString(), deviceType || null, userAgent || null, source || null, deliveryCondition, scarcityCondition]
  );

  res.json({ uuid, expDeliveryCondition: deliveryCondition, expScarcityCondition: scarcityCondition });
}));

router.post('/respondents/:uuid/consent', requireRespondent, asyncRoute(async (req, res) => {
  await query('UPDATE respondents SET consent_given = 1 WHERE id = $1', [req.respondentId]);
  res.json({ ok: true });
}));

router.post('/respondents/:uuid/screen-out', requireRespondent, asyncRoute(async (req, res) => {
  await query("UPDATE respondents SET status = 'screened_out' WHERE id = $1", [req.respondentId]);
  res.json({ ok: true });
}));

// --- profile -----------------------------------------------------------------
router.put('/respondents/:uuid/profile', requireRespondent, asyncRoute(async (req, res) => {
  const { ageGroup, gender, cityType, occupation, incomeBand } = req.body || {};
  await query(
    `INSERT INTO profile (respondent_id, age_group, gender, city_type, occupation, income_band)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (respondent_id) DO UPDATE SET age_group=excluded.age_group, gender=excluded.gender,
       city_type=excluded.city_type, occupation=excluded.occupation, income_band=excluded.income_band`,
    [req.respondentId, ageGroup || null, gender || null, cityType || null, occupation || null, incomeBand || null]
  );
  res.json({ ok: true });
}));

// --- usage habits --------------------------------------------------------------
router.put('/respondents/:uuid/usage', requireRespondent, asyncRoute(async (req, res) => {
  const { appsUsed, primaryApp, monthsUsing, frequency, typicalOrderValueBand, categoriesBought, unplannedShareSelfreport, usualTriggers } = req.body || {};
  await query(
    `INSERT INTO usage_habits (respondent_id, apps_used, primary_app, months_using, frequency, typical_order_value_band, categories_bought, unplanned_share_selfreport, usual_triggers)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (respondent_id) DO UPDATE SET apps_used=excluded.apps_used, primary_app=excluded.primary_app,
       months_using=excluded.months_using, frequency=excluded.frequency, typical_order_value_band=excluded.typical_order_value_band,
       categories_bought=excluded.categories_bought, unplanned_share_selfreport=excluded.unplanned_share_selfreport,
       usual_triggers=excluded.usual_triggers`,
    [
      req.respondentId,
      JSON.stringify(appsUsed || []),
      primaryApp || null,
      monthsUsing || null,
      frequency || null,
      typicalOrderValueBand || null,
      JSON.stringify(categoriesBought || []),
      unplannedShareSelfreport || null,
      JSON.stringify(usualTriggers || []),
    ]
  );
  res.json({ ok: true });
}));

// --- order-history walkthrough --------------------------------------------------
router.put('/respondents/:uuid/order-history', requireRespondent, asyncRoute(async (req, res) => {
  const { meta, items } = req.body || {};
  const m = meta || {};
  await query(
    `INSERT INTO order_history_meta (respondent_id, last_order_total_value, last_order_item_count, last_order_platform, last_order_time_band, last_order_occasion)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (respondent_id) DO UPDATE SET last_order_total_value=excluded.last_order_total_value,
       last_order_item_count=excluded.last_order_item_count, last_order_platform=excluded.last_order_platform,
       last_order_time_band=excluded.last_order_time_band, last_order_occasion=excluded.last_order_occasion`,
    [req.respondentId, m.totalValue ?? null, m.itemCount ?? null, m.platform || null, m.timeBand || null, m.occasion || null]
  );

  await query('DELETE FROM order_history_items WHERE respondent_id = $1', [req.respondentId]);
  const list = items || [];
  for (let idx = 0; idx < list.length; idx++) {
    const it = list[idx];
    const inMind = !!it.inMindBeforeOpening;
    const fast = !!it.decidedWithinSeconds;
    const classification = inMind ? 'planned' : fast ? 'true_impulse' : 'reminder_impulse';
    await query(
      `INSERT INTO order_history_items (respondent_id, item_seq, item_label, in_mind_before_opening, decided_within_seconds, classification)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.respondentId, idx + 1, it.label, inMind ? 1 : 0, fast ? 1 : 0, classification]
    );
  }
  res.json({ ok: true });
}));

// --- likert batch upsert --------------------------------------------------------
router.post('/respondents/:uuid/likert', requireRespondent, asyncRoute(async (req, res) => {
  const { responses } = req.body || {};
  for (const r of responses || []) {
    await query(
      `INSERT INTO likert_responses (respondent_id, section_code, item_code, item_text, value, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (respondent_id, item_code) DO UPDATE SET value=excluded.value, response_time_ms=excluded.response_time_ms`,
      [req.respondentId, r.section, r.code, r.text, r.value, r.responseTimeMs ?? null]
    );
  }
  res.json({ ok: true });
}));

// --- scenario response -----------------------------------------------------------
router.post('/respondents/:uuid/scenario', requireRespondent, asyncRoute(async (req, res) => {
  const { scenarioCode, likelihood, organism, decisionTimeMs, changedMind } = req.body || {};
  await query(
    `INSERT INTO scenario_responses (respondent_id, scenario_code, likelihood_value, organism_value, decision_time_ms, changed_mind)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (respondent_id, scenario_code) DO UPDATE SET likelihood_value=excluded.likelihood_value,
       organism_value=excluded.organism_value, decision_time_ms=excluded.decision_time_ms, changed_mind=excluded.changed_mind`,
    [req.respondentId, scenarioCode, likelihood, organism ?? null, decisionTimeMs ?? null, changedMind ? 1 : 0]
  );
  res.json({ ok: true });
}));

// --- experiment module -------------------------------------------------------------
router.put('/respondents/:uuid/experiment', requireRespondent, asyncRoute(async (req, res) => {
  const b = req.body || {};
  await query(
    `INSERT INTO experiment_responses (respondent_id, delivery_condition, scarcity_condition, pi1, pi2, pi3, exu1, exu2, exu3, manipulation_check, deliberation_selfreport, page_dwell_ms, decision)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (respondent_id) DO UPDATE SET pi1=excluded.pi1, pi2=excluded.pi2, pi3=excluded.pi3,
       exu1=excluded.exu1, exu2=excluded.exu2, exu3=excluded.exu3, manipulation_check=excluded.manipulation_check,
       deliberation_selfreport=excluded.deliberation_selfreport, page_dwell_ms=excluded.page_dwell_ms, decision=excluded.decision`,
    [
      req.respondentId, b.deliveryCondition, b.scarcityCondition,
      b.pi1, b.pi2, b.pi3, b.exu1, b.exu2, b.exu3,
      b.manipulationCheck, b.deliberationSelfreport, b.pageDwellMs, b.decision,
    ]
  );
  res.json({ ok: true });
}));

// --- cart simulator events (batched) + summary -------------------------------------
router.post('/respondents/:uuid/cart-events', requireRespondent, asyncRoute(async (req, res) => {
  const { events } = req.body || {};
  const list = events || [];
  for (let idx = 0; idx < list.length; idx++) {
    const e = list[idx];
    await query(
      `INSERT INTO cart_sim_events (respondent_id, event_seq, event_type, product_id, product_name, product_price, product_tags, cart_total_at_event, timestamp_offset_ms, meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [req.respondentId, idx + 1, e.type, e.productId || null, e.productName || null, e.productPrice ?? null, JSON.stringify(e.tags || []), e.cartTotal ?? null, e.tOffsetMs ?? null, e.meta || null]
    );
  }
  res.json({ ok: true });
}));

router.put('/respondents/:uuid/cart-summary', requireRespondent, asyncRoute(async (req, res) => {
  const b = req.body || {};
  await query(
    `INSERT INTO cart_sim_summary (respondent_id, final_cart_total, final_item_count, planned_items_added, unplanned_items_added,
       crossed_free_delivery_threshold, items_added_after_threshold_nudge, items_added_after_any_checkout_view,
       checkout_view_count, shop_return_count, categories_browsed_count, categories_browsed,
       clicked_scarcity_item, clicked_recommended_item, clicked_festive_item, clicked_bought_earlier_item,
       total_time_ms, noticed_fees)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     ON CONFLICT (respondent_id) DO UPDATE SET final_cart_total=excluded.final_cart_total, final_item_count=excluded.final_item_count,
       planned_items_added=excluded.planned_items_added, unplanned_items_added=excluded.unplanned_items_added,
       crossed_free_delivery_threshold=excluded.crossed_free_delivery_threshold,
       items_added_after_threshold_nudge=excluded.items_added_after_threshold_nudge,
       items_added_after_any_checkout_view=excluded.items_added_after_any_checkout_view,
       checkout_view_count=excluded.checkout_view_count, shop_return_count=excluded.shop_return_count,
       categories_browsed_count=excluded.categories_browsed_count, categories_browsed=excluded.categories_browsed,
       clicked_scarcity_item=excluded.clicked_scarcity_item, clicked_recommended_item=excluded.clicked_recommended_item,
       clicked_festive_item=excluded.clicked_festive_item, clicked_bought_earlier_item=excluded.clicked_bought_earlier_item,
       total_time_ms=excluded.total_time_ms, noticed_fees=excluded.noticed_fees`,
    [
      req.respondentId, b.finalCartTotal, b.finalItemCount, b.plannedItemsAdded, b.unplannedItemsAdded,
      b.crossedFreeDeliveryThreshold ? 1 : 0, b.itemsAddedAfterThresholdNudge, b.itemsAddedAfterAnyCheckoutView,
      b.checkoutViewCount, b.shopReturnCount, b.categoriesBrowsedCount, JSON.stringify(b.categoriesBrowsed || []),
      b.clickedScarcityItem ? 1 : 0, b.clickedRecommendedItem ? 1 : 0, b.clickedFestiveItem ? 1 : 0, b.clickedBoughtEarlierItem ? 1 : 0,
      b.totalTimeMs, b.noticedFees === null || b.noticedFees === undefined ? null : (b.noticedFees ? 1 : 0),
    ]
  );
  res.json({ ok: true });
}));

// --- debrief + completion -----------------------------------------------------------
router.put('/respondents/:uuid/debrief', requireRespondent, asyncRoute(async (req, res) => {
  const { biggestTriggerText, reduceOrdersText, email } = req.body || {};
  await query(
    `INSERT INTO debrief (respondent_id, biggest_trigger_text, reduce_orders_text, email)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (respondent_id) DO UPDATE SET biggest_trigger_text=excluded.biggest_trigger_text,
       reduce_orders_text=excluded.reduce_orders_text, email=excluded.email`,
    [req.respondentId, biggestTriggerText || null, reduceOrdersText || null, email || null]
  );
  res.json({ ok: true });
}));

router.post('/respondents/:uuid/complete', requireRespondent, asyncRoute(async (req, res) => {
  const { rows } = await query('SELECT started_at FROM respondents WHERE id = $1', [req.respondentId]);
  const startedAt = rows[0] ? new Date(rows[0].started_at).getTime() : Date.now();
  const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
  await query("UPDATE respondents SET status = 'completed', completed_at = $1, duration_seconds = $2 WHERE id = $3",
    [new Date().toISOString(), durationSeconds, req.respondentId]);
  res.json({ ok: true, durationSeconds });
}));

export default router;
