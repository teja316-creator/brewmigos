# Pre-Order Setup Guide

## How it works

```
Customer fills pre-order form on site
        ↓
preorder.js builds a POST request
        ↓
Submits silently to Google Form URL (hidden iframe trick)
        ↓
Google Form receives it → writes row to your Google Sheet
        ↓
You open Sheet → see all orders with name, phone, items, total
```

### Why the hidden iframe trick?

Google Forms blocks AJAX/fetch from other domains (CORS). Instead, the code creates an invisible `<form>` pointing to your Google Form's action URL and submits it via a hidden `<iframe>`. Browser sends it, Google accepts it, no CORS error. Customer sees "Order confirmed."

---

## Setup steps

### Step 1 — Create a Google Form

Go to [forms.google.com](https://forms.google.com) and create a new form with these fields:

| Field | Type |
|-------|------|
| Name | Short answer |
| Phone | Short answer |
| Email | Short answer |
| Event | Short answer |
| Items | Paragraph (long text) |
| Total Qty | Short answer |
| Total ₹ | Short answer |
| Notes | Paragraph (long text) |

---

### Step 2 — Get the Form ID

Copy it from the form's URL:

```
https://docs.google.com/forms/d/e/1FAIpQLSe.../viewform
                                   ^^^^^^^^^^^^^^^^^^^
                                   this is your formId
```

---

### Step 3 — Get each field's entry ID

1. Open the published form in your browser
2. Right-click → **Inspect** (or F12)
3. Find each question's input element — it looks like:

```html
<input name="entry.123456789" type="text" ...>
```

Each question has a unique `entry.XXXXXXX` ID. Note them all down.

---

### Step 4 — Paste into config.js

Open `config.js` and fill in the `GOOGLE_FORM` section:

```js
export const GOOGLE_FORM = {
  formId: '1FAIpQLSe...',   // from Step 2
  entries: {
    name:  'entry.111111111',
    phone: 'entry.222222222',
    email: 'entry.333333333',
    event: 'entry.444444444',
    items: 'entry.555555555',
    qty:   'entry.666666666',
    total: 'entry.777777777',
    notes: 'entry.888888888',
  },
};
```

---

### Step 5 — Link to Google Sheet

In your Google Form:

1. Click the **Responses** tab
2. Click the green **Sheets** icon
3. Google creates a Sheet — every order appears as a new row automatically

---

## Adding a future event

Open `config.js` and add a new entry to `EVENTS`:

```js
export const EVENTS = [
  {
    id: 'event-2026-07-12',
    status: 'closed',   // close past events
    // ...
  },
  {
    id: 'event-2026-08-20',
    name: 'Aug Pop-Up',
    tagline: 'Pre-order for our 20 Aug event.',
    date: '2026-08-20',
    displayDate: 'Wednesday, 20 August 2026',
    location: 'TBD — announced on Instagram',
    deadline: '2026-08-18',
    status: 'open',     // only one event should be open at a time
    products: [ /* same format as before */ ],
    minOrderQty: 6,
  },
];
```

The site automatically picks up the first event with `status: 'open'`. No other code changes needed.

---

## Before the Form is wired up

If `formId` is empty in `config.js`, the site still works. On submit it shows a formatted order summary that the customer can copy. Nothing breaks while you set up the Form.
