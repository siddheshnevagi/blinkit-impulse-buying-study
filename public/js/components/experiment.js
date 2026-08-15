import { el, likertRow, pillGroup, formatRupee } from '../ui.js';
import { PRODUCT, DELIVERY_FRAMES, SCARCITY_FRAMES, EXPERIMENT_ITEMS } from '../data/experiment.js';

// The one causal test in the whole instrument (blueprint H9): a 2x2 between-subjects
// vignette. The respondent's condition was fixed the moment they started the study
// (see app.js / server randomisation), so this component only ever renders ONE cell —
// it never reveals the other three, keeping the manipulation clean.
export default function renderExperiment(container, ctx) {
  const delivery = DELIVERY_FRAMES[ctx.state.expDeliveryCondition] || DELIVERY_FRAMES.fast;
  const scarcity = SCARCITY_FRAMES[ctx.state.expScarcityCondition] || SCARCITY_FRAMES.absent;
  const mountedAt = performance.now();

  const answers = {};
  const allItems = [...EXPERIMENT_ITEMS.purchaseIntention, ...EXPERIMENT_ITEMS.urge];
  let decision = null;

  const phone = el('div', { class: 'phone' }, [
    el('div', { class: 'phone__screen' }, [
      el('div', { class: 'phone__statusbar' }, [el('span', {}, '9:41'), el('span', {}, '●●● 5G 82%')]),
      el('div', { class: 'phone__header' }, [
        el('div', { class: 'phone__eta' }, delivery.label),
        el('div', { class: 'phone__eta-sub' }, delivery.sub),
      ]),
      el('div', { class: 'phone__body' }, [
        scarcity.label ? el('div', { class: 'pcard__badge', style: 'position:static; display:inline-block; margin-bottom:8px' }, scarcity.label) : null,
        el('div', { class: 'pcard__img', style: 'height:120px; font-size:44px' }, '🍨'),
        el('h3', { style: 'margin-top:10px' }, PRODUCT.name),
        el('div', { class: 'pcard__unit' }, PRODUCT.unit),
        el('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-top:10px' }, [
          el('div', { class: 'pcard__price', style: 'font-size:20px' }, formatRupee(PRODUCT.price)),
          el('div', { class: 'pcard__add', style: 'padding:9px 18px; font-size:13px' }, 'ADD TO CART'),
        ]),
      ]),
    ]),
  ]);

  const likertWrap = el('div', { class: 'likert' });
  for (const it of allItems) {
    likertWrap.appendChild(likertRow({
      text: it.text,
      onAnswer: (v) => { answers[it.code] = v; refreshDisabled(); },
    }));
  }

  const mcWrap = el('div', { class: 'field' }, [
    el('label', { class: 'field__label' }, EXPERIMENT_ITEMS.manipulationCheck.text),
  ]);
  mcWrap.appendChild(likertRow({
    text: '',
    leftLabel: EXPERIMENT_ITEMS.manipulationCheck.scaleLabels[0],
    rightLabel: EXPERIMENT_ITEMS.manipulationCheck.scaleLabels[1],
    onAnswer: (v) => { answers.mc = v; refreshDisabled(); },
  }));
  mcWrap.querySelector('.likert__text').remove();

  const dlbWrap = el('div', { class: 'field' }, [
    el('label', { class: 'field__label' }, EXPERIMENT_ITEMS.deliberation.text),
  ]);
  dlbWrap.appendChild(likertRow({
    text: '',
    leftLabel: EXPERIMENT_ITEMS.deliberation.scaleLabels[0],
    rightLabel: EXPERIMENT_ITEMS.deliberation.scaleLabels[1],
    onAnswer: (v) => { answers.dlb = v; refreshDisabled(); },
  }));
  dlbWrap.querySelector('.likert__text').remove();

  const decisionWrap = el('div', { class: 'field' }, [
    el('label', { class: 'field__label' }, 'Honestly — would you buy this, right now, if you saw it?'),
    pillGroup({ options: ['Yes', 'Maybe', 'No'], value: () => decision, onChange: (v) => { decision = v; refreshDisabled(); } }),
  ]);

  const wrap = el('div', { class: 'step' }, [
    el('div', { class: 'card' }, [
      el('div', { class: 'eyebrow' }, 'Part 6 of 12 · One product, one decision'),
      el('h1', {}, 'Imagine you\'re scrolling and you see this'),
      el('p', { class: 'lede', style: 'margin-bottom:14px' }, 'Look at it the way you actually would — no need to overthink.'),
      phone,
      el('div', { style: 'margin-top:18px' }, likertWrap),
      mcWrap,
      dlbWrap,
      decisionWrap,
    ]),
  ]);

  const actions = el('div', { class: 'step-actions' });
  const nextBtn = el('button', { class: 'btn btn--accent', onClick: async () => {
    const pageDwellMs = Math.round(performance.now() - mountedAt);
    await ctx.api.saveExperiment(ctx.state.uuid, {
      deliveryCondition: delivery.code,
      scarcityCondition: scarcity.code,
      pi1: answers.PI1, pi2: answers.PI2, pi3: answers.PI3,
      exu1: answers.EXU1, exu2: answers.EXU2, exu3: answers.EXU3,
      manipulationCheck: answers.mc,
      deliberationSelfreport: answers.dlb,
      pageDwellMs,
      decision: decision ? decision.toLowerCase() : null,
    });
    ctx.goNext();
  } }, 'Continue');
  nextBtn.disabled = true;
  actions.appendChild(el('button', { class: 'btn btn--ghost', onClick: ctx.goBack }, '← Back'));
  actions.appendChild(nextBtn);
  wrap.appendChild(actions);

  function refreshDisabled() {
    nextBtn.disabled = !(allItems.every((it) => answers[it.code]) && answers.mc && answers.dlb && decision);
  }

  container.appendChild(wrap);
}
