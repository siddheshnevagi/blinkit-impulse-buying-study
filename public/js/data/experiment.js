// The 2x2 between-subjects vignette experiment (blueprint H9 — the one causal test in the
// whole design). Each respondent is randomly assigned ONE cell on load and never sees the
// other three, so the manipulation stays clean. Condition is assigned client-side with a
// uniform RNG and stored immediately, before the respondent can infer the design.
export const PRODUCT = {
  name: 'Premium Belgian Chocolate Ice Cream Tub',
  unit: '700 ml',
  price: 280,
};

export const DELIVERY_FRAMES = {
  fast: { code: 'fast', label: 'Arriving in 10 minutes', sub: 'Delivery partner is 1.2 km away' },
  slow: { code: 'slow', label: 'Arriving tomorrow, 9–11 AM', sub: 'Scheduled delivery slot' },
};

export const SCARCITY_FRAMES = {
  present: { code: 'present', label: 'Only 3 left in your area' },
  absent: { code: 'absent', label: null },
};

export function assignCondition() {
  const delivery = Math.random() < 0.5 ? 'fast' : 'slow';
  const scarcity = Math.random() < 0.5 ? 'present' : 'absent';
  return { delivery, scarcity };
}

export const EXPERIMENT_ITEMS = {
  purchaseIntention: [
    { code: 'PI1', text: 'I would consider buying this right now.' },
    { code: 'PI2', text: 'The likelihood of me purchasing this is high.' },
    { code: 'PI3', text: 'I would add this to my cart if I saw it while browsing.' },
  ],
  urge: [
    { code: 'EXU1', text: 'Looking at this, I feel an urge to buy it immediately.' },
    { code: 'EXU2', text: 'I feel excited about this product right now.' },
    { code: 'EXU3', text: 'I would find it hard to walk away from this without buying it.' },
  ],
  manipulationCheck: { code: 'MC1', text: 'How fast did this delivery feel to you?', scaleLabels: ['Very slow', 'Very fast'] },
  deliberation: { code: 'DLB1', text: 'How much thought would you put into this decision?', scaleLabels: ['None at all', 'A great deal'] },
};
