# Tally — documentation

This folder is the **single home for everything that isn't application code**: the product
spec, the plan, the running work log, architecture decisions, and the database reference.
Read this index first to know where to look (and where to write).

## Map

| Area | File | Purpose |
|---|---|---|
| **Workflow** | [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md) | How we branch, commit, open PRs, and merge to `main`. |
| **Environment** | [`ENVIRONMENT.md`](ENVIRONMENT.md) | The isolated dev environment: pinned Node, local deps, `.env`. |
| **Supabase setup** | [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) | One-time backend setup: create project, run schema, configure auth, fill `.env`. |
| **Spec** | [`planning/PROJECT_BRIEF.md`](planning/PROJECT_BRIEF.md) | The full product specification — the source of truth. |
| **Plan** | [`planning/ROADMAP.md`](planning/ROADMAP.md) | The 10 build phases, with a live checklist. |
| **Status** | [`planning/PROGRESS.md`](planning/PROGRESS.md) | Running work log: what's done, in flight, and next. Read this for context. |
| **Decisions** | [`planning/DECISIONS.md`](planning/DECISIONS.md) | Architecture Decision Records (ADRs) — the *why* behind choices. |
| **Architecture** | [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | System overview: layers, data flow, the balance engine. |
| **File layout** | [`architecture/FILE_ORGANIZATION.md`](architecture/FILE_ORGANIZATION.md) | The planned `src/` structure and the conventions behind it. |
| **Database** | [`database/DATABASE.md`](database/DATABASE.md) | Schema notes and first-run setup. |
| **Schema** | [`database/supabase_schema.sql`](database/supabase_schema.sql) | The runnable Postgres schema, RLS, triggers & helpers. |

## How to keep these docs useful

- **Before starting a phase:** re-read the relevant section of `PROJECT_BRIEF.md` and the
  phase entry in `ROADMAP.md`.
- **While working:** keep `PROGRESS.md` current — it is the project's memory between sessions.
- **When you make a non-obvious choice:** add an ADR to `DECISIONS.md`.
- **When something notable ships:** add a line to the root `CHANGELOG.md`.

> Convention: docs are Markdown, wrapped at a comfortable width, and link to each other with
> relative paths so they stay navigable on GitHub and in editors.
