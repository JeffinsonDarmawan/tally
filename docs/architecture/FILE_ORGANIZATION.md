# File organization

How the codebase is laid out and the conventions behind it. This is the **target structure** —
folders are created as their phase arrives (see [`../planning/ROADMAP.md`](../planning/ROADMAP.md)),
not all at once. The guiding decision is recorded in
[`../planning/DECISIONS.md`](../planning/DECISIONS.md) (ADR-0002).

## The principle: organize by feature, not by file type

We group code **by feature/domain** rather than by technical type. Each feature owns everything it
needs — components, hooks, data access, and types — and you can delete a whole feature without
breaking the rest of the app. Truly shared things (the design-system kit, the Supabase client, the
balance engine, utilities) live in dedicated top-level folders.

This is the consensus modern approach for scalable React apps and follows two well-known references:

- **[bulletproof-react](https://github.com/alan2207/bulletproof-react)** — feature-based folders,
  a shared component library, and a one-way dependency rule.
- **[Feature-Sliced Design](https://feature-sliced.design)** — slices owning their UI + logic +
  API, composed upward into pages.

Why not group by type (`components/`, `hooks/`, `services/` at the top)? It scatters one feature
across many folders, so every change is a tab-hunt and nothing is safely deletable. Feature-first
keeps related code co-located and the blast radius of a change small.

## Top-level `src/` layout

```
src/
├── main.tsx                  # entry: mount React, register PWA service worker
├── App.tsx                   # root component
├── app/                      # app-wide composition (not a feature)
│   ├── router.tsx            #   route table (react-router)
│   ├── providers.tsx         #   query client, auth, theme providers
│   └── layouts/              #   app shell: bottom-tab (mobile) / sidebar (desktop)
│
├── components/               # SHARED, reusable, presentational UI — the design-system kit
│   └── ui/                   #   Button, Card, StatCard (tinted), ListRow, Modal/Sheet,
│                             #   SegmentedControl, Avatar/Chip (squircle), IconPicker, …
│
├── features/                 # the heart: one self-contained folder per domain
│   ├── auth/                 #   magic-link sign-in, session, profile bootstrap
│   ├── categories/           #   seeded + custom categories CRUD (icon picker)
│   ├── expenses/             #   add/edit/delete flow, the 5 split modes, payers, receipts
│   ├── dashboard/            #   net hero, owed/owe tiles, per-friend balances, simplify toggle
│   ├── settle-up/            #   settlements, reminders
│   ├── recurring/            #   templates, confirm-before-post prompts
│   ├── history/              #   list with search/filter/sort, bulk actions
│   ├── summary/              #   month/year charts + CSV/PDF export
│   ├── activity/             #   the transparency feed
│   └── notifications/        #   in-app notifications
│       (each feature, as needed:)
│       ├── components/       #   feature-specific UI built from components/ui
│       ├── hooks/            #   feature hooks (data + behavior), e.g. useExpenses.ts
│       ├── api/              #   typed Supabase queries/mutations for this feature
│       ├── types.ts          #   feature-local types
│       └── index.ts          #   small public surface (what other code may import)
│
├── lib/                      # framework-agnostic libraries & integrations
│   ├── supabase/             #   the single supabase-js client + generated DB types
│   ├── balance-engine/       #   PURE domain logic (Section 6) + __tests__/  ← unit-tested
│   ├── export/               #   CSV + PDF (jsPDF) helpers
│   └── date/                 #   date-fns wrappers + group-timezone "clock"
│
├── hooks/                    # shared hooks used across features (e.g. useMediaQuery)
├── stores/                   # global client state, if any (theme, UI prefs)
├── types/                    # shared types: database.types.ts (generated), domain types
├── styles/                   # tokens.css (design tokens), tailwind layer, global.css
├── config/                   # constants: currency, timezone, feature flags
├── assets/                   # static assets (icons, fonts)
└── test/                     # test setup + shared test utilities
```

> Plus, at the repo root (outside `src/`): `index.html`, `vite.config.ts`, `tailwind.config.ts`,
> `tsconfig*.json`, `package.json`, and the `supabase/` migrations folder (added when we wire up
> the CLI). The schema reference lives at [`../database/supabase_schema.sql`](../database/supabase_schema.sql)
> until then.

## The balance engine gets its own home

`lib/balance-engine/` is deliberately separate and **pure** — it imports nothing from React or
Supabase. It takes already-fetched rows and returns balances, FIFO unpaid/days-unpaid, simplified
transfers, and deterministic cent-rounding. Keeping it isolated is what makes the brief's mandate
("pure, unit-tested functions; do not scatter this logic across components") enforceable. Its tests
live beside it in `__tests__/`.

## The dependency rule (one direction only)

```
app  →  features  →  components / lib / hooks / utils
                         (shared layers never import from features)
```

- **Shared layers** (`components/ui`, `lib/`, `hooks/`, `types/`, `config/`) must **not** import
  from `features/`. They are leaves.
- **Features** may use shared layers and, sparingly, compose other features through their public
  `index.ts` — never by reaching into another feature's internals.
- **`app/`** wires features into routes and layouts.

This keeps the graph acyclic and features independently understandable.

## Conventions

- **Naming:** PascalCase for components (`StatCard.tsx`), camelCase for hooks/utils
  (`useExpenses.ts`, `formatMoney.ts`), kebab-case for multi-word folders (`settle-up/`).
- **Imports:** a `@/` path alias maps to `src/` (configured in `tsconfig` + Vite) so imports read
  `@/components/ui/Button` rather than `../../../`.
- **Public surface:** other code imports a feature only via its `index.ts`. Internals are private.
- **Tests:** co-located — `__tests__/` next to the code, or `*.test.ts` beside the file. The engine
  is unit-tested exhaustively (rounding, FIFO, weighted/%, tax/tip, multiple payers, simplification).
- **Types:** generated `database.types.ts` from Supabase lives in `types/`; feature-local types
  stay in the feature.
- **No business logic in components:** money/debt math belongs in `lib/balance-engine/`; data
  access belongs in a feature's `api/`. Components render.
