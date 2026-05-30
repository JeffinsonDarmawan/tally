# Database

Tally's backend is **Supabase (Postgres)**. The full, runnable schema — tables, indexes,
`updated_at` triggers, the auth profile trigger, membership helper functions, Row-Level Security
policies, the `create_group` bootstrap RPC, and Realtime setup — lives in
[`supabase_schema.sql`](supabase_schema.sql). This page is the orientation + first-run guide.

## First-run setup

1. Create a free project at [supabase.com](https://supabase.com).
2. **Supabase → SQL Editor → New query** → paste all of `supabase_schema.sql` → **Run**.
   It's written to run cleanly on an empty database (`if not exists` / `create or replace`).
3. Each of the 5 friends signs in once via magic link. A `profiles` row is created automatically
   by the `on_auth_user_created` trigger.
4. One person bootstraps the group:
   ```sql
   select public.create_group('Flat 12', 'SGD', 'Asia/Singapore');
   ```
   This creates the group, adds the caller as a member, and seeds the default categories. Note the
   returned group id.
5. Add the other four (after each has signed in once):
   ```sql
   insert into public.group_members (group_id, user_id)
   values ('<group-id>', '<their-profile-id>');
   ```
6. Copy the project URL and anon key into your local `.env` (see [`../../.env.example`](../../.env.example)).

> The `service_role` key bypasses RLS and is **server-only**. v1 has no custom server, so the app
> uses only the anon key; RLS is the security boundary.

## The model in one breath

`profiles` ← `group_members` → `groups` define who's in the group. An `expense` has two canonical
sides: **`expense_payers`** (who actually paid) and **`expense_shares`** (who owes what). For
`by_item` splits there are also `expense_items` + `expense_item_shares`. `settlements` record
repayments; `recurring_templates` drive confirm-before-post recurring bills; `activity_log` and
`notifications` provide transparency. Full field list: [`../planning/PROJECT_BRIEF.md`](../planning/PROJECT_BRIEF.md) §5.

## The one rule the app must enforce

Per expense, both sides reconcile to the total (enforced in the app's save path, not a DB
constraint — a cross-row sum is awkward/slow as a constraint):

```
SUM(expense_shares.amount)       per expense == expenses.total_amount   -- owing side
SUM(expense_payers.amount_paid)  per expense == expenses.total_amount   -- paying side
```

The balance engine reads both sides and computes each person's per-expense net as
`amount_paid − amount_owed` (`PROJECT_BRIEF.md` §6.1). It never re-derives splits — so the save
path must write exact, reconciled rows (deterministic cent-rounding; unit-tested).

## Security model (RLS)

Every table has RLS enabled. Access is gated by membership through `SECURITY DEFINER` helper
functions (`is_group_member`, `shares_group_with`, `can_access_expense`, `can_access_item`) so
policies don't recurse on `group_members`. Net effect: an authenticated user can only read/write
data for groups they belong to; `notifications` are restricted to their recipient.

## Notes for later phases

- **Migrations:** once we wire up the Supabase CLI (around Phase 1), the schema moves into
  `supabase/migrations/` as versioned files; `supabase_schema.sql` here stays as the readable
  reference snapshot. Tracked in the roadmap.
- **Generated types:** `supabase gen types typescript` produces `src/types/database.types.ts` for
  end-to-end type safety against these tables.
- **Storage:** a bucket for receipt images (attach-only, no OCR) is configured in the Add-Expense
  phase (Phase 3).
- **Realtime:** the schema adds all tables to the `supabase_realtime` publication so the shared
  group view updates live.
