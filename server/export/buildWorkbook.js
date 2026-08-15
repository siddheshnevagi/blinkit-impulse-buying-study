import ExcelJS from 'exceljs';
import { query } from '../db/db.js';
import { LIKERT_SECTIONS, PANAS_ITEMS } from '../../public/js/data/items.js';
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

export async function buildWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Blinkit Impulse-Buying Study';
  wb.created = new Date();

  const respondents = await all('SELECT * FROM respondents ORDER BY id');
  const profiles = Object.fromEntries((await all('SELECT * FROM profile')).map((r) => [r.respondent_id, r]));
  const usage = Object.fromEntries((await all('SELECT * FROM usage_habits')).map((r) => [r.respondent_id, r]));
  const ohMeta = Object.fromEntries((await all('SELECT * FROM order_history_meta')).map((r) => [r.respondent_id, r]));
  const experiment = Object.fromEntries((await all('SELECT * FROM experiment_responses')).map((r) => [r.respondent_id, r]));
  const cartSummary = Object.fromEntries((await all('SELECT * FROM cart_sim_summary')).map((r) => [r.respondent_id, r]));
  const debrief = Object.fromEntries((await all('SELECT * FROM debrief')).map((r) => [r.respondent_id, r]));

  const likertRows = await all('SELECT * FROM likert_responses');
  const likertByRespondent = {};
  for (const r of likertRows) {
    (likertByRespondent[r.respondent_id] ??= {})[r.item_code] = r.value;
  }

  const scenarioRows = await all('SELECT * FROM scenario_responses');
  const scenarioByRespondent = {};
  for (const r of scenarioRows) {
    (scenarioByRespondent[r.respondent_id] ??= {})[r.scenario_code] = r;
  }

  const orderHistoryItemsAll = await all('SELECT * FROM order_history_items ORDER BY respondent_id, item_seq');
  const ohItemsByRespondent = {};
  for (const r of orderHistoryItemsAll) {
    (ohItemsByRespondent[r.respondent_id] ??= []).push(r);
  }

  const allItemCodes = [...LIKERT_SECTIONS, PANAS_ITEMS].flatMap((s) => s.items.map((it) => it.code));
  const allScenarioCodes = SCENARIOS.map((s) => s.code);

  // ---------------------------------------------------------------- Codebook
  const codebook = wb.addWorksheet('Codebook');
  codebook.columns = [
    { header: 'Column in Respondents_Wide', key: 'col', width: 30 },
    { header: 'Construct / Section', key: 'section', width: 28 },
    { header: 'Role in S-O-R model', key: 'role', width: 16 },
    { header: 'Item text shown to respondent', key: 'text', width: 60 },
    { header: 'Scale', key: 'scale', width: 30 },
  ];
  styleHeader(codebook.getRow(1));
  for (const s of [...LIKERT_SECTIONS, PANAS_ITEMS]) {
    for (const it of s.items) {
      codebook.addRow({ col: it.code, section: s.title, role: s.role, text: it.text + (it.reverse ? '  [reverse-scored]' : ''), scale: '1 Strongly disagree – 5 Strongly agree' });
    }
  }
  for (const sc of SCENARIOS) {
    codebook.addRow({ col: `${sc.code}_likelihood`, section: `Scenario ${sc.code}`, role: 'behavioral intention', text: sc.situation, scale: '1 Very unlikely – 5 Very likely' });
    codebook.addRow({ col: `${sc.code}_decision_ms`, section: `Scenario ${sc.code}`, role: 'behavioral (indirect)', text: 'Time from scenario shown to first answer', scale: 'milliseconds' });
  }
  codebook.addRow({ col: '(see Respondents_Wide header comments)', section: 'Profile / Usage / Order history / Experiment / Cart simulation', role: '—', text: 'Plain-language field names, self-explanatory', scale: 'various' });

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
    { header: 'city_type', key: 'city_type', width: 12 },
    { header: 'occupation', key: 'occupation', width: 16 },
    { header: 'income_band', key: 'income_band', width: 14 },
    { header: 'apps_used', key: 'apps_used', width: 22 },
    { header: 'primary_app', key: 'primary_app', width: 14 },
    { header: 'months_using', key: 'months_using', width: 14 },
    { header: 'order_frequency', key: 'frequency', width: 14 },
    { header: 'typical_order_value_band', key: 'typical_order_value_band', width: 20 },
    { header: 'categories_bought', key: 'categories_bought', width: 26 },
    { header: 'unplanned_share_selfreport', key: 'unplanned_share_selfreport', width: 22 },
    { header: 'usual_triggers', key: 'usual_triggers', width: 30 },
    { header: 'last_order_total_value', key: 'last_order_total_value', width: 16 },
    { header: 'last_order_item_count', key: 'last_order_item_count', width: 16 },
    { header: 'last_order_platform', key: 'last_order_platform', width: 14 },
    { header: 'last_order_time_band', key: 'last_order_time_band', width: 16 },
    { header: 'last_order_occasion', key: 'last_order_occasion', width: 16 },
    { header: 'order_history_planned_n', key: 'oh_planned', width: 16 },
    { header: 'order_history_reminder_impulse_n', key: 'oh_reminder', width: 20 },
    { header: 'order_history_true_impulse_n', key: 'oh_true_impulse', width: 18 },
  ];
  const scenarioCols = allScenarioCodes.flatMap((code) => [
    { header: `${code}_likelihood`, key: `${code}_likelihood`, width: 14 },
    { header: `${code}_decision_ms`, key: `${code}_decision_ms`, width: 16 },
  ]);
  const experimentCols = [
    { header: 'exp_delivery_condition', key: 'exp_delivery_condition', width: 18 },
    { header: 'exp_scarcity_condition', key: 'exp_scarcity_condition', width: 18 },
    { header: 'exp_PI1', key: 'exp_PI1', width: 10 },
    { header: 'exp_PI2', key: 'exp_PI2', width: 10 },
    { header: 'exp_PI3', key: 'exp_PI3', width: 10 },
    { header: 'exp_URGE1', key: 'exp_URGE1', width: 10 },
    { header: 'exp_URGE2', key: 'exp_URGE2', width: 10 },
    { header: 'exp_URGE3', key: 'exp_URGE3', width: 10 },
    { header: 'exp_manipulation_check', key: 'exp_manipulation_check', width: 18 },
    { header: 'exp_deliberation_selfreport', key: 'exp_deliberation_selfreport', width: 20 },
    { header: 'exp_page_dwell_ms', key: 'exp_page_dwell_ms', width: 16 },
    { header: 'exp_decision', key: 'exp_decision', width: 12 },
  ];
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
  const likertCols = allItemCodes.map((code) => ({ header: code, key: code, width: 8 }));
  const debriefCols = [
    { header: 'biggest_trigger_text', key: 'biggest_trigger_text', width: 40 },
    { header: 'reduce_orders_text', key: 'reduce_orders_text', width: 40 },
    { header: 'email_optional', key: 'email_optional', width: 22 },
  ];

  wide.columns = [...baseCols, ...scenarioCols, ...experimentCols, ...cartCols, ...likertCols, ...debriefCols];
  styleHeader(wide.getRow(1));
  wide.views = [{ state: 'frozen', ySplit: 1, xSplit: 2 }];

  for (const r of respondents) {
    const p = profiles[r.id] || {};
    const u = usage[r.id] || {};
    const om = ohMeta[r.id] || {};
    const ex = experiment[r.id] || {};
    const cs = cartSummary[r.id] || {};
    const db_ = debrief[r.id] || {};
    const scenarioMap = scenarioByRespondent[r.id] || {};
    const likertMap = likertByRespondent[r.id] || {};

    const ohItems = ohItemsByRespondent[r.id] || [];
    const ohCounts = { planned: 0, reminder_impulse: 0, true_impulse: 0 };
    for (const it of ohItems) ohCounts[it.classification] = (ohCounts[it.classification] || 0) + 1;

    const rowObj = {
      id: r.id, uuid: r.uuid, status: r.status, started_at: r.started_at, completed_at: r.completed_at,
      duration_seconds: r.duration_seconds, device_type: r.device_type, source: r.source,
      age_group: p.age_group, gender: p.gender, city_type: p.city_type, occupation: p.occupation, income_band: p.income_band,
      apps_used: safeJson(u.apps_used).join('; '), primary_app: u.primary_app, months_using: u.months_using,
      frequency: u.frequency, typical_order_value_band: u.typical_order_value_band,
      categories_bought: safeJson(u.categories_bought).join('; '), unplanned_share_selfreport: u.unplanned_share_selfreport,
      usual_triggers: safeJson(u.usual_triggers).join('; '),
      last_order_total_value: om.last_order_total_value, last_order_item_count: om.last_order_item_count,
      last_order_platform: om.last_order_platform, last_order_time_band: om.last_order_time_band, last_order_occasion: om.last_order_occasion,
      oh_planned: ohCounts.planned, oh_reminder: ohCounts.reminder_impulse, oh_true_impulse: ohCounts.true_impulse,
      exp_delivery_condition: r.exp_delivery_condition, exp_scarcity_condition: r.exp_scarcity_condition,
      exp_PI1: ex.pi1, exp_PI2: ex.pi2, exp_PI3: ex.pi3,
      exp_URGE1: ex.exu1, exp_URGE2: ex.exu2, exp_URGE3: ex.exu3,
      exp_manipulation_check: ex.manipulation_check, exp_deliberation_selfreport: ex.deliberation_selfreport,
      exp_page_dwell_ms: ex.page_dwell_ms, exp_decision: ex.decision,
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
      biggest_trigger_text: db_.biggest_trigger_text, reduce_orders_text: db_.reduce_orders_text, email_optional: db_.email,
    };
    for (const code of allScenarioCodes) {
      const s = scenarioMap[code];
      rowObj[`${code}_likelihood`] = s ? s.likelihood_value : null;
      rowObj[`${code}_decision_ms`] = s ? s.decision_time_ms : null;
    }
    for (const code of allItemCodes) rowObj[code] = likertMap[code] ?? null;

    wide.addRow(rowObj);
  }

  // ---------------------------------------------------------------- Likert_Long
  const likertLong = wb.addWorksheet('Likert_Long');
  likertLong.columns = [
    { header: 'respondent_id', key: 'respondent_id', width: 12 },
    { header: 'section_code', key: 'section_code', width: 12 },
    { header: 'item_code', key: 'item_code', width: 10 },
    { header: 'item_text', key: 'item_text', width: 60 },
    { header: 'value', key: 'value', width: 8 },
    { header: 'response_time_ms', key: 'response_time_ms', width: 16 },
  ];
  styleHeader(likertLong.getRow(1));
  for (const r of likertRows) {
    likertLong.addRow({ respondent_id: r.respondent_id, section_code: r.section_code, item_code: r.item_code, item_text: r.item_text, value: r.value, response_time_ms: r.response_time_ms });
  }

  // ------------------------------------------------------------- Scenarios_Long
  const scenariosLong = wb.addWorksheet('Scenarios_Long');
  scenariosLong.columns = [
    { header: 'respondent_id', key: 'respondent_id', width: 12 },
    { header: 'scenario_code', key: 'scenario_code', width: 12 },
    { header: 'likelihood_value', key: 'likelihood_value', width: 14 },
    { header: 'decision_time_ms', key: 'decision_time_ms', width: 16 },
    { header: 'changed_mind', key: 'changed_mind', width: 12 },
  ];
  styleHeader(scenariosLong.getRow(1));
  for (const r of scenarioRows) scenariosLong.addRow(r);

  // --------------------------------------------------------- Order_History_Items
  const ohSheet = wb.addWorksheet('Order_History_Items');
  ohSheet.columns = [
    { header: 'respondent_id', key: 'respondent_id', width: 12 },
    { header: 'item_seq', key: 'item_seq', width: 8 },
    { header: 'item_label', key: 'item_label', width: 24 },
    { header: 'in_mind_before_opening', key: 'in_mind_before_opening', width: 20 },
    { header: 'decided_within_seconds', key: 'decided_within_seconds', width: 20 },
    { header: 'classification', key: 'classification', width: 18 },
  ];
  styleHeader(ohSheet.getRow(1));
  for (const r of orderHistoryItemsAll) ohSheet.addRow(r);

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
