# Tally — a group bill-splitting app

> A private, beautiful web app for a group of 5 friends to split bills, track who owes
> whom, mark debts as paid, and review past spending. Think Splitwise / Splid / Tricount,
> tailored to exactly how we settle up.

[![Status](https://img.shields.io/badge/status-feature--complete-74E0A2)](docs/planning/ROADMAP.md)
[![Tests](https://img.shields.io/badge/tests-110%20passing-74E0A2)](src/lib/balance-engine)
[![PWA](https://img.shields.io/badge/PWA-installable-9C9CF0)](#-getting-started)

---

## ✨ What it does

- **Net balance at a glance** — always from *your* perspective ("you're owed" / "you owe").
- **Add expenses** five ways — by item (with tax/tip auto-split), equal, uneven/exact,
  weighted shares, and percentage — with one or multiple payers.
- **Settle up** — record repayments (partial, full, overpayment-as-credit) that update both
  sides symmetrically, with FIFO "days unpaid" tracking.
- **Recurring payments** done right — pending bills are *confirmed before posting* (variable
  bills require a real amount), so balances never show money that hasn't actually moved.
- **Summaries** — month/year reports with category, who-paid, timeline, and settled-vs-pending
  charts, plus CSV/PDF export.
- **Transparency** — an activity feed and in-app notifications so deletes and edits are visible.
- **Installable PWA** with an offline app shell.

See the full specification in [`docs/planning/PROJECT_BRIEF.md`](docs/planning/PROJECT_BRIEF.md).

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (custom dark design tokens) |
| Routing | react-router |
| Charts | Recharts (lazy-loaded on the Summary route) |
| Export | client-side — jsPDF + a tiny CSV helper |
| PWA | vite-plugin-pwa (installable, offline app shell) |
| Backend / DB / Auth | Supabase (Postgres + Auth + Row-Level Security) |
| Hosting | Vercel (frontend) + Supabase |

**Cost at 5 users: effectively $0.** Single currency for v1. The balance engine is a pure,
unit-tested TypeScript module (`src/lib/balance-engine/`) — no money math lives in components.

## 📁 Repository layout

```
tally/
├── README.md                  ← you are here
├── CHANGELOG.md               ← human-readable record of notable changes
├── .gitignore  .editorconfig  ← tooling / hygiene
├── .github/                   ← PR template
├── vercel.json                ← SPA rewrite for deployment
├── docs/                      ← all planning & reference docs (start here for context)
│   ├── README.md              ← documentation index
│   ├── GIT_WORKFLOW.md        ← branching & PR conventions
│   ├── planning/
│   │   ├── PROJECT_BRIEF.md   ← the full product spec (source of truth)
│   │   ├── ROADMAP.md         ← the 10 build phases, tracked
│   │   ├── PROGRESS.md        ← current status & running work log
│   │   └── DECISIONS.md       ← architecture decision records (ADRs)
│   ├── architecture/
│   │   ├── ARCHITECTURE.md    ← system architecture overview
│   │   └── FILE_ORGANIZATION.md ← the src/ layout we'll build + rationale
│   ├── database/
│   │   ├── supabase_schema.sql ← the Postgres schema, RLS & helpers
│   │   └── DATABASE.md        ← schema notes & setup steps
│   ├── SUPABASE_SETUP.md      ← one-time backend setup walkthrough
│   └── dev/seed-demo-members.sql ← optional: seed demo members for testing
└── src/
    ├── app/                   ← providers, router, app shell, auth/group gate
    ├── components/ui/         ← the design-system component kit
    ├── features/             ← feature-sliced domains (auth, expenses, dashboard,
    │                            settle-up, recurring, history, summary, …)
    └── lib/balance-engine/   ← the pure, unit-tested balance engine
```

## 🚀 Getting started

**Prerequisites:** Node.js **24 LTS** (pinned in `.nvmrc`; `nvm use`), npm, and a free
[Supabase](https://supabase.com) project. See [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for the
isolated-environment setup.

```bash
# 0. Match the pinned Node version
nvm install && nvm use        # reads .nvmrc → Node 24

# 1. Install dependencies
npm install

# 2. Set up the backend (one-time) — see docs/SUPABASE_SETUP.md
#    Create a Supabase project, run docs/database/supabase_schema.sql in the SQL editor,
#    and set the magic-link Site/Redirect URLs to http://localhost:5173

# 3. Configure environment
cp .env.example .env          # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY

# 4. Run it
npm run dev                   # http://localhost:5173
```

**Scripts:** `npm run dev` · `npm run build` · `npm run test` (Vitest) · `npm run lint` · `npm run typecheck`.

Want data to play with? Run [`docs/dev/seed-demo-members.sql`](docs/dev/seed-demo-members.sql) to add
four demo members to your group.

## ☁️ Deploy (Vercel + Supabase)

1. **Import the repo into [Vercel](https://vercel.com)** — it auto-detects Vite (build `npm run build`,
   output `dist`). `vercel.json` adds the SPA rewrite so deep links survive a refresh.
2. **Add environment variables** in the Vercel project (Production): `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (the anon key — never the service-role key).
3. **Point Supabase auth at the deployed domain:** Supabase → Authentication → URL Configuration →
   add your Vercel URL (e.g. `https://tally-xxxx.vercel.app`) to **Site URL** and **Redirect URLs**.
4. Deploy. Each of the five signs in with a magic link and installs the PWA from their browser.

## 🌿 Contributing workflow

All changes go through a branch → pull request → merge-to-`main` flow. `main` always stays
green and deployable. Full conventions live in [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md).

```bash
git switch -c feat/short-description   # branch per change
# …commit work…
git push -u origin HEAD
gh pr create --fill                    # open a PR
gh pr merge --squash --delete-branch   # merge once reviewed
```

## 🗺️ Build status

Progress is tracked in [`docs/planning/PROGRESS.md`](docs/planning/PROGRESS.md) and the phase
checklist in [`docs/planning/ROADMAP.md`](docs/planning/ROADMAP.md).

## 📄 License

Private project for personal use. No license is granted for reuse at this time.
