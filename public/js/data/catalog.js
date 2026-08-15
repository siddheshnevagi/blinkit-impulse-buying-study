// Product catalog for the interactive cart simulator ("the mini Blinkit").
// Every product carries a trigger tag so every click is analysable:
//   planned        — the two seed items the task explicitly sends the respondent for
//   scarcity       — "only N left" style urgency label (tests H1/H3)
//   recommended    — appears in a "you might also like" rail (tests PN/H5)
//   boughtEarlier  — habit-loop reactivation badge (tests H1/H5, distinct mechanism from recs)
//   festive        — occasion/seasonal merchandising (tests occasion structure / H5)
// A product can carry more than one tag.
export const FREE_DELIVERY_THRESHOLD = 149;
export const SMALL_CART_WAIVER = 99;
export const DELIVERY_FEE = 30;
export const HANDLING_FEE = 5;
export const SMALL_CART_FEE = 20;

export const CATALOG = [
  { id: 'milk', name: 'Amul Taaza Toned Milk', unit: '500 ml', price: 30, category: 'Dairy & Eggs', eta: '8 mins', tags: ['planned'] },
  { id: 'eggs', name: 'Farm Fresh Eggs', unit: '6 pcs', price: 42, category: 'Dairy & Eggs', eta: '8 mins', tags: ['planned'] },

  { id: 'kitkat', name: 'Nestle KitKat 4 Finger', unit: '38.5 g', price: 30, category: 'Chocolates', eta: '8 mins', tags: ['recommended', 'boughtEarlier'], badge: 'Bought earlier' },
  { id: 'kurkure', name: 'Kurkure Masala Munch', unit: '75 g', price: 20, category: 'Snacks', eta: '8 mins', tags: ['scarcity'], badge: 'Only 3 left' },
  { id: 'dairymilk', name: 'Cadbury Dairy Milk', unit: '40 g', price: 40, category: 'Chocolates', eta: '8 mins', tags: ['recommended'], badge: 'You might also like' },
  { id: 'coke', name: 'Coca-Cola Soft Drink', unit: '750 ml', price: 38, category: 'Beverages', eta: '12 mins', tags: [] },
  { id: 'icecream', name: 'Vanilla Ice Cream Tub', unit: '700 ml', price: 280, category: 'Ice Cream', eta: '10 mins', tags: ['scarcity'], badge: 'Only 2 left' },
  { id: 'kinderjoy', name: 'Kinder Joy', unit: '20 g', price: 50, category: 'Chocolates', eta: '8 mins', tags: ['boughtEarlier'], badge: 'Bought earlier' },
  { id: 'maggi', name: 'Maggi 2-Minute Noodles', unit: '4 pack', price: 56, category: 'Food', eta: '8 mins', tags: [] },
  { id: 'rakhi', name: 'Rakhi Gifting Combo', unit: '1 set', price: 129, category: 'Festive', eta: '8 mins', tags: ['festive'], badge: 'Rakhi Special' },
  { id: 'flagset', name: 'Independence Day Flag Set', unit: '2 pcs', price: 99, category: 'Festive', eta: '8 mins', tags: ['festive'], badge: 'Independence Day' },
  { id: 'goodday', name: 'Britannia Good Day Cookies', unit: '100 g', price: 40, category: 'Bakery', eta: '8 mins', tags: ['recommended'], badge: 'Frequently bought' },
  { id: 'facewash', name: 'Herbal Face Wash', unit: '100 ml', price: 150, category: 'Personal Care', eta: '15 mins', tags: [] },
  { id: 'unclechipps', name: 'Uncle Chipps', unit: '55 g', price: 20, category: 'Snacks', eta: '8 mins', tags: ['scarcity'], badge: 'Selling fast' },
  { id: 'munchmax', name: 'Nestle Munch Max', unit: '38.5 g', price: 20, category: 'Chocolates', eta: '8 mins', tags: ['boughtEarlier'], badge: 'Bought earlier' },
  { id: 'deo', name: 'Deodorant Spray', unit: '150 ml', price: 199, category: 'Personal Care', eta: '15 mins', tags: [] },
  { id: 'poojaflowers', name: 'Pooja Flower Mix', unit: '100 g', price: 35, category: 'Festive', eta: '8 mins', tags: ['festive'], badge: 'Sawan Special' },
  { id: 'gems', name: 'Cadbury Gems Duo Pack', unit: '24.97 g', price: 20, category: 'Chocolates', eta: '8 mins', tags: ['recommended'], badge: 'Top rated' },
];

export const CATEGORIES = ['All', 'Dairy & Eggs', 'Snacks', 'Chocolates', 'Beverages', 'Ice Cream', 'Food', 'Festive', 'Bakery', 'Personal Care'];
