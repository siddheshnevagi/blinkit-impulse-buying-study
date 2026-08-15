import { el, clear, pillGroup, formatRupee } from '../ui.js';
import { CATALOG, CATEGORIES, FREE_DELIVERY_THRESHOLD, SMALL_CART_WAIVER, DELIVERY_FEE, HANDLING_FEE, SMALL_CART_FEE } from '../data/catalog.js';

const ICONS = {
  'Dairy & Eggs': '🥛', Snacks: '🍟', Chocolates: '🍫', Beverages: '🥤', 'Ice Cream': '🍨',
  Food: '🍜', Festive: '🎉', Bakery: '🍪', 'Personal Care': '🧴',
};

// The behavioural centrepiece: a real, clickable mini shopping app. The respondent is
// sent to "buy milk and eggs" and everything they do beyond that — every scarcity-tagged
// add, every threshold-chasing add, every recommendation click, every trip back and
// forth between shop and checkout — is logged as revealed behaviour, not self-report.
// Every event carries the cart total AND the running checkout-view count at that
// instant, so the full "saw the fee, went back, added more" path is directly queryable
// rather than something that has to be inferred after the fact.
//
// All mutable state lives on ctx.state.cartSim (created once, reused on every re-mount)
// so navigating back to an earlier step and forward again — or revisiting this step —
// never loses the cart, the click flags, or the checkout answer.
export default function renderCartSim(container, ctx) {
  const s = (ctx.state.cartSim ??= {
    cart: {}, // productId -> qty
    events: [],
    screen: 'shop',
    activeCategory: 'All',
    nudgeShown: false,
    itemsAddedAfterNudge: 0,
    itemsAddedAfterAnyCheckoutView: 0,
    checkoutViewCount: 0,
    shopReturnCount: 0,
    categoriesBrowsed: [], // ordered, de-duplicated on push
    clicked: { scarcity: false, recommended: false, festive: false, boughtEarlier: false },
    simStart: performance.now(),
    noticedValue: null,
  });

  function log(type, product, meta) {
    s.events.push({
      type,
      productId: product?.id || null,
      productName: product?.name || null,
      productPrice: product?.price ?? null,
      tags: product?.tags || [],
      cartTotal: cartTotal(),
      tOffsetMs: Math.round(performance.now() - s.simStart),
      meta: meta ? JSON.stringify(meta) : null,
    });
  }

  function cartTotal() {
    return CATALOG.reduce((sum, p) => sum + (s.cart[p.id] || 0) * p.price, 0);
  }
  function cartCount() {
    return Object.values(s.cart).reduce((a, b) => a + b, 0);
  }

  // Fires a `threshold_crossed` event the instant an add/remove moves the cart total
  // across the free-delivery (₹149) or small-cart-waiver (₹99) line, in either
  // direction — the exact moment a fee did or didn't apply changes.
  function logThresholdCrossings(prevTotal, newTotal) {
    for (const [name, line] of [['free_delivery', FREE_DELIVERY_THRESHOLD], ['small_cart_waiver', SMALL_CART_WAIVER]]) {
      const wasAbove = prevTotal >= line;
      const isAbove = newTotal >= line;
      if (wasAbove !== isAbove) {
        log('threshold_crossed', null, { threshold: name, direction: isAbove ? 'crossed_above' : 'crossed_below', prevTotal, newTotal });
      }
    }
  }

  function addOne(product) {
    const prevTotal = cartTotal();
    s.cart[product.id] = (s.cart[product.id] || 0) + 1;
    const newTotal = cartTotal();
    logThresholdCrossings(prevTotal, newTotal);
    log('add_to_cart', product, { checkoutViewsSoFar: s.checkoutViewCount, shopReturnsSoFar: s.shopReturnCount });
    if (product.tags.includes('scarcity')) s.clicked.scarcity = true;
    if (product.tags.includes('recommended')) s.clicked.recommended = true;
    if (product.tags.includes('festive')) s.clicked.festive = true;
    if (product.tags.includes('boughtEarlier')) s.clicked.boughtEarlier = true;
    if (s.nudgeShown) s.itemsAddedAfterNudge += 1;
    if (s.checkoutViewCount > 0) s.itemsAddedAfterAnyCheckoutView += 1;
  }
  function removeOne(product) {
    if (!s.cart[product.id]) return;
    const prevTotal = cartTotal();
    s.cart[product.id] -= 1;
    if (s.cart[product.id] <= 0) delete s.cart[product.id];
    const newTotal = cartTotal();
    logThresholdCrossings(prevTotal, newTotal);
    log('remove_from_cart', product, { checkoutViewsSoFar: s.checkoutViewCount, shopReturnsSoFar: s.shopReturnCount });
  }

  function fees(total) {
    const delivery = total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const smallCart = total >= SMALL_CART_WAIVER ? 0 : SMALL_CART_FEE;
    const handling = total > 0 ? HANDLING_FEE : 0;
    return { delivery, handling, smallCart, grand: total + delivery + handling + smallCart };
  }

  function render() {
    clear(container);
    container.appendChild(s.screen === 'shop' ? renderShop() : renderCheckout());
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
      el('button', {
        class: 'sim-catchip' + (s.activeCategory === cat ? ' is-active' : ''),
        onClick: () => {
          if (cat !== s.activeCategory) {
            log('category_filter', null, { category: cat });
            if (!s.categoriesBrowsed.includes(cat)) s.categoriesBrowsed.push(cat);
          }
          s.activeCategory = cat;
          render();
        },
      }, cat)
    ));

    const visible = CATALOG.filter((p) => s.activeCategory === 'All' || p.category === s.activeCategory);
    const grid = el('div', { class: 'sim-grid' }, visible.map((p) => renderProductCard(p)));

    const hasEssentials = (s.cart.milk || 0) > 0 && (s.cart.eggs || 0) > 0;
    const cartBar = el('div', { class: 'sim-cartbar' }, [
      el('div', {}, [
        el('div', { class: 'sim-cartbar__total' }, `${cartCount()} item${cartCount() === 1 ? '' : 's'} · ${formatRupee(cartTotal())}`),
        el('div', { class: 'sim-cartbar__sub' }, hasEssentials ? 'Milk & eggs added ✓' : 'Add milk & eggs to continue'),
      ]),
      el('button', { class: 'btn btn--accent btn--sm', disabled: !hasEssentials, onClick: () => {
        s.screen = 'checkout';
        render();
      } }, 'View cart →'),
    ]);

    return el('div', { class: 'step' }, [
      el('div', { style: 'display:flex; align-items:center; justify-content:space-between; gap:12px' }, [
        el('div', { class: 'eyebrow', style: 'margin-bottom:0' }, 'Part 4 of 4 · A tiny shopping task'),
        el('button', { class: 'btn btn--ghost btn--sm', onClick: ctx.goBack }, '← Back'),
      ]),
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
    const qty = s.cart[p.id] || 0;
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
    if (total < FREE_DELIVERY_THRESHOLD) s.nudgeShown = true;
    if (s.events.length === 0 || s.events[s.events.length - 1].type !== 'checkout_viewed') {
      s.checkoutViewCount += 1;
      log('checkout_viewed', null, { visitNumber: s.checkoutViewCount });
    }

    const lines = CATALOG.filter((p) => s.cart[p.id]).map((p) =>
      el('div', { class: 'checkout-line' }, [el('span', {}, `${p.name} × ${s.cart[p.id]}`), el('span', {}, formatRupee(p.price * s.cart[p.id]))])
    );

    const nudge = total < FREE_DELIVERY_THRESHOLD ? el('div', { class: 'threshold-banner', style: 'margin-bottom:14px' }, [
      `Add ${formatRupee(FREE_DELIVERY_THRESHOLD - total)} more to get FREE delivery`,
      el('div', { class: 'threshold-track' }, el('div', { class: 'threshold-fill', style: `width:${Math.round((total / FREE_DELIVERY_THRESHOLD) * 100)}%` })),
    ]) : null;

    const noticedWrap = el('div', { class: 'field', style: 'margin-top:16px' }, [
      el('label', { class: 'field__label' }, 'Before you continue — did you notice how much the delivery, handling and small-cart charges added to your total just now?'),
      pillGroup({ options: ['Yes, I noticed', 'No, I didn\'t check', 'I don\'t usually check'], value: () => s.noticedValue, onChange: (v) => { s.noticedValue = v; refreshPlace(); } }),
    ]);

    const placeBtn = el('button', { class: 'btn btn--accent btn--block', style: 'margin-top:4px', disabled: !s.noticedValue, onClick: async () => {
      log('place_order', null, { checkoutViewCount: s.checkoutViewCount, shopReturnCount: s.shopReturnCount });
      const finalTotal = cartTotal();
      const summary = {
        finalCartTotal: finalTotal,
        finalItemCount: cartCount(),
        plannedItemsAdded: CATALOG.filter((p) => p.tags.includes('planned')).reduce((sum, p) => sum + (s.cart[p.id] || 0), 0),
        unplannedItemsAdded: CATALOG.filter((p) => !p.tags.includes('planned')).reduce((sum, p) => sum + (s.cart[p.id] || 0), 0),
        crossedFreeDeliveryThreshold: finalTotal >= FREE_DELIVERY_THRESHOLD,
        itemsAddedAfterThresholdNudge: s.itemsAddedAfterNudge,
        itemsAddedAfterAnyCheckoutView: s.itemsAddedAfterAnyCheckoutView,
        checkoutViewCount: s.checkoutViewCount,
        shopReturnCount: s.shopReturnCount,
        categoriesBrowsedCount: s.categoriesBrowsed.length,
        categoriesBrowsed: s.categoriesBrowsed,
        clickedScarcityItem: s.clicked.scarcity,
        clickedRecommendedItem: s.clicked.recommended,
        clickedFestiveItem: s.clicked.festive,
        clickedBoughtEarlierItem: s.clicked.boughtEarlier,
        totalTimeMs: Math.round(performance.now() - s.simStart),
        noticedFees: s.noticedValue === 'Yes, I noticed' ? true : s.noticedValue ? false : null,
      };
      await ctx.api.saveCartEvents(ctx.state.uuid, s.events);
      await ctx.api.saveCartSummary(ctx.state.uuid, summary);
      await ctx.api.complete(ctx.state.uuid);
      ctx.goNext();
    } }, 'Place order');

    function refreshPlace() { placeBtn.disabled = !s.noticedValue; }

    return el('div', { class: 'step' }, [
      el('div', { class: 'eyebrow' }, 'Part 4 of 4 · Checkout'),
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
        el('button', { class: 'btn btn--ghost', onClick: () => {
          s.shopReturnCount += 1;
          log('back_to_shop', null, { fromCartTotal: total, returnNumber: s.shopReturnCount });
          s.screen = 'shop';
          render();
        } }, '← Back to shop'),
      ]),
      placeBtn,
    ]);
  }

  render();
}
