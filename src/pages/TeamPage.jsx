import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

function useTeam() {
  const { practiceId } = useAuth()
  return useQuery({
    queryKey: ['team', practiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('practice_id', practiceId)
        .order('created_at')
      if (error) throw error
      return data
    },
    enabled: !!practiceId,
  })
}

function useUpdateRole() {
  const queryClient = useQueryClient()
  const { practiceId } = useAuth()
  return useMutation({
    mutationFn: async ({ id, role }) => {
      const { error } = await supabase.from('users').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team', practiceId] }),
  })
}

export default function TeamPage() {
  const { profile, isAdmin, user } = useAuth()
  const { data: team, isLoading } = useTeam()
  const updateRole = useUpdateRole()

  const admin = team?.find(m => m.role === 'admin')

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Team</h1>

      {/* Non-admin: contact message */}
      {!isAdmin && admin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Need changes to the drug library or team roles?</p>
          <p>
            Contact your practice admin{' '}
            <span className="font-semibold">{admin.full_name || 'your admin'}</span>
            {admin.email && (
              <> at <a href={`mailto:${admin.email}`} className="underline">{admin.email}</a></>
            )}
            {' '}to update drug configurations, dose ranges, or to change team roles.
          </p>
        </div>
      )}

      {/* Team table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Joined</th>
              {isAdmin && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {team?.map(member => (
              <tr key={member.id} className={member.role === 'admin' ? 'bg-blue-50/40' : ''}>
                <td className="px-4 py-2 font-medium text-gray-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    {member.full_name || '—'}
                    {member.id === user.id && <span className="text-xs text-gray-400">(you)</span>}
                    {member.role === 'admin' && (
                      <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">Admin</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-500">{member.email || '—'}</td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2 text-right">
                    {member.id !== user.id && (
                      <button
                        onClick={() => updateRole.mutate({
                          id: member.id,
                          role: member.role === 'admin' ? 'user' : 'admin',
                        })}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        Make {member.role === 'admin' ? 'user' : 'admin'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Your profile */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Profile</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-1 text-sm text-gray-700">
          <p><span className="font-medium">Name:</span> {profile?.full_name ?? '—'}</p>
          <p><span className="font-medium">Email:</span> {user?.email ?? '—'}</p>
          <p><span className="font-medium">Role:</span> <span className="capitalize">{profile?.role ?? '—'}</span></p>
        </div>
      </div>
    </div>
  )
}
