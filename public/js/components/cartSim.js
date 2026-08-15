import { el, clear, pillGroup, formatRupee } from '../ui.js';
import { CATALOG, CATEGORIES, FREE_DELIVERY_THRESHOLD, SMALL_CART_WAIVER, DELIVERY_FEE, HANDLING_FEE, SMALL_CART_FEE } from '../data/catalog.js';

const ICONS = {
  'Dairy & Eggs': '🥛', Snacks: '🍟', Chocolates: '🍫', Beverages: '🥤', 'Ice Cream': '🍨',
  Food: '🍜', Festive: '🎉', Bakery: '🍪', 'Personal Care': '🧴',
};

// The behavioural centrepiece: a real, clickable mini shopping app. The respondent is
// sent to "buy milk and eggs" and everything they do beyond that — every scarcity-tagged
// add, every threshold-chasing add, every recommendation click — is logged as revealed
// behaviour, not self-report. This gives an actual unplanned-share-of-basket number to
// set alongside the self-reported one from Section 3.
export default function renderCartSim(container, ctx) {
  const cart = {}; // productId -> qty
  const events = [];
  const simStart = performance.now();
  let activeCategory = 'All';
  let screen = 'shop';
  let nudgeShown = false;
  let itemsAddedAfterNudge = 0;
  const clicked = { scarcity: false, recommended: false, festive: false, boughtEarlier: false };

  function log(type, product) {
    events.push({
      type,
      productId: product?.id || null,
      productName: product?.name || null,
      productPrice: product?.price ?? null,
      tags: product?.tags || [],
      cartTotal: cartTotal(),
      tOffsetMs: Math.round(performance.now() - simStart),
    });
  }

  function cartTotal() {
    return CATALOG.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);
  }
  function cartCount() {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }

  function addOne(product) {
    cart[product.id] = (cart[product.id] || 0) + 1;
    log('add_to_cart', product);
    if (product.tags.includes('scarcity')) clicked.scarcity = true;
    if (product.tags.includes('recommended')) clicked.recommended = true;
    if (product.tags.includes('festive')) clicked.festive = true;
    if (product.tags.includes('boughtEarlier')) clicked.boughtEarlier = true;
    if (nudgeShown) itemsAddedAfterNudge += 1;
  }
  function removeOne(product) {
    if (!cart[product.id]) return;
    cart[product.id] -= 1;
    if (cart[product.id] <= 0) delete cart[product.id];
    log('remove_from_cart', product);
  }

  function fees(total) {
    const delivery = total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const smallCart = total >= SMALL_CART_WAIVER ? 0 : SMALL_CART_FEE;
    const handling = total > 0 ? HANDLING_FEE : 0;
    return { delivery, handling, smallCart, grand: total + delivery + handling + smallCart };
  }

  function render() {
    clear(container);
    container.appendChild(screen === 'shop' ? renderShop() : renderCheckout());
  }

  function renderShop() {
    const task = el('div', { class: 'sim-task' }, [
      el('span', { style: 'font-size:20px' }, '📝'),
      el('span', {}, 'Task: you just realised you\'re out of milk and eggs. Use this mini app to place that order — shop however feels natural.'),
    ]);

    const topbar = el('div', { class: 'sim-topbar' }, [
      el('div', { style: 'font-weight:800; font-size:16px' }, 'Blinkit in 8 minutes'),
      el('div', { style: 'font-size:12px; opacity:.85' }, 'Sector A, Jankipuram'),
    ]);

    const catbar = el('div', { class: 'sim-catbar' }, CATEGORIES.map((cat) =>
      el('button', { class: 'sim-catchip' + (activeCategory === cat ? ' is-active' : ''), onClick: () => { activeCategory = cat; render(); } }, cat)
    ));

    const visible = CATALOG.filter((p) => activeCategory === 'All' || p.category === activeCategory);
    const grid = el('div', { class: 'sim-grid' }, visible.map((p) => renderProductCard(p)));

    const hasEssentials = (cart.milk || 0) > 0 && (cart.eggs || 0) > 0;
    const cartBar = el('div', { class: 'sim-cartbar' }, [
      el('div', {}, [
        el('div', { class: 'sim-cartbar__total' }, `${cartCount()} item${cartCount() === 1 ? '' : 's'} · ${formatRupee(cartTotal())}`),
        el('div', { class: 'sim-cartbar__sub' }, hasEssentials ? 'Milk & eggs added ✓' : 'Add milk & eggs to continue'),
      ]),
      el('button', { class: 'btn btn--accent btn--sm', disabled: !hasEssentials, onClick: () => { screen = 'checkout'; render(); } }, 'View cart →'),
    ]);

    return el('div', { class: 'step' }, [
      el('div', { class: 'eyebrow' }, 'Part 4 of 11 · A tiny shopping task'),
      task,
      el('div', { class: 'card card--flush', style: 'margin-top:12px' }, [
        topbar,
        el('div', { style: 'padding:12px 16px 0' }, catbar),
        el('div', { style: 'padding:12px 16px 16px' }, grid),
      ]),
      cartBar,
    ]);
  }

  function renderProductCard(p) {
    const qty = cart[p.id] || 0;
    const badgeClass = p.tags.includes('scarcity') ? '' : p.tags.includes('festive') ? 'pcard__badge--fest' : 'pcard__badge--rec';
    return el('div', { class: 'pcard' }, [
      p.badge ? el('div', { class: `pcard__badge ${badgeClass}` }, p.badge) : null,
      el('div', { class: 'pcard__img' }, ICONS[p.category] || '🛒'),
      el('div', { class: 'pcard__name' }, p.name),
      el('div', { class: 'pcard__unit' }, `${p.unit} · ${p.eta}`),
      el('div', { class: 'pcard__row' }, [
        el('div', { class: 'pcard__price' }, formatRupee(p.price)),
        qty === 0
          ? el('button', { class: 'pcard__add', onClick: () => { addOne(p); render(); } }, 'ADD')
          : el('div', { style: 'display:flex; align-items:center; gap:6px' }, [
              el('button', { class: 'pcard__add', onClick: () => { removeOne(p); render(); } }, '−'),
              el('span', { style: 'font-weight:800; font-size:12px' }, qty),
              el('button', { class: 'pcard__add', onClick: () => { addOne(p); render(); } }, '+'),
            ]),
      ]),
    ]);
  }

  function renderCheckout() {
    const total = cartTotal();
    const f = fees(total);
    if (total < FREE_DELIVERY_THRESHOLD) nudgeShown = true;
    if (events.length === 0 || events[events.length - 1].type !== 'checkout_viewed') log('checkout_viewed', null);

    const lines = CATALOG.filter((p) => cart[p.id]).map((p) =>
      el('div', { class: 'checkout-line' }, [el('span', {}, `${p.name} × ${cart[p.id]}`), el('span', {}, formatRupee(p.price * cart[p.id]))])
    );

    const nudge = total < FREE_DELIVERY_THRESHOLD ? el('div', { class: 'threshold-banner', style: 'margin-bottom:14px' }, [
      `Add ${formatRupee(FREE_DELIVERY_THRESHOLD - total)} more to get FREE delivery`,
      el('div', { class: 'threshold-track' }, el('div', { class: 'threshold-fill', style: `width:${Math.round((total / FREE_DELIVERY_THRESHOLD) * 100)}%` })),
    ]) : null;

    let noticedValue = null;
    const noticedWrap = el('div', { class: 'field', style: 'margin-top:16px' }, [
      el('label', { class: 'field__label' }, 'Before you continue — did you notice how much the delivery, handling and small-cart charges added to your total just now?'),
      pillGroup({ options: ['Yes, I noticed', 'No, I didn\'t check', 'I don\'t usually check'], value: () => noticedValue, onChange: (v) => { noticedValue = v; refreshPlace(); } }),
    ]);

    const placeBtn = el('button', { class: 'btn btn--accent btn--block', style: 'margin-top:4px', disabled: true, onClick: async () => {
      log('place_order', null);
      const finalTotal = cartTotal();
      const summary = {
        finalCartTotal: finalTotal,
        finalItemCount: cartCount(),
        plannedItemsAdded: CATALOG.filter((p) => p.tags.includes('planned')).reduce((s, p) => s + (cart[p.id] || 0), 0),
        unplannedItemsAdded: CATALOG.filter((p) => !p.tags.includes('planned')).reduce((s, p) => s + (cart[p.id] || 0), 0),
        crossedFreeDeliveryThreshold: finalTotal >= FREE_DELIVERY_THRESHOLD,
        itemsAddedAfterThresholdNudge: itemsAddedAfterNudge,
        clickedScarcityItem: clicked.scarcity,
        clickedRecommendedItem: clicked.recommended,
        clickedFestiveItem: clicked.festive,
        clickedBoughtEarlierItem: clicked.boughtEarlier,
        totalTimeMs: Math.round(performance.now() - simStart),
        noticedFees: noticedValue === 'Yes, I noticed' ? true : noticedValue ? false : null,
      };
      await ctx.api.saveCartEvents(ctx.state.uuid, events);
      await ctx.api.saveCartSummary(ctx.state.uuid, summary);
      ctx.goNext();
    } }, 'Place order');

    function refreshPlace() { placeBtn.disabled = !noticedValue; }

    return el('div', { class: 'step' }, [
      el('div', { class: 'eyebrow' }, 'Part 4 of 11 · Checkout'),
      el('div', { class: 'card' }, [
        el('h2', {}, 'Your cart'),
        el('div', { style: 'margin: 10px 0' }, lines),
        nudge,
        el('div', { class: 'checkout-line' }, [el('span', {}, 'Items total'), el('span', {}, formatRupee(total))]),
        el('div', { class: 'checkout-line' }, [el('span', {}, 'Delivery charge'), el('span', {}, f.delivery === 0 ? 'FREE' : formatRupee(f.delivery))]),
        el('div', { class: 'checkout-line' }, [el('span', {}, 'Handling charge'), el('span', {}, formatRupee(f.handling))]),
        el('div', { class: 'checkout-line' }, [el('span', {}, 'Small cart charge'), el('span', {}, f.smallCart === 0 ? 'FREE' : formatRupee(f.smallCart))]),
        el('div', { class: 'checkout-line checkout-line--total' }, [el('span', {}, 'Grand total'), el('span', {}, formatRupee(f.grand))]),
        noticedWrap,
      ]),
      el('div', { class: 'step-actions' }, [
        el('button', { class: 'btn btn--ghost', onClick: () => { screen = 'shop'; render(); } }, '← Back to shop'),
      ]),
      placeBtn,
    ]);
  }

  render();
}
