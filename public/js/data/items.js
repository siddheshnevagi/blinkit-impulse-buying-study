// Single source of truth for every Likert-type construct item used in the study.
// role: 'stimulus' | 'organism' | 'response' | 'trait' | 'welfare'
// reverse: true items are worded negatively and should be reverse-scored before
// computing construct means (procedural remedy for common-method bias).
export const LIKERT_SECTIONS = [
  {
    code: 'SC',
    title: 'Scarcity & time-pressure cues',
    role: 'stimulus',
    blurb: 'Countdown timers, low-stock labels, delivery-speed promises.',
    items: [
      { code: 'SC1', text: 'Countdown or delivery-time counters on the app make me feel I should order quickly.' },
      { code: 'SC2', text: 'Labels like "only a few left" or "selling fast" push me to buy before I miss out.' },
      { code: 'SC3', text: 'The promise of delivery in about 10 minutes makes me place orders on the spur of the moment.' },
      { code: 'SC4', text: 'Limited-time offers on these apps create a sense of urgency to buy right now.' },
    ],
  },
  {
    code: 'PR',
    title: 'Promotions & deals',
    role: 'stimulus',
    blurb: 'Discounts, coupons, bundles, free-delivery thresholds.',
    items: [
      { code: 'PR1', text: 'Discounts and coupons tempt me to buy items I had not planned to.' },
      { code: 'PR2', text: '"Free delivery above ₹X" offers make me add extra items to my cart.' },
      { code: 'PR3', text: 'Combo and bundle deals make me spend more than I intended.' },
      { code: 'PR4', text: 'I open these apps just to check ongoing deals, even when I don\'t need anything.', optional: true },
    ],
  },
  {
    code: 'CV',
    title: 'App convenience',
    role: 'stimulus',
    blurb: 'Friction removed from browsing, payment and checkout.',
    items: [
      { code: 'CV1', text: 'Ordering on these apps takes very little effort.' },
      { code: 'CV2', text: 'Saved payment details and one-tap checkout make it easy to buy instantly.' },
      { code: 'CV3', text: 'The app is simple to browse, and I find products quickly.' },
      { code: 'CV4', text: 'Because ordering is so convenient, I buy things I would otherwise skip.' },
    ],
  },
  {
    code: 'PN',
    title: 'Personalised cues',
    role: 'stimulus',
    blurb: 'Recommendations, "you might also like", push notifications.',
    items: [
      { code: 'PN1', text: 'The products recommended to me often match what I feel like buying.' },
      { code: 'PN2', text: 'Push notifications from these apps prompt me to open the app and shop.' },
      { code: 'PN3', text: '"Frequently bought" / "you may also like" rows lead me to add more items.' },
      { code: 'PN4', text: 'Personalised offers make me feel the app understands my needs.', optional: true },
    ],
  },
  {
    code: 'AR',
    title: 'Felt urgency & arousal',
    role: 'organism',
    blurb: 'The internal charge behind the tap.',
    items: [
      { code: 'AR1', text: 'While using these apps I sometimes feel excited or energised.' },
      { code: 'AR2', text: 'I feel a sense of urgency to complete my order quickly.' },
      { code: 'AR3', text: 'Browsing the app can feel stimulating or fun.' },
      { code: 'AR4', text: 'When I see something I like, I feel a strong pull to buy it immediately.' },
    ],
  },
  {
    code: 'EN',
    title: 'Shopping enjoyment & ease',
    role: 'organism',
    blurb: 'The pleasant, effortless side of the experience.',
    items: [
      { code: 'EN1', text: 'Shopping on quick-commerce apps is enjoyable.' },
      { code: 'EN2', text: 'I feel good when my order arrives within minutes.' },
      { code: 'EN3', text: 'Overall, I find the experience pleasant and effortless.' },
      { code: 'EN4', text: 'Ordering on these apps lifts my mood.', optional: true },
    ],
  },
  {
    code: 'IBT',
    title: 'Impulse-buying tendency (general trait)',
    role: 'trait',
    blurb: 'How you shop everywhere, not just on Blinkit.',
    items: [
      { code: 'IBT1', text: '"Buy now, think about it later" describes how I sometimes shop.' },
      { code: 'IBT2', text: 'I often buy things spontaneously.' },
      { code: 'IBT3', text: 'I find it hard to resist buying something I like, even if unplanned.' },
      { code: 'IBT4', text: 'I sometimes feel a sudden urge to buy something with no prior plan.' },
    ],
  },
  {
    code: 'SCTL',
    title: 'Self-control (general)',
    role: 'trait',
    blurb: 'A brief, validated self-regulation measure — two items are reverse-worded on purpose.',
    items: [
      { code: 'SCTL1', text: 'I am good at resisting temptation.' },
      { code: 'SCTL2', text: 'I have a hard time breaking bad habits.', reverse: true },
      { code: 'SCTL3', text: 'I do certain things that are bad for me if they are fun.', reverse: true },
      { code: 'SCTL4', text: 'People would say I have iron self-discipline.' },
    ],
  },
  {
    code: 'UBI',
    title: 'Urge to buy impulsively (on Blinkit)',
    role: 'response',
    blurb: 'The proximal pull, right before the click.',
    items: [
      { code: 'UBI1', text: 'On these apps I sometimes feel a sudden urge to buy something I didn\'t come for.' },
      { code: 'UBI2', text: 'I experience strong "I want it now" feelings while using the app.' },
      { code: 'UBI3', text: 'It is difficult to resist adding unplanned items to my cart.' },
    ],
  },
  {
    code: 'IB',
    title: 'Impulse-buying behaviour (on Blinkit)',
    role: 'response',
    blurb: 'What actually ends up in the basket.',
    items: [
      { code: 'IB1', text: 'I frequently buy items on these apps that I had not planned to buy.' },
      { code: 'IB2', text: 'Many of my orders include at least one unplanned item.' },
      { code: 'IB3', text: 'I have bought things simply because they could arrive instantly.' },
      { code: 'IB4', text: 'I often add extra items at checkout on impulse.' },
    ],
  },
  {
    code: 'RG',
    title: 'Post-purchase regret',
    role: 'welfare',
    blurb: 'How the order looks a day later.',
    items: [
      { code: 'RG1', text: 'I sometimes regret impulse purchases made on these apps.' },
      { code: 'RG2', text: 'After some orders I feel I spent more than I should have.' },
      { code: 'RG3', text: 'I occasionally feel my quick-commerce spending is higher than I realise.' },
    ],
  },
];

// Optional marker-variable module for common-method-bias diagnostics (Podsakoff et al., 2003).
// Theoretically unrelated to impulse buying, so it should not correlate with the study constructs;
// off by default, toggle ENABLE_PANAS in app config to include it.
export const PANAS_ITEMS = {
  code: 'PANAS',
  title: 'Right now, I feel...',
  role: 'marker',
  blurb: 'A short mood check used only as a statistical control.',
  items: [
    { code: 'PANAS1', text: 'Interested' },
    { code: 'PANAS2', text: 'Upset' },
    { code: 'PANAS3', text: 'Alert' },
    { code: 'PANAS4', text: 'Nervous' },
    { code: 'PANAS5', text: 'Inspired' },
  ],
};

export function allLikertItems(includePanas = false) {
  const sections = includePanas ? [...LIKERT_SECTIONS, PANAS_ITEMS] : LIKERT_SECTIONS;
  return sections.flatMap((s) => s.items.map((it) => ({ ...it, section: s.code })));
}
