import { useState } from 'react'
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

export default function SettingsPage() {
  const { profile, isAdmin, user } = useAuth()
  const { data: team, isLoading } = useTeam()
  const updateRole = useUpdateRole()
  const [practiceName] = useState(profile?.practices?.name ?? '')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Practice info */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 mb-4">Settings</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Practice</p>
          <p className="text-gray-800 font-semibold">{practiceName || '—'}</p>
        </div>
      </div>

      {/* Your profile */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Profile</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-2 text-sm text-gray-700">
          <p><span className="font-medium">Name:</span> {profile?.full_name ?? '—'}</p>
          <p><span className="font-medium">Email:</span> {user?.email ?? '—'}</p>
          <p><span className="font-medium">Role:</span> <span className="capitalize">{profile?.role ?? '—'}</span></p>
        </div>
      </div>

      {/* Team (admin only) */}
      {isAdmin && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Team</h2>
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Joined</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {team?.map(member => (
                    <tr key={member.id}>
                      <td className="px-4 py-2 font-medium text-gray-800">
                        {member.full_name || '—'}
                        {member.id === user.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-600 capitalize">{member.role}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
