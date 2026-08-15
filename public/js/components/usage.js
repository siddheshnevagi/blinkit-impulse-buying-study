import { el, stepShell, pillGroup, checkGrid } from '../ui.js';

const FREQUENCIES = ['Daily', '4–6×/week', '1–3×/week', '2–3×/month', 'Rarely'];
const CATEGORIES = ['Groceries', 'Snacks/beverages', 'Personal care', 'Beauty', 'Electronics', 'Other'];
const UNPLANNED_SHARE = ['None', '< 25%', '25–50%', '50–75%', '> 75%'];

export default function renderUsage(container, ctx) {
  const u = ctx.state.usage;
  u.categoriesBought ??= [];

  function pills(label, sub, options, key) {
    return el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, label),
      sub ? el('div', { class: 'field__sub' }, sub) : null,
      pillGroup({ options, value: () => u[key], onChange: (v) => { u[key] = v; refreshDisabled(); } }),
    ]);
  }
  function chips(label, sub, options, key) {
    return el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, label),
      sub ? el('div', { class: 'field__sub' }, sub) : null,
      checkGrid({
        options,
        values: () => u[key],
        onToggle: (v) => {
          u[key] = u[key].includes(v) ? u[key].filter((x) => x !== v) : [...u[key], v];
          refreshDisabled();
        },
      }),
    ]);
  }

  const body = el('div', {}, [
    pills('How often do you order?', null, FREQUENCIES, 'frequency'),
    chips('What do you usually buy?', 'Select all that apply.', CATEGORIES, 'categoriesBought'),
    pills('Roughly what share of your orders are things you did NOT plan to buy before opening the app?', null, UNPLANNED_SHARE, 'unplannedShareSelfreport'),
  ]);

  const { node, refreshDisabled } = stepShell({
    eyebrow: 'Part 2 of 11',
    title: 'How you actually use these apps',
    body,
    onBack: ctx.goBack,
    onNext: async () => {
      await ctx.api.saveUsage(ctx.state.uuid, u);
      ctx.goNext();
    },
    nextDisabled: () => !(u.frequency && u.categoriesBought.length && u.unplannedShareSelfreport),
  });
  container.appendChild(node);
}
