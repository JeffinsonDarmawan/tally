# Architecture overview

A high-level map of how Tally fits together. Detail on the `src/` layout is in
[`FILE_ORGANIZATION.md`](FILE_ORGANIZATION.md); the data model and rules are in
[`../planning/PROJECT_BRIEF.md`](../planning/PROJECT_BRIEF.md) §5–§6 and
[`../database/DATABASE.md`](../database/DATABASE.md).

## System shape

Tally is a **client-only single-page app talking directly to Supabase**. There is no custom
backend server in v1 — Supabase provides Postgres, Auth, Row-Level Security, Storage, and
Realtime, and the React app is a static bundle hosted on Vercel.

```
┌──────────────────────────────────────────────┐         ┌─────────────────────────────┐
│  Browser (installable PWA)                    │         │  Supabase                   │
│                                               │         │                             │
│  React + TypeScript (Vite)                    │  HTTPS  │  ┌───────────────────────┐  │
│  ┌─────────────────────────────────────────┐  │ ─────▶ │  │ Auth (magic link)     │  │
│  │ UI: features + shared component kit      │  │        │  └───────────────────────┘  │
│  └───────────────┬─────────────────────────┘  │        │  ┌───────────────────────┐  │
│  ┌───────────────▼─────────────────────────┐  │        │  │ Postgres + RLS        │  │
│  │ Data layer: supabase-js client + queries │  │ ◀────▶ │  │ (canonical ledger)    │  │
│  └───────────────┬─────────────────────────┘  │ Realtime└───────────────────────┘  │
│  ┌───────────────▼─────────────────────────┐  │        │  ┌───────────────────────┐  │
│  │ Balance engine (PURE, unit-tested TS)    │  │        │  │ Storage (unused in v1)│  │
│  └─────────────────────────────────────────┘  │        │  └───────────────────────┘  │
└──────────────────────────────────────────────┘         └─────────────────────────────┘
        host: Vercel (static frontend)                          host: Supabase cloud
```

## Layers (responsibilities)

1. **UI layer** — feature screens composed from a shared, design-token-driven component kit.
   Renders state; never contains balance math. Every screen has designed empty/loading/error
   states. UI work goes through the `frontend-design` skill.
2. **Data layer** — thin functions wrapping the `supabase-js` client: typed queries and mutations
   per feature (`features/<x>/api/`), plus a single shared client in `lib/supabase/`. Auth session,
   Realtime subscriptions, and Storage uploads live here.
3. **Domain / balance engine** — **pure TypeScript functions** in `lib/balance-engine/` that take
   fetched rows and return balances, unpaid/days-unpaid (FIFO), simplified transfers, and
   deterministic cent-rounding. No React, no I/O, fully unit-tested. This is the heart of the app
   (`PROJECT_BRIEF.md` §6) and is kept isolated so it can't drift into components.
4. **Persistence (Supabase/Postgres)** — the canonical ledger. `expense_shares` (owing) and
   `expense_payers` (paying) are the source of truth; RLS restricts every table to group members.

## Key data-flow: saving an expense

```
Add-Expense UI  →  build shares + payers from the chosen split mode
               →  validate  Σ shares == total  AND  Σ payers == total   (client-side)
               →  write expense + items + shares + payers atomically (Supabase)
               →  log to activity_log, create notifications
               →  invalidate/refetch → engine recomputes balances → dashboard updates
```

The engine **reads** `expense_shares` + `expense_payers`; it never re-derives splits. Correctness
depends on the save path persisting exact, reconciled rows.

## Cross-cutting concerns

- **State/data caching:** a server-state cache (e.g. TanStack Query) over the Supabase queries,
  with Realtime updates keeping the shared group view live. Finalized in Phase 0/2.
- **Auth & access:** Supabase Auth (email magic link); Postgres RLS is the real security boundary
  (the client only ever holds the anon key).
- **Time:** one configurable **group time zone** drives "days unpaid" and month/year boundaries so
  every member sees identical figures (`PROJECT_BRIEF.md` §6.7).
- **Money:** single currency for v1; all amounts `numeric(12,2)`; tabular figures in the UI;
  rounding is deterministic and unit-tested.
- **Offline/PWA:** `vite-plugin-pwa` provides an installable, offline app shell (finalized Phase 9).

## What's deliberately NOT here (v1)

Multi-currency, multiple groups in the UI, receipt capture/OCR (removed — ADR-0007), complex
permission roles, and PayNow/QR settle-up — see `PROJECT_BRIEF.md` §14. No custom server: keeping it client + Supabase
is what makes the app free to run at this scale.
