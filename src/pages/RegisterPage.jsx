import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [practices, setPractices] = useState([])
  const [form, setForm] = useState({ fullName: '', email: '', password: '', practiceChoice: '', newPracticeName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.rpc('list_practices').then(({ data }) => {
      if (data) setPractices(data)
    })
  }, [])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const isNewPractice = form.practiceChoice === '__new__'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.practiceChoice) { setError('Please select or create a practice.'); return }
    if (isNewPractice && !form.newPracticeName.trim()) { setError('Enter a practice name.'); return }

    setLoading(true)

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    const userId = authData.user.id

    if (isNewPractice) {
      const { error: rpcError } = await supabase.rpc('register_practice', {
        p_user_id: userId,
        p_full_name: form.fullName,
        p_practice_name: form.newPracticeName.trim(),
        p_email: form.email,
      })
      if (rpcError) { setError(rpcError.message); setLoading(false); return }
    } else {
      const { error: rpcError } = await supabase.rpc('join_practice', {
        p_user_id: userId,
        p_full_name: form.fullName,
        p_practice_id: form.practiceChoice,
        p_email: form.email,
      })
      if (rpcError) { setError(rpcError.message); setLoading(false); return }
    }

    setLoading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
        <img src="/Simini-logo-dark.png" alt="Simini" className="h-12 object-contain mx-auto mb-4" />
        <p className="text-center text-gray-500 text-sm mb-6">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your full name</label>
            <input type="text" required value={form.fullName} onChange={set('fullName')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Practice</label>
            <select required value={form.practiceChoice} onChange={set('practiceChoice')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a practice…</option>
              {practices.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="__new__">+ Create new practice</option>
            </select>
          </div>

          {isNewPractice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Practice name</label>
              <input type="text" required value={form.newPracticeName} onChange={set('newPracticeName')}
                placeholder="e.g. Petro Vet"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={set('email')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={set('password')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2 rounded text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#1a365d' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
