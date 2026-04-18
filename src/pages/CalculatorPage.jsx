import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDrugs } from '../hooks/useDrugs'
import { useCreateLog } from '../hooks/useLogs'
import { calcDrug } from '../lib/doseCalc'
import { generateLetter } from '../lib/letterGen'
import PatientForm from '../components/calculator/PatientForm'
import DrugCheckboxes from '../components/calculator/DrugCheckboxes'
import LetterOutput from '../components/calculator/LetterOutput'
import DoseCalcsPanel from '../components/calculator/DoseCalcsPanel'

const emptyPatient = { patientName: '', procedure: '', surgeryDate: '', weightLbs: '' }

export default function CalculatorPage() {
  const { data: drugs, isLoading } = useDrugs({ activeOnly: true })
  const navigate = useNavigate()
  const createLog = useCreateLog()
  const [logError, setLogError] = useState(null)

  // Redirect to drug library if practice has no drugs yet
  useEffect(() => {
    if (!isLoading && drugs && drugs.length === 0) {
      navigate('/drugs')
    }
  }, [isLoading, drugs, navigate])
  const [patient, setPatient] = useState(emptyPatient)
  const [selectedIds, setSelectedIds] = useState([])

  const weightKg = parseFloat(patient.weightLbs) / 2.2046
  const hasWeight = !isNaN(weightKg) && weightKg > 0
  const ready = patient.patientName && hasWeight && patient.surgeryDate && selectedIds.length > 0

  // Calculate doses for all selected drugs
  const selectedDrugs = useMemo(() =>
    (drugs ?? []).filter(d => selectedIds.includes(d.id)),
    [drugs, selectedIds]
  )

  const results = useMemo(() => {
    if (!hasWeight) return {}
    return Object.fromEntries(
      selectedDrugs.map(drug => [drug.id, calcDrug(drug, weightKg)])
    )
  }, [selectedDrugs, weightKg, hasWeight])

  const letter = useMemo(() => {
    if (!ready) return { html: '', text: '' }
    return generateLetter(patient.patientName, patient.surgeryDate, selectedDrugs, results)
  }, [ready, patient.patientName, patient.surgeryDate, selectedDrugs, results])

  function handleCopy(_type) {
    if (ready) {
      createLog.mutate(
        { patient, selectedDrugs, results },
        { onError: () => setLogError('Failed to save log. Please try again or contact your admin.') }
      )
    }
  }

  function clearAll() {
    setPatient(emptyPatient)
    setSelectedIds([])
  }

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <PatientForm values={patient} onChange={setPatient} />

      <DrugCheckboxes
        drugs={drugs ?? []}
        selected={selectedIds}
        onChange={setSelectedIds}
      />

      <LetterOutput
        html={letter.html}
        text={letter.text}
        onCopy={handleCopy}
      />

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
