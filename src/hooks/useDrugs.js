import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'

export function useDrugs({ activeOnly = false } = {}) {
  const { practiceId } = useAuth()

  return useQuery({
    queryKey: ['drugs', practiceId, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('drugs')
        .select('*')
        .eq('practice_id', practiceId)
      if (activeOnly) query = query.eq('active', true)
      const { data, error } = await query
        .order('section')
        .order('group_key')
        .order('sort_order')
        .order('name')
      if (error) throw error
      return data
    },
    enabled: !!practiceId,
  })
}

export function useUpsertDrug() {
  const queryClient = useQueryClient()
  const { practiceId } = useAuth()

  return useMutation({
    mutationFn: async (drug) => {
      const payload = { ...drug, practice_id: practiceId }
      const { data, error } = drug.id
        ? await supabase.from('drugs').update(payload).eq('id', drug.id).select().single()
        : await supabase.from('drugs').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drugs', practiceId] }),
  })
}

export function useDeactivateDrug() {
  const queryClient = useQueryClient()
  const { practiceId } = useAuth()

  return useMutation({
    mutationFn: async ({ id, active }) => {
      const { error } = await supabase.from('drugs').update({ active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drugs', practiceId] }),
  })
}
