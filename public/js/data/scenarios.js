// Vignette battery. Each scenario is a short, realistic Blinkit moment rendered as a
// mock phone screen. Every scenario captures a single likelihood rating plus the
// decision time (ms from render to answer) as a behavioural proxy for how "gut-level"
// versus deliberated the reaction was — one question per scenario, kept short on
// purpose so the battery stays quick to complete.
//
// mock: describes the phone-mock UI so the renderer can build it without images.
export const SCENARIOS = [
  {
    code: 'E1',
    trigger: 'scarcity_time',
    hypotheses: ['H1', 'H3'],
    situation: 'It\'s 11 PM. You open the app only to buy milk. On the home screen, a snack you love shows "Only 2 left" and "Delivered in 12 minutes."',
    mock: { type: 'home_badge', badge: 'Only 2 left', eta: '12 mins', product: 'Your favourite snack' },
    likelihood: 'I would add the snack to my cart.',
  },
  {
    code: 'E2',
    trigger: 'threshold_nudge',
    hypotheses: ['H4'],
    situation: 'Your cart total is ₹170. A banner reads "Add ₹30 more to get FREE delivery."',
    mock: { type: 'threshold', cartTotal: 170, need: 30, label: 'FREE delivery' },
    likelihood: 'I would add another item just to cross the free-delivery amount.',
  },
  {
    code: 'E3',
    trigger: 'personalised_recs',
    hypotheses: ['H5'],
    situation: 'At checkout, the app shows a "You might also like" row with three items matched to your past orders.',
    mock: { type: 'recs', items: ['Chips', 'Choco bar', 'Cold drink'] },
    likelihood: 'I would add at least one of these items.',
  },
  {
    code: 'E4',
    trigger: 'occasion_merchandising',
    hypotheses: ['H5'],
    situation: 'You open the app to buy milk. The home screen is taken over by a festive "Rakhi Specials" banner — rakhis, gifting combos, sweets — none of which you came for.',
    mock: { type: 'festive_takeover', theme: 'Rakhi Specials', items: ['Kids Rakhi', 'Gifting combo', 'Festive sweets box'] },
    likelihood: 'I would browse the festive rail even though I didn\'t come for it.',
  },
  {
    code: 'E5',
    trigger: 'quantity_anchor',
    hypotheses: ['H4'],
    situation: 'You search for one bottle of a soft drink. Before adding to cart, a pop-up shows Pack of 1 / Pack of 2 / Pack of 4 — the bigger pack is marked as better value per bottle.',
    mock: { type: 'pack_picker', options: [{ label: 'Pack of 1', price: 38, unit: '₹38/bottle' }, { label: 'Pack of 2', price: 75, unit: '₹37.5/bottle' }, { label: 'Pack of 4', price: 151, unit: '₹37.8/bottle', tag: 'Best value' }] },
    likelihood: 'I would pick a bigger pack than I actually needed.',
  },
  {
    code: 'E6',
    trigger: 'fee_stacking',
    hypotheses: ['H8'],
    situation: 'Your ₹95 item balloons to a ₹150 bill after a delivery charge, a handling charge and a "small cart" charge — with a note that the small-cart charge disappears above ₹99.',
    mock: { type: 'bill_breakdown', itemsTotal: 95, delivery: 30, handling: 5, smallCart: 20, total: 150, waiver: 99 },
    likelihood: 'I would add another item purely to dodge the small-cart charge.',
  },
  {
    code: 'E7',
    trigger: 'habit_reactivation',
    hypotheses: ['H1', 'H5'],
    situation: 'You search for something completely unrelated. The results page resurfaces snacks tagged "Bought earlier" that you used to order often.',
    mock: { type: 'bought_earlier', items: ['KitKat', 'Kinder Joy', 'Munch'] },
    likelihood: 'I would add one of these familiar items even though I searched for something else.',
  },
];
