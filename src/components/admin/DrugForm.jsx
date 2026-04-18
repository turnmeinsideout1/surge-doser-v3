import { useState, useMemo } from 'react'
import { useUpsertDrug } from '../../hooks/useDrugs'
import { calcDrug } from '../../lib/doseCalc'
import {
  SECTION_LABELS,
  SECTION_GROUPS,
  GROUP_LABELS,
  SECTION_ORDER,
  isGroupValidForSection,
  normalizeDrugSection,
  normalizeDrugGroup,
} from '../../lib/medicationConfig'

const FREQUENCIES = ['SID', 'BID', 'TID', 'TID-QID']

const STRATEGIES = [
  { value: 'A', label: 'A — Closest to low dose (conservative)' },
  { value: 'B', label: 'B — Closest to midpoint (balanced)' },
  { value: 'C', label: 'C — Closest to high dose (aggressive)' },
]

const empty = {
  name: '',
  section:   'discharge',
  group_key: 'antibiotics',
  form:      'tablet',
  low_dose_mg_per_kg: '', high_dose_mg_per_kg: '',
  dose_strategy: 'B',
  prn_low_dose_mg_per_kg: '', prn_high_dose_mg_per_kg: '',
  frequency: 'BID', duration_days: 14, week2: true,
  tablet_sizes: [], concentration_mg_per_ml: '',
  patient_instructions: '',
  route: '', default_timing: '',
  instruction_template_plain: '', instruction_template_html: '',
  sort_order: 0,
}

export default function DrugForm({ drug, onClose }) {
  const [form, setForm] = useState(drug ? {
    ...empty,
    ...drug,
    section:   normalizeDrugSection(drug),
    group_key: normalizeDrugGroup(drug),
    tablet_sizes:               drug.tablet_sizes               ?? [],
    concentration_mg_per_ml:    drug.concentration_mg_per_ml    ?? '',
    patient_instructions:       drug.patient_instructions       ?? '',
    dose_strategy:              drug.dose_strategy              ?? 'B',
    prn_low_dose_mg_per_kg:     drug.prn_low_dose_mg_per_kg     ?? '',
    prn_high_dose_mg_per_kg:    drug.prn_high_dose_mg_per_kg    ?? '',
    route:                      drug.route                      ?? '',
    default_timing:             drug.default_timing             ?? '',
    instruction_template_plain: drug.instruction_template_plain ?? '',
    instruction_template_html:  drug.instruction_template_html  ?? '',
  } : empty)

  const [newSize, setNewSize]         = useState('')
  const [error, setError]             = useState('')
  const [previewWeight, setPreviewWeight] = useState('20')
  const upsert = useUpsertDrug()

  // ── Live template preview ────────────────────────────────────────────────
  const preview = useMemo(() => {
    const wKg = parseFloat(previewWeight)
    const low  = parseFloat(form.low_dose_mg_per_kg)
    const high = parseFloat(form.high_dose_mg_per_kg)
    if (!wKg || isNaN(wKg) || !low || isNaN(low) || !high || isNaN(high)) return null

    // Build a minimal drug object that calcDrug understands
    const drugProxy = {
      ...form,
      low_dose_mg_per_kg:      low,
      high_dose_mg_per_kg:     high,
      concentration_mg_per_ml: form.form === 'liquid' ? parseFloat(form.concentration_mg_per_ml) || null : null,
      tablet_sizes:            form.form !== 'liquid' ? form.tablet_sizes : null,
      dose_strategy:           form.dose_strategy || 'B',
    }

    let result
    try { result = calcDrug(drugProxy, wKg) } catch { return null }

    const lowMg    = result.lowMg  ?? 0
    const highMg   = result.highMg ?? 0
    const targetMg = Math.abs(lowMg - highMg) < 0.001 ? lowMg : (lowMg + highMg) / 2

    const doseRate = Math.abs(low - high) < 0.0001
      ? String(low)
      : `${low}–${high}`

    const ctx = {
      drugName:           form.name           || '',
      doseRate,
      doseUnit:           'mg/kg',
      route:              form.route          || '',
      timing:             form.default_timing || '',
      calculatedDose:     targetMg.toFixed(2),
      calculatedDoseUnit: 'mg',
      concentration:      form.concentration_mg_per_ml ? `${form.concentration_mg_per_ml} mg/mL` : '',
      volume:             form.form === 'liquid' && result.suggestion ? result.suggestion : '',
      quantity:           form.form !== 'liquid' && result.suggestion ? result.suggestion : '',
      weight:             `${wKg.toFixed(2)} kg`,
      patientName: '', procedure: '', surgeryDate: '',
    }

    function interpolate(tmpl) {
      return tmpl
        .replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? '')
        .replace(/ {2,}/g, ' ')
        .replace(/ ([.,])/g, '$1')
        .trim()
    }

    // Default formats (mirrors anesthesiaGen defaults)
    const routePart  = form.route          ? ` ${form.route}`          : ''
    const timingPart = form.default_timing ? ` ${form.default_timing}` : ''
    const volumePart = form.form === 'liquid' && result.suggestion ? ` / ${result.suggestion}` : ''
    const defaultPlain = `${form.name || '[drug name]'}: ${doseRate} mg/kg${routePart}${timingPart} = ${targetMg.toFixed(2)} mg total${volumePart}.`
    const defaultHtml  = defaultPlain.replace(/^([^:]+):/, '<strong>$1:</strong>')

    return {
      plain: form.instruction_template_plain ? interpolate(form.instruction_template_plain) : defaultPlain,
      html:  form.instruction_template_html  ? interpolate(form.instruction_template_html)  : defaultHtml,
      usingDefault: !form.instruction_template_plain && !form.instruction_template_html,
    }
  }, [
    previewWeight,
    form.name, form.form,
    form.low_dose_mg_per_kg, form.high_dose_mg_per_kg,
    form.concentration_mg_per_ml, form.tablet_sizes, form.dose_strategy,
    form.route, form.default_timing,
    form.instruction_template_plain, form.instruction_template_html,
  ])

  const isDischarge  = form.section === 'discharge'
  const isAnesthesia = form.section === 'anesthesia'

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function setCheck(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.checked }))
  }

  function handleSectionChange(e) {
    const section = e.target.value
    const firstGroup = SECTION_GROUPS[section]?.[0] ?? ''
    setForm(f => ({ ...f, section, group_key: firstGroup }))
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

    if (!isGroupValidForSection(form.section, form.group_key)) {
      setError('The selected group does not match the section. Please re-select the group.')
      return
    }
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
        // Keep category non-null until the DB constraint is dropped (legacy compat)
        category: form.category || form.group_key || 'Uncategorized',
        low_dose_mg_per_kg:  parseFloat(form.low_dose_mg_per_kg),
        high_dose_mg_per_kg: parseFloat(form.high_dose_mg_per_kg),
        dose_strategy:       form.dose_strategy || 'B',
        prn_low_dose_mg_per_kg:  form.prn_low_dose_mg_per_kg  ? parseFloat(form.prn_low_dose_mg_per_kg)  : null,
        prn_high_dose_mg_per_kg: form.prn_high_dose_mg_per_kg ? parseFloat(form.prn_high_dose_mg_per_kg) : null,
        duration_days:           parseInt(form.duration_days),
        sort_order:              parseInt(form.sort_order) || 0,
        concentration_mg_per_ml: form.form === 'liquid' ? parseFloat(form.concentration_mg_per_ml) : null,
        tablet_sizes:            form.form !== 'liquid' ? form.tablet_sizes : null,
        route:                   form.route          || null,
        default_timing:          form.default_timing || null,
        instruction_template_plain: form.instruction_template_plain || null,
        instruction_template_html:  form.instruction_template_html  || null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">{drug ? 'Edit Drug' : 'Add Drug'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Drug name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drug name</label>
            <input required value={form.name} onChange={set('name')} className={inputCls} />
          </div>

          {/* Section + Group */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select value={form.section} onChange={handleSectionChange} className={inputCls}>
                {SECTION_ORDER.map(s => (
                  <option key={s} value={s}>{SECTION_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <select value={form.group_key} onChange={set('group_key')} className={inputCls}>
                {(SECTION_GROUPS[form.section] ?? []).map(g => (
                  <option key={g} value={g}>{GROUP_LABELS[g]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Form (tablet / capsule / liquid) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
            <select value={form.form} onChange={set('form')} className={inputCls}>
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="liquid">Liquid</option>
            </select>
          </div>

          {/* Tablet sizes or concentration */}
          {form.form !== 'liquid' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available {form.form === 'capsule' ? 'capsule' : 'tablet'} sizes (mg)
              </label>
              <div className="flex gap-2 mb-2">
                <input type="number" min="0" step="any" value={newSize}
                  onChange={e => setNewSize(e.target.value)}
                  placeholder="e.g. 100"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={addSize}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tablet_sizes.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 text-sm">
                    {s}mg
                    <button type="button" onClick={() => removeSize(s)}
                      className="text-blue-400 hover:text-blue-700 leading-none">×</button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concentration (mg/mL)</label>
              <input type="number" min="0" step="any" required
                value={form.concentration_mg_per_ml}
                onChange={set('concentration_mg_per_ml')}
                className={inputCls} />
            </div>
          )}

          {/* Dose range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low dose (mg/kg)</label>
              <input type="number" min="0" step="any" required
                value={form.low_dose_mg_per_kg} onChange={set('low_dose_mg_per_kg')}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">High dose (mg/kg)</label>
              <input type="number" min="0" step="any" required
                value={form.high_dose_mg_per_kg} onChange={set('high_dose_mg_per_kg')}
                className={inputCls} />
            </div>
          </div>

          {/* Dose strategy */}
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

          {/* PRN escalation */}
          <div className="border border-gray-200 rounded p-3 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              PRN escalation dose
              <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">PRN low dose (mg/kg)</label>
                <input type="number" min="0" step="any"
                  value={form.prn_low_dose_mg_per_kg} onChange={set('prn_low_dose_mg_per_kg')}
                  placeholder="leave blank if none"
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">PRN high dose (mg/kg)</label>
                <input type="number" min="0" step="any"
                  value={form.prn_high_dose_mg_per_kg} onChange={set('prn_high_dose_mg_per_kg')}
                  placeholder="leave blank if none"
                  className={inputCls} />
              </div>
            </div>
          </div>

          {/* Discharge-specific fields */}
          {isDischarge && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={set('frequency')} className={inputCls}>
                    {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input type="number" min="1" required
                    value={form.duration_days} onChange={set('duration_days')}
                    className={inputCls} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.week2} onChange={setCheck('week2')}
                  className="accent-blue-700 w-4 h-4" />
                <span className="text-sm text-gray-700">Continue into Week 2</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient instructions <span className="text-xs text-gray-400 font-normal">(appears in discharge letter)</span>
                </label>
                <textarea rows={3} value={form.patient_instructions} onChange={set('patient_instructions')}
                  placeholder="e.g. orally with food twice (2x) daily. This is a non-steroidal anti-inflammatory…"
                  className={`${inputCls} resize-none`} />
              </div>
            </>
          )}

          {/* Anesthesia-specific fields */}
          {isAnesthesia && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route <span className="text-xs text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input value={form.route} onChange={set('route')}
                    placeholder="e.g. IM, IV, SQ"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default timing <span className="text-xs text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input value={form.default_timing} onChange={set('default_timing')}
                    placeholder="e.g. pre-op, to effect"
                    className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* Shared: route/timing for discharge too (optional) */}
          {isDischarge && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <input value={form.route} onChange={set('route')}
                  placeholder="e.g. PO, IM"
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default timing <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <input value={form.default_timing} onChange={set('default_timing')}
                  placeholder="e.g. with food"
                  className={inputCls} />
              </div>
            </div>
          )}

          {/* Custom output templates (both sections) */}
          <div className="border border-gray-200 rounded p-3 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Custom output templates
              <span className="text-xs text-gray-400 font-normal ml-1">
                (optional — overrides default formatting)
              </span>
            </p>
            <p className="text-xs text-gray-400">
              Tokens: {'{drugName}'} {'{doseRate}'} {'{doseUnit}'} {'{route}'} {'{timing}'}
              {' '}{'{calculatedDose}'} {'{calculatedDoseUnit}'} {'{concentration}'} {'{volume}'} {'{quantity}'}
              {' '}{'{weight}'} {'{procedure}'} {'{patientName}'}
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plain text template</label>
              <textarea rows={2} value={form.instruction_template_plain}
                onChange={set('instruction_template_plain')}
                placeholder="e.g. {drugName}: {doseRate} {doseUnit} {route} {timing} = {calculatedDose} mg total."
                className={`${inputCls} resize-none font-mono text-xs`} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">HTML template</label>
              <textarea rows={2} value={form.instruction_template_html}
                onChange={set('instruction_template_html')}
                placeholder="e.g. <strong>{drugName}:</strong> {doseRate} {doseUnit} {route} {timing} = <strong>{calculatedDose} mg</strong> total."
                className={`${inputCls} resize-none font-mono text-xs`} />
            </div>

            {/* Live preview */}
            <div className="pt-1 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">
                  Preview
                  {preview?.usingDefault && (
                    <span className="ml-1 font-normal text-gray-400">(default format)</span>
                  )}
                </p>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-gray-400">Sample weight</label>
                  <input
                    type="number" min="1" step="1"
                    value={previewWeight}
                    onChange={e => setPreviewWeight(e.target.value)}
                    className="w-16 border border-gray-200 rounded px-2 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <span className="text-xs text-gray-400">kg</span>
                </div>
              </div>

              {preview ? (
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded px-3 py-2">
                    <p className="text-xs text-gray-400 mb-0.5">Plain text</p>
                    <p className="text-sm text-gray-700">{preview.plain}</p>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-2">
                    <p className="text-xs text-gray-400 mb-0.5">Formatted</p>
                    <p
                      className="text-sm text-gray-700"
                      dangerouslySetInnerHTML={{ __html: preview.html }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Fill in drug name, dose, and concentration to see a preview.
                </p>
              )}
            </div>
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
