import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'

export function useCreateLog() {
  const { practiceId, user } = useAuth()

  return useMutation({
    mutationFn: async ({
      patient,
      selectedDrugs,
      results,
      dischargeGenerated = false,
      anesthesiaGenerated = false,
    }) => {
      const weightKg = parseFloat(patient.weightLbs) / 2.2046

      // Deep-copy the snapshot so future drug edits don't affect historical logs
      const drugsSnapshot = selectedDrugs.map(drug => ({
        drug_id:              drug.id,
        name:                 drug.name,
        section:              drug.section    ?? 'discharge',
        group_key:            drug.group_key  ?? null,
        category:             drug.category   ?? null, // kept for backward compat
        form:                 drug.form,
        frequency:            drug.frequency,
        low_dose_mg_per_kg:   drug.low_dose_mg_per_kg,
        high_dose_mg_per_kg:  drug.high_dose_mg_per_kg,
        route:                drug.route          ?? null,
        default_timing:       drug.default_timing ?? null,
        result:               results[drug.id],
      }))

      const { error } = await supabase.from('dose_logs').insert({
        practice_id:           practiceId,
        user_id:               user.id,
        patient_name:          patient.patientName,
        patient_weight_lbs:    parseFloat(patient.weightLbs),
        patient_weight_kg:     parseFloat(weightKg.toFixed(2)),
        procedure:             patient.procedure,
        surgery_date:          patient.surgeryDate || null,
        drugs_json:            drugsSnapshot,
        discharge_generated:   dischargeGenerated,
        anesthesia_generated:  anesthesiaGenerated,
      })
      if (error) throw error
    },
  })
}

export function useLogs() {
  const { practiceId } = useAuth()

  return useQuery({
    queryKey: ['logs', practiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dose_logs')
        .select('*, users(full_name)')
        .eq('practice_id', practiceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!practiceId,
  })
}
