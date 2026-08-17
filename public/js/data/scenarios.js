// Vignette battery. Each scenario is a short, realistic Blinkit moment rendered as a
// mock phone screen. Every scenario captures four ratings plus the decision time (ms
// from render to first answer, a behavioural proxy for how "gut-level" versus
// deliberated the reaction was):
//   likelihood — the Response/DV: would they act on it (1 Very unlikely – 5 Very likely)
//   organism   — item 2, first Organism item (1 Strongly disagree – 5 Strongly agree)
//   item3      — second Organism item, same construct as `organism` (1-5 agree scale)
//   item4      — third Organism item, same construct as `organism` (1-5 agree scale)
//
// `construct` is the S-O-R organism construct code the three organism items (organism,
// item3, item4) jointly measure, per Fresh Start/model2-survey-spec.md:
//   PU Perceived Urgency · PS Perceived Deal Smartness · HT Heuristic Price Trust
//   NA Negative Affect/Irritation · CE Perceived Cognitive Ease
// construct value for a respondent = mean(organism, item3, item4).
// DV (II_composite) = mean of all 5 scenarios' `likelihood` ratings.
//
// E3 (personalised_recs, construct PP) and E4 (occasion_merchandising, construct PA)
// were removed from the live flow (2026-08-18) — see HANDOVER.md changelog. Earlier
// respondents' E3/E4 answers still exist in the DB and remain visible in the
// Scenarios_Long export sheet; they no longer appear in Respondents_Wide or
// II_composite going forward, since both are now built from this 5-scenario array.
//
// mock: describes the phone-mock UI so the renderer can build it without images.
export const SCENARIOS = [
  {
    code: 'E1',
    trigger: 'scarcity_time',
    hypotheses: ['H1', 'H3'],
    construct: 'PU',
    situation: 'It\'s 11 PM. You open the app only to buy milk. On the home screen, a snack you love shows "Only 2 left" and "Delivered in 12 minutes."',
    mock: { type: 'home_badge', badge: 'Only 2 left', eta: '12 mins', product: 'Your favourite snack' },
    likelihood: 'I would add the snack to my cart.',
    organism: 'Seeing "only 2 left" makes me feel I need to grab it before it\'s gone.',
    item3: 'I felt a sense of time pressure to decide quickly.',
    item4: 'I felt anxious that I might miss out if I didn\'t act now.',
  },
  {
    code: 'E2',
    trigger: 'threshold_nudge',
    hypotheses: ['H4'],
    construct: 'PS',
    situation: 'Your cart total is ₹170. A banner reads "Add ₹30 more to get FREE delivery."',
    mock: { type: 'threshold', cartTotal: 170, need: 30, label: 'FREE delivery' },
    likelihood: 'I would add another item just to cross the free-delivery amount.',
    organism: 'In this situation, adding another item feels like the smart thing to do.',
    item3: 'Reaching the free-delivery threshold felt like a small win.',
    item4: 'I felt I was getting more value for money by adding one more item.',
  },
  {
    code: 'E5',
    trigger: 'quantity_anchor',
    hypotheses: ['H4'],
    construct: 'HT',
    situation: 'You search for one bottle of a soft drink. Before adding to cart, a pop-up shows Pack of 1 / Pack of 2 / Pack of 4 — the bigger pack is marked as better value per bottle.',
    mock: { type: 'pack_picker', options: [{ label: 'Pack of 1', price: 38, unit: '₹38/bottle' }, { label: 'Pack of 2', price: 75, unit: '₹37.5/bottle' }, { label: 'Pack of 4', price: 151, unit: '₹37.8/bottle', tag: 'Best value' }] },
    likelihood: 'I would pick a bigger pack than I actually needed.',
    organism: 'The "best value" tag makes me trust this is the smart pick without checking the maths myself.',
    item3: 'I assumed the bigger pack was the better deal without comparing prices myself.',
    item4: 'I relied on the app\'s label rather than working out the per-bottle price.',
  },
  {
    code: 'E6',
    trigger: 'fee_stacking',
    hypotheses: ['H8'],
    construct: 'NA',
    situation: 'Your ₹95 item balloons to a ₹150 bill after a delivery charge, a handling charge and a "small cart" charge — with a note that the small-cart charge disappears above ₹99.',
    mock: { type: 'bill_breakdown', itemsTotal: 95, delivery: 30, handling: 5, smallCart: 20, total: 150, waiver: 99 },
    likelihood: 'I would add another item purely to dodge the small-cart charge.',
    organism: 'This bill makes me feel annoyed about the extra charges.',
    item3: 'I felt the extra charges were unfair.',
    item4: 'This made me feel like the app was pressuring me to spend more.',
  },
  {
    code: 'E7',
    trigger: 'habit_reactivation',
    hypotheses: ['H1', 'H5'],
    construct: 'CE',
    situation: 'You search for something completely unrelated. The results page resurfaces snacks tagged "Bought earlier" that you used to order often.',
    mock: { type: 'bought_earlier', items: ['KitKat', 'Kinder Joy', 'Munch'] },
    likelihood: 'I would add one of these familiar items even though I searched for something else.',
    organism: 'Seeing items I\'ve bought before feels like an easy, no-need-to-think choice.',
    item3: 'Choosing a familiar item required very little thought.',
    item4: 'I picked it out of habit rather than because I needed it right now.',
  },
];
