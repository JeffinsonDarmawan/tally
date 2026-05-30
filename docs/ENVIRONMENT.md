# Development environment

We work in an **isolated, reproducible per-project environment** so that builds are identical
across machines and nothing leaks into your global system. This is the lightweight standard for a
Vite/React/TypeScript app — no Docker required.

## What "isolated" means here

| Concern | How it's isolated |
|---|---|
| **Node version** | Pinned in [`.nvmrc`](../.nvmrc) and [`.node-version`](../.node-version) (Node **24 LTS**, matching Vercel's default runtime). Works with `nvm`, `fnm`, `asdf`, or Volta. |
| **Dependencies** | Installed project-locally into `node_modules/` (gitignored). Nothing is installed globally. |
| **Secrets / config** | Live in a gitignored `.env`, seeded from [`.env.example`](../.env.example). Never committed. |
| **Reproducibility** | A committed `package-lock.json` (added in Phase 0) locks exact dependency versions. |

## First-time setup

```bash
# 1. Use the project's Node version (installs it if you don't have it)
nvm install        # reads .nvmrc → Node 24
nvm use

# 2. Install dependencies locally (after Phase 0 creates package.json)
npm install

# 3. Create your local environment file and fill it in
cp .env.example .env
```

Don't have `nvm`? Any version manager works (`fnm use`, `asdf install`), or install Node 24 LTS
directly. The app needs Node ≥ 20; 24 is what we pin and test against.

## Daily use

```bash
nvm use            # once per shell, to match the pinned version
npm run dev        # start the Vite dev server   (available after Phase 0)
npm run build      # production build
npm run test       # unit tests (the balance engine, etc.)
npm run lint       # lint
```

## Optional: Dev Container (stronger isolation, later)

If you later want a fully containerized environment (everything runs in Docker, zero host
footprint), we can add a `.devcontainer/` with a Node 24 image and "Reopen in Container" support.
It's deliberately **not** set up now — it requires Docker and isn't needed for solo work. See
ADR-0005 in [`planning/DECISIONS.md`](planning/DECISIONS.md).
