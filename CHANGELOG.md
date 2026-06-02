# Changelog

All notable changes to **Tally** are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
once it ships. Until v1.0.0, the app is pre-release and the API/schema may change.

Entries are grouped by phase (see [`docs/planning/ROADMAP.md`](docs/planning/ROADMAP.md)).
Day-to-day work notes live in [`docs/planning/PROGRESS.md`](docs/planning/PROGRESS.md);
this file is the curated, human-readable summary.

## [Unreleased]

### Added — Phase 3: Add Expense flow
- Multi-step **Add/Edit Expense** sheet (brief §8): Basics (date, category, total, note, optional
  receipt photo) → Who paid (single or multiple payers with live remaining) → Who's involved →
  How to split, with all **five split modes**: equal, by-item (with tax/tip/service auto-allocation),
  uneven/exact, weighted shares, and percentage — each with live per-person previews.
- A pure, unit-tested payload builder + form-state model (13 tests) that turn the form into the
  canonical `expense_shares` + `expense_payers` via the engine, enforcing Σ shares == total and
  Σ payers == total.
- Expenses data layer: atomic-ish create (with cleanup-on-failure), edit (replace children),
  delete (cascade) — all writing `activity_log` + notifications; receipt upload to Storage.
- Stored a `split_config` snapshot on each expense for faithful editing (schema + types).
- History page now lists the group's expenses (newest first); tap to edit or delete. (Search /
  filters / bulk actions arrive in Phase 7.)
- New kit pieces: `MoneyInput`, `Toggle`; the FAB now opens the real flow via an `ExpenseSheetProvider`.
- `docs/SUPABASE_SETUP.md`: optional `receipts` Storage bucket + RLS.

### Added — Phase 2: Balance engine
- Pure, unit-tested balance engine in `src/lib/balance-engine/` (brief §6), built test-first (54 tests):
  - **money** — integer-cents conversion + deterministic remainder distribution (§6.5).
  - **splits** — equal, uneven, weighted shares, percentage, and by-item with tax/tip/service
    auto-allocation (§8); every method reconciles exactly to the total.
  - **netting** — per-expense net (paid − owed) → surplus-proportional pairwise debt edges (§6.1),
    matching the brief's worked example; reduces to the single-payer case.
  - **balances** — aggregate owe map, settlements, signed `net(a,b)`, dashboard totals (§6.2–6.3),
    incl. overpayment-as-credit.
  - **fifo** — unpaid items + days-unpaid applied oldest-first (§6.4).
  - **simplify** — greedy minimal-transfer debt simplification (§6.6), presentation-only.
  - **clock** — group-time-zone "today" + month boundaries (§6.7).
- Added Vitest with a Node-environment config; `npm run test` runs the suite.

### Added — Phase 1: Auth, members & categories
- Magic-link authentication (Supabase Auth) with an `AuthProvider`, a branded login screen, and a
  "backend not configured" fallback when env vars are missing.
- Session bootstrap: loads the signed-in user's profile, their single group, and all members; gates
  the app behind sign-in and group membership with a branded splash/error.
- Onboarding for users without a group: create a group (seeds default categories via the
  `create_group` RPC) or join via a shareable member code.
- Profile editing (display name + avatar color) and member management (list + add-by-code), RLS-safe.
- Full categories CRUD wired to Supabase (create/edit/delete, icon + color pickers, confirm-on-delete).
- Hand-authored `database.types.ts` from the schema; typed the Supabase client.
- New kit components: `Input`/`Field`, `ColorPicker`, `ConfirmDialog`.
- Added `docs/SUPABASE_SETUP.md` with the one-time backend setup.

### Added — Phase 0: Scaffold & design system
- Scaffolded the app: Vite 8, React 19, TypeScript, Tailwind v4 (CSS-first theme), react-router 7,
  `@supabase/supabase-js`, `vite-plugin-pwa`, Geist variable font, and Tabler icons.
- Implemented the dark design tokens and type scale from the brief (§3) as a Tailwind v4 `@theme`.
- Built the design-system component kit: Button, Card, StatCard, ListRow, Modal (sheet/dialog),
  SegmentedControl, Avatar (squircle), Chip, CategoryTile, IconPicker, and Empty/Loading/Error states.
- Built the responsive app shell (desktop sidebar / mobile bottom-tab bar) with routing and the
  placeholder feature pages.
- Added project scripts (`dev`, `build`, `lint`, `typecheck`, `test`), ESLint flat config, and the
  Supabase client wrapper.

### Added — Project foundation (pre-Phase 0)
- Initialized the git repository with `main` as the integration branch.
- Established the documentation structure under `docs/` (planning, architecture, database).
- Added the product specification as `docs/planning/PROJECT_BRIEF.md`.
- Added the Supabase schema reference at `docs/database/supabase_schema.sql`.
- Authored the architecture overview and the `src/` file-organization plan.
- Documented the branch → PR → merge git workflow.
- Added root `README.md`, `CHANGELOG.md`, `.gitignore`, `.editorconfig`, and a PR template.
- Configured an isolated development environment and an `.env.example` template.

_Nothing here is application code yet — Phase 0 (scaffold) is the first code phase._
