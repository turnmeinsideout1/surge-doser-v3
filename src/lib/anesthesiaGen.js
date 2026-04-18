/**
 * Anesthesia instruction generator.
 *
 * Produces { html, text } from selected anesthesia drugs + pre-calculated results.
 *
 * Output is grouped by phase (pre_op → peri_op → post_op).
 *
 * Per-drug formatting:
 *   1. If drug.instruction_template_html / instruction_template_plain are set,
 *      interpolate template tokens and use them.
 *   2. Otherwise fall back to the default formatter:
 *      "{Drug Name}: {doseRate} mg/kg {route} {timing} = {calculatedDose} mg total[ / {volume}]."
 *
 * Supported template tokens:
 *   {drugName} {doseRate} {doseUnit} {route} {timing}
 *   {calculatedDose} {calculatedDoseUnit} {concentration} {volume} {quantity}
 *   {weight} {procedure} {surgeryDate} {patientName}
 */

import { SECTION_GROUPS, GROUP_LABELS } from './medicationConfig'

// ---------------------------------------------------------------------------
// Token interpolation
// ---------------------------------------------------------------------------

function interpolate(template, ctx) {
  return template
    .replace(/\{(\w+)\}/g, (_, key) => ctx[key] ?? '')
    // Collapse runs of spaces that can appear when an optional token is empty
    .replace(/ {2,}/g, ' ')
    // Remove space before punctuation
    .replace(/ ([.,])/g, '$1')
    .trim()
}

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

function buildContext(drug, result, weightKg, patient) {
  const lowMg  = result.lowMg  ?? 0
  const highMg = result.highMg ?? 0
  const targetMg = Math.abs(lowMg - highMg) < 0.001
    ? lowMg
    : (lowMg + highMg) / 2

  const doseRate = Math.abs(
    (drug.low_dose_mg_per_kg ?? 0) - (drug.high_dose_mg_per_kg ?? 0)
  ) < 0.0001
    ? String(drug.low_dose_mg_per_kg ?? 0)
    : `${drug.low_dose_mg_per_kg}–${drug.high_dose_mg_per_kg}`

  return {
    drugName:           drug.name,
    doseRate,
    doseUnit:           'mg/kg',
    route:              drug.route          ?? '',
    timing:             drug.default_timing ?? '',
    calculatedDose:     targetMg.toFixed(2),
    calculatedDoseUnit: 'mg',
    concentration:      drug.concentration_mg_per_ml
                          ? `${drug.concentration_mg_per_ml} mg/mL`
                          : '',
    volume:             drug.form === 'liquid' && result.suggestion
                          ? result.suggestion
                          : '',
    quantity:           drug.form !== 'liquid' && result.suggestion
                          ? result.suggestion
                          : '',
    weight:             `${weightKg.toFixed(2)} kg`,
    patientName:        patient?.patientName  ?? '',
    procedure:          patient?.procedure    ?? '',
    surgeryDate:        patient?.surgeryDate  ?? '',
  }
}

// ---------------------------------------------------------------------------
// Default formatters
// ---------------------------------------------------------------------------

function defaultLinePlain(drug, result, weightKg) {
  const lowMg  = result.lowMg  ?? 0
  const highMg = result.highMg ?? 0
  const targetMg = Math.abs(lowMg - highMg) < 0.001
    ? lowMg
    : (lowMg + highMg) / 2

  const doseRate = Math.abs(
    (drug.low_dose_mg_per_kg ?? 0) - (drug.high_dose_mg_per_kg ?? 0)
  ) < 0.0001
    ? drug.low_dose_mg_per_kg
    : `${drug.low_dose_mg_per_kg}–${drug.high_dose_mg_per_kg}`

  const routePart  = drug.route          ? ` ${drug.route}`          : ''
  const timingPart = drug.default_timing ? ` ${drug.default_timing}` : ''
  const volumePart = drug.form === 'liquid' && result.suggestion
    ? ` / ${result.suggestion}`
    : ''

  return `${drug.name}: ${doseRate} mg/kg${routePart}${timingPart} = ${targetMg.toFixed(2)} mg total${volumePart}.`
}

function defaultLineHtml(drug, result, weightKg) {
  // Build from plain and apply minimal bold markup
  const plain = defaultLinePlain(drug, result, weightKg)
  // Bold the drug name (everything before the first colon)
  return plain.replace(/^([^:]+):/, '<strong>$1:</strong>')
}

// ---------------------------------------------------------------------------
// Public generator
// ---------------------------------------------------------------------------

/**
 * @param {object}   patient        - { patientName, procedure, surgeryDate, weightLbs }
 * @param {object[]} anesthesiaDrugs - drugs filtered to section='anesthesia'
 * @param {object}   results        - { [drugId]: calcDrug result }
 * @param {number}   weightKg
 * @returns {{ html: string, text: string }}
 */
export function generateAnesthesiaOutput(patient, anesthesiaDrugs, results, weightKg) {
  const groupOrder = SECTION_GROUPS.anesthesia // ['pre_op', 'peri_op', 'post_op']

  // Build phase→drugs map, preserving group order and skipping empty groups
  const grouped = {}
  for (const g of groupOrder) {
    const items = anesthesiaDrugs.filter(d => (d.group_key ?? '') === g)
    if (items.length) grouped[g] = items
  }

  if (Object.keys(grouped).length === 0) return { html: '', text: '' }

  let html = `<strong>ANESTHESIA MEDS</strong>`
  let text = `ANESTHESIA MEDS`

  for (const [groupKey, drugs] of Object.entries(grouped)) {
    const label = GROUP_LABELS[groupKey]
    html += `<br><br><strong>${label}</strong><br>`
    text += `\n\n${label}\n`

    for (const drug of drugs) {
      const result = results[drug.id]
      if (!result) continue

      const ctx = buildContext(drug, result, weightKg, patient)

      const textLine = drug.instruction_template_plain
        ? interpolate(drug.instruction_template_plain, ctx)
        : defaultLinePlain(drug, result, weightKg)

      const htmlLine = drug.instruction_template_html
        ? interpolate(drug.instruction_template_html, ctx)
        : defaultLineHtml(drug, result, weightKg)

      html += `• ${htmlLine}<br>`
      text += `- ${textLine}\n`
    }
  }

  return { html, text: text.trimEnd() }
}
