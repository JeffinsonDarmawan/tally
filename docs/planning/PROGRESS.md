# Progress log

> This is the project's **working memory** — the place to look first to understand what state
> we're in. Append a dated entry whenever meaningful work happens. Newest entries on top.
> Keep it factual: what changed, why, what's next, and anything that would surprise a future
> reader. Convert relative dates to absolute.

## Current state

- **Phase:** Foundation complete → **Phase 0 (Scaffold) is next.**
- **Repo:** `tally` (public, GitHub) · integration branch `main`.
- **App code:** none yet — by design. The repo holds VCS + docs + planned architecture only.

## Next up

1. **Phase 0 — Scaffold & design system.** Invoke the `frontend-design` skill, then scaffold
   Vite + React + TS + Tailwind + react-router + Supabase client + `vite-plugin-pwa`, build the
   design tokens and component kit, and the app shell. Pause for review.

---

## Log

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
