# Git workflow

`main` is the **integration branch**: it always builds, passes checks, and is deployable.
Nothing is committed directly to `main` — every change arrives through a short-lived branch
and a pull request.

```
main ──●─────────────────●───────────────●──▶   (always green, deployable)
        \               /  \             /
         ●──●──●  PR ──▶     ●──●──●  PR ─
         feat/add-expense    fix/rounding-cents
```

## 1. Branch per change

Create a focused branch off the latest `main`:

```bash
git switch main
git pull
git switch -c <type>/<short-description>
```

**Branch naming** — `<type>/<kebab-description>`:

| Type | Use for |
|---|---|
| `feat/` | A new feature or capability |
| `fix/` | A bug fix |
| `chore/` | Tooling, config, deps, housekeeping |
| `docs/` | Documentation only |
| `refactor/` | Code change that neither fixes a bug nor adds a feature |
| `test/` | Adding or fixing tests |

Examples: `feat/add-expense-flow`, `fix/fifo-days-unpaid`, `chore/project-foundation`.

A good rule of thumb: **one branch maps to one phase task** (see the roadmap), or smaller.

## 2. Commit conventions

Write [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <summary>` in the
imperative mood, ≤ 72 chars on the subject line, with a body explaining *why* when it isn't obvious.

```
feat: add weighted-shares split mode to the add-expense flow

Splits the total in proportion to integer weights and reuses the
deterministic cent-distribution helper so shares sum exactly to total.
```

Keep commits coherent and reviewable. Don't mix unrelated changes.

## 3. Open a pull request

```bash
git push -u origin HEAD
gh pr create --fill          # or write a title/body; the PR template prompts you
```

Fill in the PR template: what & why, how you tested, and the checklist. UI work must note that
empty / loading / error states and both mobile and desktop layouts were checked.

## 4. Merge to `main`

Once the PR is reviewed and checks pass:

```bash
gh pr merge --squash --delete-branch
```

We **squash-merge** so `main` keeps one clean commit per change and the branch is deleted
automatically. Then locally:

```bash
git switch main
git pull
```

## 5. After merging

- Update [`planning/PROGRESS.md`](planning/PROGRESS.md) if a phase task advanced.
- Add a line to the root [`CHANGELOG.md`](../CHANGELOG.md) under **Unreleased** if notable.

## Conventions & guardrails

- **`main` is protected by discipline** (and branch protection once the repo settles): no direct
  pushes, PRs only.
- **Never commit secrets** — `.env`, keys, and tokens are gitignored. Use `.env.example` as the
  template.
- **Authorship is the project owner's.** Commits and PRs are authored by the repository owner and
  carry no third-party co-author or tooling attribution.
- **Small and frequent** beats large and rare. Smaller PRs review faster and break less.
