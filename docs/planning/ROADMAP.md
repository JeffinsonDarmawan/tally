# Roadmap

The app is built in **10 reviewed phases** (Phase 0 → 9). We complete one phase at a time and
**pause for review between phases**. UI phases (0, 3, 4, 5, 6, 7, 8, 9) must invoke the
`frontend-design` skill at their start. Full detail for each phase lives in
[`PROJECT_BRIEF.md` §12](PROJECT_BRIEF.md).

Legend: ⬜ not started · 🟡 in progress · ✅ done

| Phase | Title | Status |
|---|---|---|
| — | **Foundation** (VCS, docs, environment) | ✅ |
| 0 | Scaffold & design system | ✅ |
| 1 | Auth, members & categories | ✅ |
| 2 | Schema & balance engine (unit-tested) | ✅ |
| 3 | Add Expense flow | ✅ |
| 4 | Dashboard | ✅ |
| 5 | Settle up, reminders, activity log & notifications | ✅ |
| 6 | Recurring payments | ✅ |
| 7 | History page | ✅ |
| 8 | Summary pages | ✅ |
| 9 | Polish & deploy | 🟡 in review |

---

## Phase 0 — Scaffold & design system
Vite + React + TS + Tailwind + react-router + Supabase client + `vite-plugin-pwa`. Build the
locked dark theme tokens + type scale and a component kit (button, card, tinted stat card, list
row, modal/sheet, segmented control, rounded-square avatar/chip, icon picker). Styled app shell
with bottom-tab nav.
**Exit:** design system renders; app shell navigable; PWA registers in dev.

## Phase 1 — Auth, members & categories
Magic-link login, profiles, single group, membership, seeded + custom categories with icons
(CRUD). RLS verified.
**Exit:** all 5 can sign in; categories CRUD works; RLS blocks non-members.

## Phase 2 — Schema & balance engine
Finalize schema. Implement the engine (§6) as **pure, unit-tested TypeScript**: pairwise net,
settlements, FIFO unpaid/days, rounding, weighted & percentage splits, tax/tip allocation,
multiple payers, debt simplification. **Do this before dependent screens.**
**Exit:** engine unit tests pass, including the §6.1 worked example.

## Phase 3 — Add Expense flow
Basics + receipt photo, who-paid (single/multiple payers), involved selection, all 5 split
modes incl. tax/tip; validation; save; edit/delete.
**Exit:** every split mode saves shares that sum exactly to total; edit/delete recompute.

## Phase 4 — Dashboard
Net hero, owed/owe tiles, unpaid count, per-friend breakdown, simplify-debts toggle, pending
recurring, this-month activity.
**Exit:** dashboard reflects engine output live, from "my" perspective.

## Phase 5 — Settle up, reminders, activity log & notifications
Settlements (partial/full/overpayment), symmetric updates, FIFO days-unpaid, reminders, the
activity feed, and in-app notifications.
**Exit:** settling reduces debt on both sides identically; activity logs add/edit/delete/settle.

## Phase 6 — Recurring payments
Templates; **future periods never post**; due periods prompt confirmation; variable bills require
a real amount; fixed confirm fast; skip + backlog + anchor-day rules.
**Exit:** no future expense appears in balances; variable confirm requires amount.

## Phase 7 — History page
Full expense list with search, filter (date/category/member/paid-unpaid/amount), sort, and bulk
select → recategorize/delete.
**Exit:** filters/sort/bulk actions work on real data.

## Phase 8 — Summary pages
Month/year reports: category donut, who-paid, timeline, settled-vs-pending, top expenses, with
CSV + PDF export. Designed empty states.
**Exit:** charts render; CSV + PDF export the current period.

## Phase 9 — Polish & deploy
Empty/loading/error states everywhere, finalize PWA (installable, offline shell), responsive +
a11y pass, deploy to Vercel + Supabase, complete the README.
**Exit:** the acceptance checklist (§13) is fully ticked and the app is deployed.

**Carried over from earlier reviews (a11y pass):**
- Modal: focus trap, initial focus on open, and focus-return to the trigger on close.
- Full WCAG AA color-contrast audit across the dark theme.
- De-duplicate the two `nav` landmarks (sidebar vs. bottom bar share the same label).
