import { el, stepShell } from '../ui.js';

export default function renderDebrief(container, ctx) {
  const d = { biggestTriggerText: '', reduceOrdersText: '', email: '' };

  const body = el('div', {}, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'In one line — what\'s the ONE thing that gets you to add an item you never planned to buy?'),
      el('textarea', { placeholder: 'e.g. "seeing the countdown timer" or "the free delivery banner"…', onInput: (e) => { d.biggestTriggerText = e.target.value; } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'Is there anything that would make you order less often? (optional)'),
      el('textarea', { placeholder: 'Totally optional — skip if nothing comes to mind.', onInput: (e) => { d.reduceOrdersText = e.target.value; } }),
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'Want a summary of the findings once the study wraps up? (optional)'),
      el('input', { type: 'email', placeholder: 'your@email.com — optional, never shared', onInput: (e) => { d.email = e.target.value; } }),
    ]),
  ]);

  const { node } = stepShell({
    eyebrow: 'Part 11 of 11',
    title: 'In your own words',
    body,
    onBack: ctx.goBack,
    onNext: async () => {
      await ctx.api.saveDebrief(ctx.state.uuid, d);
      await ctx.api.complete(ctx.state.uuid);
      ctx.goNext();
    },
    nextLabel: 'Finish',
  });
  container.appendChild(node);
}
