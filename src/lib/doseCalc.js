import { tabletLookup, prnLookup } from './tabletLookup'

/**
 * Calculate dose suggestion for a single drug given weight in kg.
 * Returns a result object used by the letter generator and the calcs panel.
 *
 * V3 rules:
 *  - Tablet, low === high  → FLOOR (never exceed target)
 *  - Tablet, low !== high  → configs within range, pick by strategy A/B/C
 *  - Liquid                → target mg determined by strategy, then mg ÷ concentration
 *  - PRN (optional)        → midpoint of PRN range, closest config within that range
 */
export function calcDrug(drug, weightKg) {
  const lowMg  = drug.low_dose_mg_per_kg  * weightKg
  const highMg = drug.high_dose_mg_per_kg * weightKg
  const strategy = drug.dose_strategy || 'B'

  // --- Liquid ---
  if (drug.form === 'liquid') {
    const conc = drug.concentration_mg_per_ml
    const targetMg = lowMg === highMg ? lowMg
      : strategy === 'A' ? lowMg
      : strategy === 'C' ? highMg
      : (lowMg + highMg) / 2

    const out = {
      lowMg, highMg,
      suggestion: (targetMg / conc).toFixed(2) + ' mL',
      conc: `${conc}mg/mL`,
    }

    if (drug.prn_low_dose_mg_per_kg && drug.prn_high_dose_mg_per_kg) {
      const prnLowMg  = drug.prn_low_dose_mg_per_kg  * weightKg
      const prnHighMg = drug.prn_high_dose_mg_per_kg * weightKg
      const prnMl = ((prnLowMg + prnHighMg) / 2) / conc
      out.prn = prnMl.toFixed(2) + ' mL'
    }

    return out
  }

  // --- Tablet ---
  const canSplit = drug.form !== 'capsule'
  const result = tabletLookup(drug.tablet_sizes, lowMg, highMg, strategy, canSplit)

  const out = {
    lowMg, highMg,
    suggestion: result.warning ? null : result.instruction,
    warning:     result.warning     ?? false,
    fallback:    result.fallback?.instruction    ?? null,
    alternative: result.alternative?.instruction ?? null,
  }

  if (drug.prn_low_dose_mg_per_kg && drug.prn_high_dose_mg_per_kg) {
    const prnLowMg  = drug.prn_low_dose_mg_per_kg  * weightKg
    const prnHighMg = drug.prn_high_dose_mg_per_kg * weightKg
    const prn = prnLookup(drug.tablet_sizes, prnLowMg, prnHighMg, canSplit)
    out.prn = prn.instruction
    out.prnWarning = prn.warning ?? false
  }

  return out
}
