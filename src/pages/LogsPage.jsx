import { useLogs } from '../hooks/useLogs'

function exportCSV(logs) {
  const rows = [['Date', 'User', 'Patient', 'Weight (lbs)', 'Weight (kg)', 'Procedure', 'Surgery Date', 'Drug', 'Form', 'Low Dose mg/kg', 'High Dose mg/kg', 'Frequency', 'Suggestion']]

  for (const log of logs) {
    const date = new Date(log.created_at).toLocaleString()
    const user = log.users?.full_name || '—'
    for (const drug of (log.drugs_json || [])) {
      const r = drug.result || {}
      const suggestion = r.suggestion || ''
      rows.push([
        date, user,
        log.patient_name, log.patient_weight_lbs, log.patient_weight_kg,
        log.procedure, log.surgery_date,
        drug.name, drug.form,
        drug.low_dose_mg_per_kg, drug.high_dose_mg_per_kg,
        drug.frequency, suggestion,
      ])
    }
  }

  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `surge-logs-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function LogsPage() {
  const { data: logs, isLoading, error } = useLogs()

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading logs…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error.message}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Usage Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs?.length ?? 0} copy events recorded</p>
        </div>
        {logs?.length > 0 && (
          <button
            onClick={() => exportCSV(logs)}
            className="px-4 py-2 rounded text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
            Download CSV
          </button>
        )}
      </div>

      {logs?.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No logs yet. Logs are recorded each time a Copy button is clicked in the calculator.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Patient</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Weight</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Procedure</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Surgery Date</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Drugs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {log.users?.full_name || '—'}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-800">{log.patient_name}</td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                    {log.patient_weight_lbs} lbs / {log.patient_weight_kg} kg
                  </td>
                  <td className="px-4 py-2 text-gray-600">{log.procedure}</td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{log.surgery_date}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {(log.drugs_json || []).map(d => d.name).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
