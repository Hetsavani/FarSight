# DESIGN.md — FarSight UI Design System

Source of truth for how the interface must look and behave. Product scope lives in `PRODUCT.md`; working rules live in `AGENTS.md`.

Everything below describes the **actual implementation** in `frontend/`. Values are taken from code, not invented. Where the implementation defines no token, that is stated explicitly.

## 1. Visual identity

**Direction.** Dark-first operations-console aesthetic ("Opportunity Radar"): dense signal-review workspace with a fixed sidebar + top bar, mono-tagged section labels, status pills, and card grids. Personality is precise and technical, not marketing-style. The app shell (`frontend/src/data/shell.json`) uses near-black surfaces; several screens have light variants, but the default experience is dark.

**Theme behavior (verified in code).**
- Theme state lives in `frontend/src/components/radar/theme.tsx` (`RadarThemeProvider`, default `"dark"`).
- The renderer wraps output in `<div className="radar-app" data-theme={theme}>` (`frontend/src/components/radar/screen.tsx`).
- Token overrides: `.radar-app[data-theme="dark"]` and per-screen `.reference-screen[data-screen="N"]` blocks in `frontend/src/styles.css`.
- Light counterparts exist for some screens via a `lightIds` map in `screen.tsx`: dark 10→light 6, 11→12, 2→1, 8→14. There is no light variant for every screen.
- The legacy shadcn `.dark` class block also exists in `styles.css`, but the radar screens resolve through the `reference-screen` / `radar-app` tokens, not the `.dark` class. Do not assume the two systems are interchangeable.
- `prefers-color-scheme` handling: **none found** — theme is explicit state, not system-driven.

**Color system.** All colors are `oklch`. No hex tokens exist. Two token layers are defined in `frontend/src/styles.css` (`@theme inline` registrations + `:root` values):
- Base shadcn layer: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1…5`, `sidebar*`.
- Reference (Lovable) layer actually used by the screens: `surface`, `surface-dim/bright`, `surface-container-lowest/low/container/high/highest`, `surface-variant`, `surface-tint`, `on-surface`, `on-surface-variant`, `on-background`, `primary`, `on-primary`, `primary-container`, `primary-fixed`, `secondary`, `secondary-fixed`, `tertiary`, `tertiary-container`, `tertiary-fixed`, `error`, `error-container`, `outline`, `outline-variant`, `inverse-surface`, `inverse-primary`, plus raw `ref-*` aliases (e.g. `--ref-0c0e12`, `--ref-4f46e5`). Semantic states observed in `leads.json` tag colors: verified-direct (tertiary container), strong-inferred (secondary/primary container), needs-verification (amber overlay classes), muted/research states (surface-highest + outline-variant).
- Representative dark values (read `styles.css` before reusing): `--background: oklch(0.16342 0.00906 264.284)`, `--surface: oklch(0.18637 0.00876 264.337)`, `--primary: oklch(0.83174 0.08656 283.632)`, `--tertiary: oklch(0.8085 0.14984 162.305)`. Light reference screens use `--background: oklch(0.98255 0.00614 317.753)` with indigo primary `oklch(0.51057 0.23005 276.966)`.
- Rule: reference markup classes (e.g. `bg-surface-container`, `text-on-surface-variant`, `border-outline-variant/30`) resolve to these tokens. Never hard-code replacement colors; never convert tokens to invented hex values.

**Typography.**
- Families (loaded in `frontend/src/routes/__root.tsx`): **Inter** for headline/body/label (`400;500;600;700`), **JetBrains Mono** for data/tag (`400;500`). Do not substitute another font.
- Scale (defined in `styles.css`, `--text-*` + `--font-*`): `display-lg` 32/40, `headline-xl` 32/40 (mobile 26/34), `headline-lg` 24/32, `headline-md` 20/28, `headline-sm` 16/24, `body-lg` 15/24, `body-md` 13/20, `body-sm` 12/18, `label-md` 12/16, `label-sm` 11/14, `label-xs` 10/12, `mono-data` 12/16, `mono-tag` 10/12. Uppercase mono tags label sections ("Lead Intelligence Engine", "Signal Detection Matrix", "Demo Data Mode").
- Icons: **Material Symbols Outlined** (`material-symbols-outlined`, loaded via Google Fonts) inside reference markup (e.g. `radar`, `space_dashboard`, `download`, `tune`, `verified_user`); `lucide-react` is installed and available for hand-written components. Keep the existing per-surface choice; do not mix both inside one control.

**Spacing / layout / elevation.**
- Tokens: `--spacing-gutter: 1rem`, `--spacing-gutter-desktop: 1.5rem`, `--spacing-margin: 1rem`, `--spacing-margin-desktop: 2rem`, `space-xs 0.25rem`, `space-sm 0.5rem`, `space-md 0.75rem`, `space-lg 1.25rem`, `space-xl 2rem`. Screens use `px-gutter-desktop`, `py-space-lg`, `gap-space-*` throughout.
- Radii: base `--radius: 0.625rem`, but the reference layer overrides to `--radius-lg: 0.25rem`, `--radius-xl: 0.5rem`, `--radius-full: 0.75rem` (so `rounded-lg` in reference markup = 0.25rem). Do not arbitrarily enlarge radii.
- Layout: fixed left sidebar `w-64` + fixed header `left-64 h-14` on desktop; content offset with `pt-14`; cards/grids (`grid ... md:grid-cols-2 lg:grid-cols-4`), `rounded-xl` panels, `shadow-sm/md/lg`, `backdrop-blur-md` sticky sub-headers. Elevation is subtle; keep it that way.

**Where tokens live.** `frontend/src/styles.css` is the only token authority. Shared helpers: `cn()` in `frontend/src/lib/utils.ts`.

## 2. Component system

**Shared renderer (not a conventional component tree).**
- `frontend/src/components/radar/screen.tsx` exports `RadarScreen({ page, detail })` and `pageHead(title, description)`. It parses `shell.json` (aside + header) and one `screens.json` entry per page via `html-react-parser`, rewrites `<a>`/`<button>`/`<input>`/`<tr>` into router-aware interactive elements, and holds all demo state in `useState` (query, status tab, selected lead, drawer open, empty-state preview, notice, modal, notes, per-lead status, threshold). Screen IDs per page: overview 10, find-leads 11, lead-inbox 2, research-queue 3, outreach 9, saved-searches 7, sources-and-platforms 13, usage-and-limits 5, settings 4; detail view (`/leads/meridian`) forces screen 8.
- `frontend/src/components/radar/theme.tsx` is the theme provider. `Button` (`frontend/src/components/ui/button.tsx`) exposes a `reference` variant (`reference-button` class) so parsed markup buttons keep their reference styling with focus-visible ring and disabled states.

**App frame that actually exists.**
- Sidebar (`shell.aside`): fixed `w-64`, brand row with emblem + "Radar" + `v1.0 Free` pill, grouped nav (Workspace: Overview, Find Leads, Lead Inbox, Research Queue, Outreach, Saved Searches, Sources & Platforms, Usage & Limits, Settings), active item with left border + `aria-current="page"`.
- Header (`shell.header`): fixed `h-14`, workspace breadcrumb, global search input with `⌘K` hint, "Radar Active" pulse pill, notifications button, primary action button.
- Mobile nav (`.radar-mobile-nav`, rendered by `screen.tsx`): plain link row shown on small screens.
- Routes: ten file routes in `frontend/src/routes/` (`index`, `find-leads`, `lead-inbox`, `leads.meridian`, `research-queue`, `outreach`, `saved-searches`, `settings`, `sources-and-platforms`, `usage-and-limits`), each a thin `createFileRoute` + `<RadarScreen page=…>` wrapper. `__root.tsx` provides query context, fonts, 404 and error components.

**Primitives available.** ~40 shadcn/Radix wrappers in `frontend/src/components/ui/` (accordion, alert-dialog, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, tooltip). Most are **available but unused by the reference screens**, which render raw parsed HTML instead. Prefer them for new hand-written UI; do not swap them into existing reference screens without a task reason.

**States.**
- Loading: simulated only (`Running discovery preview…` + 1.2s `setTimeout` in `run()`); no skeletons or spinners wired to real fetches.
- Empty: per-screen `populated-state` / `empty-state` blocks toggled by the "Preview Empty State / Preview Demo Data" button — keep both.
- Error: root `ErrorComponent` ("This page didn't load" + Try again / Go home) and SSR error page (`lib/error-page.ts`); per-screen error states are copy only.
- Success/notice: transient `role="status"` `.radar-notice` toast (4s timeout).
- Disabled: `disabled` on the run button while `busy`; `disabled:pointer-events-none disabled:opacity-50` in button styles.
- Dialogs: `.radar-modal-backdrop` + `.radar-modal` with `role="dialog" aria-modal` (Save search, Filter leads, Connection details).

**Responsive.** Screens use `flex-col md:flex-row`, `lg:` breakpoints, `overflow-x-auto no-scrollbar` tab rows, `flex-wrap` action bars. Verify every change at desktop and ~375px widths; the fixed sidebar is desktop-only (mobile uses `.radar-mobile-nav`).

**Accessibility expectations.** Keep `aria-current="page"` on active nav, `role="dialog"`/`aria-modal`/`aria-label` on modals, `role="status"` on notices, visible `focus-visible` rings, semantic `button`/`a`/`input`/`select`/`tr` controls, `label htmlFor` on form fields, and `alt`/aria-label on the emblem. Contrast follows the token pairs (e.g. `on-surface` on `surface`); do not invent lower-contrast combinations.

## 3. Product-specific UX (as implemented vs planned)

All of the following describe the **demo UI that exists**. Nothing here performs live discovery; every screen carries a "Demo Data Mode" / "Illustrative sample leads" banner that must be kept until real data replaces it.

- **Search configuration (Find Leads, screen 11/12):** market multi-select (US, CA, UK, EU, UAE, AU, NZ + Custom Country), industry/company-stage tiles, services checklist, Tier 1 direct-intent vs Tier 2 inferred signal toggles, "Free Quota 858 / 1,000 Tavily calls" pill, preset loader, "Find Opportunities" run button. All controls are visual/demo state today — **planned:** binding to a real search backend.
- **Result presentation (Lead Inbox, 1/2):** table rows (`.lead-row`, `data-lead-id`) with company, score, tag, source; client-side search filter, status tabs (All / New / Qualified / …), country filter modal, row click opens the detail drawer, Qualify / Mark Contacted update local `updated` state only. **Planned:** real result sets, server-side filtering, persistence.
- **Evidence & source links:** drawer/brief show `observed` (quote) vs `inferred` (interpretation) text from `leads.json`; external `http` links open in a new tab (`target="_blank" rel="noreferrer"`). No verified real URLs or publication dates exist in the data (no date fields at all) — **planned:** original source URL + genuinely-available publication date per result; never fabricate them.
- **Direct vs inferred labels:** lead `tag` field (`Verified Direct Intent`, `Strong Inferred`, `Needs Verification`, `Needs Research`, `Moderate Signal`) with color classes. Keep the observed/inferred split visible wherever a lead is shown — **planned:** real classification with evidence.
- **Relevance/confidence:** `score` strings (`94% AI Fit`, …) are static demo text in `leads.json`; the settings screen has a threshold slider (default 75, local state). **Planned:** a real, explained scoring rule.
- **Save / reject / revisit:** local-only — Qualify/Contacted status flips, notes appended to `notesContainer`, saved-search names appended to a session list, CSV export via Blob download (`radar-leads.csv`), outreach draft copy via clipboard. No persistence (no DB, no localStorage found). **Planned:** real saved/rejected stores and revisit views.
- **Loading / no-results / error / quota:** simulated previewrun + empty-state toggle; quota pill is static text ("858 / 1,000"); sources screen "Test Connection" replies "Demo connection status only. No live API credentials are connected."; outreach "Regenerate" replies "Sample draft refreshed. Live AI generation is not connected." **Planned (required):** honest empty, error, and quota-exhausted states wired to real limits.

## 4. Non-negotiable design constraints

- Reuse existing components and tokens. New screens go through `RadarScreen` + `screens.json` markup or the established `ui/` primitives — not a new system.
- Do not substitute Inter / JetBrains Mono / Material Symbols with generic fonts.
- Do not flip the dark-first console to a light-first design, or vice versa per screen.
- Do not arbitrarily enlarge border radii, paddings, gaps, cards, or typography beyond the tokens above.
- Do not use generic placeholder content (lorem ipsum, stock cards) when the demo/product data or an explicit empty state applies.
- Do not redesign the product or introduce a new visual language without explicit approval.
- Maintain visual consistency across all ten routes (frame, pills, tags, buttons, drawers, modals, notices).
- Ensure desktop and small-screen usability for every change.
- Preserve keyboard accessibility, visible focus states, semantic controls, and sufficient contrast.

## 5. Implementation guidance

To add or modify a screen while preserving fidelity:

1. Read the route file, the matching `screens.json` entry (by screen ID in `screen.tsx`), `shell.json`, and the lead fields it consumes. Reproduce the reference markup structure; do not re-author the layout from scratch.
2. Keep reference classes resolving to `styles.css` tokens. If a value has no token, leave it undefined/document it — do not invent a token value and present it as authoritative.
3. Wire interactions through the existing `screen.tsx` patterns (navigation, `alert()` notices, modals, drawer, status tabs, empty-state blocks). Extend `act()`/state minimally rather than adding parallel systems.
4. Use `pageHead()` for route metadata; keep `__root.tsx` (fonts, `<Outlet />`, error/404) untouched unless the task requires it.
5. Verify: render the touched routes at desktop and mobile widths, exercise the controls (filters, tabs, drawer, modals, export/copy), and confirm the demo-data labels and theme toggle still behave. Run `bun run test` and `bun run lint` from `frontend/`.
