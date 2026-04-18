import { useState } from 'react'
import { useUpsertDrug } from '../../hooks/useDrugs'

const CATEGORIES = ['Anti-Inflammatories', 'Antibiotics', 'Tranquilizers', 'Miscellaneous', 'Supplements']
const FREQUENCIES = ['SID', 'BID', 'TID', 'TID-QID']

const empty = {
  name: '', category: 'Anti-Inflammatories', form: 'tablet',
  low_dose_mg_per_kg: '', high_dose_mg_per_kg: '',
  dose_strategy: 'B',
  prn_low_dose_mg_per_kg: '', prn_high_dose_mg_per_kg: '',
  frequency: 'BID', duration_days: 14, week2: true,
  tablet_sizes: [], concentration_mg_per_ml: '',
  patient_instructions: '', sort_order: 0,
}

const STRATEGIES = [
  { value: 'A', label: 'A — Closest to low dose (conservative)' },
  { value: 'B', label: 'B — Closest to midpoint (balanced)' },
  { value: 'C', label: 'C — Closest to high dose (aggressive)' },
]

export default function DrugForm({ drug, onClose }) {
  const [form, setForm] = useState(drug ? {
    ...drug,
    tablet_sizes: drug.tablet_sizes ?? [],
    concentration_mg_per_ml: drug.concentration_mg_per_ml ?? '',
    patient_instructions: drug.patient_instructions ?? '',
    dose_strategy: drug.dose_strategy ?? 'B',
    prn_low_dose_mg_per_kg:  drug.prn_low_dose_mg_per_kg  ?? '',
    prn_high_dose_mg_per_kg: drug.prn_high_dose_mg_per_kg ?? '',
  } : empty)
  const [newSize, setNewSize] = useState('')
  const [error, setError] = useState('')
  const upsert = useUpsertDrug()

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function setCheck(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.checked }))
  }

  function addSize() {
    const n = parseFloat(newSize)
    if (!isNaN(n) && n > 0 && !form.tablet_sizes.includes(n)) {
      setForm(f => ({ ...f, tablet_sizes: [...f.tablet_sizes, n].sort((a, b) => a - b) }))
      setNewSize('')
    }
  }

  function removeSize(s) {
    setForm(f => ({ ...f, tablet_sizes: f.tablet_sizes.filter(x => x !== s) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.form !== 'liquid' && form.tablet_sizes.length === 0) {
      setError('Add at least one tablet/capsule size.')
      return
    }
    if (form.form === 'liquid' && !form.concentration_mg_per_ml) {
      setError('Concentration is required for liquid drugs.')
      return
    }
    try {
      await upsert.mutateAsync({
        ...form,
        low_dose_mg_per_kg: parseFloat(form.low_dose_mg_per_kg),
        high_dose_mg_per_kg: parseFloat(form.high_dose_mg_per_kg),
        dose_strategy: form.dose_strategy || 'B',
        prn_low_dose_mg_per_kg:  form.prn_low_dose_mg_per_kg  ? parseFloat(form.prn_low_dose_mg_per_kg)  : null,
        prn_high_dose_mg_per_kg: form.prn_high_dose_mg_per_kg ? parseFloat(form.prn_high_dose_mg_per_kg) : null,
        duration_days: parseInt(form.duration_days),
        sort_order: parseInt(form.sort_order) || 0,
        concentration_mg_per_ml: form.form === 'liquid' ? parseFloat(form.concentration_mg_per_ml) : null,
        tablet_sizes: form.form !== 'liquid' ? form.tablet_sizes : null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">{drug ? 'Edit Drug' : 'Add Drug'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drug name</label>
            <input required value={form.name} onChange={set('name')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Category + Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={set('category')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
              <select value={form.form} onChange={set('form')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="liquid">Liquid</option>
              </select>
            </div>
          </div>

          {/* Tablet sizes or concentration */}
          {form.form !== 'liquid' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available {form.form === 'capsule' ? 'capsule' : 'tablet'} sizes (mg)
              </label>
              <div className="flex gap-2 mb-2">
                <input type="number" min="0" step="any" value={newSize} onChange={e => setNewSize(e.target.value)}
                  placeholder="e.g. 100"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={addSize}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tablet_sizes.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 text-sm">
                    {s}mg
                    <button type="button" onClick={() => removeSize(s)} className="text-blue-400 hover:text-blue-700 leading-none">×</button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concentration (mg/mL)</label>
              <input type="number" min="0" step="any" required value={form.concentration_mg_per_ml} onChange={set('concentration_mg_per_ml')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {/* Dose range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low dose (mg/kg)</label>
              <input type="number" min="0" step="any" required value={form.low_dose_mg_per_kg} onChange={set('low_dose_mg_per_kg')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">High dose (mg/kg)</label>
              <input type="number" min="0" step="any" required value={form.high_dose_mg_per_kg} onChange={set('high_dose_mg_per_kg')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Dose strategy — only relevant when low ≠ high */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dose selection strategy
              <span className="ml-1 text-xs text-gray-400 font-normal">(when low ≠ high)</span>
            </label>
            <div className="space-y-1">
              {STRATEGIES.map(s => (
                <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="dose_strategy" value={s.value}
                    checked={form.dose_strategy === s.value}
                    onChange={set('dose_strategy')}
                    className="accent-blue-700" />
                  <span className="text-sm text-gray-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* PRN escalation dose */}
          <div className="border border-gray-200 rounded p-3 space-y-3">
            <p className="text-sm font-medium text-gray-700">PRN escalation dose <span className="text-xs text-gray-400 font-normal">(optional — for as-needed dose increase)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">PRN low dose (mg/kg)</label>
                <input type="number" min="0" step="any" value={form.prn_low_dose_mg_per_kg} onChange={set('prn_low_dose_mg_per_kg')}
                  placeholder="leave blank if none"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">PRN high dose (mg/kg)</label>
                <input type="number" min="0" step="any" value={form.prn_high_dose_mg_per_kg} onChange={set('prn_high_dose_mg_per_kg')}
                  placeholder="leave blank if none"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Frequency + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select value={form.frequency} onChange={set('frequency')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input type="number" min="1" required value={form.duration_days} onChange={set('duration_days')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Week 2 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.week2} onChange={setCheck('week2')} className="accent-blue-700 w-4 h-4" />
            <span className="text-sm text-gray-700">Continue into Week 2</span>
          </label>

          {/* Patient instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient instructions (appears in letter)</label>
            <textarea rows={3} value={form.patient_instructions} onChange={set('patient_instructions')}
              placeholder="e.g. orally with food twice (2x) daily. This is a non-steroidal anti-inflammatory..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={upsert.isPending}
              className="flex-1 py-2 rounded text-sm text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: '#1a365d' }}>
              {upsert.isPending ? 'Saving…' : 'Save drug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
