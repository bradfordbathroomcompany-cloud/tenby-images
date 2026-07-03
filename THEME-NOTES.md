# Freestanding Bath Co — Theme Notes

Bespoke Shopify Online Store 2.0 theme built on the Dawn skeleton, fully
reskinned for **Freestanding Bath Co** — "The Home of Statement Baths."

- **Base:** Shopify Dawn 15.x (imported unmodified, then reskinned). Dawn's
  a11y, cart/checkout, predictive-search and performance plumbing are retained;
  every visible surface is bespoke (`fbc-*` files).
- **Store:** ry01af-kg.myshopify.com · GBP · UK English.
- **Dev theme (unpublished):** "Freestanding Bath Co — Dev (Dawn base)"
  (`gid://shopify/OnlineStoreTheme/198389203291`). **Never published** — the
  owner previews and publishes.

Everything bespoke is namespaced `fbc-` (files, CSS classes, custom elements,
theme-setting ids) so it never collides with Dawn internals.

## Design system

`assets/fbc-theme.css` defines the tokens as CSS custom properties and bridges
them into Dawn's variable system so retained Dawn UI inherits the brand:

| Token | Value | Use |
|---|---|---|
| `--c-ink` | `#2B2622` | text / headers |
| `--c-cream` | `#FAF6EF` | page background |
| `--c-paper` | `#FFFFFF` | cards |
| `--c-brass` | `#A67C44` | accent / CTAs / links / icons |
| `--c-brass-dark` | `#8A6534` | hover |
| `--c-sage` | `#7D8471` | secondary accent |
| `--c-error` / `--c-success` | `#B3261E` / `#3D6B4F` | states |

- **Type:** Fraunces (headings, opsz axis, 400/600) + Inter (body, 400/500/600)
  from Google Fonts, `display=swap`, preconnected. Fallbacks Georgia / system-ui.
  Fluid `clamp()` scale (h1 40→64, h2 30→44, h3 22→28, body 16→18).
- **Space:** 8px grid; sections `--space-section` 56→128px.
- **Radius:** 2px cards, none on heroes. Shadow ceiling `0 1px 3px rgb(0 0 0/.08)`.
- **Motion:** 150–250ms ease-out; all animation disabled under
  `prefers-reduced-motion`.
- **Buttons:** primary = brass fill / cream text, darken on hover; secondary =
  1px ink outline. Squared, 2px radius.

Colours are editable in **Theme settings → Freestanding Bath Co**; overrides are
emitted by `snippets/fbc-tokens.liquid`.

## Data contract consumed (namespace `custom`)

Metafields: `bath_type` (list), `material`, `size_mm`, `style`, `colour`,
`ended`, `feet_included`, `brand`, `guarantee`, `nextday_eligible`.
Tags: `new-in`, `sale`, `nextday-eligible`.
All are surfaced in product cards, the product page, specs table and delivery
messaging. Collection handles, page handles and both menus are consumed exactly
as supplied — no invented handles/keys.

## Sections (bespoke)

| Section (`sections/…`) | Purpose | Key settings / blocks |
|---|---|---|
| `fbc-announcement-bar` | Rotating bar, max 3 | interval; `announcement` blocks (text, link) |
| `fbc-header` | Sticky header, mega menu, mobile drawer, search | menu, sticky, logotype, microline, mega featured tile |
| `fbc-footer` | Footer | logotype, blurb, phone, payment icons; `menu` blocks |
| `fbc-hero` | Full-bleed hero + optional Ken Burns | image, height, eyebrow, heading, sub, 2 CTAs |
| `fbc-trust-row` | 4 trust icons | `item` blocks (icon, heading, text) |
| `fbc-collection-tiles` | 8-tile collection grid | `tile` blocks (collection, image, label) |
| `fbc-editorial-split` | "One Room. One Hero." | image, reverse, richtext, CTA |
| `fbc-featured-products` | "Signature Baths" carousel | collection, limit, link label |
| `fbc-sale-band` | Brass-tinted sale band | heading, text, CTA |
| `fbc-advice-teaser` | 3 advice cards | `custom` + `article` blocks |
| `fbc-social-strip` | #MyStatementBath image row | `image` blocks (image, caption, link) |
| `fbc-newsletter` | "Good Taste, Delivered." | heading, copy, success/privacy text |
| `fbc-main-collection` | Collection grid | description split, filters, `chip` blocks |
| `fbc-main-product` | Product page | (see below) |
| `fbc-recommendations` | Internal — rendered by recommendations API | — |
| `fbc-main-page` | Prose page, 720px measure | — |
| `fbc-contact` | Contact form + details card + promise | intro, phone, hours, address, promise |
| `fbc-faq` | FAQ accordion + FAQPage JSON-LD | auto-built from page h2/h3 |
| `fbc-main-blog` | "Advice & Guides" listing | intro |
| `fbc-main-article` | Editorial article | drop cap toggle, in-article product |
| `fbc-404` | "…gone down the plughole." | `link` blocks (collections) |
| `fbc-search` | Search results | — |
| `fbc-password` | Full-bleed password page | image, logotype, microline, tagline |

## Snippets (bespoke)

`fbc-icon` (line-icon library), `fbc-card-product` (global product card),
`fbc-price`, `fbc-facets` (native `collection.filters`), `fbc-breadcrumbs`
(+ BreadcrumbList JSON-LD), `fbc-delivery-box`, `fbc-specs-table`,
`fbc-will-it-fit`, `fbc-cross-sell`, `fbc-cart-messaging`, `fbc-jsonld`
(Organization + WebSite), `fbc-tokens` (colour-setting overrides).

## JS (vanilla ES, no framework, all `defer`)

`fbc-header.js` (announcement rotation, mega/dropdown nav, mobile drawer with
focus trap, search panel, predictive search via `search/suggest.json`),
`fbc-facets.js` (instant-apply filtering with history, mobile filter drawer,
sort), `fbc-product.js` (variant switching, gallery + zoom, quantity, sticky
add-to-cart, complementary cross-sell fetch), `fbc-will-it-fit.js`.
Dawn's `product-form.js` handles the AJAX add-to-cart into the cart drawer.

## Product page (§7)

Sticky gallery + thumbnails + click-to-zoom · buy column: brand · H1 · review
stars placeholder (schema-ready) · price + finance line (price ÷ divisor,
labelled, links `/pages/finance`) · key-spec chips · variant selects · quantity
+ sticky add-to-cart bar · **delivery promise box** (free delivery always;
next-day upgrade when `nextday_eligible`; guarantee; feet-included) · **RAL note**
when `colour = painted` · **"Will it fit?"** SVG plan + room-width calculator
(pure JS) · accordion (Description · Specifications auto-table · Delivery &
Returns · Guarantee) · **"Complete the Look"** cross-sell (recommendations API,
fallback to taps/wastes/feet) with quick-add · Product + Breadcrumb JSON-LD.

## Collection page (§5)

Description split at the first `<h2>` — intro renders above the grid, the FAQ
half renders **below** it. Native Storefront filtering (sidebar desktop / drawer
mobile) with active-filter pills; 3-up/2-up grid; sort; paginate 24;
sub-collection chips (blocks) — pre-wired on `collection.all-freestanding-baths`.
CollectionPage + FAQPage (parsed from `<h3>`) JSON-LD.
> **Owner action:** enable metafield filters (material, size_mm, style, colour,
> brand) in the **Search & Discovery** app for the facets to appear.

## Cart (§8)

Slide-out drawer (`cart_type: drawer`). Always shows "Free UK delivery — 3–5
working days". If **all** lines are next-day-eligible → upgrade prompt; if
**mixed** → "made to order, ships together, free". Accessory cross-sell row
(a waste from `bath-wastes-fillers`) appears when a bath is in the cart without
a waste. No free-shipping progress bar (everything ships free).

## SEO / performance / a11y (§10)

- JSON-LD: Organization + WebSite (sitewide), BreadcrumbList, Product,
  CollectionPage, FAQPage, Article. OG/Twitter via Dawn's `meta-tags` snippet.
  Canonicals via Dawn's `layout/theme.liquid`.
- Responsive `srcset`/`sizes`, explicit dimensions, below-fold `loading="lazy"`,
  hero/first-media preloaded + `fetchpriority="high"`.
- Semantic landmarks, skip link, visible brass focus ring, `aria-expanded` on
  menus/drawers/accordions, keyboard-operable, focus trap in the mobile drawer,
  reduced-motion honoured.
- UK English, GBP throughout.

## Template → section map

`index` → homepage 9 sections · `collection[.all-freestanding-baths]` →
`fbc-main-collection` · `product` → `fbc-main-product` · `page` → `fbc-main-page`
· `page.contact` → `fbc-contact` · `page.faq` → `fbc-faq` · `blog` →
`fbc-main-blog` · `article` → `fbc-main-article` · `404` → `fbc-404` · `search` →
`fbc-search` · `password` → `fbc-password`.
> **Owner action:** assign the **FAQ** template to the *FAQs* page (Admin → Pages
> → FAQs → Theme template → `faq`).

## Not yet done / owner to-dos

- Enable Search & Discovery metafield filters (above).
- Assign the `faq` template to the FAQs page.
- Upload a logo (falls back to the Fraunces logotype until then).
- Add lifestyle imagery to the hero, tiles, editorial, social strip and mega
  featured tile.
- Gift-card template and the customer account pages use Dawn's markup reskinned
  by `base.css` + `fbc-theme.css` (not individually rebuilt).
