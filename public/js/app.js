import { api, createRespondent } from './api.js';
import { clear, setProgress } from './ui.js';

import renderLanding from './components/landing.js';
import renderDemographics from './components/demographics.js';
import renderUsage from './components/usage.js';
import renderScenarios from './components/scenarios.js';
import renderCartSim from './components/cartSim.js';
import renderThankyou from './components/thankyou.js';

const STEPS = [
  { id: 'landing', mount: renderLanding, progress: 0 },
  { id: 'demographics', mount: renderDemographics, progress: 20 },
  { id: 'usage', mount: renderUsage, progress: 35 },
  { id: 'scenarios', mount: renderScenarios, progress: 55 },
  { id: 'cartSim', mount: renderCartSim, progress: 85 },
  { id: 'thankyou', mount: renderThankyou, progress: 100 },
];

const state = {
  uuid: null,
  expDeliveryCondition: null,
  expScarcityCondition: null,
  startedAt: Date.now(),
  screenedOut: false,
  profile: {},
  usage: {},
  cart: {},
};

let stepIndex = 0;
const stage = document.getElementById('stage');
const topbar = document.getElementById('topbar');

function deviceType() {
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function sourceParam() {
  try {
    return new URLSearchParams(window.location.search).get('src') || 'direct';
  } catch { return 'direct'; }
}

const ctx = {
  state,
  api,
  goNext,
  goBack,
  goTo,
  restart,
};

async function ensureRespondent() {
  if (state.uuid) return;
  const res = await createRespondent({ deviceType: deviceType(), userAgent: navigator.userAgent, source: sourceParam() });
  state.uuid = res.uuid;
  state.expDeliveryCondition = res.expDeliveryCondition;
  state.expScarcityCondition = res.expScarcityCondition;
}

function renderStep() {
  const step = STEPS[stepIndex];
  clear(stage);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  setProgress(step.progress);
  topbar.classList.toggle('is-hidden', step.id === 'landing');
  step.mount(stage, ctx);
}

async function goNext() {
  if (stepIndex === 0) await ensureRespondent();
  if (stepIndex < STEPS.length - 1) {
    stepIndex += 1;
    renderStep();
  }
}

function goBack() {
  if (stepIndex > 0) {
    stepIndex -= 1;
    renderStep();
  }
}

function goTo(id) {
  const idx = STEPS.findIndex((s) => s.id === id);
  if (idx >= 0) { stepIndex = idx; renderStep(); }
}

function restart() {
  stepIndex = 0;
  state.uuid = null;
  renderStep();
}

renderStep();

if (new URLSearchParams(window.location.search).has('debug')) {
  window.__ctx = ctx;
  window.__ensureRespondent = ensureRespondent;
}
