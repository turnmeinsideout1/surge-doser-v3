export default function PatientForm({ values, onChange }) {
  function set(field) {
    return e => onChange({ ...values, [field]: e.target.value })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-5 space-y-4">
      {[
        { label: 'Patient Name',  id: 'patientName',  type: 'text',   placeholder: 'e.g. Bruno' },
        { label: 'Procedure',     id: 'procedure',    type: 'text',   placeholder: 'e.g. TPLO' },
        { label: 'Surgery Date',  id: 'surgeryDate',  type: 'date',   placeholder: '' },
        { label: 'Weight (lbs)',  id: 'weightLbs',    type: 'number', placeholder: 'e.g. 45' },
      ].map(({ label, id, type, placeholder }) => (
        <div key={id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={type} value={values[id]} onChange={set(id)}
            placeholder={placeholder} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 0.1 : undefined}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      ))}
    </div>
  )
}
