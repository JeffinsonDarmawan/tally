/**
 * Sample data for the Phase 0 design-system preview ONLY.
 * The real dashboard (Phase 4) reads live balances from the engine (Phase 2).
 */
export interface SamplePerson {
  id: string
  name: string
  color: string
}

export interface SampleBalance {
  person: SamplePerson
  /** Net from your perspective: positive = they owe you, negative = you owe them. */
  net: number
  daysUnpaid: number | null
}

export const SAMPLE_BALANCES: SampleBalance[] = [
  { person: { id: 'emma', name: 'Emma', color: '#74E0A2' }, net: 42.0, daysUnpaid: 3 },
  { person: { id: 'leo', name: 'Leo', color: '#F4948B' }, net: -33.34, daysUnpaid: 9 },
  { person: { id: 'mia', name: 'Mia', color: '#E0B35B' }, net: 18.5, daysUnpaid: 1 },
  { person: { id: 'sam', name: 'Sam', color: '#6BC8D6' }, net: 0, daysUnpaid: null },
]
