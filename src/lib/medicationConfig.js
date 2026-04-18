/**
 * Medication section and group constants.
 *
 * Sections:   discharge | anesthesia
 * Groups:     antibiotics | pain_medications | tranquilizers  (discharge)
 *             pre_op | peri_op | post_op                       (anesthesia)
 */

export const SECTION_LABELS = {
  discharge:  'Discharge meds',
  anesthesia: 'Anesthesia meds',
}

export const GROUP_LABELS = {
  antibiotics:      'Antibiotics',
  pain_medications: 'Pain medications',
  tranquilizers:    'Tranquilizers',
  pre_op:           'Pre-op meds',
  peri_op:          'Induction meds',
  post_op:          'Post-op meds',
}

/** Groups belonging to each section, in display order. */
export const SECTION_GROUPS = {
  discharge:  ['antibiotics', 'pain_medications', 'tranquilizers'],
  anesthesia: ['pre_op', 'peri_op', 'post_op'],
}

/** Top-level section display order. */
export const SECTION_ORDER = ['discharge', 'anesthesia']

/** All valid section values. */
export const VALID_SECTIONS = Object.keys(SECTION_GROUPS)

/** All valid group_key values. */
export const VALID_GROUPS = Object.values(SECTION_GROUPS).flat()

/**
 * Returns true when group_key is valid for the given section.
 */
export function isGroupValidForSection(section, groupKey) {
  return (SECTION_GROUPS[section] ?? []).includes(groupKey)
}

/**
 * Normalise section for a drug that may pre-date the migration.
 * Defaults to 'discharge' if section is null/undefined.
 */
export function normalizeDrugSection(drug) {
  return drug.section ?? 'discharge'
}

/**
 * Normalise group_key for a drug that may pre-date the migration.
 * Falls back to a category-based mapping so the UI stays usable
 * even if the migration has not yet been applied.
 */
export function normalizeDrugGroup(drug) {
  if (drug.group_key) return drug.group_key
  // Legacy fallback: map old category values
  switch (drug.category) {
    case 'Antibiotics':   return 'antibiotics'
    case 'Tranquilizers': return 'tranquilizers'
    default:              return 'pain_medications'
  }
}
