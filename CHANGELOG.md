# Changelog

All notable changes to **Tally** are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
once it ships. Until v1.0.0, the app is pre-release and the API/schema may change.

Entries are grouped by phase (see [`docs/planning/ROADMAP.md`](docs/planning/ROADMAP.md)).
Day-to-day work notes live in [`docs/planning/PROGRESS.md`](docs/planning/PROGRESS.md);
this file is the curated, human-readable summary.

## [Unreleased]

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
