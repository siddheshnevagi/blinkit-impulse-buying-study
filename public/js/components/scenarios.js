import { el, clear, likertRow, formatRupee } from '../ui.js';
import { SCENARIOS } from '../data/scenarios.js';

function phoneFrame(headerContent, bodyContent) {
  return el('div', { class: 'phone' }, [
    el('div', { class: 'phone__screen' }, [
      el('div', { class: 'phone__statusbar' }, [el('span', {}, '9:41'), el('span', {}, '●●● 5G 82%')]),
      headerContent,
      bodyContent,
    ]),
  ]);
}

function greenHeader(eta, sub) {
  return el('div', { class: 'phone__header' }, [
    el('div', { class: 'phone__eta' }, `Blinkit in ${eta}`),
    el('div', { class: 'phone__eta-sub' }, sub || 'Sector A · Delivering to Home'),
  ]);
}

function screenHeader(title, sub) {
  return el('div', { class: 'phone__header' }, [
    el('div', { class: 'phone__eta' }, title),
    el('div', { class: 'phone__eta-sub' }, sub),
  ]);
}

function productCard({ icon = '🍫', name, price, badge, badgeClass = '' }) {
  return el('div', { class: 'pcard' }, [
    badge ? el('div', { class: `pcard__badge ${badgeClass}` }, badge) : null,
    el('div', { class: 'pcard__img' }, icon),
    el('div', { class: 'pcard__name' }, name),
    el('div', { class: 'pcard__row' }, [
      el('div', { class: 'pcard__price' }, price ? formatRupee(price) : ''),
      el('div', { class: 'pcard__add' }, 'ADD'),
    ]),
  ]);
}

function renderMock(mock) {
  switch (mock.type) {
    case 'home_badge':
      return phoneFrame(greenHeader(mock.eta, '11:04 PM · Sector A'), el('div', { class: 'phone__body' }, [
        el('div', { class: 'field__sub', style: 'margin-bottom:8px' }, 'Home'),
        el('div', { class: 'sim-grid' }, [
          productCard({ icon: '🥛', name: 'Amul Toned Milk', price: 30 }),
          productCard({ icon: '🍪', name: mock.product, price: 30, badge: mock.badge, badgeClass: '' }),
        ]),
      ]));
    case 'threshold':
      return phoneFrame(greenHeader('9 mins'), el('div', { class: 'phone__body' }, [
        el('div', { class: 'threshold-banner' }, [
          `Add ${formatRupee(mock.need)} more to get ${mock.label}`,
          el('div', { class: 'threshold-track' }, el('div', { class: 'threshold-fill', style: `width:${Math.round((mock.cartTotal / (mock.cartTotal + mock.need)) * 100)}%` })),
        ]),
        el('div', { class: 'checkout-line', style: 'margin-top:14px' }, [el('span', {}, 'Cart total'), el('span', {}, formatRupee(mock.cartTotal))]),
      ]));
    case 'recs':
      return phoneFrame(screenHeader('Checkout', '1 item · 9 mins away'), el('div', { class: 'phone__body' }, [
        el('div', { class: 'field__sub', style: 'margin-bottom:8px' }, 'You might also like'),
        el('div', { class: 'sim-grid' }, mock.items.map((n) => productCard({ icon: '🍫', name: n, price: null, badge: 'For you', badgeClass: 'pcard__badge--rec' }))),
      ]));
    case 'festive_takeover':
      return phoneFrame(el('div', { class: 'phone__header', style: 'background:linear-gradient(135deg,#c2410c,#f59e0b)' }, [
        el('div', { class: 'phone__eta' }, mock.theme),
        el('div', { class: 'phone__eta-sub' }, 'You searched for: milk'),
      ]), el('div', { class: 'phone__body' }, [
        el('div', { class: 'sim-grid' }, mock.items.map((n) => productCard({ icon: '🎁', name: n, price: null, badge: 'Festive', badgeClass: 'pcard__badge--fest' }))),
      ]));
    case 'pack_picker':
      return phoneFrame(greenHeader('12 mins'), el('div', { class: 'popup-sheet' }, el('div', { class: 'popup-sheet__panel' }, [
        el('h3', {}, 'Coca-Cola Soft Drink'),
        el('div', { style: 'display:flex; gap:8px; margin-top:12px' }, mock.options.map((o) => el('div', { class: 'pcard', style: 'flex:1' }, [
          o.tag ? el('div', { class: 'pcard__badge pcard__badge--fest' }, o.tag) : null,
          el('div', { class: 'pcard__img' }, '🥤'),
          el('div', { class: 'pcard__name' }, o.label),
          el('div', { class: 'pcard__unit' }, o.unit),
          el('div', { class: 'pcard__price' }, formatRupee(o.price)),
        ]))),
      ])));
    case 'bill_breakdown':
      return phoneFrame(screenHeader('Checkout', 'Review your bill'), el('div', { class: 'phone__body' }, [
        el('div', { class: 'checkout-line' }, [el('span', {}, 'Items total'), el('span', {}, formatRupee(mock.itemsTotal))]),
        el('div', { class: 'checkout-line' }, [el('span', {}, 'Delivery charge'), el('span', {}, formatRupee(mock.delivery))]),
        el('div', { class: 'checkout-line' }, [el('span', {}, 'Handling charge'), el('span', {}, formatRupee(mock.handling))]),
        el('div', { class: 'checkout-line' }, [el('span', {}, 'Small cart charge'), el('span', {}, formatRupee(mock.smallCart))]),
        el('div', { class: 'checkout-line checkout-line--total' }, [el('span', {}, 'Grand total'), el('span', {}, formatRupee(mock.total))]),
        el('div', { class: 'hint', style: 'margin-top:6px' }, `No small cart charge on orders above ${formatRupee(mock.waiver)}`),
      ]));
    case 'bought_earlier':
      return phoneFrame(screenHeader('Search results', 'Showing results for "cyucbwkd..."'), el('div', { class: 'phone__body' }, [
        el('div', { class: 'phone__search', style: 'margin:0 0 10px' }, 'Search: "cyucbwkd..."'),
        el('div', { class: 'sim-grid' }, mock.items.map((n) => productCard({ icon: '🍬', name: n, price: null, badge: 'Bought earlier', badgeClass: '' }))),
      ]));
    case 'popup_offer':
      return phoneFrame(greenHeader('8 mins'), el('div', { class: 'popup-sheet' }, el('div', { class: 'popup-sheet__panel' }, [
        el('div', { style: 'font-size:32px' }, '🛵'),
        el('h3', { style: 'margin-top:8px' }, mock.headline),
        el('p', { class: 'lede' }, mock.condition),
        el('div', { class: 'mock-btn', style: 'margin-top:12px' }, 'Got it, thanks!'),
      ])));
    default:
      return el('div');
  }
}

export default function renderScenarios(container, ctx) {
  ctx.state.scenarioIndex ??= 0;

  function mount() {
    const idx = ctx.state.scenarioIndex;
    const sc = SCENARIOS[idx];
    clear(container);

    const shownAt = performance.now();
    let firstAnswerAt = null;
    let likelihoodAnswered = false, agreementAnswered = false;
    let likelihoodChanged = false, agreementChanged = false;
    let likelihoodValue = null, agreementValue = null;

    const dots = el('div', { class: 'scenario-progress' }, SCENARIOS.map((_, i) =>
      el('div', { class: 'scenario-progress__dot' + (i < idx ? ' is-done' : i === idx ? ' is-current' : '') })
    ));

    const nextBtn = el('button', { class: 'btn btn--accent' }, idx === SCENARIOS.length - 1 ? 'Continue' : 'Next scenario');
    nextBtn.disabled = true;

    function maybeEnable() {
      if (likelihoodAnswered && agreementAnswered) nextBtn.disabled = false;
    }

    const likelihoodRow = likertRow({
      text: sc.likelihood,
      leftLabel: 'Very unlikely', rightLabel: 'Very likely',
      onAnswer: (v) => {
        if (firstAnswerAt === null) firstAnswerAt = performance.now();
        else likelihoodChanged = likelihoodAnswered ? true : likelihoodChanged;
        likelihoodAnswered = true;
        likelihoodValue = v;
        maybeEnable();
      },
    });
    const agreementRow = likertRow({
      text: sc.agreement,
      leftLabel: 'Strongly disagree', rightLabel: 'Strongly agree',
      onAnswer: (v) => {
        if (firstAnswerAt === null) firstAnswerAt = performance.now();
        else agreementChanged = agreementAnswered ? true : agreementChanged;
        agreementAnswered = true;
        agreementValue = v;
        maybeEnable();
      },
    });

    const wrap = el('div', { class: 'step' }, [
      el('div', { class: 'card' }, [
        el('div', { class: 'eyebrow' }, `Part 3 of 11 · Scenario ${idx + 1} of ${SCENARIOS.length}`),
        dots,
        el('div', { class: 'situation' }, sc.situation),
        renderMock(sc.mock),
        el('div', { class: 'likert', style: 'margin-top:16px' }, [likelihoodRow, agreementRow]),
      ]),
      el('div', { class: 'step-actions' }, [
        el('button', { class: 'btn btn--ghost', onClick: () => {
          if (idx === 0) ctx.goBack();
          else { ctx.state.scenarioIndex -= 1; mount(); }
        } }, '← Back'),
        nextBtn,
      ]),
    ]);

    nextBtn.addEventListener('click', async () => {
      const decisionTimeMs = firstAnswerAt ? Math.round(firstAnswerAt - shownAt) : null;
      await ctx.api.saveScenario(ctx.state.uuid, {
        scenarioCode: sc.code,
        likelihood: likelihoodValue,
        agreement: agreementValue,
        decisionTimeMs,
        changedMind: likelihoodChanged || agreementChanged,
      });
      if (idx === SCENARIOS.length - 1) ctx.goNext();
      else { ctx.state.scenarioIndex += 1; mount(); }
    });

    container.appendChild(wrap);
  }

  mount();
}
