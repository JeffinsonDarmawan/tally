# Progress log

> This is the project's **working memory** — the place to look first to understand what state
> we're in. Append a dated entry whenever meaningful work happens. Newest entries on top.
> Keep it factual: what changed, why, what's next, and anything that would surprise a future
> reader. Convert relative dates to absolute.

## Current state

- **Phase:** **Phase 1 (Auth, members & categories) — in review.** Phase 0 merged (PR #3).
- **Repo:** `tally` (public, GitHub) · integration branch `main`.
- **App:** Auth (magic link), session/group bootstrap + gating, onboarding, profile editing, member
  management, and categories CRUD — all wired to Supabase with RLS. Needs a live Supabase project to run.
- **Backend:** the user sets up Supabase (see `docs/SUPABASE_SETUP.md`); code is ready to connect.

## Next up

1. **Review Phase 1** (PR open) + do the Supabase setup to test it live. After merge →
   **Phase 2 — Schema & balance engine** (pure, unit-tested TypeScript; §6). Do this before the
   dashboard/add-expense screens.

---

## Log

### 2026-05-31 — Phase 1 · auth, members & categories (in review)
- Magic-link auth via Supabase: `AuthProvider`/`useAuth`, branded `LoginPage` (+ "backend not
  configured" fallback so the app never white-screens without env).
- Session bootstrap: `GroupProvider` loads profile + group + members; `AppGate` routes
  loading → splash, signed-out → login, no-group → onboarding, ready → app.
- Onboarding: create a group (`create_group` RPC, seeds categories) or join via a member code.
- Settings reworked to real data: profile edit (name + avatar color), members (list + add-by-code),
  and full categories CRUD (`CategoryManager` + `CategoryFormModal` with icon/color pickers).
- Hand-authored `src/types/database.types.ts` from the schema; typed the Supabase client.
- New kit components: `Input`/`Field`, `ColorPicker`, `ConfirmDialog`.
- Verified: build ✓, lint ✓, tsc ✓; rendered the unconfigured + login-form states in-browser.
  Authenticated flows (onboarding/settings CRUD) need a live Supabase project to exercise.
- Wrote `docs/SUPABASE_SETUP.md` (create project, run schema, configure auth redirect, fill `.env`).

### 2026-05-30 — Phase 0 · scaffold & design system (in review)
- Invoked the `frontend-design` skill; committed to a "calm fintech, money-as-hero" dark direction.
- Scaffolded the app: Vite 8, React 19, TypeScript, Tailwind v4 (CSS-first `@theme`), react-router 7,
  `@supabase/supabase-js`, `vite-plugin-pwa`, Geist variable font, Tabler icons.
- Built the design tokens + type scale from §3 (warm charcoal palette, money colors, squircle radius,
  tabular figures, micro-labels, subtle motion).
- Built the component kit: Button, Card/SectionHeader, StatCard (tinted), ListRow/Divider,
  Modal (bottom-sheet/dialog), SegmentedControl, Avatar (squircle), Chip, CategoryTile, IconPicker,
  and designed Empty/Loading/Error states.
- Built the responsive app shell (desktop sidebar / mobile bottom-tab bar with center Add action) and
  routing with placeholder feature pages (Overview preview, History, Recurring, Summary, Settings, 404).
- Verified: `npm run build` ✓, `npm run lint` ✓ (0 problems), `tsc` ✓, dev server + PWA SW register ✓,
  and rendered the UI in-browser (Overview hero/stat cards/balances + Settings modal/icon picker).
- Engine, real data, and auth are intentionally not here yet — they belong to Phases 1–2.
- **Ran a 4-dimension multi-agent code review** (correctness, a11y, design fidelity, architecture) with
  adversarial verification: 28 findings → 22 confirmed → applied the Phase-0-appropriate ones. Notable:
  removed a hardcoded personal email from the public repo; gave `Button` a default `type="button"`;
  replaced invalid `brightness-108` with valid values; swapped hardcoded `#0D0D11` for the `--color-base`
  token; fixed `SegmentedControl` ARIA (`role=group` + `aria-pressed`); added `Modal` `aria-labelledby`
  + non-tabbable backdrop; restored keyboard focus rings on controls that suppressed them; corrected the
  `StatCard` tone-label color (and the owe-label contrast); used human-readable `aria-label`s in the icon
  picker; and added the feature barrel `index.ts` files our architecture mandates. Re-verified build/lint.
- **Deferred to Phase 9 (a11y pass), by design:** Modal focus trap + initial-focus + focus-return,
  a full WCAG color-contrast audit, and de-duplicating the two `nav` landmarks.

### 2026-05-30 — Project foundation
- Initialized git on `main`; created the public GitHub repo `tally`.
- Set up the documentation system under `docs/` (planning, architecture, database) with an index.
- Moved the product spec to `docs/planning/PROJECT_BRIEF.md` and the schema to
  `docs/database/supabase_schema.sql`.
- Wrote the architecture overview, the `src/` file-organization plan (feature-sliced; rationale
  and references recorded), the roadmap, this log, and the decisions log.
- Documented the branch → PR → merge workflow; added a PR template, `.gitignore`, `.editorconfig`,
  `CHANGELOG.md`, and `.env.example`.
- Configured an isolated development environment (see `DECISIONS.md`).
- Established that commits/PRs carry no third-party tooling attribution.
- **Decision:** defer the actual Vite scaffold to Phase 0 so it gets a proper review checkpoint.
