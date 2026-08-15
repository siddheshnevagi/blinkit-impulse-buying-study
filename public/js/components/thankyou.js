import { el } from '../ui.js';

export default function renderThankyou(container, ctx) {
  const screenedOut = ctx.state.screenedOut;

  const node = el('div', { class: 'step' }, [
    el('div', { class: 'card' }, screenedOut ? [
      el('div', { class: 'thankyou-emoji' }, '🙏'),
      el('h1', { style: 'text-align:center' }, 'Thanks for your time'),
      el('p', { class: 'lede', style: 'text-align:center' }, 'This study is specifically about quick-commerce app users, so it doesn\'t apply to you right now — but we really appreciate you stopping by.'),
    ] : [
      el('div', { class: 'thankyou-emoji' }, '🎉'),
      el('h1', { style: 'text-align:center' }, 'That\'s a wrap — thank you!'),
      el('p', { class: 'lede', style: 'text-align:center' }, 'Your responses have been recorded anonymously. They\'ll feed into a study on how quick-commerce app design shapes impulse buying — genuinely useful, and genuinely appreciated.'),
      el('p', { class: 'hint', style: 'text-align:center; margin-top:14px' }, 'Feel free to share this study with a couple of friends who also use Blinkit, Zepto or Swiggy Instamart.'),
    ]),
  ]);
  container.appendChild(node);
}
