import {
  SECTION_ORDER,
  SECTION_LABELS,
  SECTION_GROUPS,
  GROUP_LABELS,
  normalizeDrugSection,
  normalizeDrugGroup,
} from '../../lib/medicationConfig'

export default function DrugCheckboxes({ drugs, selected, onChange }) {
  function toggle(id) {
    onChange(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Build: section → group → drugs (only active drugs, respecting display order)
  const sectionsWithContent = SECTION_ORDER
    .map(sectionKey => {
      const groups = SECTION_GROUPS[sectionKey]
        .map(groupKey => {
          const items = drugs.filter(d =>
            d.active &&
            normalizeDrugSection(d) === sectionKey &&
            normalizeDrugGroup(d)   === groupKey
          )
          return { groupKey, items }
        })
        .filter(g => g.items.length > 0)
      return { sectionKey, groups }
    })
    .filter(s => s.groups.length > 0)

  if (sectionsWithContent.length === 0) return null

  const multiSection = sectionsWithContent.length > 1

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-5 space-y-5">
      {sectionsWithContent.map(({ sectionKey, groups }) => (
        <div key={sectionKey}>
          {multiSection && (
            <h2 className="font-bold text-gray-800 text-sm mb-3 pb-1.5 border-b border-gray-200">
              {SECTION_LABELS[sectionKey]}
            </h2>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4">
            {groups.map(({ groupKey, items }) => (
              <div key={groupKey}>
                <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-2">
                  {GROUP_LABELS[groupKey]}
                </h3>
                {items.map(drug => (
                  <label key={drug.id} className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={selected.includes(drug.id)}
                      onChange={() => toggle(drug.id)}
                      className="mt-0.5 accent-blue-700 w-4 h-4 shrink-0"
                    />
                    <span>{drug.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
