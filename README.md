# Tally — a group bill-splitting app

> A private, beautiful web app for a group of 5 friends to split bills, track who owes
> whom, mark debts as paid, and review past spending. Think Splitwise / Splid / Tricount,
> tailored to exactly how we settle up.

[![Status](https://img.shields.io/badge/status-foundation-9C9CF0)](docs/planning/PROGRESS.md)
[![Phase](https://img.shields.io/badge/phase-0%20pending-6B6B74)](docs/planning/ROADMAP.md)

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
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS (custom dark design tokens) |
| Routing | react-router |
| Charts | Recharts |
| Dates | date-fns |
| Export | client-side (jsPDF + CSV helper) |
| PWA | vite-plugin-pwa |
| Backend / DB / Auth / Storage | Supabase (Postgres + Auth + RLS + Storage) |
| Hosting | Vercel (frontend) + Supabase |

**Cost at 5 users: effectively $0.** Single currency for v1.

## 📁 Repository layout

```
tally/
├── README.md                  ← you are here
├── CHANGELOG.md               ← human-readable record of notable changes
├── .gitignore  .editorconfig  ← tooling / hygiene
├── .github/                   ← PR template (CI workflows land in Phase 9)
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
│   └── database/
│       ├── supabase_schema.sql ← the Postgres schema, RLS & helpers
│       └── DATABASE.md        ← schema notes & setup steps
└── src/ …                     ← (app code — created in Phase 0)
```

> **The app code does not exist yet.** This repository currently holds the project
> *foundation*: version control, documentation, and the planned architecture. The
> application itself is built in reviewed phases — see the roadmap.

## 🚀 Getting started

> These steps become runnable once **Phase 0 (scaffold)** lands. They're documented here so
> the README is ready to go.

**Prerequisites:** Node.js **24 LTS** (pinned in `.nvmrc`; `nvm use`), npm, and a free
[Supabase](https://supabase.com) project. See [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for the
isolated-environment setup.

```bash
# 0. Match the pinned Node version
nvm install && nvm use        # reads .nvmrc → Node 24

# 1. Install dependencies (after Phase 0 scaffolds package.json)
npm install

# 2. Configure environment
cp .env.example .env          # then fill in your Supabase URL + anon key

# 3. Set up the backend (one-time)
#    Follow docs/SUPABASE_SETUP.md: create a project, run docs/database/supabase_schema.sql,
#    configure the magic-link redirect URLs, and copy your URL + anon key into .env

# 4. Run the dev server
npm run dev
```

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
