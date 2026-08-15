import { el, stepShell } from '../ui.js';

export default function renderConsent(container, ctx) {
  let agreed = false;

  const consentText = el('div', { class: 'consent-box' }, [
    el('p', {}, 'This short study is part of an academic Consumer Behaviour project on shopping through quick-commerce apps like Blinkit. It takes about 8–10 minutes.'),
    el('p', { style: 'margin-top:10px' }, 'Your responses are anonymous and used only for this project. One part shows you a mocked-up shopping screen and quietly times how you interact with it — that\'s expected and part of the study design, not a mistake. No real purchases or payments happen anywhere in this study.'),
    el('p', { style: 'margin-top:10px' }, 'Participation is voluntary and you may stop at any time. By continuing, you confirm you are 18 or older and consent to take part.'),
  ]);

  const checkRow = el('label', { class: 'check-row' });
  const checkbox = el('input', { type: 'checkbox', onChange: (e) => { agreed = e.target.checked; refreshDisabled(); } });
  checkRow.appendChild(checkbox);
  checkRow.appendChild(el('span', {}, 'I am 18 or older and I agree to take part in this study.'));

  const body = el('div', {}, [consentText, checkRow]);

  const { node, refreshDisabled } = stepShell({
    eyebrow: 'Before we begin',
    title: 'Quick consent check',
    body,
    onBack: ctx.goBack,
    onNext: async () => { await ctx.api.consent(ctx.state.uuid); ctx.goNext(); },
    nextLabel: 'Agree & continue',
    nextDisabled: () => !agreed,
  });
  container.appendChild(node);
}
