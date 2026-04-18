import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDrugs } from '../hooks/useDrugs'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabaseClient'
import DrugTable from '../components/admin/DrugTable'
import DrugForm from '../components/admin/DrugForm'

function NonAdminBanner({ practiceId }) {
  const { data: admin } = useQuery({
    queryKey: ['practice-admin', practiceId],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('practice_id', practiceId)
        .eq('role', 'admin')
        .single()
      return data
    },
    enabled: !!practiceId,
  })

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
      <p className="font-semibold mb-0.5">View only</p>
      <p>
        To request changes to the drug library or to become an admin, contact{' '}
        <span className="font-semibold">
          {admin?.full_name || 'your practice admin'}
          {admin?.email && <> (<a href={`mailto:${admin.email}`} className="underline">{admin.email}</a>)</>}
        </span>.
      </p>
    </div>
  )
}

// ─── Default drug set ────────────────────────────────────────────────────────
// Each entry must include section + group_key.
// Anesthesia seed values are clinical placeholders — verify before clinical use.

const DEFAULT_DRUGS = [
  // Discharge — pain medications
  { name: 'Carprofen',           section: 'discharge', group_key: 'pain_medications', category: 'Anti-Inflammatories', form: 'tablet',  tablet_sizes: [25,75,100],        concentration_mg_per_ml: null, low_dose_mg_per_kg: 1.8,   high_dose_mg_per_kg: 2.5,  frequency: 'BID',     duration_days: 14, week2: true,  sort_order: 1, patient_instructions: 'orally with food twice (2x) daily. This is a non-steroidal anti-inflammatory drug (NSAID) which may cause gastrointestinal upset such as vomiting, diarrhea, black stool and/or inappetence. If any of these clinical signs are noted please contact a veterinarian.' },
  { name: 'Metacam',             section: 'discharge', group_key: 'pain_medications', category: 'Anti-Inflammatories', form: 'liquid',  tablet_sizes: null,               concentration_mg_per_ml: 1.5,  low_dose_mg_per_kg: 0.1,   high_dose_mg_per_kg: 0.1,  frequency: 'SID',     duration_days: 14, week2: true,  sort_order: 2, patient_instructions: 'orally with food once (1x) daily. This is a non-steroidal anti-inflammatory drug (NSAID) which may cause gastrointestinal upset such as vomiting, diarrhea, black stool and/or inappetence. If any of these clinical signs are noted please contact a veterinarian.' },
  { name: 'Gallaprant',          section: 'discharge', group_key: 'pain_medications', category: 'Anti-Inflammatories', form: 'tablet',  tablet_sizes: [20,60,100],        concentration_mg_per_ml: null, low_dose_mg_per_kg: 2.0,   high_dose_mg_per_kg: 2.2,  frequency: 'SID',     duration_days: 14, week2: true,  sort_order: 3, patient_instructions: 'orally with food once (1x) daily. This is a non-steroidal anti-inflammatory drug (NSAID).' },
  { name: 'Gabapentin Capsules', section: 'discharge', group_key: 'pain_medications', category: 'Miscellaneous',      form: 'tablet',  tablet_sizes: [100,300],          concentration_mg_per_ml: null, low_dose_mg_per_kg: 10,    high_dose_mg_per_kg: 20,   frequency: 'TID',     duration_days: 14, week2: true,  sort_order: 4, patient_instructions: 'orally with food three times (3x) daily. This is a pain medication and may cause sedation.' },
  { name: 'Gabapentin Liquid',   section: 'discharge', group_key: 'pain_medications', category: 'Miscellaneous',      form: 'liquid',  tablet_sizes: null,               concentration_mg_per_ml: 50,   low_dose_mg_per_kg: 15,    high_dose_mg_per_kg: 15,   frequency: 'TID',     duration_days: 14, week2: true,  sort_order: 5, patient_instructions: 'orally with food three times (3x) daily. This is a pain medication and may cause sedation.' },
  // Discharge — antibiotics
  { name: 'Cephalexin',          section: 'discharge', group_key: 'antibiotics',      category: 'Antibiotics',        form: 'tablet',  tablet_sizes: [250,500],          concentration_mg_per_ml: null, low_dose_mg_per_kg: 22,    high_dose_mg_per_kg: 30,   frequency: 'BID',     duration_days: 7,  week2: false, sort_order: 1, patient_instructions: 'orally with food twice (2x) daily. This is a broad spectrum antibiotic.' },
  { name: 'Clavamox',            section: 'discharge', group_key: 'antibiotics',      category: 'Antibiotics',        form: 'tablet',  tablet_sizes: [62.5,125,250,375], concentration_mg_per_ml: null, low_dose_mg_per_kg: 13.75, high_dose_mg_per_kg: 15,   frequency: 'BID',     duration_days: 7,  week2: false, sort_order: 2, patient_instructions: 'orally with food twice (2x) daily. This is a broad spectrum antibiotic.' },
  { name: 'Amoxicillin',         section: 'discharge', group_key: 'antibiotics',      category: 'Antibiotics',        form: 'liquid',  tablet_sizes: null,               concentration_mg_per_ml: 50,   low_dose_mg_per_kg: 22,    high_dose_mg_per_kg: 22,   frequency: 'BID',     duration_days: 7,  week2: false, sort_order: 3, patient_instructions: 'orally with food twice (2x) daily. This is a broad spectrum antibiotic.' },
  // Discharge — tranquilizers
  { name: 'Trazodone',           section: 'discharge', group_key: 'tranquilizers',    category: 'Tranquilizers',      form: 'tablet',  tablet_sizes: [50,100],           concentration_mg_per_ml: null, low_dose_mg_per_kg: 3,     high_dose_mg_per_kg: 7,    frequency: 'TID',     duration_days: 14, week2: true,  sort_order: 1, patient_instructions: 'orally with food three times (3x) daily. This is a mild sedative, the expected side effect is sedation.' },
  { name: 'Acepromazine',        section: 'discharge', group_key: 'tranquilizers',    category: 'Tranquilizers',      form: 'tablet',  tablet_sizes: [10,25],            concentration_mg_per_ml: null, low_dose_mg_per_kg: 0.5,   high_dose_mg_per_kg: 2.0,  frequency: 'TID-QID', duration_days: 14, week2: true,  sort_order: 2, patient_instructions: 'orally with food three to four times (3–4x) daily. This is a mild sedative, the expected side effect is sedation.' },

  // ── Anesthesia — pre-op ───────────────────────────────────────────────────
  { name: 'Hydromorphone', section: 'anesthesia', group_key: 'pre_op',  category: null, form: 'liquid', tablet_sizes: null, concentration_mg_per_ml: 2,   low_dose_mg_per_kg: 0.05, high_dose_mg_per_kg: 0.2,  frequency: 'SID', duration_days: 1, week2: false, sort_order: 1, route: 'IM', default_timing: 'pre-op',   patient_instructions: '' },
  { name: 'Midazolam',     section: 'anesthesia', group_key: 'pre_op',  category: null, form: 'liquid', tablet_sizes: null, concentration_mg_per_ml: 5,   low_dose_mg_per_kg: 0.1,  high_dose_mg_per_kg: 0.3,  frequency: 'SID', duration_days: 1, week2: false, sort_order: 2, route: 'IM', default_timing: 'pre-op',   patient_instructions: '' },
  { name: 'Methadone',     section: 'anesthesia', group_key: 'pre_op',  category: null, form: 'liquid', tablet_sizes: null, concentration_mg_per_ml: 10,  low_dose_mg_per_kg: 0.1,  high_dose_mg_per_kg: 0.5,  frequency: 'SID', duration_days: 1, week2: false, sort_order: 3, route: 'IM', default_timing: 'pre-op',   patient_instructions: '' },
  // Anesthesia — induction (peri_op)
  { name: 'Propofol',      section: 'anesthesia', group_key: 'peri_op', category: null, form: 'liquid', tablet_sizes: null, concentration_mg_per_ml: 10,  low_dose_mg_per_kg: 2,    high_dose_mg_per_kg: 6,    frequency: 'SID', duration_days: 1, week2: false, sort_order: 1, route: 'IV', default_timing: 'to effect', patient_instructions: '' },
  { name: 'Ketamine',      section: 'anesthesia', group_key: 'peri_op', category: null, form: 'liquid', tablet_sizes: null, concentration_mg_per_ml: 10,  low_dose_mg_per_kg: 1,    high_dose_mg_per_kg: 5,    frequency: 'SID', duration_days: 1, week2: false, sort_order: 2, route: 'IV', default_timing: 'to effect', patient_instructions: '' },
  // Anesthesia — post-op
  { name: 'Hydromorphone', section: 'anesthesia', group_key: 'post_op', category: null, form: 'liquid', tablet_sizes: null, concentration_mg_per_ml: 2,   low_dose_mg_per_kg: 0.05, high_dose_mg_per_kg: 0.1,  frequency: 'SID', duration_days: 1, week2: false, sort_order: 1, route: 'IV', default_timing: 'post-op',  patient_instructions: '' },
  { name: 'Buprenorphine', section: 'anesthesia', group_key: 'post_op', category: null, form: 'liquid', tablet_sizes: null, concentration_mg_per_ml: 0.3, low_dose_mg_per_kg: 0.01, high_dose_mg_per_kg: 0.02, frequency: 'SID', duration_days: 1, week2: false, sort_order: 2, route: 'IV', default_timing: 'post-op',  patient_instructions: '' },
]

// ─── Audit log helpers ───────────────────────────────────────────────────────

const ACTION_STYLES = {
  created:     'bg-green-100 text-green-700',
  updated:     'bg-blue-100 text-blue-700',
  deactivated: 'bg-red-100 text-red-700',
  activated:   'bg-green-100 text-green-700',
}

const FIELD_LABELS = {
  name:                       'Name',
  section:                    'Section',
  group_key:                  'Group',
  form:                       'Form',
  low_dose_mg_per_kg:         'Low dose',
  high_dose_mg_per_kg:        'High dose',
  frequency:                  'Frequency',
  duration_days:              'Duration',
  week2:                      'Week 2',
  concentration_mg_per_ml:    'Concentration',
  tablet_sizes:               'Tablet sizes',
  patient_instructions:       'Patient instructions',
  route:                      'Route',
  default_timing:             'Default timing',
  instruction_template_plain: 'Plain template',
  instruction_template_html:  'HTML template',
  active:                     'Active',
}

// Fields to skip in audit diff display (internal / low-signal)
const IGNORE_FIELDS = new Set([
  'id', 'practice_id', 'created_at', 'sort_order', 'category',
])

function diffValues(oldV, newV) {
  if (!oldV || !newV) return []
  return Object.keys(newV)
    .filter(k => !IGNORE_FIELDS.has(k) && JSON.stringify(oldV[k]) !== JSON.stringify(newV[k]))
    .map(k => ({
      field: FIELD_LABELS[k] || k,
      from:  String(oldV[k] ?? '—'),
      to:    String(newV[k] ?? '—'),
    }))
}

function useAuditLog() {
  const { practiceId } = useAuth()
  return useQuery({
    queryKey: ['drug-audit', practiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drug_audit_logs')
        .select('*, users(full_name)')
        .eq('practice_id', practiceId)
        .order('changed_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data
    },
    enabled: !!practiceId,
  })
}

// ─── Page component ──────────────────────────────────────────────────────────

export default function DrugLibraryPage() {
  const { isAdmin, practiceId } = useAuth()
  const { data: drugs, isLoading, error } = useDrugs()
  const { data: auditLogs } = useAuditLog()
  const queryClient = useQueryClient()
  const [adding, setAdding]     = useState(false)
  const [seeding, setSeeding]   = useState(false)
  const [showAudit, setShowAudit] = useState(false)

  async function loadDefaults() {
    setSeeding(true)
    // Deduplicate by name + group_key so the same drug can exist in multiple
    // phases (e.g. Hydromorphone in both pre-op and post-op)
    const existingKeys = new Set(
      (drugs ?? []).map(d => `${d.name}||${d.group_key ?? ''}`)
    )
    const rows = DEFAULT_DRUGS
      .filter(d => !existingKeys.has(`${d.name}||${d.group_key}`))
      .map(d => ({ ...d, practice_id: practiceId, active: true }))
    if (rows.length > 0) await supabase.from('drugs').insert(rows)
    queryClient.invalidateQueries({ queryKey: ['drugs', practiceId] })
    setSeeding(false)
  }

  const totalCount  = drugs?.length ?? 0
  const activeCount = drugs?.filter(d => d.active).length ?? 0
  const dischargeCt = drugs?.filter(d => (d.section ?? 'discharge') === 'discharge').length ?? 0
  const anesthCt    = drugs?.filter(d => d.section === 'anesthesia').length ?? 0

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading drug library…</div>
  if (error)     return <div className="p-8 text-center text-red-500">{error.message}</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Non-admin banner */}
      {!isAdmin && <NonAdminBanner practiceId={practiceId} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Drug Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} drugs · {activeCount} active
            {dischargeCt > 0 && <> · {dischargeCt} discharge</>}
            {anesthCt    > 0 && <> · {anesthCt} anesthesia</>}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={loadDefaults} disabled={seeding}
              className="px-4 py-2 rounded text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50">
              {seeding ? 'Loading…' : 'Load standard drug set'}
            </button>
            <button onClick={() => setAdding(true)}
              className="px-4 py-2 rounded text-sm text-white font-medium"
              style={{ backgroundColor: '#1a365d' }}>
              + Add Drug
            </button>
          </div>
        )}
      </div>

      {/* Drug table or empty state */}
      {totalCount === 0 ? (
        <div className="py-8">
          {isAdmin ? (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center max-w-lg mx-auto">
              <p className="text-3xl mb-3">☝️</p>
              <p className="font-semibold text-blue-900 text-lg mb-2">
                Start here — click "Load standard drug set" above
              </p>
              <p className="text-sm text-blue-700 mb-4">
                Pre-populates your library with discharge and anesthesia placeholder drugs. You can add, change, or delete drugs anytime after.
              </p>
              <button onClick={() => setAdding(true)} className="text-blue-500 hover:underline text-xs">
                Or add a drug manually instead
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="mb-2">No drugs in your library yet.</p>
              <p className="text-sm">Ask your practice admin to load the standard drug set.</p>
            </div>
          )}
        </div>
      ) : (
        <DrugTable drugs={drugs} isAdmin={isAdmin} />
      )}

      {/* Audit log (admin only) */}
      {isAdmin && (
        <div className="mt-8">
          <button
            onClick={() => setShowAudit(o => !o)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            <span>{showAudit ? '▾' : '▸'}</span>
            Drug Change Log {auditLogs?.length ? `(${auditLogs.length})` : ''}
          </button>

          {showAudit && (
            <div className="mt-3 bg-white rounded-lg border border-gray-200 overflow-hidden">
              {!auditLogs?.length ? (
                <p className="p-4 text-sm text-gray-400">No changes recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">When</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Who</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Drug</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Action</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map(log => {
                      const changes = log.action === 'updated'
                        ? diffValues(log.old_values, log.new_values)
                        : []
                      return (
                        <tr key={log.id} className="align-top">
                          <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                            {new Date(log.changed_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {log.users?.full_name || '—'}
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-800">{log.drug_name}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-600'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {changes.length === 0 ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : (
                              <ul className="space-y-0.5">
                                {changes.map(c => (
                                  <li key={c.field} className="text-xs">
                                    <span className="font-medium">{c.field}:</span>{' '}
                                    <span className="line-through text-red-400">{c.from}</span>{' → '}
                                    <span className="text-green-600">{c.to}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {adding && <DrugForm onClose={() => setAdding(false)} />}
    </div>
  )
}
