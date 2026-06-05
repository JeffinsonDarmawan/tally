# Supabase setup (do this once)

Tally needs a free Supabase project for auth, the database, and Row-Level Security. This is the
one-time setup to make Phase 1 (and everything after) run. Budget ~10 minutes.

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Name it (e.g. `tally`), set a database password (save it somewhere), pick the region closest
   to the group, and create. Wait for it to finish provisioning.

## 2. Run the schema

1. In the project: **SQL Editor → New query**.
2. Paste the entire contents of [`database/supabase_schema.sql`](database/supabase_schema.sql) and
   click **Run**. This creates all tables, RLS policies, triggers, helper functions, the
   `create_group` RPC, and Realtime — it's written to run cleanly on a fresh project.
   > Re-running it on an existing project is safe — it uses `if not exists` / `create or replace`
   > and adds new columns (e.g. `expenses.split_config`) via `alter … add column if not exists`.

## 3. Configure Auth (magic link)

1. **Authentication → Providers → Email**: ensure **Email** is enabled. Magic links work with the
   default email provider out of the box (Supabase sends the email).
   - Leave “Confirm email” on. Passwords aren't used — Tally signs in with magic links only.
2. **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:5173` (your local dev URL).
   - **Redirect URLs:** add `http://localhost:5173` (and later your deployed URL, e.g.
     `https://tally.vercel.app`). The magic link returns here; the app completes sign-in.
   > The app sends the magic link with `emailRedirectTo = window.location.origin`, so whatever
   > origin you run on must be in this allow-list.

## 4. Get your keys → `.env`

1. **Project Settings → API**. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public** key → `VITE_SUPABASE_ANON_KEY`
   > Use the **anon** key only. Never put the `service_role` key in the app or `.env` — it bypasses
   > RLS and is server-only (Tally has no server, so you never need it).
2. In the repo root:
   ```bash
   cp .env.example .env
   ```
   Fill in the two values. `.env` is gitignored — it is never committed.

## 5. Run it

```bash
nvm use && npm install   # first time only
npm run dev              # http://localhost:5173
```

You should see the **Sign in** screen (not “Backend not configured”).

## 6. First sign-in & forming the group

1. Each of the 5 friends opens the app once and signs in with their email (magic link). This
   auto-creates their `profiles` row.
2. **One** person creates the group on the welcome screen → **Create group** (seeds default
   categories and adds them as the first member).
3. Everyone else: after signing in, they land on the welcome screen showing a **member code**
   (their profile id). They send it to the group creator.
4. The creator (or any member) goes to **Settings → Members → Add**, pastes each code, and adds
   them. Once added, everyone shares the same live data.

## Troubleshooting

- **“Backend not configured” on the sign-in screen** → `.env` is missing or the dev server wasn't
  restarted after editing it. Stop and re-run `npm run dev`.
- **Magic link opens but doesn't sign in** → the origin isn't in **Redirect URLs** (step 3), or you
  opened the link on a different device/browser than the one you requested it from.
- **“new row violates row-level security policy”** when adding a member → the adder must already be
  a member of the group, and the pasted code must be a real profile id (the person must have signed
  in at least once).
- **Regenerate types** after any schema change:
  ```bash
  npx supabase gen types typescript --project-id <your-project-id> --schema public > src/types/database.types.ts
  ```

See also [`database/DATABASE.md`](database/DATABASE.md) for the data model and the canonical-ledger rule.
