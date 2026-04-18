const CATEGORY_ORDER = ['Anti-Inflammatories', 'Antibiotics', 'Tranquilizers', 'Miscellaneous', 'Supplements']

export default function DrugCheckboxes({ drugs, selected, onChange }) {
  // Group active drugs by category
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = drugs.filter(d => d.active && d.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  function toggle(id) {
    onChange(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-4">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="font-semibold text-gray-800 text-sm mb-3">{cat}</h3>
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
  )
}
