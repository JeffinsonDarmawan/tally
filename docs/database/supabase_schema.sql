-- =============================================================================
-- Tally — Supabase schema, RLS, triggers & helpers (v1)
-- =============================================================================
-- HOW TO USE
--   1. Open your Supabase project -> SQL Editor -> New query.
--   2. Paste this whole file and run it once. It is idempotent-ish: it uses
--      "if not exists" / "create or replace" where possible. To re-run cleanly
--      on a fresh project, just run it on an empty database.
--   3. Each of the 5 friends signs in once (magic link). A profile row is
--      created automatically by a trigger on auth.users.
--   4. One person calls:  select public.create_group('Flat 12', 'SGD', 'Asia/Singapore');
--      That creates the group, adds the caller as a member, and seeds default
--      categories. Note the returned group id.
--   5. Add the other 4 friends (after each has signed in once) by inserting into
--      group_members, e.g.:
--          insert into public.group_members (group_id, user_id)
--          values ('<group-id>', '<their-profile-id>');
--      (Any existing member is allowed to do this by the RLS policies below.)
--
-- DESIGN NOTES
--   * expense_shares is the canonical ledger. SUM(amount) per expense must equal
--     expenses.total_amount. This is enforced in the app layer (a cross-row sum
--     is awkward and slow to enforce in a constraint); the engine only ever reads
--     this table + expenses.paid_by.
--   * Categorical fields use text + CHECK (not enums) so they're easy to extend.
--   * Membership checks use SECURITY DEFINER helper functions so RLS policies on
--     group_members don't recurse.
--   * The service_role key bypasses RLS (server-side only). The anon/authenticated
--     keys go through the policies defined here.
-- =============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- =============================================================================
-- 1. TABLES
-- =============================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null,
  avatar_color  text not null default '#9C9CF0',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  currency_code text not null default 'SGD',
  time_zone     text not null default 'Asia/Singapore',  -- used for "days unpaid" & month boundaries
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  name       text not null,
  icon       text,                       -- Tabler icon name or emoji
  color      text,
  is_custom  boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_templates (
  id                 uuid primary key default gen_random_uuid(),
  group_id           uuid not null references public.groups (id) on delete cascade,
  name               text not null,
  category_id        uuid references public.categories (id) on delete set null,
  paid_by            uuid not null references public.profiles (id) on delete restrict,
  frequency          text not null check (frequency in ('weekly','biweekly','monthly','yearly')),
  amount_mode        text not null check (amount_mode in ('fixed','variable')),
  default_amount     numeric(12,2) check (default_amount is null or default_amount >= 0),
  split_method       text not null check (split_method in ('by_item','equal','uneven','shares','percentage')),
  split_config       jsonb not null default '{}'::jsonb,  -- members + per-person/item/share/% config
  anchor_day         smallint check (anchor_day is null or anchor_day between 0 and 31), -- day-of-month, or day-of-week for weekly
  start_date         date not null,
  end_date           date,
  last_posted_period date,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.expenses (
  id                   uuid primary key default gen_random_uuid(),
  group_id             uuid not null references public.groups (id) on delete cascade,
  paid_by              uuid references public.profiles (id) on delete set null,  -- PRIMARY payer (display only); canonical contributions live in expense_payers
  date                 date not null default current_date,
  category_id          uuid references public.categories (id) on delete set null,
  total_amount         numeric(12,2) not null check (total_amount > 0),
  split_method         text not null check (split_method in ('by_item','equal','uneven','shares','percentage')),
  split_config         jsonb not null default '{}'::jsonb,  -- snapshot of the split inputs, for faithful editing (the engine reads expense_shares, not this)
  extra_charges        jsonb not null default '[]'::jsonb,  -- [{label, amount, mode:'proportional'|'equal'}]
  note                 text,
  receipt_url          text,                                -- Supabase Storage path; attach only (no OCR)
  recurring_template_id uuid references public.recurring_templates (id) on delete set null,
  created_by           uuid not null references public.profiles (id) on delete restrict,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Upgrade path: add split_config to an existing expenses table (create-if-not-exists won't alter it).
alter table public.expenses add column if not exists split_config jsonb not null default '{}'::jsonb;

create table if not exists public.expense_items (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  name       text not null,
  amount     numeric(12,2) not null check (amount >= 0)
);

create table if not exists public.expense_item_shares (
  item_id uuid not null references public.expense_items (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  primary key (item_id, user_id)
);

create table if not exists public.expense_shares (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete restrict,
  amount     numeric(12,2) not null check (amount >= 0),  -- OWING side. SUM per expense == expenses.total_amount (app-enforced)
  primary key (expense_id, user_id)
);

create table if not exists public.expense_payers (
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete restrict,
  amount_paid numeric(12,2) not null check (amount_paid >= 0),  -- PAYING side. SUM per expense == expenses.total_amount (app-enforced)
  primary key (expense_id, user_id)
  -- One row for the common single-payer case; several rows for split payments.
);

create table if not exists public.settlements (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  from_user  uuid not null references public.profiles (id) on delete restrict,  -- the one paying back
  to_user    uuid not null references public.profiles (id) on delete restrict,  -- the one being paid
  amount     numeric(12,2) not null check (amount > 0),
  date       date not null default current_date,
  note       text,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  actor       uuid not null references public.profiles (id) on delete restrict,
  action_type text not null,   -- expense.created|expense.edited|expense.deleted|settlement.created|recurring.confirmed|reminder.sent|member.added ...
  target_type text,
  target_id   uuid,
  summary     text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,  -- recipient
  type       text not null,   -- added_to_expense|settled_with_you|recurring_due|reminder
  message    text not null,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

create index if not exists idx_group_members_user        on public.group_members (user_id);
create index if not exists idx_categories_group           on public.categories (group_id);
create index if not exists idx_expenses_group_date        on public.expenses (group_id, date desc);
create index if not exists idx_expenses_paid_by           on public.expenses (paid_by);
create index if not exists idx_expenses_category          on public.expenses (category_id);
create index if not exists idx_expenses_recurring         on public.expenses (recurring_template_id);
create index if not exists idx_expense_items_expense      on public.expense_items (expense_id);
create index if not exists idx_expense_item_shares_user   on public.expense_item_shares (user_id);
create index if not exists idx_expense_shares_user        on public.expense_shares (user_id);
create index if not exists idx_expense_payers_user        on public.expense_payers (user_id);
create index if not exists idx_settlements_group          on public.settlements (group_id);
create index if not exists idx_settlements_from           on public.settlements (from_user);
create index if not exists idx_settlements_to             on public.settlements (to_user);
create index if not exists idx_recurring_group_active     on public.recurring_templates (group_id, active);
create index if not exists idx_activity_group_created     on public.activity_log (group_id, created_at desc);
create index if not exists idx_notifications_user_unread  on public.notifications (user_id, read, created_at desc);

-- =============================================================================
-- 3. updated_at TRIGGERS
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at before update on public.groups
  for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_recurring_updated_at on public.recurring_templates;
create trigger trg_recurring_updated_at before update on public.recurring_templates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 4. AUTH: auto-create a profile when a user signs up
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.profiles (id, display_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    (array['#9C9CF0','#74E0A2','#F4948B','#E0B35B','#6BC8D6','#D199E8'])[1 + floor(random() * 6)::int]
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 5. MEMBERSHIP HELPER FUNCTIONS (SECURITY DEFINER -> no RLS recursion)
-- =============================================================================

create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql security definer set search_path = '' stable as $fn$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  );
$fn$;

create or replace function public.shares_group_with(p_user_id uuid)
returns boolean language sql security definer set search_path = '' stable as $fn$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = p_user_id
  );
$fn$;

create or replace function public.can_access_expense(p_expense_id uuid)
returns boolean language sql security definer set search_path = '' stable as $fn$
  select exists (
    select 1
    from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = p_expense_id and gm.user_id = auth.uid()
  );
$fn$;

create or replace function public.can_access_item(p_item_id uuid)
returns boolean language sql security definer set search_path = '' stable as $fn$
  select exists (
    select 1
    from public.expense_items it
    join public.expenses e on e.id = it.expense_id
    join public.group_members gm on gm.group_id = e.group_id
    where it.id = p_item_id and gm.user_id = auth.uid()
  );
$fn$;

-- =============================================================================
-- 6. ROW-LEVEL SECURITY
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.groups              enable row level security;
alter table public.group_members       enable row level security;
alter table public.categories          enable row level security;
alter table public.recurring_templates enable row level security;
alter table public.expenses            enable row level security;
alter table public.expense_items       enable row level security;
alter table public.expense_item_shares enable row level security;
alter table public.expense_shares      enable row level security;
alter table public.expense_payers      enable row level security;
alter table public.settlements         enable row level security;
alter table public.activity_log        enable row level security;
alter table public.notifications       enable row level security;

-- ---- profiles -------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.shares_group_with(id));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ---- groups ---------------------------------------------------------------
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups for select
  using (public.is_group_member(id));

drop policy if exists groups_update on public.groups;
create policy groups_update on public.groups for update
  using (public.is_group_member(id)) with check (public.is_group_member(id));
-- (groups are created only via public.create_group())

-- ---- group_members --------------------------------------------------------
drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members for select
  using (public.is_group_member(group_id));

drop policy if exists group_members_insert on public.group_members;
create policy group_members_insert on public.group_members for insert
  with check (public.is_group_member(group_id));

drop policy if exists group_members_delete on public.group_members;
create policy group_members_delete on public.group_members for delete
  using (public.is_group_member(group_id));

-- ---- categories -----------------------------------------------------------
drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories for all
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

-- ---- recurring_templates --------------------------------------------------
drop policy if exists recurring_all on public.recurring_templates;
create policy recurring_all on public.recurring_templates for all
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

-- ---- expenses -------------------------------------------------------------
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses for select
  using (public.is_group_member(group_id));

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses for insert
  with check (public.is_group_member(group_id) and created_by = auth.uid());

drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses for update
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses for delete
  using (public.is_group_member(group_id));

-- ---- expense_items --------------------------------------------------------
drop policy if exists expense_items_all on public.expense_items;
create policy expense_items_all on public.expense_items for all
  using (public.can_access_expense(expense_id)) with check (public.can_access_expense(expense_id));

-- ---- expense_item_shares --------------------------------------------------
drop policy if exists expense_item_shares_all on public.expense_item_shares;
create policy expense_item_shares_all on public.expense_item_shares for all
  using (public.can_access_item(item_id)) with check (public.can_access_item(item_id));

-- ---- expense_shares -------------------------------------------------------
drop policy if exists expense_shares_all on public.expense_shares;
create policy expense_shares_all on public.expense_shares for all
  using (public.can_access_expense(expense_id)) with check (public.can_access_expense(expense_id));

-- ---- expense_payers -------------------------------------------------------
drop policy if exists expense_payers_all on public.expense_payers;
create policy expense_payers_all on public.expense_payers for all
  using (public.can_access_expense(expense_id)) with check (public.can_access_expense(expense_id));

-- ---- settlements ----------------------------------------------------------
drop policy if exists settlements_select on public.settlements;
create policy settlements_select on public.settlements for select
  using (public.is_group_member(group_id));

drop policy if exists settlements_write on public.settlements;
create policy settlements_write on public.settlements for all
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));

-- ---- activity_log (append-only) -------------------------------------------
drop policy if exists activity_select on public.activity_log;
create policy activity_select on public.activity_log for select
  using (public.is_group_member(group_id));

drop policy if exists activity_insert on public.activity_log;
create policy activity_insert on public.activity_log for insert
  with check (public.is_group_member(group_id) and actor = auth.uid());

-- ---- notifications --------------------------------------------------------
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert
  with check (user_id = auth.uid() or public.shares_group_with(user_id));

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete
  using (user_id = auth.uid());

-- =============================================================================
-- 7. GROUP BOOTSTRAP RPC (creates group + adds caller + seeds categories)
-- =============================================================================

create or replace function public.create_group(
  p_name          text,
  p_currency_code text default 'SGD',
  p_time_zone     text default 'Asia/Singapore'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.groups (name, currency_code, time_zone)
  values (p_name, p_currency_code, p_time_zone)
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id)
  values (v_group_id, auth.uid());

  insert into public.categories (group_id, name, icon, color, is_custom, sort_order) values
    (v_group_id, 'Food & drink',  'ti-tools-kitchen-2', '#F4948B', false, 1),
    (v_group_id, 'Groceries',     'ti-shopping-cart',   '#74E0A2', false, 2),
    (v_group_id, 'Transport',     'ti-car',             '#6BC8D6', false, 3),
    (v_group_id, 'Rent',          'ti-home',            '#9C9CF0', false, 4),
    (v_group_id, 'Utilities',     'ti-bulb',            '#E0B35B', false, 5),
    (v_group_id, 'Entertainment', 'ti-device-tv',       '#D199E8', false, 6),
    (v_group_id, 'Travel',        'ti-plane',           '#7FB5F0', false, 7),
    (v_group_id, 'Shopping',      'ti-shopping-bag',    '#F0A6C0', false, 8),
    (v_group_id, 'Health',        'ti-heartbeat',       '#8FE0B0', false, 9),
    (v_group_id, 'Other',         'ti-dots',            '#9A9AA2', false, 10);

  return v_group_id;
end;
$fn$;

grant execute on function public.create_group(text, text, text) to authenticated;

-- =============================================================================
-- 8. REALTIME (optional) — lets the app receive live updates
-- =============================================================================

do $rt$
declare t text;
begin
  foreach t in array array[
    'profiles','groups','group_members','categories','recurring_templates',
    'expenses','expense_items','expense_item_shares','expense_shares','expense_payers',
    'settlements','activity_log','notifications'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;  -- already in publication, or publication missing
    end;
  end loop;
end
$rt$;

-- =============================================================================
-- DONE. Remember (enforce in the app when saving an expense):
--   SUM(expense_shares.amount)  per expense == expenses.total_amount   (owing side)
--   SUM(expense_payers.amount_paid) per expense == expenses.total_amount  (paying side)
-- The balance engine reads both sides: each person's net on an expense is
-- (amount_paid − amount_owed); see Section 6.1 of the plan.
-- =============================================================================
