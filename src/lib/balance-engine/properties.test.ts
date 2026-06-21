import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { distribute, splitEqual } from './money'
import { computeShares, sumCents, type CentShares } from './splits'
import { expenseEdges } from './netting'
import { computeBalances, dashboardTotals, type ExpenseSides, type SettlementInput } from './balances'
import { simplifyDebts } from './simplify'
import { pairUnpaid, type DatedExpense } from './fifo'

// Property-based tests: each runs hundreds of randomized inputs and asserts an invariant
// that must ALWAYS hold. fast-check shrinks any failure to a minimal counterexample.

const RUNS = { numRuns: 400 }
const POOL = ['a', 'b', 'c', 'd', 'e'] as const

const genUsers = fc.uniqueArray(fc.constantFrom(...POOL), { minLength: 2, maxLength: 5 })
const genTotal = fc.integer({ min: 1, max: 5_000_00 })
const genW5 = fc.array(fc.integer({ min: 0, max: 200 }), { minLength: 5, maxLength: 5 })

function toRecord(users: readonly string[], parts: number[]): CentShares {
  const r: CentShares = {}
  users.forEach((u, i) => (r[u] = parts[i]))
  return r
}

const genBalancedExpense = fc
  .tuple(genUsers, genTotal, genW5, genW5)
  .map(([users, total, wp, wo]): ExpenseSides => ({
    paid: toRecord(users, distribute(total, users.map((_, i) => wp[i]))),
    owed: toRecord(users, distribute(total, users.map((_, i) => wo[i]))),
  }))

const genExpenses = fc.array(genBalancedExpense, { maxLength: 6 })
function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const genDate = fc.integer({ min: 0, max: 730 }).map((n) => addDaysISO('2025-01-01', n))
const genDatedExpenses = fc.array(
  fc.tuple(genBalancedExpense, genDate).map(([e, date]): DatedExpense => ({ ...e, date })),
  { maxLength: 6 },
)
const genSettlements = fc.array(
  fc
    .record({
      from: fc.constantFrom(...POOL),
      to: fc.constantFrom(...POOL),
      amountCents: fc.integer({ min: 0, max: 300_00 }),
    })
    .filter((s) => s.from !== s.to) as fc.Arbitrary<SettlementInput>,
  { maxLength: 5 },
)

describe('money.distribute', () => {
  it('always sums to the total, preserves length, and is non-negative', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 8 }), (total, weights) => {
        const parts = distribute(total, weights)
        expect(parts.length).toBe(weights.length)
        expect(parts.reduce((a, b) => a + b, 0)).toBe(total)
        expect(parts.every((p) => p >= 0)).toBe(true)
      }),
      RUNS,
    )
  })

  it('is deterministic', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 8 }), (total, weights) => {
        expect(distribute(total, weights)).toEqual(distribute(total, [...weights]))
      }),
      RUNS,
    )
  })

  it('splitEqual parts differ by at most one cent', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), fc.integer({ min: 1, max: 12 }), (total, n) => {
        const parts = splitEqual(total, n)
        expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1)
        expect(parts.reduce((a, b) => a + b, 0)).toBe(total)
      }),
      RUNS,
    )
  })
})

describe('splits.computeShares reconcile exactly to the total', () => {
  it('equal', () => {
    fc.assert(fc.property(genTotal, genUsers, (total, users) => {
      expect(sumCents(computeShares({ method: 'equal', totalCents: total, involved: users }))).toBe(total)
    }), RUNS)
  })

  it('weighted shares', () => {
    fc.assert(fc.property(genTotal, genUsers, genW5, (total, users, w5) => {
      const weights = toRecord(users, users.map((_, i) => w5[i]))
      fc.pre(sumCents(weights) > 0)
      expect(sumCents(computeShares({ method: 'shares', totalCents: total, weights }))).toBe(total)
    }), RUNS)
  })

  it('percentage', () => {
    fc.assert(fc.property(genTotal, genUsers, genW5, (total, users, w5) => {
      const percentages = toRecord(users, users.map((_, i) => w5[i]))
      fc.pre(sumCents(percentages) > 0)
      expect(sumCents(computeShares({ method: 'percentage', totalCents: total, percentages }))).toBe(total)
    }), RUNS)
  })

  it('by_item (items + auto-allocated charges)', () => {
    const genItem = fc.record({ amount: fc.integer({ min: 1, max: 50_00 }), mask: fc.array(fc.boolean(), { minLength: 5, maxLength: 5 }) })
    const genCharge = fc.record({ amount: fc.integer({ min: 0, max: 20_00 }), mode: fc.constantFrom('proportional' as const, 'equal' as const) })
    fc.assert(
      fc.property(genUsers, fc.array(genItem, { minLength: 1, maxLength: 6 }), fc.array(genCharge, { maxLength: 3 }), (users, rawItems, charges) => {
        const items = rawItems.map((it) => {
          const sharers = users.filter((_, i) => it.mask[i])
          return { amount: it.amount, sharers: sharers.length ? sharers : [users[0]] }
        })
        const total = items.reduce((s, i) => s + i.amount, 0) + charges.reduce((s, c) => s + c.amount, 0)
        expect(sumCents(computeShares({ method: 'by_item', involved: users, items, extraCharges: charges }))).toBe(total)
      }),
      RUNS,
    )
  })
})

describe('netting.expenseEdges', () => {
  it('conserve money exactly, pay each debtor exactly, and attribute creditors within the proportional-rounding bound', () => {
    fc.assert(
      fc.property(genUsers, genTotal, genW5, genW5, (users, total, wp, wo) => {
        const paid = toRecord(users, distribute(total, users.map((_, i) => wp[i])))
        const owed = toRecord(users, distribute(total, users.map((_, i) => wo[i])))
        const edges = expenseEdges(paid, owed)
        const numDebtors = users.filter((u) => (paid[u] ?? 0) - (owed[u] ?? 0) < 0).length

        for (const u of users) {
          const net = (paid[u] ?? 0) - (owed[u] ?? 0)
          const incoming = edges.filter((e) => e.to === u).reduce((s, e) => s + e.amountCents, 0)
          const outgoing = edges.filter((e) => e.from === u).reduce((s, e) => s + e.amountCents, 0)
          // Debtors (and settled users) are exact; creditors are within ≤1¢ per co-payer
          // (proportional integer rounding — brief §6.1). The grand total is always conserved.
          if (net <= 0) expect(incoming - outgoing).toBe(net)
          else expect(Math.abs(incoming - net)).toBeLessThanOrEqual(numDebtors)
        }
        const edgeSum = edges.reduce((s, e) => s + e.amountCents, 0)
        const deficit = users.reduce((s, u) => s + Math.max(0, (owed[u] ?? 0) - (paid[u] ?? 0)), 0)
        expect(edgeSum).toBe(deficit) // money conserved exactly
        expect(edges.every((e) => e.amountCents > 0 && e.from !== e.to)).toBe(true)
      }),
      RUNS,
    )
  })
})

describe('balances', () => {
  it('net is antisymmetric: net(a,b) + net(b,a) === 0', () => {
    fc.assert(fc.property(genExpenses, genSettlements, (expenses, settlements) => {
      const { net } = computeBalances(expenses, settlements)
      for (const a of POOL) for (const b of POOL) expect(net(a, b) + net(b, a)).toBe(0)
    }), RUNS)
  })

  it('dashboard overall net === −Σ per-friend nets', () => {
    fc.assert(fc.property(genExpenses, genSettlements, (expenses, settlements) => {
      const t = dashboardTotals('a', ['b', 'c', 'd', 'e'], expenses, settlements)
      expect(t.overallNetCents + t.perFriend.reduce((s, f) => s + f.netCents, 0)).toBe(0)
      expect(t.totalImOwedCents - t.totalIOweCents).toBe(t.overallNetCents)
      expect(t.totalIOweCents).toBeGreaterThanOrEqual(0)
      expect(t.totalImOwedCents).toBeGreaterThanOrEqual(0)
    }), RUNS)
  })
})

describe('simplify.simplifyDebts', () => {
  const genBalanced = genUsers.chain((users) =>
    fc.array(fc.integer({ min: -100_000, max: 100_000 }), { minLength: users.length - 1, maxLength: users.length - 1 }).map((vals) => {
      const rec: Record<string, number> = {}
      users.slice(0, -1).forEach((u, i) => (rec[u] = vals[i]))
      const sum = vals.reduce((a, b) => a + b, 0)
      rec[users[users.length - 1]] = sum === 0 ? 0 : -sum // avoid -0
      return rec
    }),
  )

  it('satisfies every net, conserves cash, uses only positive transfers, and is minimal', () => {
    fc.assert(
      fc.property(genBalanced, (balances) => {
        const transfers = simplifyDebts(balances)
        for (const u of Object.keys(balances)) {
          const incoming = transfers.filter((t) => t.to === u).reduce((s, t) => s + t.amountCents, 0)
          const outgoing = transfers.filter((t) => t.from === u).reduce((s, t) => s + t.amountCents, 0)
          expect(incoming - outgoing).toBe(balances[u])
        }
        expect(transfers.every((t) => t.amountCents > 0 && t.from !== t.to)).toBe(true)
        const moved = transfers.reduce((s, t) => s + t.amountCents, 0)
        const owedTotal = Object.values(balances).reduce((s, v) => s + Math.max(0, v), 0)
        expect(moved).toBe(owedTotal)
        const nonzero = Object.values(balances).filter((v) => v !== 0).length
        expect(transfers.length).toBeLessThanOrEqual(Math.max(0, nonzero - 1))
      }),
      RUNS,
    )
  })
})

describe('fifo.pairUnpaid', () => {
  it('total = Σ items, ≤ |net|, direction matches sign, items oldest-first; = |net| with no settlements', () => {
    fc.assert(
      fc.property(genDatedExpenses, genSettlements, (expenses, settlements) => {
        const { net } = computeBalances(expenses, settlements)
        for (const me of POOL) for (const f of POOL) {
          if (me === f) continue
          const pu = pairUnpaid(me, f, expenses, settlements)
          const itemsSum = pu.items.reduce((s, i) => s + i.amountCents, 0)
          expect(pu.totalCents).toBe(itemsSum)
          expect(pu.totalCents).toBeLessThanOrEqual(Math.abs(net(me, f)))
          const n = net(me, f)
          expect(pu.direction).toBe(n > 0 ? 'you_owe' : n < 0 ? 'they_owe' : 'settled')
          if (n === 0) expect(pu.totalCents).toBe(0)
          for (let i = 1; i < pu.items.length; i++) expect(pu.items[i].date >= pu.items[i - 1].date).toBe(true)
        }
      }),
      RUNS,
    )
  })

  it('equals |net| exactly when there are no settlements', () => {
    fc.assert(
      fc.property(genDatedExpenses, (expenses) => {
        const { net } = computeBalances(expenses, [])
        for (const me of POOL) for (const f of POOL) {
          if (me === f) continue
          expect(pairUnpaid(me, f, expenses, []).totalCents).toBe(Math.abs(net(me, f)))
        }
      }),
      RUNS,
    )
  })
})
