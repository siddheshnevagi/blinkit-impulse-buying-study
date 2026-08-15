import { el, clear, stepShell, pillGroup } from '../ui.js';

const PLATFORMS = ['Blinkit', 'Zepto', 'Swiggy Instamart', 'Other'];
const TIME_BANDS = ['Morning (6–12)', 'Afternoon (12–5)', 'Evening (5–9)', 'Late night (9pm–2am)', 'Very late (2–6am)'];
const OCCASIONS = ['Routine restock', 'Sudden craving', 'Guests came over', 'Rain / weather', 'Watching a match/event', 'Festive occasion', 'Other'];

// The retrospective "order-history walkthrough": ask about the respondent's actual last
// order, item by item, using Stern's (1962) planned / reminder-impulse / true-impulse
// split rather than a single vague "was this impulsive?" question.
export default function renderOrderHistory(container, ctx) {
  const oh = ctx.state.orderHistory;
  oh.meta ??= {};
  oh.items ??= [{ label: '', inMindBeforeOpening: null, decidedWithinSeconds: null }];

  const m = oh.meta;

  const metaBody = el('div', {}, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'Total value of your last quick-commerce order (₹)'),
      el('input', { type: 'number', min: '0', placeholder: 'e.g. 320', value: m.totalValue ?? '', onInput: (e) => { m.totalValue = e.target.value ? Number(e.target.value) : null; refreshDisabled(); } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'Number of items in that order'),
      el('input', { type: 'number', min: '1', placeholder: 'e.g. 6', value: m.itemCount ?? '', onInput: (e) => { m.itemCount = e.target.value ? Number(e.target.value) : null; refreshDisabled(); } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'Which app was it on?'),
      pillGroup({ options: PLATFORMS, value: () => m.platform, onChange: (v) => { m.platform = v; refreshDisabled(); } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'Roughly what time was it?'),
      pillGroup({ options: TIME_BANDS, value: () => m.timeBand, onChange: (v) => { m.timeBand = v; refreshDisabled(); } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'What prompted that order?'),
      pillGroup({ options: OCCASIONS, value: () => m.occasion, onChange: (v) => { m.occasion = v; refreshDisabled(); } }),
    ]),
  ]);

  const { node, refreshDisabled } = stepShell({
    eyebrow: 'Part 3 of 12 · Think of one real order',
    title: 'Your most recent Blinkit-style order',
    lede: 'Picture the very last order you placed on any of these apps. We\'ll walk through it item by item next.',
    body: metaBody,
    onBack: ctx.goBack,
    onNext: () => renderItemsStep(),
    nextDisabled: () => !(m.totalValue && m.itemCount && m.platform && m.timeBand && m.occasion),
  });
  container.appendChild(node);

  function renderItemsStep() {
    clear(container);
    const listWrap = el('div', {});

    function itemCard(item, idx) {
      const card = el('div', { class: 'card card--tight', style: 'margin-bottom:12px' });
      card.appendChild(el('div', { class: 'field' }, [
        el('label', { class: 'field__label' }, `Item ${idx + 1}`),
        el('input', { type: 'text', placeholder: 'e.g. milk, KitKat, shampoo…', value: item.label, onInput: (e) => { item.label = e.target.value; refreshItemsDisabled(); } }),
      ]));
      card.appendChild(el('div', { class: 'field' }, [
        el('label', { class: 'field__label' }, 'Was it in your mind before you opened the app?'),
        pillGroup({ options: ['Yes', 'No'], value: () => item.inMindBeforeOpening === null ? null : (item.inMindBeforeOpening ? 'Yes' : 'No'), onChange: (v) => { item.inMindBeforeOpening = v === 'Yes'; renderList(); } }),
      ]));
      if (item.inMindBeforeOpening === false) {
        card.appendChild(el('div', { class: 'field' }, [
          el('label', { class: 'field__label' }, 'Did you decide to buy it within a few seconds of seeing it?'),
          pillGroup({ options: ['Yes', 'No'], value: () => item.decidedWithinSeconds === null ? null : (item.decidedWithinSeconds ? 'Yes' : 'No'), onChange: (v) => { item.decidedWithinSeconds = v === 'Yes'; refreshItemsDisabled(); } }),
        ]));
      }
      if (oh.items.length > 1) {
        card.appendChild(el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { oh.items.splice(idx, 1); renderList(); } }, 'Remove item'));
      }
      return card;
    }

    function renderList() {
      clear(listWrap);
      oh.items.forEach((item, idx) => listWrap.appendChild(itemCard(item, idx)));
      if (oh.items.length < 5) {
        listWrap.appendChild(el('button', {
          class: 'btn btn--ghost btn--sm', style: 'margin-bottom:12px',
          onClick: () => { oh.items.push({ label: '', inMindBeforeOpening: null, decidedWithinSeconds: null }); renderList(); },
        }, '+ Add another item'));
      }
      refreshItemsDisabled();
    }

    const wrap = el('div', { class: 'step' }, [
      el('div', { class: 'eyebrow', style: 'margin-left:2px' }, 'Part 3 of 12'),
      el('h1', { style: 'margin: 0 0 6px 2px; font-size:22px' }, 'Now, item by item'),
      el('p', { class: 'lede', style: 'margin: 0 0 14px 2px' }, 'For each item, be honest rather than tidy — "I forgot I needed it" and "I just wanted it" are both valid answers.'),
      listWrap,
    ]);
    const actions = el('div', { class: 'step-actions' }, [
      el('button', { class: 'btn btn--ghost', onClick: () => { clear(container); container.appendChild(node); } }, '← Back'),
      el('button', { class: 'btn btn--accent', onClick: async () => {
        await ctx.api.saveOrderHistory(ctx.state.uuid, {
          meta: m,
          items: oh.items.filter((it) => it.label.trim()),
        });
        ctx.goNext();
      } }, 'Continue'),
    ]);

    function refreshItemsDisabled() {
      const ready = oh.items.every((it) => it.label.trim() && it.inMindBeforeOpening !== null && (it.inMindBeforeOpening === true || it.decidedWithinSeconds !== null));
      actions.querySelector('.btn--accent').disabled = !ready;
    }

    renderList();
    container.appendChild(wrap);
    container.appendChild(actions);
  }
}
