import { el, likertRow } from '../ui.js';
import { LIKERT_SECTIONS } from '../data/items.js';

// Generic renderer for any subset of Likert sections defined in data/items.js.
// Buffers answers locally and flushes them as one batch to the API when the
// respondent continues, so a single network call covers the whole screen.
export default function renderLikertBattery(container, ctx, { sections, eyebrow, title, lede }) {
  const items = sections.flatMap((code) => {
    const s = LIKERT_SECTIONS.find((sec) => sec.code === code);
    return s ? s.items.filter((it) => !it.optional).map((it) => ({ ...it, section: code })) : [];
  });

  ctx.state.likertBuffer ??= {};
  const answers = ctx.state.likertBuffer;

  const wrap = el('div', { class: 'step' });
  const card = el('div', { class: 'card' });
  card.appendChild(el('div', { class: 'eyebrow' }, eyebrow));
  card.appendChild(el('h1', {}, title));
  if (lede) card.appendChild(el('p', { class: 'lede', style: 'margin-bottom:10px' }, lede));

  const listWrap = el('div', { class: 'likert' });
  for (const it of items) {
    const existing = answers[it.code];
    listWrap.appendChild(likertRow({
      text: it.text,
      initialValue: existing ? existing.value : null,
      onAnswer: (value, responseTimeMs) => {
        answers[it.code] = { section: it.section, code: it.code, text: it.text, value, responseTimeMs: answers[it.code]?.responseTimeMs ?? responseTimeMs };
        refreshDisabled();
      },
    }));
  }
  card.appendChild(listWrap);
  wrap.appendChild(card);

  const actions = el('div', { class: 'step-actions' });
  const backBtn = el('button', { class: 'btn btn--ghost', onClick: ctx.goBack }, '← Back');
  const nextBtn = el('button', {
    class: 'btn btn--accent',
    onClick: async () => {
      const batch = items.map((it) => answers[it.code]).filter(Boolean);
      await ctx.api.saveLikertBatch(ctx.state.uuid, batch);
      ctx.goNext();
    },
  }, 'Continue');
  actions.appendChild(backBtn);
  actions.appendChild(nextBtn);
  wrap.appendChild(actions);

  function refreshDisabled() {
    nextBtn.disabled = !items.every((it) => answers[it.code]);
  }
  refreshDisabled();

  container.appendChild(wrap);
}
