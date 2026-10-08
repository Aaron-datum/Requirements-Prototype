# Datum UI V1 — Design System

A design system for **Datum**, a 3D CAD search and requirement-matching tool for mechanical and manufacturing engineers. This system is the source of truth for colors, type, spacing, components, iconography, and the application's information architecture.

## Product context

Datum is a workbench-style web application for engineers evaluating CAD parts against precise technical requirements. The core flow is:

1. **Upload / Select files** — bring CAD assemblies (STEP, SolidWorks, etc.) into the app
2. **Define Search** — add reference measurements — diameters, axes, planes- that the system will attempt to replicate on search parts
3. **Results** — a dense, sortable table of parts ranked by geometric similarity be default, with measurement results
4. **Compare** — open a result alongside the search part in CAD Compare (side-by-side or snap-overlay difference analysis)
5. **My Projects / Saved searches** — reusable measurement sets and re-runnable searches

The audience is technical and tolerant of density. Every screen prioritizes information over whitespace.

## Sources

Derived from the Datum Figma file, the `Aaron-datum/Uiv1` codebase (`Guidelines.md`, `globals.css`, `components/*.tsx`, brand assets), and the authored *"CAD Search — Global Design System Guidelines"* plus the *UI Overview* IA spec. If you don't have access to those, everything you need is here: tokens in `colors_and_type.css`, assets in `assets/`, cards in `preview/`, and templates in `templates/`.

## Quick index

- `README.md` — this file. Start here.
- `SKILL.md` — agent skill entry-point.
- `colors_and_type.css` — all design tokens; **White (default) · Tan · Dark** modes, densities, sizing.
- `assets/` — logos (full wordmark + hex icon, transparent variants) and CAD render thumbnails.
- `preview/` — Design System tab cards (Foundations, Colors, Brand, Components).
- `templates/` — copy-me starting points (`.dc.html`): app shell, search-results page.

---

## CONTENT FUNDAMENTALS

Datum's copy is the voice of a calm, competent engineer — specific, terse, respectful of the reader's expertise.

### Voice

- **Specific over suggestive.** "Add Requirement", "Confirm Datum", "Open CAD Compare" — never "Click here", "Continue your journey".
- **Imperative verbs for actions.** Buttons read as commands: *Search*, *Upload Files*, *Save Search*, *Add Requirement*, *Open in PLM*.
- **Numbers are first-class.** Values render in IBM Plex Mono next to their units: `76.2 mm`, `±5%`, `287 results`, `98.2%`. Never "around 76 mm".
- **Second person for instructions.** Tips and empty-states address the user as *you*. First person ("I"/"we") is never used.
- **No marketing flourish.** No exclamation points, no "powerful / intelligent / seamless" in UI chrome.

### Casing

- **Buttons and tabs** — Title Case: *Add Requirement*, *Saved Searches*, *Open CAD Compare*.
- **Section labels preceding a value** — UPPERCASE, 13px, `--fg-muted`, `.4px` letter-spacing.
- **Body copy** — sentence case.

### Emoji & special characters

- **No emoji in production UI chrome.**
- **Unicode for units is encouraged**: `°`, `±`, `≤`, `≥`, `×`, `Ø`, `µ`. These render in IBM Plex Mono with numbers.
- **Never use color or a filled dot alone as a status indicator** — always pair with text or icon (accessibility rule).

### Vibe

Quiet, precise, a little austere. If the copy reads like a spec sheet, it's right.

---

## VISUAL FOUNDATIONS

### Color modes

The system ships **three themes**, switched via `data-theme` on the root. **White is the default.**

| Mode | Canvas | Accent | Feel |
| --- | --- | --- | --- |
| **White** (default) | near-white `#FAFBFC` / white`#FFFFFF` | **Datum Dark Blue `#1A3A5C`** | clean, high-contrast, product-default |
| **Tan** | Vanilla `#FAF5F3` / Oatmilk | Charcoal `#211F1F` | warm, paper-like |
| **Dark** | l charcoal `#211F1F`+ storm | Ice Melt `#C0DDF0` | low-light, glare-free |

Minimum contrast ratios (WCAG AA 4.5:1) are maintained across all three. Consume colors through the **semantic tokens** (`--bg-page`, `--fg-primary`, `--accent`, `--border-default`, `--fill-selected`, …) — never hardcode a hex, so a design works in all three modes for free.

**Brand palette** (fixed hues the semantic tokens are built from): Charcoal `#211F1F`, Storm `#4A4E57`, Ice Melt `#C0DDF0`, Oatmilk `#E0D6D1`, Vanilla `#FAF5F3`, Datum Blue `#1A3A5C`.

**Status** (badges only, never mixed with brand accent in one element): Pass `#1A6B3A / #E6F4EC` · Warn `#7A4F00 / #FFF3CD` · Fail `#A8200D / #FAE5E3` · Info = Datum Blue on `#E3EEF8`.

**CAD Compare overlay** (snap-overlay difference analysis): `--overlay-shared` green (overlapping), `--overlay-a` red (unique to search part), `--overlay-b` blue (unique to result part). Always paired with a labeled legend.

### Typography

**Two families, one job each.** `--font-ui` and `--font-data` — pick by what the text *is*, never by where it sits.

- **DM Sans (`--font-ui`)** — system titles, screen and part names, section headers, labels, buttons, prose. Never used for a number the user has to read precisely.
- **IBM Plex Mono (`--font-data`)** — every number, measurement, tolerance, PLM field, part number, revision, path, hash and timestamp. Chosen for an unmistakable slashed **0** against **O**, and 1 / l / I that stay distinct at 14px. Always `font-variant-numeric: tabular-nums`.
- **Weight cap: 500.** Bold (700) is forbidden.
- **Body scale:** 20 (page) / 16 (section) / 15 (button, body) / 14 (small) / 13 (badge). **15px is the default reading size, 14px the floor for a sentence, 13px the absolute floor** — reserved for uppercase micro-labels where caps and letter-spacing carry legibility. Nothing in the system is smaller than 13px.
- **Data scale:** 15 (data) / 14 (data-sm, compact tables and chips only).
- **Display scale** (low-density / hero — home, auth, onboarding, modal headers, empty states): 20 / 26 / 34. Never inside the workbench.
- Numbers always include units and always render in `--font-data`.

### Alignment

One rule per content class, no exceptions, tables and cards alike.

| Content | Alignment | Notes |
| --- | --- | --- |
| Numbers | **Right** | Tabular figures so decimals stack. A numeric column's *header* is right-aligned too — it labels the digits, not the cell. |
| Text, names, column names | **Left** | Never centered, never justified. |
| Action buttons | **Center** | Label centers inside a button whose box is the hit target; same for icon buttons and action columns. |

Utilities: `.align-number` (also locks tabular figures — never set `text-align` on a numeric cell without it), `.align-text`, `.align-action`.

### Spacing

- **Component scale (strict):** `4 · 8 · 12 · 16`. Padding inside cards, gaps, form fields, table cells.
- **Layout scale:** `24 · 32 · 40 · 56 · 80`. Canvas padding, hero margins, section rhythm. Larger values only on low-density surfaces.

### Sizing

- Buttons: **36px default**, 40px form-submit, 44px brand/auth primary. Inputs 32px.
- Icons: 16px standard, 14px compact, 28px icon-only button (16px glyph inside).
- Sidebars: **340px expanded** (resizable 260–500px), **56px collapsed**.
- Header: **48px global nav + 36px breadcrumb strip = 84px** total. Lower drawer 132px.

### Shape, borders, elevation

- **Radius: 5px** — cards, buttons, inputs, badges, modals, popovers. (Pills use 99px; avatars/icon tiles use 5px, never fully round.)
- **Borders: universal `1px solid var(--border-default)`.** Selected state → **2px** solid accent. Open/active collapsible → `border-left: 2px`.
- **Shadows: none.** Elevation is communicated by borders. Modals use a `rgba(0,0,0,0.5)` scrim (no blur); dropdowns use a 1px border.

### States & motion

- **Hover primary button:** `opacity: 0.88`, no color shift. **Secondary/icon:** background → `--fill-hover`. **Row hover:** `--fill-selected` / `--fill-hover`.
- **Focus:** `outline: 1.5px solid var(--accent); outline-offset: 1px`. Never suppress focus rings; `:focus-visible` is fine.
- **Disabled:** `opacity: 0.38; cursor: not-allowed`.
- **Motion:** `transition` only, 150ms (hover/focus/tab) to 200ms (collapse/table update), `ease`. No keyframes for UI chrome, no bounce/spring, no ambient loops. Loading uses a **skeleton**, not a spinner, on server fetches.

### Backgrounds

Flat color only. No gradients, photography, illustration, texture, or backdrop-blur anywhere. The CAD viewer is the one place a rendered 3D object appears — inside a bordered white panel. The logo/icon are the only imagery in chrome.

---

## INFORMATION ARCHITECTURE & PATTERNS

The app is a persistent shell (global nav + breadcrumb strip) wrapping a swappable center stage, flanked by collapsible sidebars and an optional lower drawer.

### Global navigation (persistent, all routes)

Two stacked strips — see the **App top bar** card.

- **Row 1 · 48px global nav** — Datum lockup (+ optional tenant mark for white-label) · primary product tabs (**Search · Create · My Projects**) · right-aligned utilities (**Feedback** modal, help) + user/avatar menu (Settings, Log out). Surfaces an **unsaved-changes** state when the page below is dirty.
- **Row 2 · 36px breadcrumb strip** — back arrow + workflow crumb trail, optional page-action buttons on the right. Lives *under* the nav, never inline.

### Breadcrumbs

Format: `← Step 1 › Step 2 › Current`. Current step bold/non-clickable; previous steps clickable and restore exact state at that step. A later step the user stepped back from renders **stale** (muted, still clickable). Future steps don't render. The **back arrow is browser-history back**, not one step up the hierarchy. See the **Breadcrumbs** and **App top bar** cards. Styling: 13px, `--bg-page`, `border-bottom: 1px solid var(--border-default)`.

### Sidebars

One shared base; three content types — see the **Sidebar** and **Filter sidebar** cards.

- **Navigational** — app nav, project tree. Active row = accent-tint fill.
- **Filtering** — narrows a list/table. Collapsible sections, segmented controls, checkboxes with counts, range sliders. Header carries active count + "Clear all". Tabs: **Filters · Columns · Manage**.
- **Informational** — read-only selection detail. Stacked label/value blocks, measurement readouts, key-value tables. No active state.

Shared base: 340px expanded (resizable 260–500px via a 4px inner-edge hot zone), 56px collapsed, `--bg-sidebar` bg, 1px inner border, header (title + optional action), scroll body, footer collapse button. Open/collapsed + custom width persist per user.

**Filter rules by data type:** open text → `text-search` · ≤5 fixed options → `multi-tag` · 6+ options → `multi-search` (internal search appears) · ordered category → `level-seg` (segmented multi-select) · numeric w/ target → `range-units` (dual-thumb, Value↔Error%, target tick) · date → `date-preset`. Active filters raise pills above the table. Clear is three-tier: per-section, per-group, global "Clear all".

**CAD viewer** (informational, HOOPS viewer) — see the **CAD sidebar** card. Part name (open file + active selection) · two toolbar rows (Row 1 view tools incl. one-off quick measure; Row 2 persistent measurement tools that create cards) · assembly tree (search, visibility toggles, expand/collapse, copy name; Datum-parseable bodies only by default, reference geometry greyed/unselectable; hidden parts excluded from bbox/search unless opted in) · read-only file-scoped PLM · measurement cards (field order: name → type → geometry → body → measured value). **Cross-selection chain**: measurement ↔ body ↔ tree row ↔ 3D geometry, all directions. In **Compare**, every block mirrors both files (names side-by-side, trees stacked, PLM side-by-side with matching fields highlighted, measurements in dual boxes).

### Densities

Compact / Default / Comfy set row height, cell padding, table font, and default rows-per-page (15 / 10 / 8) via `data-density` — see the **Densities** card. **Thumbnail** is a distinct layout that swaps rows for icon-card tiles (clicking a tile opens the part-detail sidebar). Set globally in Settings → System or per-table in the filter sidebar's Columns tab.

### Center stage

- **Homepage / launchpad** — 3-up quick-action cards (primary = accent fill, secondaries bordered; title + 1-line description + mono meta footer). See **Launchpad cards**.
- **File selection** — pick CAD files / saved searches / upload.
- **CAD viewer** — single (HOOPS 3D) or **CAD Compare** (side-by-side linked, or snap-overlay RGB difference analysis). See **CAD Compare**.
- **Data tables** — **lightweight** (in-page, in-header filter + sort, small sets) and **heavyweight** (full page + filter sidebar, filter pills, column resize/pin, CSV export, expanded **tabbed row drawer**: File Info · PLM Data · Measurements · Related Files; row actions Open in PLM / Open CAD Compare; pinned **search info bar** on top). See **Data table (lightweight)** and **Results table**.

### Right panel & lower drawer

- **Right panel** (informational) — file-selection detail (preview, PLM, action to next step) or part detail (preview, PLM, file info, measurements, related files).
- **Lower drawer** — collapsible, bottom-pinned, default closed. Version info, data-sync status, and this-session recent searches (last 3, link to My Projects). See **Recent activity strip**.

### Settings

Account (IT-synced fields read-only; display name local) · System (color theme, default table view, info density, 3D CAD controls — CATIA/NX presets or custom mapping with conflict detection) · Permissions (read-only, IT-sourced) · **User Management** (admin — lightweight user table, full-page user detail) · **Activity Log** (admin — audit table, server-side 100/page, CSV export).

### Global behaviors

- **Unsaved-changes guard** — confirmation dialog on navigate-away with dirty state.
- **Errors** — inline near the action (not toast-only) so the user can retry. Toast is success-only.
- **Loading** — skeletons, not spinners, on server fetches.
- **Accessibility** — visible labels (never placeholder-only), keyboard-navigable theme/density controls and admin table rows.

---

## ICONOGRAPHY

**Lucide**, exclusively (via `lucide-react` in code; inline SVG with the Lucide visual language in static cards). Do not mix icon libraries.

- Standard 16px · compact 14px · icon-only button 28px container / 16px glyph.
- Stroke **1.5px** (Lucide default — don't override; static cards use 1.75 for crispness at small sizes).
- Color `currentColor` — inherit from text. Icon buttons without a visible label carry `aria-label`.
- `?`-in-a-circle is the canonical "unknown status" mark (paired with text, never color-only).

## Logos

In `assets/`: `datum-logo-full.png` / `datum-logo-full-transparent.png` (wordmark), `datum-icon.png` / `datum-icon-transparent.png` / `datum-icon-alt.png` (hex mark), `datum-logo-login.png`. Do not recolor, add opacity, or redraw. In Dark mode the full logo receives `filter: brightness(0) invert(1)` — the only permitted manipulation.

## Typography substitutions

**None.** DM Sans + IBM Plex Mono load from Google Fonts. Plex Mono replaces DM Mono system-wide: DM Mono's unslashed zero is not safely distinguishable from O in part numbers and revisions.

---

## Do-Not list

- ❌ `border-radius` other than **5px** (99px pills excepted). No fully-round avatars/cards.
- ❌ Drop shadows — use borders. No exceptions, incl. modals & dropdowns.
- ❌ Gradients, photography, illustration, texture, `backdrop-filter` — flat color only.
- ❌ `font-weight: 700` — cap at 500.
- ❌ UI body type < 13px anywhere, or < 14px for a full sentence; display tier (20/26/34) is low-density/hero only.
- ❌ Display type or display measurements-without-units inside the workbench.
- ❌ Hardcoded hex where a semantic token exists (breaks Tan/Dark modes).
- ❌ A number set in DM Sans, or a name set in Plex Mono · centered or left-aligned numeric columns.
- ❌ Placeholder text as a substitute for a label · generic labels like "Datum 1".
- ❌ Suppressing focus rings · color as the sole state indicator.
- ❌ Muted mid-tone `#70869E` as primary text · hiding edit/delete until hover in dense areas.
- ❌ Component-scale values outside `4 · 8 · 12 · 16`; layout-scale outside `24 · 32 · 40 · 56 · 80`.
- ❌ `@keyframes` for UI chrome — use `transition`. Spinners where a skeleton belongs.
- ❌ Mixing icon libraries · emoji in chrome.
- ❌ Breadcrumb back arrow that walks the hierarchy — it is browser-history back.
