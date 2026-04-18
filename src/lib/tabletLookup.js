/**
 * Tablet lookup — V3 range-based logic.
 *
 * When low === high: FLOOR — largest config whose mg is at or below the target.
 * When low !== high: filter configs within [lowMg, highMg], then pick by strategy:
 *   A — closest to low  (smallest in range)
 *   B — closest to midpoint
 *   C — closest to high (largest in range)
 *
 * If no config falls within the range, returns a warning result with:
 *   fallback    — closest config below highMg (conservative option)
 *   alternative — nearest config above highMg (slightly outside range)
 *
 * PRN: filter within [prnLowMg, prnHighMg], pick closest to midpoint.
 *
 * Supported fractions: ¼ (low-end exception), ½, 1, 1½, 2, 3, 4
 * Capsules (canSplit=false): whole multiples only.
 */

const FRACTIONS = [
  { mult: 0.25, label: '¼' },   // low-end exception only
  { mult: 0.5,  label: '½' },
  { mult: 1,    label: '1' },
  { mult: 1.5,  label: '1½' },
  { mult: 2,    label: '2' },
  { mult: 3,    label: '3' },
  { mult: 4,    label: '4' },
]

const WHOLE_ONLY = FRACTIONS.filter(f => Number.isInteger(f.mult))

function buildEntries(tabletSizes, canSplit = true) {
  const fractions = canSplit ? FRACTIONS : WHOLE_ONLY
  const entries = []
  for (const size of tabletSizes) {
    for (const f of fractions) {
      const mg = size * f.mult
      const noun = f.mult <= 1 ? 'tablet' : 'tablets'
      entries.push({ mg, instruction: `${f.label} × ${size}mg ${noun}` })
    }
  }
  entries.sort((a, b) => a.mg - b.mg)
  return entries
}

function outOfRangeResult(entries, highMg) {
  const fallback    = [...entries].filter(e => e.mg <= highMg).at(-1) ?? null
  const alternative = entries.find(e => e.mg > highMg) ?? null
  return { warning: true, fallback, alternative }
}

export function tabletLookup(tabletSizes, lowMg, highMg, strategy = 'B', canSplit = true) {
  if (!tabletSizes || tabletSizes.length === 0) return outOfRangeResult([], highMg)

  const entries = buildEntries(tabletSizes, canSplit)

  // When low === high: FLOOR (never exceed target)
  if (Math.abs(lowMg - highMg) < 0.001) {
    const valid = entries.filter(e => e.mg <= lowMg)
    return valid.length ? valid[valid.length - 1] : outOfRangeResult(entries, highMg)
  }

  // When low !== high: filter to within range, then pick by strategy
  const inRange = entries.filter(e => e.mg >= lowMg && e.mg <= highMg)
  if (!inRange.length) return outOfRangeResult(entries, highMg)

  if (strategy === 'A') return inRange[0]
  if (strategy === 'C') return inRange[inRange.length - 1]

  // B: closest to midpoint
  const mid = (lowMg + highMg) / 2
  return inRange.reduce((best, curr) =>
    Math.abs(curr.mg - mid) < Math.abs(best.mg - mid) ? curr : best
  )
}

export function prnLookup(tabletSizes, prnLowMg, prnHighMg, canSplit = true) {
  if (!tabletSizes || tabletSizes.length === 0) {
    return { warning: true, instruction: 'No standard configuration within PRN dose range — consult veterinarian' }
  }

  const entries = buildEntries(tabletSizes, canSplit)
  const inRange = entries.filter(e => e.mg >= prnLowMg && e.mg <= prnHighMg)
  if (!inRange.length) {
    return { warning: true, instruction: 'No standard configuration within PRN dose range — consult veterinarian' }
  }

  const mid = (prnLowMg + prnHighMg) / 2
  return inRange.reduce((best, curr) =>
    Math.abs(curr.mg - mid) < Math.abs(best.mg - mid) ? curr : best
  )
}
