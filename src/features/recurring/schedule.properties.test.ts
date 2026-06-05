import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { nextDuePeriod, nextOccurrence, type ScheduleTemplate } from './schedule'

const RUNS = { numRuns: 500 }

function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const genISO = fc.integer({ min: 0, max: 1000 }).map((n) => addDaysISO('2025-01-01', n))

const genTemplate: fc.Arbitrary<ScheduleTemplate> = fc.record({
  frequency: fc.constantFrom('weekly' as const, 'biweekly' as const, 'monthly' as const, 'yearly' as const),
  anchorDay: fc.option(fc.integer({ min: 1, max: 31 }), { nil: null }),
  startDate: genISO,
  endDate: fc.option(genISO, { nil: null }),
  lastPostedPeriod: fc.option(genISO, { nil: null }),
  active: fc.boolean(),
})

describe('recurring scheduler invariants', () => {
  it('NEVER surfaces a future period (the core §10 rule)', () => {
    fc.assert(
      fc.property(genTemplate, genISO, (t, today) => {
        const due = nextDuePeriod(t, today)
        if (due !== null) expect(due <= today).toBe(true)
      }),
      RUNS,
    )
  })

  it('the next occurrence is after the last posted period, on/after start, and within the end date', () => {
    fc.assert(
      fc.property(genTemplate, (t) => {
        const occ = nextOccurrence(t)
        if (occ !== null) {
          expect(occ >= t.startDate).toBe(true)
          if (t.lastPostedPeriod !== null) expect(occ > t.lastPostedPeriod).toBe(true)
          if (t.endDate !== null) expect(occ <= t.endDate).toBe(true)
        }
      }),
      RUNS,
    )
  })

  it('advancing the period strictly increases the next occurrence (catch-up converges)', () => {
    fc.assert(
      fc.property(genTemplate, (t) => {
        const occ = nextOccurrence(t)
        if (occ !== null) {
          const next = nextOccurrence({ ...t, lastPostedPeriod: occ })
          if (next !== null) expect(next > occ).toBe(true)
        }
      }),
      RUNS,
    )
  })

  it('an inactive template is never due', () => {
    fc.assert(
      fc.property(genTemplate, genISO, (t, today) => {
        if (nextDuePeriod({ ...t, active: false }, today) !== null) throw new Error('inactive template was due')
      }),
      RUNS,
    )
  })
})
