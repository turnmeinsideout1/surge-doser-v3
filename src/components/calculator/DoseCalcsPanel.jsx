import { useState } from 'react'

export default function DoseCalcsPanel({ drugs, results, weightKg }) {
  const [open, setOpen] = useState(false)

  if (!drugs.length) return null

  return (
    <>
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <input type="checkbox" checked={open} onChange={e => setOpen(e.target.checked)}
          className="accent-blue-700 w-4 h-4" />
        <span className="text-sm font-medium text-gray-700">Show Dosing Calculations</span>
      </label>

      {open && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-5 space-y-4">
          {drugs.map(drug => {
            const r = results[drug.id]
            if (!r) return null
            return (
              <div key={drug.id}>
                <p className="text-sm font-semibold text-gray-700 mb-1">{drug.name}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <span className="font-medium">Low dose:</span> {r.lowMg?.toFixed(1)} mg
                    <span className="text-gray-400 ml-1">({drug.low_dose_mg_per_kg} mg/kg)</span>
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <span className="font-medium">High dose:</span> {r.highMg?.toFixed(1)} mg
                    <span className="text-gray-400 ml-1">({drug.high_dose_mg_per_kg} mg/kg)</span>
                  </div>
                  <div className={`rounded px-2 py-1 ${r.warning ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <span className="font-medium">Suggestion:</span>{' '}
                    {r.warning ? (
                      <span className="text-red-600">
                        No config in range
                        {r.fallback    && <span className="block text-gray-600">Below: {r.fallback}</span>}
                        {r.alternative && <span className="block text-gray-600">Above: {r.alternative}</span>}
                      </span>
                    ) : (
                      r.suggestion || '—'
                    )}
                  </div>
                  {r.prn && (
                    <div className="bg-amber-50 rounded px-2 py-1 col-span-2 sm:col-span-3">
                      <span className="font-medium">PRN escalation:</span> {r.prn}
                      {r.prnWarning && <span className="text-red-500 ml-1">⚠</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
