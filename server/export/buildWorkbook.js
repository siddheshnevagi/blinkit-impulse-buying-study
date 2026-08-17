import ExcelJS from 'exceljs';
import { query } from '../db/db.js';
import { SCENARIOS } from '../../public/js/data/scenarios.js';

async function all(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows;
}

function safeJson(str, fallback = []) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
  row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
}

// Mirrors the current study exactly: demographics (age/gender/occupation), usage habits
// (frequency/categories/unplanned share), the 7-scenario vignette battery, and the cart
// simulator (summary + full click-by-click event log). No consent/screening, order-history,
// Likert batteries, 2x2 experiment, or debrief columns — those modules were removed from
// the live flow, so their tables stay empty and are left out of the export entirely.
export async function buildWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Blinkit Impulse-Buying Study';
  wb.created = new Date();

  const respondents = await all('SELECT * FROM respondents ORDER BY id');
  const profiles = Object.fromEntries((await all('SELECT * FROM profile')).map((r) => [r.respondent_id, r]));
  const usage = Object.fromEntries((await all('SELECT * FROM usage_habits')).map((r) => [r.respondent_id, r]));
  const cartSummary = Object.fromEntries((await all('SELECT * FROM cart_sim_summary')).map((r) => [r.respondent_id, r]));

  const scenarioRows = await all('SELECT * FROM scenario_responses');
  const scenarioByRespondent = {};
  for (const r of scenarioRows) {
    (scenarioByRespondent[r.respondent_id] ??= {})[r.scenario_code] = r;
  }

  const allScenarioCodes = SCENARIOS.map((s) => s.code);

  // ---------------------------------------------------------------- Codebook
  const codebook = wb.addWorksheet('Codebook');
  codebook.columns = [
    { header: 'Column in Respondents_Wide', key: 'col', width: 34 },
    { header: 'What it is', key: 'section', width: 26 },
    { header: 'Item text / description', key: 'text', width: 60 },
    { header: 'Scale / format', key: 'scale', width: 30 },
  ];
  styleHeader(codebook.getRow(1));
  codebook.addRow({ col: 'age_group / gender / occupation', section: 'Demographics', text: 'Self-reported profile', scale: 'category' });
  codebook.addRow({ col: 'order_frequency', section: 'Usage habits', text: 'How often the respondent orders on quick-commerce apps', scale: 'category' });
  codebook.addRow({ col: 'categories_bought', section: 'Usage habits', text: 'What they usually buy (multi-select)', scale: 'semicolon-separated list' });
  codebook.addRow({ col: 'unplanned_share_selfreport', section: 'Usage habits', text: 'Self-reported share of orders that are unplanned', scale: 'category (None / <25% / 25-50% / 50-75% / >75%)' });
  for (const sc of SCENARIOS) {
    codebook.addRow({ col: `${sc.code}_likelihood`, section: `Scenario ${sc.code} — Response (item 1)`, text: sc.situation, scale: '1 Very unlikely – 5 Very likely' });
    codebook.addRow({ col: `${sc.code}_organism`, section: `Scenario ${sc.code} — Organism (item 2)`, text: sc.organism, scale: '1 Strongly disagree – 5 Strongly agree' });
    codebook.addRow({ col: `${sc.code}_item3`, section: `Scenario ${sc.code} — Organism (item 3)`, text: sc.item3, scale: '1 Strongly disagree – 5 Strongly agree' });
    codebook.addRow({ col: `${sc.code}_item4`, section: `Scenario ${sc.code} — Organism (item 4)`, text: sc.item4, scale: '1 Strongly disagree – 5 Strongly agree' });
    codebook.addRow({ col: `${sc.code}_decision_ms`, section: `Scenario ${sc.code}`, text: 'Time from scenario shown to first answer (behavioural, indirect)', scale: 'milliseconds' });
  }
  codebook.addRow({ col: 'PU / PS / PP / PA / HT / NA / CE', section: 'Model 2 — construct scores', text: 'Organism construct score per scenario = mean of that scenario\'s 3 organism items (organism + item3 + item4). PU=Perceived Urgency (E1), PS=Perceived Deal Smartness (E2), PP=Perceived Personalization/Ease (E3), PA=Positive Affect/Mood (E4), HT=Heuristic Price Trust (E5), NA=Negative Affect/Irritation (E6), CE=Perceived Cognitive Ease (E7)', scale: '1–5 (mean of 3 items)' });
  codebook.addRow({ col: 'II_composite', section: 'Model 2 — dependent variable', text: 'Impulse purchase intention composite = mean of all 7 scenarios\' likelihood (item 1) ratings. Regress on PU..CE per Fresh Start/model2-survey-spec.md', scale: '1–5 (mean of 7 items)' });
  codebook.addRow({ col: 'cart_final_total / cart_final_item_count', section: 'Cart simulator', text: 'Final basket at "Place order"', scale: '₹ / count' });
  codebook.addRow({ col: 'cart_planned_items_added / cart_unplanned_items_added', section: 'Cart simulator', text: 'Milk+eggs (planned) vs. everything else added (unplanned) — revealed, not self-reported', scale: 'count' });
  codebook.addRow({ col: 'cart_crossed_free_delivery_threshold', section: 'Cart simulator', text: 'Whether the final basket reached ₹149 (free delivery)', scale: '0/1' });
  codebook.addRow({ col: 'cart_items_added_after_threshold_nudge', section: 'Cart simulator', text: 'Items added after first seeing a checkout total below ₹149', scale: 'count' });
  codebook.addRow({ col: 'cart_items_added_after_any_checkout_view', section: 'Cart simulator', text: 'Items added after having seen the bill at least once (any threshold)', scale: 'count' });
  codebook.addRow({ col: 'cart_checkout_view_count / cart_shop_return_count', section: 'Cart simulator', text: 'How many times they viewed checkout / bounced back to shopping', scale: 'count' });
  codebook.addRow({ col: 'cart_categories_browsed_count / cart_categories_browsed', section: 'Cart simulator', text: 'Distinct category rails browsed, in the order first opened', scale: 'count / semicolon-separated list' });
  codebook.addRow({ col: 'cart_clicked_scarcity_item / _recommended_item / _festive_item / _bought_earlier_item', section: 'Cart simulator', text: 'Whether they ever added an item carrying that trigger tag', scale: '0/1 each' });
  codebook.addRow({ col: 'cart_total_time_ms', section: 'Cart simulator', text: 'Total time spent in the simulator', scale: 'milliseconds' });
  codebook.addRow({ col: 'cart_noticed_fees', section: 'Cart simulator', text: 'Self-report: did they notice the delivery/handling/small-cart fees', scale: '1 = yes noticed, 0 = no/didn\'t check, blank = not reached' });
  codebook.addRow({ col: '(see Cart_Sim_Events sheet)', section: 'Cart simulator — full log', text: 'Every add/remove/category-click/checkout-view/back-to-shop/threshold-crossing/place-order, in order, with a JSON "meta" column of event-specific detail', scale: 'one row per action' });

  // ---------------------------------------------------------- Respondents_Wide
  const wide = wb.addWorksheet('Respondents_Wide');
  const baseCols = [
    { header: 'respondent_id', key: 'id', width: 12 },
    { header: 'uuid', key: 'uuid', width: 24 },
    { header: 'status', key: 'status', width: 14 },
    { header: 'started_at', key: 'started_at', width: 20 },
    { header: 'completed_at', key: 'completed_at', width: 20 },
    { header: 'duration_seconds', key: 'duration_seconds', width: 14 },
    { header: 'device_type', key: 'device_type', width: 12 },
    { header: 'source', key: 'source', width: 12 },
    { header: 'age_group', key: 'age_group', width: 10 },
    { header: 'gender', key: 'gender', width: 12 },
    { header: 'occupation', key: 'occupation', width: 16 },
    { header: 'order_frequency', key: 'frequency', width: 14 },
    { header: 'categories_bought', key: 'categories_bought', width: 26 },
    { header: 'unplanned_share_selfreport', key: 'unplanned_share_selfreport', width: 22 },
  ];
  const scenarioCols = allScenarioCodes.flatMap((code) => [
    { header: `${code}_likelihood`, key: `${code}_likelihood`, width: 14 },
    { header: `${code}_organism`, key: `${code}_organism`, width: 14 },
    { header: `${code}_item3`, key: `${code}_item3`, width: 14 },
    { header: `${code}_item4`, key: `${code}_item4`, width: 14 },
    { header: `${code}_decision_ms`, key: `${code}_decision_ms`, width: 16 },
  ]);
  // Model 2 construct scores (one per scenario, mean of that scenario's 3 organism
  // items) plus the DV composite (mean of all 7 likelihood items).
  const constructCols = SCENARIOS.map((sc) => ({ header: sc.construct, key: sc.construct, width: 10 }));
  const dvCols = [{ header: 'II_composite', key: 'II_composite', width: 14 }];
  const cartCols = [
    { header: 'cart_final_total', key: 'cart_final_total', width: 14 },
    { header: 'cart_final_item_count', key: 'cart_final_item_count', width: 16 },
    { header: 'cart_planned_items_added', key: 'cart_planned_items_added', width: 18 },
    { header: 'cart_unplanned_items_added', key: 'cart_unplanned_items_added', width: 20 },
    { header: 'cart_crossed_free_delivery_threshold', key: 'cart_crossed_free_delivery_threshold', width: 24 },
    { header: 'cart_items_added_after_threshold_nudge', key: 'cart_items_added_after_threshold_nudge', width: 26 },
    { header: 'cart_items_added_after_any_checkout_view', key: 'cart_items_added_after_any_checkout_view', width: 28 },
    { header: 'cart_checkout_view_count', key: 'cart_checkout_view_count', width: 18 },
    { header: 'cart_shop_return_count', key: 'cart_shop_return_count', width: 18 },
    { header: 'cart_categories_browsed_count', key: 'cart_categories_browsed_count', width: 22 },
    { header: 'cart_categories_browsed', key: 'cart_categories_browsed', width: 30 },
    { header: 'cart_clicked_scarcity_item', key: 'cart_clicked_scarcity_item', width: 20 },
    { header: 'cart_clicked_recommended_item', key: 'cart_clicked_recommended_item', width: 22 },
    { header: 'cart_clicked_festive_item', key: 'cart_clicked_festive_item', width: 20 },
    { header: 'cart_clicked_bought_earlier_item', key: 'cart_clicked_bought_earlier_item', width: 24 },
    { header: 'cart_total_time_ms', key: 'cart_total_time_ms', width: 16 },
    { header: 'cart_noticed_fees', key: 'cart_noticed_fees', width: 14 },
  ];

  wide.columns = [...baseCols, ...scenarioCols, ...constructCols, ...dvCols, ...cartCols];
  styleHeader(wide.getRow(1));
  wide.views = [{ state: 'frozen', ySplit: 1, xSplit: 2 }];

  for (const r of respondents) {
    const p = profiles[r.id] || {};
    const u = usage[r.id] || {};
    const cs = cartSummary[r.id] || {};
    const scenarioMap = scenarioByRespondent[r.id] || {};

    const rowObj = {
      id: r.id, uuid: r.uuid, status: r.status, started_at: r.started_at, completed_at: r.completed_at,
      duration_seconds: r.duration_seconds, device_type: r.device_type, source: r.source,
      age_group: p.age_group, gender: p.gender, occupation: p.occupation,
      frequency: u.frequency,
      categories_bought: safeJson(u.categories_bought).join('; '), unplanned_share_selfreport: u.unplanned_share_selfreport,
      cart_final_total: cs.final_cart_total, cart_final_item_count: cs.final_item_count,
      cart_planned_items_added: cs.planned_items_added, cart_unplanned_items_added: cs.unplanned_items_added,
      cart_crossed_free_delivery_threshold: cs.crossed_free_delivery_threshold,
      cart_items_added_after_threshold_nudge: cs.items_added_after_threshold_nudge,
      cart_items_added_after_any_checkout_view: cs.items_added_after_any_checkout_view,
      cart_checkout_view_count: cs.checkout_view_count, cart_shop_return_count: cs.shop_return_count,
      cart_categories_browsed_count: cs.categories_browsed_count, cart_categories_browsed: safeJson(cs.categories_browsed).join('; '),
      cart_clicked_scarcity_item: cs.clicked_scarcity_item, cart_clicked_recommended_item: cs.clicked_recommended_item,
      cart_clicked_festive_item: cs.clicked_festive_item, cart_clicked_bought_earlier_item: cs.clicked_bought_earlier_item,
      cart_total_time_ms: cs.total_time_ms, cart_noticed_fees: cs.noticed_fees,
    };
    const likelihoodValues = [];
    for (const sc of SCENARIOS) {
      const code = sc.code;
      const s = scenarioMap[code];
      rowObj[`${code}_likelihood`] = s ? s.likelihood_value : null;
      rowObj[`${code}_organism`] = s ? s.organism_value : null;
      rowObj[`${code}_item3`] = s ? s.item3_value : null;
      rowObj[`${code}_item4`] = s ? s.item4_value : null;
      rowObj[`${code}_decision_ms`] = s ? s.decision_time_ms : null;

      const organismItems = [s?.organism_value, s?.item3_value, s?.item4_value];
      rowObj[sc.construct] = organismItems.every((v) => v !== null && v !== undefined)
        ? organismItems.reduce((a, b) => a + b, 0) / organismItems.length
        : null;

      if (s && s.likelihood_value !== null && s.likelihood_value !== undefined) likelihoodValues.push(s.likelihood_value);
    }
    rowObj.II_composite = likelihoodValues.length === SCENARIOS.length
      ? likelihoodValues.reduce((a, b) => a + b, 0) / likelihoodValues.length
      : null;

    wide.addRow(rowObj);
  }

  // ------------------------------------------------------------- Scenarios_Long
  const scenariosLong = wb.addWorksheet('Scenarios_Long');
  scenariosLong.columns = [
    { header: 'respondent_id', key: 'respondent_id', width: 12 },
    { header: 'scenario_code', key: 'scenario_code', width: 12 },
    { header: 'likelihood_value', key: 'likelihood_value', width: 14 },
    { header: 'organism_value', key: 'organism_value', width: 14 },
    { header: 'item3_value', key: 'item3_value', width: 14 },
    { header: 'item4_value', key: 'item4_value', width: 14 },
    { header: 'decision_time_ms', key: 'decision_time_ms', width: 16 },
    { header: 'changed_mind', key: 'changed_mind', width: 12 },
  ];
  styleHeader(scenariosLong.getRow(1));
  for (const r of scenarioRows) scenariosLong.addRow(r);

  // ---------------------------------------------------------- Cart_Sim_Events
  const cartEvents = wb.addWorksheet('Cart_Sim_Events');
  cartEvents.columns = [
    { header: 'respondent_id', key: 'respondent_id', width: 12 },
    { header: 'event_seq', key: 'event_seq', width: 10 },
    { header: 'event_type', key: 'event_type', width: 24 },
    { header: 'product_id', key: 'product_id', width: 16 },
    { header: 'product_name', key: 'product_name', width: 26 },
    { header: 'product_price', key: 'product_price', width: 12 },
    { header: 'product_tags', key: 'product_tags', width: 24 },
    { header: 'cart_total_at_event', key: 'cart_total_at_event', width: 18 },
    { header: 'timestamp_offset_ms', key: 'timestamp_offset_ms', width: 18 },
    { header: 'meta', key: 'meta', width: 40 },
  ];
  styleHeader(cartEvents.getRow(1));
  for (const r of await all('SELECT * FROM cart_sim_events ORDER BY respondent_id, event_seq')) cartEvents.addRow(r);

  return wb;
}
