# 0002 – The supplied design file becomes EJS templates with its inline styles kept verbatim

- Status: Accepted
- Date: 2026-09-20
- Requirements: 001 SC6 (the design is fixed), QE4 (dark only), QE3 (desktop browser), D4, D5, D6

## Context

The stakeholder supplied `Agent Factory Dashboard.dc.html` plus `support.js` and declared the
design fixed. It is a Claude Design Component: markup with inline styles, `sc-if` / `sc-for`
placeholders and a `DCLogic` class that computes the view model from mock data. The mock data, the
`TRANSCRIPT` generator, the `RAW` array and the unused `kpis` block are illustrative, not product.

The running UI has to be recognisably that file, and three of its details are overridden (D4, D5,
D6). Someone has to be able to check the result against the design without reading a diff of a
bundler's output.

## Options

### A – Port the markup to EJS templates, keep the inline `style="…"` strings character for character
`sc-for` becomes `<% for %>`, `sc-if` becomes `<% if %>`, `{{ x }}` becomes `<%= x %>`. The view
model is a TypeScript port of `renderVals()`. Only rules that cannot be inline (`html`, `body`,
scrollbars, the `af-pulse` keyframe, `@font-face`, `:hover`) move into one small stylesheet.
Diffing the template against the design file is a line-by-line read.

### B – Extract the styles into CSS classes / a design-token stylesheet
Cleaner CSS, but every element's styling now lives somewhere else than in the design file, so
"does this match the design" becomes an exercise in following class names. The design has ~120
distinct inline style strings and no reuse pressure: it is rendered once, server-side.

### C – Rebuild the screens in a component framework using the design as a reference
Throws away the exact thing the stakeholder fixed and re-derives it from a reading of it.

## Decision

Option A. The design file is the specification for layout, structure and wording (SC6), so the
template keeps its structure and its literal style strings, and the port is mechanical and
checkable. `style-hover="…"` attributes, which only the design runtime understands, become
`:hover` rules in `app.css` keyed by a class added to that element.

The design's own helpers are ported verbatim because they define wording: `fmtTok`, `fmtH`, `pct`,
the `AG` agent labels and colours, the `STATUS` map, the stage hints, the severity order, the
attention note sentences and every section caption.

D4, D5 and D6 are applied as the requirements state: 26 weekly buckets instead of 8, no
"synced X ago" and no self-refresh, and no `kind` column in an expanded run.

## Consequences

- Templates are verbose and that is intended; nobody edits them for style, only to follow a design
  change.
- Fonts (IBM Plex Sans/Mono) are self-hosted instead of fetched from Google Fonts: the Pi and the
  browser must not depend on an external service at page load, and the product has no other
  outbound dependency.
- The client-side script stays under ~40 lines (tab switching only); run expansion uses native
  `<details>`, so the detail page works without JavaScript.
- A test asserts the presence of the design's literal captions and palette values, so a careless
  refactor of the markup fails the build (T-UI-1).
