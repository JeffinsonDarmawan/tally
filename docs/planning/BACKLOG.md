# Backlog — future enhancements

Ideas intentionally **out of v1 scope** but worth building later. This is the living list; the
v1 build follows [`ROADMAP.md`](ROADMAP.md). Adding something here does **not** schedule it — it
records the intent so it isn't lost. Newest/most-wanted near the top.

> Source of truth for what v1 includes is [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) §14.

| # | Enhancement | Status | Notes |
|---|---|---|---|
| B1 | Receipt-photo OCR → auto-itemise | Proposed (2026-05-31) | Requested by owner. |
| B2 | PayNow / payment-link settle-up with prefilled QR | v2 candidate (from brief §14) | High value for a Singapore group. |
| B3 | Push notifications beyond in-app/email | v2 candidate (from brief §14) | |
| B4 | Multi-currency / conversion | Out of v1 scope (brief §14) | |
| B5 | Multiple groups in the UI | Out of v1 scope (brief §14) | Schema already allows it. |

---

## B1 — Receipt-photo OCR → auto-itemise
**Status:** Proposed · 2026-05-31 · requested by the owner.

**What:** When adding an expense, let me **photograph a bill/receipt** and have the app **read the
line items and prices automatically**, pre-filling the **by-item** split so I don't type each item.
I review/adjust, then save as normal.

**Why:** The by-item split is the most tedious entry path. v1 already supports attaching a receipt
photo (no OCR) and a full by-item splitter with tax/tip allocation — so this is a natural extension
that turns the photo from a record into a time-saver.

**Relationship to v1:**
- v1 is **photo-attach only, no OCR** (brief §8, §14) — deliberately, to keep it free and simple.
- This enhancement adds an **OCR/extraction step** that outputs candidate `expense_items`
  (`name`, `amount`) + detected tax/service charges, which flow into the existing by-item flow.
  Nothing about the canonical ledger changes — it's an input accelerator.

**Sketch of approach (revisit at design time):**
- Image already lands in Supabase Storage (v1). Run OCR on it to get raw text/blocks.
- Parse line items + totals; map detected GST/service/tip into the existing **extra_charges**
  mechanism (proportional/equal) rather than as line items.
- Always show an **editable review step** before saving — OCR is a suggestion, the human confirms.
- Reconcile to the bill total using the same validation as manual by-item entry.

**Cost/feasibility note:** true OCR usually means a paid/cloud vision API or an on-device model,
which can break the “free to run” guarantee. Evaluate options (free tiers, on-device, or
owner-supplied API key) when this is scheduled. Keep it strictly optional.

**Effort:** Medium–Large (new extraction pipeline + review UI + reconciliation).

---

## B2–B5 — carried from the brief
These are recorded in [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) §14 and restated here so the backlog is
the single place to scan future work:

- **B2 — PayNow / payment-link settle-up with prefilled QR.** Generate a payment QR/link prefilled
  with the outstanding amount when settling up. Excluded from v1 by choice; high value for SG.
- **B3 — Push notifications** beyond the v1 in-app/email basics (e.g. web push / mobile).
- **B4 — Multi-currency / conversion.** v1 is single-currency (one configurable constant).
- **B5 — Multiple groups in the UI.** The schema already supports multiple groups; v1's UI handles
  exactly one.
