import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { PresetService } from '@/types/database'

export function usePresetServices() {
  const [presets, setPresets] = useState<PresetService[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPresets = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('preset_services')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching preset services:', error)
    } else {
      setPresets((data as PresetService[]) || [])
    }
    setLoading(false)
  }, [])

  async function createPreset(preset: Omit<PresetService, 'id' | 'garage_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('preset_services')
      .insert({ ...preset, garage_id: user.id })

    if (!error) await fetchPresets()
    return { error }
  }

  async function deletePreset(id: string) {
    const { error } = await supabase
      .from('preset_services')
      .delete()
      .eq('id', id)

    if (!error) await fetchPresets()
    return { error }
  }

  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  return { presets, loading, fetchPresets, createPreset, deletePreset }
}
