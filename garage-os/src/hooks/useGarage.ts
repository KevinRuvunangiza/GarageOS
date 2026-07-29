import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export type SubscriptionStatus = 'pending' | 'active_lifetime' | 'active_trial' | 'expired'

export interface GarageProfile {
  id: string
  garage_name: string
  garage_address: string
  personal_phone: string
  garage_phone: string
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  applied_promo_code: string | null
  created_at: string
}

export function useGarage() {
  const [garage, setGarage] = useState<GarageProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchGarage = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setGarage(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('garages')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching garage:', error)
      setGarage(null)
    } else {
      setGarage(data as GarageProfile)
    }
    setLoading(false)
  }, [])

  /**
   * Calls the Supabase RPC `apply_promo_code` with the garage id and
   * the supplied code. Returns { success, type, message }.
   */
  const applyPromoCode = useCallback(async (code: string): Promise<{ success: boolean; type?: string; message?: string }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Not authenticated' }

    const { data, error } = await supabase.rpc('apply_promo_code', {
      garage_id:   user.id,
      promo_code:  code.trim().toUpperCase(),
    })

    if (error) {
      console.error('RPC apply_promo_code error:', error)
      return { success: false, message: 'Server error. Please try again.' }
    }

    const result = data as { success: boolean; type?: string; message?: string }

    if (result.success) {
      // Re-fetch so we get the freshly updated trial_ends_at etc.
      await fetchGarage()
    }

    return result
  }, [fetchGarage])

  /** Legacy helper kept for backward compatibility (e.g., ProfileView) */
  const updateSubscription = useCallback(async (status: SubscriptionStatus) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('garages')
      .update({ subscription_status: status })
      .eq('id', user.id)

    if (!error) {
      setGarage((prev) => (prev ? { ...prev, subscription_status: status } : null))
    }
    return { error }
  }, [])

  useEffect(() => {
    fetchGarage()
  }, [fetchGarage])

  return { garage, loading, fetchGarage, updateSubscription, applyPromoCode }
}
