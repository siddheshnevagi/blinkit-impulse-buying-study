// Tiny DOM helpers shared by every step component. No framework — the app is small
// enough that a hyperscript-style `el()` plus a few composite widgets keeps things
// readable without a build step.

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function pillGroup({ options, value, onChange, block = false }) {
  const wrap = el('div', { class: 'pillgroup' });
  function render() {
    clear(wrap);
    for (const opt of options) {
      const label = typeof opt === 'string' ? opt : opt.label;
      const val = typeof opt === 'string' ? opt : opt.value;
      const selected = value() === val;
      wrap.appendChild(el('button', {
        type: 'button',
        class: 'pill' + (block ? ' pill--block' : '') + (selected ? ' is-selected' : ''),
        onClick: () => { onChange(val); render(); },
      }, [label, block && selected ? '✓' : block ? '' : null]));
    }
  }
  render();
  return wrap;
}

export function checkGrid({ options, values, onToggle }) {
  const wrap = el('div', { class: 'checkgrid' });
  function render() {
    clear(wrap);
    for (const opt of options) {
      const label = typeof opt === 'string' ? opt : opt.label;
      const val = typeof opt === 'string' ? opt : opt.value;
      const selected = values().includes(val);
      wrap.appendChild(el('button', {
        type: 'button',
        class: 'checkchip' + (selected ? ' is-selected' : ''),
        onClick: () => { onToggle(val); render(); },
      }, (selected ? '✓ ' : '') + label));
    }
  }
  render();
  return wrap;
}

// A single 1-5 Likert row. Fires onAnswer(value, responseTimeMs) once, on first click,
// then allows changing the answer (responseTimeMs is only recorded for the FIRST click,
// which is the behaviourally meaningful "gut reaction" latency).
export function likertRow({ text, leftLabel = 'Strongly disagree', rightLabel = 'Strongly agree', initialValue = null, onAnswer }) {
  const shownAt = performance.now();
  let firstAnswerRecorded = initialValue !== null;
  let current = initialValue;
  const dotsWrap = el('div', { class: 'likert__scale' });

  function renderDots() {
    clear(dotsWrap);
    for (let i = 1; i <= 5; i++) {
      dotsWrap.appendChild(el('button', {
        type: 'button',
        class: 'likert__dot' + (current === i ? ' is-selected' : ''),
        'aria-label': `${i} of 5`,
        onClick: () => {
          current = i;
          const rt = firstAnswerRecorded ? null : Math.round(performance.now() - shownAt);
          firstAnswerRecorded = true;
          renderDots();
          onAnswer(i, rt);
        },
      }, String(i)));
    }
  }
  renderDots();

  return el('div', { class: 'likert__item' }, [
    el('div', { class: 'likert__text' }, text),
    el('div', { class: 'likert__row' }, [
      el('div', { class: 'likert__endlabel' }, leftLabel),
      dotsWrap,
      el('div', { class: 'likert__endlabel likert__endlabel--right' }, rightLabel),
    ]),
  ]);
}

export function stepShell({ eyebrow, title, lede, body, onBack, onNext, nextLabel = 'Continue', nextDisabled = () => false, hideBack = false }) {
  const wrap = el('div', { class: 'step' });
  const card = el('div', { class: 'card' });
  if (eyebrow) card.appendChild(el('div', { class: 'eyebrow' }, eyebrow));
  if (title) card.appendChild(el('h1', {}, title));
  if (lede) card.appendChild(el('p', { class: 'lede' }, lede));
  const bodyWrap = el('div', { class: title || lede ? 'field' : '' });
  if (body) bodyWrap.appendChild(body);
  card.appendChild(bodyWrap);
  wrap.appendChild(card);

  const actions = el('div', { class: 'step-actions' + (hideBack ? ' step-actions--end' : '') });
  if (!hideBack) actions.appendChild(el('button', { class: 'btn btn--ghost', onClick: onBack }, '← Back'));
  const nextBtn = el('button', { class: 'btn btn--accent', onClick: onNext }, nextLabel);
  actions.appendChild(nextBtn);
  wrap.appendChild(actions);

  function refreshDisabled() { nextBtn.disabled = nextDisabled(); }
  refreshDisabled();

  return { node: wrap, refreshDisabled };
}

export function setProgress(pct) {
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${Math.max(2, Math.min(100, pct))}%`;
}

export function formatRupee(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
