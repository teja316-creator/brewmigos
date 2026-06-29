# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the site

No build step. Serve directly:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

ES modules and the service worker both require HTTP — opening `index.html` directly via `file://` will break them.

## Architecture

Fully static PWA — no framework, no bundler, no dependencies to install.

| File | Role |
|------|------|
| `index.html` | Single page. All sections (hero, menu, events, gallery, contact, pre-order modal, lightbox) live here. |
| `style.css` | All styles. CSS custom properties at `:root` define the palette and type stack. |
| `ui.js` | Module. Nav scroll, scroll-reveal (`IntersectionObserver`), card tilt, gallery toggle, lightbox, active-nav tracking, contact form. Calls `window.lucide.createIcons()` on load. |
| `preorder.js` | Module. Reads `config.js` to find the active event, renders product cards with qty steppers, manages a `localStorage` cart, submits to Google Form via hidden iframe. |
| `config.js` | **Owner-editable.** Defines `EVENTS` array and `GOOGLE_FORM` credentials. This is the only file that needs editing to launch a new event or wire up Google Form. |
| `sw.js` | Service worker. Cache key is `brewmigos-v2` — bump the version string when assets change to force cache invalidation. |
| `scene.js` | Unused/legacy Three.js file from initial scaffold. Safe to delete. |

## Icons

Lucide is loaded from CDN (`unpkg.com/lucide`) as a UMD script **before** the ES modules. Usage in HTML: `<i data-lucide="icon-name" class="icon"></i>`. The `createIcons()` call in `ui.js` hydrates them all at once. Icon sizing is controlled by `.icon`, `.icon--sm`, `.icon--lg` classes in `style.css`.

## Pre-order system

Driven entirely by `config.js`:

- **Active event** = first entry in `EVENTS` with `status: 'open'`
- **Adding a new event** = append to `EVENTS`, set old one to `status: 'closed'`
- **Google Form** = paste `formId` and `entry.XXXXXXX` field IDs into `GOOGLE_FORM` — see `PREORDER-SETUP.md` for full walkthrough
- **Fallback** = if `formId` is empty, submit shows a copyable order summary instead of posting to Google

Cart persists per event ID in `localStorage` under key `brewmigos-cart-{event.id}`.

## Design tokens

All in `:root` of `style.css`:

```
--c-bg        #160C08   deep espresso base
--c-surface   #2A1410   dark chocolate
--c-gold      #C98A3C   golden crust accent
--c-caramel   #B5701F   Biscoff caramel
--c-cream     #F3E3C3   baked dough cream
--font-display Fraunces (Google Fonts)
--font-body    Albert Sans (Google Fonts)
```

## Deployment

Hosted on GitHub Pages from the `main` branch root (`teja316-creator/brewmigos`). Push to `main` → Pages rebuilds automatically (no CI needed, static files only).

```bash
git add <files>
git commit -m "..."
git push origin main
```
