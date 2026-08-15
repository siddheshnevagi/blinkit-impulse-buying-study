import { el } from '../ui.js';

export default function renderLanding(container, ctx) {
  const sections = [
    ['🧠', 'A few quick questions about how you shop and feel'],
    ['📱', 'A handful of real app moments — tell us what you\'d do'],
    ['🛒', 'A tiny shopping simulation — actually build a cart'],
    ['💬', 'Two short open questions, then you\'re done'],
  ];

  const node = el('div', { class: 'step' }, [
    el('div', { class: 'card' }, [
      el('div', { class: 'hero-illustration' }, '🛵'),
      el('div', { class: 'eyebrow' }, 'A Consumer Behaviour study · ~8–10 min'),
      el('h1', {}, 'Ever ordered something on Blinkit you never meant to buy?'),
      el('p', { class: 'lede' }, 'This short interactive study looks at how quick-commerce apps shape real shopping decisions. It mixes quick questions with a few realistic scenarios and one tiny hands-on task — no two people will answer exactly the same way, and that\'s the point.'),
      el('ul', { class: 'section-list' }, sections.map(([icon, label]) =>
        el('li', {}, el('div', { class: 'section-item' }, [el('span', { class: 'section-item__icon' }, icon), el('span', {}, label)]))
      )),
      el('div', { class: 'stat-row' }, [
        el('div', { class: 'stat' }, [el('b', {}, '8–10'), el('span', {}, 'minutes')]),
        el('div', { class: 'stat' }, [el('b', {}, '100%'), el('span', {}, 'anonymous')]),
        el('div', { class: 'stat' }, [el('b', {}, '18+'), el('span', {}, 'only')]),
      ]),
    ]),
    el('div', { class: 'step-actions step-actions--end' }, [
      el('button', { class: 'btn btn--accent btn--block', onClick: ctx.goNext }, 'Let\'s start →'),
    ]),
  ]);
  container.appendChild(node);
}
