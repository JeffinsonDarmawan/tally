# Progress log

> This is the project's **working memory** — the place to look first to understand what state
> we're in. Append a dated entry whenever meaningful work happens. Newest entries on top.
> Keep it factual: what changed, why, what's next, and anything that would surprise a future
> reader. Convert relative dates to absolute.

## Current state

- **Phase:** **Phase 4 (Dashboard) — in review.** Phases 0–3 merged (PRs #3, #4, #6, #7).
- **Repo:** `tally` (public, GitHub) · integration branch `main`.
- **App:** the dashboard shows **real engine balances** (net hero, owed/owe tiles, unpaid stat,
  per-friend with days-unpaid, Detailed⇄Simplified toggle, this-month activity). 76 unit tests green.
- **Backend:** **live** — the owner connected Supabase (`.env` set locally, gitignored); the 5 can
  sign in, form the group, and add expenses for real. Optional `receipts` bucket still available.

## Next up

1. **Review Phase 4** (PR open) — now viewable live in the browser. After merge → **Phase 5 —
   Settle up, reminders, activity log & notifications** (record repayments; the per-friend rows
   become the entry point to settle up).

---

## Log

### 2026-06-03 — Phase 4 · Dashboard (in review)
- Replaced the Overview's sample data with real engine output: net hero, owed/owe tiles, unpaid stat,
  per-friend balances (direction + days-unpaid), Detailed⇄Simplified toggle (§6.6 minimal transfers),
  and this-month activity (who paid incl. "+N", total, your share; tap → edit).
- TDD'd a pure `summarizeDashboard` (7 tests) deriving everything from fetched rows via the engine;
  added the dashboard data layer + `useDashboard` hook.
- Verified: 76 tests, build, lint, tsc ✓. The owner connected Supabase mid-phase, so this one is
  viewable live in the browser.
- Deferred to later phases (as designed): tapping a friend → settle-up (Phase 5); pending-recurring
  prompts (Phase 6); the unpaid stat's filtered list (Phase 7 History filters).

### 2026-06-02 — Phase 3 · Add Expense flow (in review)
- Built the multi-step Add/Edit Expense sheet (§8): Basics → Who paid → Involved → Split, with all
  5 modes (equal, by-item + tax/tip, uneven, weighted shares, percentage) and live per-person previews.
- TDD'd the payload builder + form-state model (13 tests) bridging the form → canonical
  `expense_shares`/`expense_payers` via the engine; enforces both ledger invariants.
- Data layer: create (cleanup-on-failure for atomicity), edit (replace children), delete (cascade),
  list; activity_log + notifications on each; receipt upload to Storage. Added `split_config` to
  `expenses` for faithful editing.
- History page now lists expenses (tap → edit/delete); FAB opens the flow via `ExpenseSheetProvider`.
- Verified: 69 tests, build, lint, tsc ✓; app boots cleanly. The signed-in flow needs the user's
  Supabase project to exercise end-to-end.
- No background review workflow this phase (per the owner's request to avoid approval floods).

### 2026-06-01 — Phase 2 · balance engine (in review)
- Built the engine test-first (TDD) in `src/lib/balance-engine/`: money (§6.5 rounding), splits
  (5 methods + tax/tip §8), netting (§6.1 surplus-proportional edges, matches the worked example),
  balances (§6.2–6.3 net + settlements + dashboard totals), fifo (§6.4 unpaid/days), simplify
  (§6.6 minimal transfers), and clock (§6.7 group-tz today + month bounds).
- Added Vitest (Node env). 55 unit tests, all green; build/lint/tsc ✓.
- Pure logic only — no React, no I/O; the canonical ledger stays `expense_shares` + `expense_payers`.
- Ran an adversarial multi-agent review (spec-correctness, numerical edge cases, coverage/determinism).

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
