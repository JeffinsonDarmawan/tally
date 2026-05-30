# Project Brief: "Tally" — A Group Bill-Splitting App

> **Instructions for Claude Code:** This is the full specification for the app I want you to build. Read the entire document before writing any code. Build it in the **phases** in Section 12, one phase at a time, and pause for my review between phases.
>
> **MANDATORY:** Before writing or editing *any* frontend UI (components, pages, styling, layout), you must **invoke the `frontend-design` skill** and follow it. Re-invoke it at the start of every phase that touches the UI and whenever you create a new screen or major component. The look of this app matters as much as the logic.

---

## 1. What we're building

A private web app for **me and 4 friends (5 users total)** to split bills, track who owes whom, mark debts as paid, and review past spending. Conceptually similar to **Splid / Splitwise / Tricount**, tailored to the exact behavior below.

**Guiding principles:** free to run, lightweight, genuinely useful, and beautiful. No feature creep beyond this spec.

---

## 2. Tech stack (free & lightweight at this scale)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React + TypeScript + Vite** | Fast, small, modern |
| Styling | **Tailwind CSS** | Pairs with the `frontend-design` skill; easy dark theme via tokens |
| Routing | **react-router** | Simple client routing |
| Charts | **Recharts** | Clean charts for the summary pages |
| Dates | **date-fns** | Lightweight date math |
| PDF/CSV export | **client-side** (e.g. `jspdf` + a tiny CSV helper) | Free, no server |
| PWA | **vite-plugin-pwa** | Installable, offline app shell |
| Backend + DB + Auth + file storage | **Supabase** (Postgres + Auth + RLS + Storage) | Free tier, shared data, real auth, receipt image storage |
| Hosting | **Vercel** or **Cloudflare Pages** (frontend) + Supabase | Free at this scale |

**Cost at 5 users:** effectively $0. **Single currency** for v1 (one configurable constant). Keep dependencies minimal.

---

## 3. Design direction (read alongside the `frontend-design` skill)

**Locked direction:** friendly card-based layout (warm charcoal, rounded-square avatars, soft tinted stat cards) with **bold, confident numbers** for the net-balance hero and all summary figures. Minimalist, sleek, uncluttered, dark mode, modern type.

**Design tokens (starting point; refine via the design skill):**

- **Backgrounds:** base `#0D0D11`, surface/card `#16161C`, elevated `#1F1F26`, hairline border `#23232B`.
- **Text:** primary `#F2F2F4`, secondary `#9A9AA2`, muted `#6B6B74`.
- **Semantic money colors (muted):**
  - *Owed to you* — text `#74E0A2`, soft tint card bg `#11241B`.
  - *You owe* — text `#F4948B`, soft tint card bg `#26161A`.
  - *Neutral/settled* — muted gray.
- **Accent:** calm indigo `#9C9CF0` for primary actions / focus (used sparingly).
- **Avatars:** **rounded-square ("squircle") tiles**, ~`14px` radius, one consistent color per person, used everywhere that person appears (lists, chips, charts).
- **Typography:** modern variable sans — **Inter**, **Geist**, or **Satoshi**. Body uses friendly medium weights; the **net-balance hero and summary headline numbers use heavy weight (600–700), tight tracking, large size**. **All money/numbers use tabular figures** (`font-variant-numeric: tabular-nums`). Optional sparing use of uppercase, letter-spaced micro-labels for section headers.
- **Shape & spacing:** 4px scale, generous padding, `14–18px` rounded corners on cards, hairline borders, minimal soft shadows.
- **Motion:** subtle `150–200ms` ease. No bounce.
- **Layout:** mobile-first. Bottom tab bar on mobile; top nav / sidebar on desktop.

**Quality bar:** every screen needs designed empty, loading, and error states. No raw unstyled data rows — especially not on summary pages.

---

## 4. Users, group & auth

- One shared group containing the 5 of us. (Schema should *allow* multiple groups later, but v1 UI deals with one.)
- **Auth:** Supabase Auth with **email magic link**. On first sign-in, create/link a `profile`.
- **Profiles:** display name, avatar color (used consistently across charts/chips), optional image.
- The app always renders **from the logged-in user's perspective** ("you"); never make me figure out which person I am.
- **Security:** Postgres **Row-Level Security** so only authenticated group members can read/write the group's data.

---

## 5. Data model (Supabase / Postgres)

UUID primary keys, `created_at` / `updated_at`, sensible FKs, and RLS policies.

```
profiles
  id (uuid, = auth.users.id)
  display_name
  avatar_color
  created_at

groups
  id
  name
  currency_code            -- single currency for v1
  created_at

group_members
  group_id -> groups.id
  user_id  -> profiles.id
  (composite pk)

categories
  id
  group_id
  name
  icon                     -- icon name/emoji (icon picker in UI)
  color
  is_custom                -- user-created vs seeded default
  sort_order
  -- seed a default set on group creation; full CRUD in settings

expenses
  id
  group_id
  paid_by                  -> profiles.id      -- nullable: PRIMARY payer, for display only (canonical = expense_payers)
  date
  category_id
  total_amount             -- numeric(12,2) == SUM(expense_shares.amount)
  split_method             -- enum: 'by_item' | 'equal' | 'uneven' | 'shares' | 'percentage'
  extra_charges            -- jsonb: [{label:'GST', amount:7.20, mode:'proportional'|'equal'}]
  note
  receipt_url              -- nullable; Supabase Storage path (photo attach, NO OCR in v1)
  recurring_template_id    -- nullable; set when posted from a recurring template
  created_by               -> profiles.id
  created_at, updated_at

expense_items               -- only when split_method = 'by_item'
  id
  expense_id
  name
  amount

expense_item_shares         -- which people split a given item (equally)
  item_id -> expense_items.id
  user_id -> profiles.id

expense_shares              -- CANONICAL ledger, OWING side: final amount each person owes
  expense_id
  user_id
  amount                   -- SUM over an expense == total_amount

expense_payers              -- CANONICAL ledger, PAYING side: how much each person actually paid
  expense_id
  user_id
  amount_paid              -- SUM over an expense == total_amount; usually one row (single payer)
  -- The balance engine reads expense_shares (owing) + expense_payers (paying).
  -- For the common single-payer case the app just writes one expense_payers row.

settlements                 -- "I paid you back" records (mark as paid)
  id
  group_id
  from_user                -> profiles.id
  to_user                  -> profiles.id
  amount
  date
  note
  created_at

recurring_templates
  id
  group_id
  name
  category_id
  paid_by                  -> profiles.id
  frequency                -- 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  amount_mode              -- 'fixed' | 'variable'
  default_amount           -- nullable
  split_method             -- same enum as expenses
  split_config             -- jsonb snapshot of members + per-person/item/share/% config
  anchor_day
  start_date, end_date     -- end_date nullable
  last_posted_period
  active
  created_at

activity_log                -- transparency feed
  id
  group_id
  actor                    -> profiles.id
  action_type              -- 'expense.created' | 'expense.edited' | 'expense.deleted'
                           --  | 'settlement.created' | 'recurring.confirmed'
                           --  | 'reminder.sent' | 'member.added' | ...
  target_type, target_id
  summary                  -- human-readable line for the feed
  metadata                 -- jsonb
  created_at

notifications               -- lightweight in-app notifications
  id
  user_id                  -> profiles.id   -- recipient
  type                     -- 'added_to_expense' | 'settled_with_you' | 'recurring_due' | 'reminder'
  message
  link                     -- optional deep link
  read
  created_at
```

**Key rule:** `expense_shares` is the single source of truth for "who owes what." Whatever the split method, when an expense is saved you compute and persist one row per involved user, and `SUM(amount) == total_amount`. The engine never re-derives splits — it just sums these rows.

---

## 6. The balance / debt engine (get this exactly right)

Implement as **pure, unit-tested TypeScript functions** that take fetched rows and return balances. Do not scatter this logic across components.

### 6.1 Per-expense balance (supports one OR multiple payers)
Each expense has two sides: what each person **paid** (`expense_payers`) and what each person **owes** (`expense_shares`). For each expense `e`, every participant `i` has a net for that expense:
```
net_i(e) = paid_i(e) − owed_i(e)        (Σ net_i = 0, since Σ paid = Σ owed = total)
```
Within an expense, `net > 0` are **creditors** and `net < 0` are **debtors**. Convert this into pairwise debts by distributing each debtor's deficit across the creditors **in proportion to each creditor's surplus**. This yields clean per-pair edges and reduces *exactly* to the simple case when there's one payer (that payer is the sole creditor, owed every other share).
```
owe(A, B)      = Σ over all expenses of A's debt-edge toward B (from the distribution above)
raw_net(A, B)  = owe(A, B) − owe(B, A)
```
> **Worked example** — bill $100, split equally 3 ways ($33.33 / $33.33 / $33.34). Emma paid $90, Leo paid $10, you paid $0.
> Nets: Emma +$56.67 (only creditor), Leo −$23.33, you −$33.34.
> Result: Leo owes Emma $23.33, you owe Emma $33.34. (Leo still owes despite paying $10 — correct, because he owed more than he paid.)

### 6.2 Apply settlements
```
paid(A, B)     = Σ settlements.amount where from_user = A and to_user = B
net(A, B)      = raw_net(A, B) − paid(A, B) + paid(B, A)
```
- `net(A, B) > 0` → **A owes B**. `< 0` → **B owes A** `|net|`.

### 6.3 Dashboard totals for the current user `me`
For each friend `f`, compute `net(me, f)`.
- **Total I owe** = Σ positive nets. **Total I'm owed** = Σ |negative nets|. Show the **per-friend breakdown**.

### 6.4 Unpaid count & days-unpaid — FIFO
Settlements are aggregate, so apply repayments **oldest-first**:
1. For pair (debtor `D`, creditor `C`), build chronological debt items: each expense's debt-edge from `D` to `C` (per 6.1) → `(date, amount)`, oldest→newest.
2. Compute net amount `D` settled toward `C` (clamp ≥ 0).
3. Subtract that amount from the list **oldest item first**.
4. Items not fully covered are **"unpaid."**
- **Unpaid count** = unpaid items involving `me`. **Days unpaid** = `today − oldest_unpaid_item.date`. Symmetric for both parties.

### 6.5 Rounding
Splits must sum **exactly** to the total; distribute leftover cents deterministically (stable ordering). Unit-test this.

### 6.6 Debt simplification (for the "Simplify debts" toggle — Section 11)
Implement a pure function that takes everyone's net balances and returns the **minimal set of transfers** that zeroes the group out (greedy min-cash-flow: repeatedly match the largest creditor with the largest debtor). This powers the optional simplified settle-up view. It must NOT alter stored balances — it's a presentation layer over the same `net()` values.

### 6.7 Clock
Pick one **group time zone** (configurable) for "days unpaid" and for "current month" boundaries, so figures are consistent across members in different zones.

---

## 7. Dashboard (home page `/`)

Top to bottom:
1. **Net balance hero** — big bold number (you're owed / you owe overall), in the C-style heavy figure treatment.
2. **Two tinted stat cards** — *You're owed* (green tint) and *You owe* (coral tint).
3. **Unpaid transactions** stat — tappable to a filtered list.
4. **Per-friend balances** — default view, one rounded-square avatar row per friend with net + days-unpaid; tap → friend detail / settle-up. A **toggle** switches to the **simplified settle-up view** (Section 11); default is the detailed per-friend view.
5. **Pending recurring** prompts (if any are due) — Section 10.
6. **Recent activity (current month)** — clean list of this month's transactions involving me (I paid for others / others paid for me): category icon, who paid (show "Emma +1" when a bill had several payers), amount, my share, date, paid/unpaid indicator.
7. **Prominent "＋ Add expense"** — FAB on mobile / primary button on desktop.

---

## 8. Add Expense flow (core feature)

Focused multi-step modal/sheet.

### Step 1 — Basics
Date (default today), category, total amount, optional note, **optional receipt photo** (upload to Supabase Storage; image attach only, no OCR).

### Step 1b — Who paid (one or more payers)
Record **who paid** the bill — a side that's separate from who *owes* it. The default is a **single payer** (me, selectable to any of the 5), so the common case stays one tap. A **"Split the payment"** toggle lets you record **multiple payers**, each with the amount they put in (e.g. Emma $90, Leo $10); show a live "remaining vs total" and require the contributions to sum to `total_amount`. Stored in `expense_payers` (one row per payer).

### Step 2 — Who's involved
**Select involved members** (default all 5, must be deselectable). Only involved members can receive a share.

### Step 3 — How to split (5 modes)
Segmented control:

**A) By ITEMS.** Add line items (name + cost); for each item pick which involved people share it (split equally among them). A person's share = sum across items.
- **Extra charges (tax / tip / service):** support adding labeled charges (e.g. GST, service charge, tip) that are **auto-allocated** — *proportional* to each person's item subtotal by default, or *equal* split, per charge. `total_amount = Σ items + Σ extra_charges`. Validate items + charges reconcile to the total.

**B) EQUAL.** Split total equally among involved members (rounding rule 6.5).

**C) UNEVEN / exact.** Enter the exact amount each person owes; show live "remaining vs total"; block save until it reconciles.

**D) SHARES (weighted).** Assign integer weights per person (e.g. a couple = 2, a single = 1); split total in proportion to weights (rounding rule).

**E) PERCENTAGE.** Assign a % per person; must sum to 100%; split accordingly.

### Save
Validate `SUM(expense_shares.amount) == total_amount` **and** `SUM(expense_payers.amount_paid) == total_amount`; write expense + payers + shares atomically; log to `activity_log`; notify involved members; return to dashboard.

**Edit & delete** supported (with confirmation); recompute balances; log the edit/delete to `activity_log` and notify (Splid users specifically want to know when a transaction is deleted).

---

## 9. Summary pages (`/summary`)

Toggle **Month / Year** with a period selector. A designed, visual report (Recharts + cards), not a table. Include:
- **Header:** total spent, transaction count, my net for the period (bold figures).
- **Spending by category** — donut + legend with percentages.
- **Who paid** — proportion fronted by each person (per-person colors).
- **Payment timeline** — spending across the period (days in a month / months in a year).
- **Settled vs pending** — visual of paid vs outstanding + a short list of pending items with days-unpaid.
- **Top expenses** — a few largest, nicely presented.
- **Export** — download the current period as **CSV and PDF** (client-side; free).

Designed empty states for periods with no data.

---

## 10. Recurring payments (`/recurring`)

For rent, utilities, subscriptions, etc.

### Template
Name, category, default payer, frequency (weekly/biweekly/monthly/yearly), **amount mode** (`fixed` like rent / `variable` like utilities), optional default amount, split config (any of the 5 split modes + involved members), start date, optional end date, anchor day.

### Critical behavior — DO NOT post future expenses
- **Future, not-yet-occurred recurring payments must NOT appear in balances or totals** (posting them early misrepresents spending). This is a deliberate, important design choice — see rationale below.
- When a period **comes due** (`next_due_date <= today`), surface a **pending recurring prompt** on the dashboard and recurring page. Compute pending instances on the fly from the template + `last_posted_period`; do **not** persist a real expense until I confirm.
- **Confirm:** fixed → amount prefilled, just confirm; **variable → I must enter the actual amount** before it posts. On confirm → create a real `expenses` row with the template's split config and confirmed amount/date, write `expense_shares`, set `recurring_template_id`, advance the period, log to `activity_log`, notify.
- **Skip/dismiss** a due instance (advance without posting). Define a **backlog rule** (catch-up prompts vs auto-skip after N missed periods) and handle the anchor day in short months (e.g. the 31st in February).
- Editing a template affects **future** instances only.

> **Design rationale (for Claude Code):** competitors auto-post recurring expenses on schedule, which inflates balances with money that hasn't actually moved and breaks for fluctuating bills. Confirm-before-posting (and requiring a real amount for variable bills) keeps the ledger accurate. Build it this way intentionally.

---

## 11. Settling up, reminders & "mark as paid"

- From a friend's balance card, **"Settle up"** records a repayment → insert `settlements` (`from_user`, `to_user`, `amount`, `date`, note). Reduces the debt immediately and **symmetrically** on both members' views (shared data). Log to `activity_log`; notify the recipient.
- Support **partial** and **full** settlements (prefill exact outstanding). Overpayment flips into a credit — handle gracefully and explain it in the UI.
- After settling, recompute via the engine; FIFO (6.4) updates unpaid items and **days-unpaid** (visible to both parties, same number).
- **Simplify-debts toggle:** an optional view (dashboard + a "settle up" screen) that uses 6.6 to show the **minimal set of transfers** to zero the whole group. Default remains the detailed per-friend view (preserves who-owed-whom clarity); the toggle is opt-in.
- **Payment reminders:** a one-tap **"Remind"** on an outstanding debt that (a) creates a `notification` for the debtor and (b) drafts a friendly prefilled message I can copy/share ("you've owed Sam $12.50 for 9 days"). Gentle, no nagging. Logged as `reminder.sent`.

---

## 12. Build phases (in order; pause for review after each)

> Invoke the `frontend-design` skill at the start of every UI phase (0, 3, 4, 5, 6, 7, 8, 9).

- **Phase 0 — Scaffold & design system.** Vite + React + TS + Tailwind + react-router + Supabase client + `vite-plugin-pwa`. Build the locked dark theme tokens + type scale (Section 3) and a component kit (button, card, tinted stat card, list row, modal/sheet, segmented control, rounded-square avatar/chip, icon picker). Styled app shell with bottom-tab nav.
- **Phase 1 — Auth, members & categories.** Magic-link login, profiles, single group, membership, seeded + **custom categories with icons (CRUD)**. RLS.
- **Phase 2 — Schema & balance engine.** Finalize schema (Section 5). Implement the engine (Section 6) with **unit tests**: pairwise net, settlements, FIFO unpaid/days, rounding, **weighted & percentage splits**, **tax/tip allocation**, **multiple payers (net = paid − owed, surplus-proportional distribution)**, **debt simplification**. Do this before dependent screens.
- **Phase 3 — Add Expense flow.** Section 8: basics + receipt photo, **who paid (single or multiple payers)**, involved selection, all 5 split modes incl. tax/tip; validation; save; edit/delete.
- **Phase 4 — Dashboard.** Section 7, including the simplify-debts toggle.
- **Phase 5 — Settle up, reminders, activity log & notifications.** Sections 11 + the `activity_log` feed + in-app `notifications`.
- **Phase 6 — Recurring payments.** Section 10 (no-future-posting; variable confirmation; backlog/anchor rules).
- **Phase 7 — History page.** Full expense list with **search, filter (date/category/member/paid-unpaid/amount), sort**, and **bulk select → recategorize/delete**.
- **Phase 8 — Summary pages.** Section 9 charts + **CSV/PDF export**.
- **Phase 9 — Polish & deploy.** Empty/loading/error states, **finalize PWA (installable, offline shell)**, responsive + a11y pass, deploy (Vercel/Cloudflare Pages) + Supabase. README with setup/run/deploy + Supabase config.

---

## 13. Acceptance checklist (definition of done)

- [ ] 5 of us sign in (magic link) and see the same shared, live data, always from "my" perspective.
- [ ] Dashboard: net hero, owed/owe tiles, unpaid count, per-friend breakdown, simplify-debts toggle, pending recurring, this-month activity.
- [ ] Add Expense: set date/category/total/note + optional receipt photo; **set who paid (single or multiple payers, contributions summing to total)**; select involved members; **by-item (with tax/tip auto-split), equal, uneven, shares (weighted), percentage**. Shares always sum to total.
- [ ] Settle up reduces debt for both parties; partial + full + overpayment handled; reminders create a notification + draft message.
- [ ] Each debt shows **days unpaid**, identical on both sides.
- [ ] Recurring: **future periods never appear in balances/totals**; due periods prompt confirmation; **variable bills require a real amount**; fixed confirm fast; skip + backlog handled.
- [ ] History page: search, filter, sort, bulk recategorize/delete.
- [ ] Activity log records add/edit/delete/settle/recurring/reminder; deletes are visible to others.
- [ ] Summary toggles month/year with category / who-paid / timeline / settled-vs-pending visuals; CSV + PDF export work.
- [ ] Custom categories with icons; installable PWA (offline shell).
- [ ] Engine unit tests pass (incl. rounding, FIFO, weighted/%, tax/tip, simplification).
- [ ] Free to run, lightweight, deployed, README complete. UI matches the locked design and used the `frontend-design` skill throughout.

---

## 14. Scope decisions

**Out of scope for v1:** multi-currency / conversion, multiple groups in the UI, **receipt OCR** (photo attach only), and complex permission roles.

**Deliberately deferred (strong v2 candidates):** **PayNow / payment-link settle-up with prefilled QR** (excluded from v1 by choice — high value for a Singapore group, revisit in v2); push notifications beyond in-app/email basics.
