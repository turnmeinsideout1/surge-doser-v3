import { useState } from 'react'
import { useDeactivateDrug } from '../../hooks/useDrugs'
import {
  SECTION_ORDER,
  SECTION_LABELS,
  SECTION_GROUPS,
  GROUP_LABELS,
  normalizeDrugSection,
  normalizeDrugGroup,
} from '../../lib/medicationConfig'
import DrugForm from './DrugForm'

export default function DrugTable({ drugs, isAdmin }) {
  const [editing, setEditing] = useState(null)
  const deactivate = useDeactivateDrug()

  // Build: section → group → drugs
  const sectionsWithContent = SECTION_ORDER
    .map(sectionKey => {
      const groups = SECTION_GROUPS[sectionKey]
        .map(groupKey => {
          const items = drugs.filter(d =>
            normalizeDrugSection(d) === sectionKey &&
            normalizeDrugGroup(d)   === groupKey
          )
          return { groupKey, items }
        })
        .filter(g => g.items.length > 0)
      return { sectionKey, groups }
    })
    .filter(s => s.groups.length > 0)

  const multiSection = sectionsWithContent.length > 1

  return (
    <>
      {sectionsWithContent.map(({ sectionKey, groups }) => (
        <div key={sectionKey} className="mb-8">
          {multiSection && (
            <h2 className="text-base font-bold text-gray-700 mb-4 pb-1 border-b border-gray-300">
              {SECTION_LABELS[sectionKey]}
            </h2>
          )}

          {groups.map(({ groupKey, items }) => (
            <div key={groupKey} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {GROUP_LABELS[groupKey]}
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Drug</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Form</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Dose (mg/kg)</th>
                      {sectionKey === 'discharge' ? (
                        <>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Freq</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Days</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Wk2</th>
                        </>
                      ) : (
                        <>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Route</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">Timing</th>
                        </>
                      )}
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                      {isAdmin && <th className="px-4 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(drug => (
                      <tr key={drug.id} className={drug.active ? '' : 'opacity-40'}>
                        <td className="px-4 py-2 font-medium text-gray-800">{drug.name}</td>
                        <td className="px-4 py-2 text-gray-600 capitalize">
                          {drug.form === 'liquid'
                            ? `Liquid (${drug.concentration_mg_per_ml} mg/mL)`
                            : drug.form === 'capsule'
                              ? `Capsule [${(drug.tablet_sizes || []).join(', ')}mg]`
                              : `Tablet [${(drug.tablet_sizes || []).join(', ')}mg]`}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {drug.low_dose_mg_per_kg}–{drug.high_dose_mg_per_kg}
                        </td>
                        {sectionKey === 'discharge' ? (
                          <>
                            <td className="px-4 py-2 text-gray-600">{drug.frequency}</td>
                            <td className="px-4 py-2 text-gray-600">{drug.duration_days}</td>
                            <td className="px-4 py-2 text-gray-600">{drug.week2 ? '✓' : '—'}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2 text-gray-600">{drug.route || '—'}</td>
                            <td className="px-4 py-2 text-gray-600">{drug.default_timing || '—'}</td>
                          </>
                        )}
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${drug.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {drug.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-2">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditing(drug)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                              <button
                                onClick={() => deactivate.mutate({ id: drug.id, active: !drug.active })}
                                className="text-gray-500 hover:text-gray-700 text-xs font-medium">
                                {drug.active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}

      {editing && <DrugForm drug={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
