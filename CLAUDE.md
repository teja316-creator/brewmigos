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
| `index.html` | Story page: a 2D illustrated story that alternates between a cookie being made (dough → bake → cool & box) and a coffee being brewed (grind → bloom & pour → into the cup), ending at the pop-up stall. Section backgrounds (`.band--1`…`.band--6`) darken from cream to espresso as the story goes on. All illustrations are inline SVG. |
| `menu.html` `events.html` `gallery.html` `about.html` `contact.html` | One page per nav tab. Every page repeats the same announcement bar, nav, footer, install indicator and pre-order modal markup (no templating — static files), so edit shared chrome in all six pages. The active nav link is marked per page with `aria-current="page"`. `about.html` holds the partner names/phones and the registered address (also in the footer and `contact.html`). Only `gallery.html` has the `#lightbox` markup. |
| `style.css` | All styles. CSS custom properties at `:root` define the palette, story band colours and type stack. Sections set `--eyebrow` / `--muted` so text tones follow the background. `.reveal` elements fade up on scroll only when `<html class="js">` is set (inline script in each `<head>`); the top section of each page is deliberately not `.reveal` so it paints immediately. |
| `ui.js` | Module, loaded on every page. Nav scroll shadow + mobile hamburger, scroll-reveal (`IntersectionObserver`), contact form, gallery lightbox, install indicator. Every feature no-ops when its elements are absent from the current page. |
| `preorder.js` | Module. Reads `config.js` to find the active event, renders product cards with qty steppers, manages a `localStorage` cart, submits to Google Form via hidden iframe. Pages ship in the closed state (`[data-preorder-closed]` visible, `[data-preorder-open]` hidden); an open event flips both. |
| `config.js` | **Owner-editable.** Defines `EVENTS` array and `GOOGLE_FORM` credentials. This is the only file that needs editing to launch a new event or wire up Google Form. |
| `sw.js` | Service worker. Cache key is `brewmigos-v7`; `PRECACHE` lists every page, so add new pages there — bump the version string when assets change to force cache invalidation. |

No third-party JS: icons are inline SVG, fonts come from Google Fonts. The cookie cursor is `icons/cursor-cookie.svg`, set on `body` in `style.css`.

## Pre-order system

Driven entirely by `config.js`:

- **Active event** = first entry in `EVENTS` with `status: 'open'`; with none open, every page shows "pre-orders are closed"
- **Reopening** = set the event's `status: 'open'` (and update its dates) — the Pre-order button appears in the nav and the closed notices hide
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
--band-1…6    #EFDDB7 → #3A1B0F   story backgrounds, light to dark
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
