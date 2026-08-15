// API client. Talks to the Express backend when it's reachable; otherwise falls back to
// an in-browser "demo mode" (localStorage) so the study can still be previewed/tested
// without a server running — useful for design review, and harmless in production since
// a live deployment will always have the backend available.
const DEMO_KEY = 'blinkit_study_demo_v1';
let demoMode = false;
let demoStore = null;

function loadDemoStore() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function persistDemoStore() {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(demoStore)); } catch { /* ignore quota errors */ }
}

async function tryFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function isDemoMode() {
  return demoMode;
}

export async function createRespondent({ deviceType, userAgent, source }) {
  try {
    return await tryFetch('/api/respondents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceType, userAgent, source }),
    });
  } catch {
    demoMode = true;
    demoStore = loadDemoStore();
    const uuid = 'demo-' + Math.random().toString(36).slice(2, 10);
    const expDeliveryCondition = Math.random() < 0.5 ? 'fast' : 'slow';
    const expScarcityCondition = Math.random() < 0.5 ? 'present' : 'absent';
    demoStore[uuid] = { uuid, expDeliveryCondition, expScarcityCondition, createdAt: Date.now() };
    persistDemoStore();
    return { uuid, expDeliveryCondition, expScarcityCondition };
  }
}

function demoSave(uuid, key, value) {
  demoStore[uuid] = demoStore[uuid] || {};
  demoStore[uuid][key] = value;
  persistDemoStore();
  return { ok: true, demo: true };
}

export const api = {
  consent: (uuid) => demoMode ? demoSave(uuid, 'consent', true) : tryFetch(`/api/respondents/${uuid}/consent`, { method: 'POST' }),
  screenOut: (uuid) => demoMode ? demoSave(uuid, 'screenedOut', true) : tryFetch(`/api/respondents/${uuid}/screen-out`, { method: 'POST' }),
  saveProfile: (uuid, data) => demoMode ? demoSave(uuid, 'profile', data) : tryFetch(`/api/respondents/${uuid}/profile`, putJson(data)),
  saveUsage: (uuid, data) => demoMode ? demoSave(uuid, 'usage', data) : tryFetch(`/api/respondents/${uuid}/usage`, putJson(data)),
  saveOrderHistory: (uuid, data) => demoMode ? demoSave(uuid, 'orderHistory', data) : tryFetch(`/api/respondents/${uuid}/order-history`, putJson(data)),
  saveLikertBatch: (uuid, responses) => demoMode
    ? demoSave(uuid, 'likert_' + Date.now(), responses)
    : tryFetch(`/api/respondents/${uuid}/likert`, postJson({ responses })),
  saveScenario: (uuid, data) => demoMode ? demoSave(uuid, 'scenario_' + data.scenarioCode, data) : tryFetch(`/api/respondents/${uuid}/scenario`, postJson(data)),
  saveExperiment: (uuid, data) => demoMode ? demoSave(uuid, 'experiment', data) : tryFetch(`/api/respondents/${uuid}/experiment`, putJson(data)),
  saveCartEvents: (uuid, events) => demoMode ? demoSave(uuid, 'cartEvents', events) : tryFetch(`/api/respondents/${uuid}/cart-events`, postJson({ events })),
  saveCartSummary: (uuid, data) => demoMode ? demoSave(uuid, 'cartSummary', data) : tryFetch(`/api/respondents/${uuid}/cart-summary`, putJson(data)),
  saveDebrief: (uuid, data) => demoMode ? demoSave(uuid, 'debrief', data) : tryFetch(`/api/respondents/${uuid}/debrief`, putJson(data)),
  complete: (uuid) => demoMode ? demoSave(uuid, 'completed', Date.now()) : tryFetch(`/api/respondents/${uuid}/complete`, { method: 'POST' }),
};

function putJson(body) {
  return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
function postJson(body) {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
