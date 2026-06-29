// ─── Event + Google Form configuration ───────────────────────────────────────
// To add a future event: append an object to EVENTS and set status: 'open'.
// Only the first item with status === 'open' drives the pre-order UI.

export const EVENTS = [
  {
    id: 'event-2026-07-12',
    name: '12 Jul Pop-Up',
    tagline: 'Pre-order for our 12 Jul event — pickup on the day.',
    date: '2026-07-12',
    displayDate: 'Saturday, 12 July 2026',
    location: 'Brewmigos — location TBD (will be shared on Instagram @brewmigos4u)',
    deadline: '2026-07-10',   // last date to place an order
    status: 'open',           // 'open' | 'closed'
    products: [
      { id: 'triple-choc',    name: 'Triple Chocolate',     desc: 'Dark, milk & white chips in every bite',              price: 120, photo: 'assets/PHOTO-2026-06-29-11-44-33.jpg' },
      { id: 'biscoff',        name: 'Biscoff Butter',       desc: 'Caramel cookie crust, drizzled on top',               price: 130, photo: 'assets/PHOTO-2026-06-29-11-44-35%202.jpg' },
      { id: 'nyc-choc-chip',  name: 'NYC Choc-Chip',        desc: 'Crispy edges, gooey centre, bags of chips',           price: 110, photo: 'assets/PHOTO-2026-06-29-11-44-35%2020.jpg' },
      { id: 'loaded',         name: 'Loaded Monster',       desc: 'KitKat, M&Ms, white chips — the works',              price: 150, photo: 'assets/PHOTO-2026-06-29-11-44-33.jpg' },
      { id: 'white-mac',      name: 'White Choc Macadamia', desc: 'Buttery dough, creamy white chips, crunchy macadamia', price: 140, photo: 'assets/PHOTO-2026-06-29-11-44-35%2010.jpg' },
      { id: 'double-biscoff', name: 'Double Biscoff',       desc: 'Biscoff dough + Biscoff spread centre',              price: 140, photo: 'assets/PHOTO-2026-06-29-11-44-35%2015.jpg' },
    ],
    minOrderQty: 6,   // minimum cookies per order
  },
];

// ─── Google Form configuration ────────────────────────────────────────────────
// Step-by-step setup: see PREORDER-SETUP.md
// Once your Google Form is ready, paste the values below.
export const GOOGLE_FORM = {
  formId: '',    // e.g. '1FAIpQLSe...'
  entries: {
    name:    '',  // e.g. 'entry.123456789'
    phone:   '',
    email:   '',
    event:   '',
    items:   '',  // full order summary line
    qty:     '',  // total quantity
    total:   '',  // total price in ₹
    notes:   '',
  },
};
