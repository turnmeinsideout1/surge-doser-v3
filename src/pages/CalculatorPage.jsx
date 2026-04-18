import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDrugs } from '../hooks/useDrugs'
import { useCreateLog } from '../hooks/useLogs'
import { useAuth } from '../hooks/useAuth'
import { calcDrug } from '../lib/doseCalc'
import { generateLetter } from '../lib/letterGen'
import { generateAnesthesiaOutput } from '../lib/anesthesiaGen'
import { normalizeDrugSection } from '../lib/medicationConfig'
import PatientForm from '../components/calculator/PatientForm'
import DrugCheckboxes from '../components/calculator/DrugCheckboxes'
import LetterOutput from '../components/calculator/LetterOutput'
import DoseCalcsPanel from '../components/calculator/DoseCalcsPanel'

const emptyPatient = { patientName: '', procedure: '', surgeryDate: '', weightLbs: '' }

export default function CalculatorPage() {
  const { practiceId, isAdmin, loading: authLoading } = useAuth()
  const { data: drugs, isLoading } = useDrugs({ activeOnly: true })
  const navigate = useNavigate()
  const createLog = useCreateLog()
  const [logError, setLogError] = useState(null)

  // Wait for both auth profile and drug query to settle before redirecting.
  // Without the authLoading check, practiceId is null on first render so
  // useDrugs is disabled and drugs is undefined — the redirect never fires.
  const stillLoading = authLoading || isLoading

  useEffect(() => {
    if (!stillLoading && Array.isArray(drugs) && drugs.length === 0) {
      navigate('/drugs')
    }
  }, [stillLoading, drugs, navigate])

  const [patient, setPatient] = useState(emptyPatient)
  const [selectedIds, setSelectedIds] = useState([])

  const weightKg = parseFloat(patient.weightLbs) / 2.2046
  const hasWeight = !isNaN(weightKg) && weightKg > 0

  // All selected drugs (both sections)
  const selectedDrugs = useMemo(() =>
    (drugs ?? []).filter(d => selectedIds.includes(d.id)),
    [drugs, selectedIds]
  )

  // Split by section for separate output generation
  const dischargeDrugs = useMemo(() =>
    selectedDrugs.filter(d => normalizeDrugSection(d) === 'discharge'),
    [selectedDrugs]
  )

  const anesthesiaDrugs = useMemo(() =>
    selectedDrugs.filter(d => normalizeDrugSection(d) === 'anesthesia'),
    [selectedDrugs]
  )

  // Pre-conditions for each output type
  // Discharge requires surgeryDate (needed for Week 1 / Week 2 dates)
  const dischargeReady = !!(
    patient.patientName && hasWeight && patient.surgeryDate && dischargeDrugs.length > 0
  )
  const anesthesiaReady = !!(
    patient.patientName && hasWeight && anesthesiaDrugs.length > 0
  )
  const ready = dischargeReady || anesthesiaReady

  // Calculate doses for every selected drug (section-agnostic engine)
  const results = useMemo(() => {
    if (!hasWeight) return {}
    return Object.fromEntries(
      selectedDrugs.map(drug => [drug.id, calcDrug(drug, weightKg)])
    )
  }, [selectedDrugs, weightKg, hasWeight])

  // Generate discharge letter (unchanged behaviour)
  const dischargeLetter = useMemo(() => {
    if (!dischargeReady) return { html: '', text: '' }
    return generateLetter(patient.patientName, patient.surgeryDate, dischargeDrugs, results)
  }, [dischargeReady, patient.patientName, patient.surgeryDate, dischargeDrugs, results])

  // Generate anesthesia output (grouped by phase)
  const anesthesiaOutput = useMemo(() => {
    if (!anesthesiaReady) return { html: '', text: '' }
    return generateAnesthesiaOutput(patient, anesthesiaDrugs, results, weightKg)
  }, [anesthesiaReady, patient, anesthesiaDrugs, results, weightKg])

  function handleCopy(_type) {
    if (ready) {
      createLog.mutate(
        {
          patient,
          selectedDrugs,
          results,
          dischargeGenerated:  dischargeDrugs.length  > 0,
          anesthesiaGenerated: anesthesiaDrugs.length > 0,
        },
        { onError: () => setLogError('Failed to save log. Please try again or contact your admin.') }
      )
    }
  }

  function clearAll() {
    setPatient(emptyPatient)
    setSelectedIds([])
  }

  if (stillLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>

  // Fallback empty state — redirect above handles this in most cases, but
  // if navigation hasn't fired yet render a helpful prompt instead of a blank form.
  if (Array.isArray(drugs) && drugs.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-3xl mb-4">💊</p>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">No drugs in your library yet</h2>
        <p className="text-sm text-gray-500 mb-6">
          {isAdmin
            ? 'Load the standard drug set or add drugs manually to get started.'
            : 'Ask your practice admin to set up the drug library before using the calculator.'}
        </p>
        {isAdmin && (
          <Link
            to="/drugs"
            className="inline-block px-5 py-2.5 rounded text-white text-sm font-medium"
            style={{ backgroundColor: '#1a365d' }}>
            Go to Drug Library →
          </Link>
        )}
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <PatientForm values={patient} onChange={setPatient} />

      <DrugCheckboxes
        drugs={drugs ?? []}
        selected={selectedIds}
        onChange={setSelectedIds}
      />

      {/* Discharge instructions */}
      {(dischargeDrugs.length > 0 || !anesthesiaReady) && (
        <LetterOutput
          title={anesthesiaDrugs.length > 0 ? 'Discharge Instructions' : undefined}
          html={dischargeLetter.html}
          text={dischargeLetter.text}
          onCopy={handleCopy}
        />
      )}

      {/* Anesthesia instructions */}
      {anesthesiaDrugs.length > 0 && (
        <LetterOutput
          title="Anesthesia Instructions"
          html={anesthesiaOutput.html}
          text={anesthesiaOutput.text}
          onCopy={handleCopy}
          showDisclaimer={!dischargeDrugs.length}
        />
      )}

      {/* Shared disclaimer when both sections are shown */}
      {dischargeDrugs.length > 0 && anesthesiaDrugs.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          ⚠️ These are draft calculations only. All doses should be verified by a qualified staff before administration.
        </p>
      )}

      <DoseCalcsPanel
        drugs={selectedDrugs}
        results={results}
        weightKg={weightKg}
      />

      {logError && (
        <div className="flex items-center justify-between mt-2 px-4 py-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          <span>{logError}</span>
          <button onClick={() => setLogError(null)} className="ml-4 text-red-400 hover:text-red-600 leading-none text-base">×</button>
        </div>
      )}

      <button
        onClick={clearAll}
        className="w-full py-2.5 mt-2 rounded-md font-medium text-gray-600 text-sm tracking-wide border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
        Clear All Fields
      </button>
    </main>
  )
}
