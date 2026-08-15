import { el, stepShell, pillGroup } from '../ui.js';

export default function renderScreening(container, ctx) {
  let usedRecently = null;

  const body = el('div', {}, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, 'Have you ordered from a quick-commerce app (Blinkit, Zepto, Swiggy Instamart, etc.) in the last 3 months?'),
      pillGroup({
        options: ['Yes', 'No'],
        value: () => usedRecently,
        onChange: (v) => { usedRecently = v; refreshDisabled(); render(); },
        block: false,
      }),
    ]),
  ]);

  function render() {}

  const { node, refreshDisabled } = stepShell({
    eyebrow: 'One quick check',
    title: 'Are you the right fit for this study?',
    body,
    hideBack: true,
    onNext: async () => {
      if (usedRecently === 'No') {
        await ctx.api.screenOut(ctx.state.uuid);
        ctx.state.screenedOut = true;
        ctx.goTo('thankyou');
        return;
      }
      ctx.goNext();
    },
    nextDisabled: () => usedRecently === null,
  });
  container.appendChild(node);
}
