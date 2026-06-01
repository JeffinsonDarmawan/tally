/**
 * Integer-cents money helpers for the balance engine.
 *
 * All engine math runs in integer cents to avoid floating-point drift, then converts
 * back to dollars at the edges. Splits are distributed so they sum EXACTLY to the total
 * (brief §6.5): largest fractional remainder first, ties broken by earliest index.
 */

/** Convert decimal dollars (numeric(12,2)) to integer cents. */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/** Convert integer cents back to decimal dollars. */
export function fromCents(cents: number): number {
  return cents / 100
}

/**
 * Distribute `totalCents` across buckets proportional to `weights`, summing exactly to
 * `totalCents`. Leftover cents go to the largest fractional remainders first; ties break
 * by earliest index, so the result is fully deterministic. Zero total weight → equal split.
 */
export function distribute(totalCents: number, weights: number[]): number[] {
  const n = weights.length
  if (n === 0) return []

  let sumW = weights.reduce((a, b) => a + b, 0)
  let effective = weights
  if (sumW === 0) {
    effective = weights.map(() => 1)
    sumW = n
  }

  const base: number[] = new Array(n)
  const remainders: { index: number; frac: number }[] = []
  let allocated = 0

  for (let i = 0; i < n; i++) {
    const exact = (totalCents * effective[i]) / sumW
    // Epsilon nudge so a mathematically-integer value never floors down (e.g. 4999.9999999).
    const b = Math.floor(exact + 1e-9)
    base[i] = b
    allocated += b
    remainders.push({ index: i, frac: Math.max(0, exact - b) })
  }

  const leftover = totalCents - allocated
  remainders.sort((a, b) => b.frac - a.frac || a.index - b.index)
  for (let k = 0; k < leftover; k++) {
    base[remainders[k].index] += 1
  }

  return base
}

/** Split a total into `n` equal parts, with deterministic leftover-cent distribution. */
export function splitEqual(totalCents: number, n: number): number[] {
  return distribute(totalCents, new Array(n).fill(1))
}
