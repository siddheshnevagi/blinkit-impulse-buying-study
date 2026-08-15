import { el, stepShell, pillGroup, checkGrid } from '../ui.js';

const APPS = ['Blinkit', 'Zepto', 'Swiggy Instamart', 'BigBasket / BBNow', 'Other'];
const MONTHS_USING = ['< 3 months', '3–12 months', '1–2 years', '2+ years'];
const FREQUENCIES = ['Daily', '4–6×/week', '1–3×/week', '2–3×/month', 'Rarely'];
const ORDER_VALUES = ['< ₹200', '₹200–500', '₹500–1000', '> ₹1000'];
const CATEGORIES = ['Groceries', 'Snacks/beverages', 'Personal care', 'Beauty', 'Electronics', 'Other'];
const UNPLANNED_SHARE = ['None', '< 25%', '25–50%', '50–75%', '> 75%'];
const TRIGGERS = ['Ran out of something', 'Sudden craving', 'Saw an ad/notification', 'Bored, just browsing', 'Guests / occasion', 'Weather (rain, heat)', 'Late-night hours', 'Friend recommended'];

export default function renderUsage(container, ctx) {
  const u = ctx.state.usage;
  u.appsUsed ??= [];
  u.categoriesBought ??= [];
  u.usualTriggers ??= [];

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
          if (key === 'appsUsed' && !u.primaryApp && u.appsUsed.length) u.primaryApp = u.appsUsed[0];
          refreshDisabled();
        },
      }),
    ]);
  }

  const body = el('div', {}, [
    chips('Which apps do you use?', 'Select all that apply.', APPS, 'appsUsed'),
    pills('How long have you been using quick-commerce apps?', null, MONTHS_USING, 'monthsUsing'),
    pills('How often do you order?', null, FREQUENCIES, 'frequency'),
    pills('Typical order value', null, ORDER_VALUES, 'typicalOrderValueBand'),
    chips('What do you usually buy?', 'Select all that apply.', CATEGORIES, 'categoriesBought'),
    pills('Roughly what share of your orders are things you did NOT plan to buy before opening the app?', null, UNPLANNED_SHARE, 'unplannedShareSelfreport'),
    chips('What usually gets you to open the app in the first place?', 'Select all that apply — this helps us map situational triggers.', TRIGGERS, 'usualTriggers'),
  ]);

  const { node, refreshDisabled } = stepShell({
    eyebrow: 'Part 2 of 12',
    title: 'How you actually use these apps',
    body,
    onBack: ctx.goBack,
    onNext: async () => {
      await ctx.api.saveUsage(ctx.state.uuid, u);
      ctx.goNext();
    },
    nextDisabled: () => !(u.appsUsed.length && u.monthsUsing && u.frequency && u.typicalOrderValueBand && u.categoriesBought.length && u.unplannedShareSelfreport),
  });
  container.appendChild(node);
}
