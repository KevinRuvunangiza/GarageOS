import { useState, useEffect, useCallback } from 'react'
import type { EstimatorItem } from '@/components/ItemizedEstimator'
import type { FuelLevel } from '@/types/database'

export interface JobDraftState {
  clientName: string
  phoneNumber: string
  email: string
  address: string
  notes: string
  make: string
  model: string
  year: string
  licensePlate: string
  vin: string
  fuelLevel: FuelLevel | null
  preExistingDamage: string[]
  issueDescription: string
  odometerKm: string
  items: EstimatorItem[]
  savedAt: string
}

const STORAGE_KEY = 'garageos_job_draft'

export function useJobDraft() {
  const [draft, setDraft] = useState<JobDraftState | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Load initial draft from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: JobDraftState = JSON.parse(stored)
        setDraft(parsed)
        setLastSaved(parsed.savedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (e) {
      console.error('Failed to parse job draft from localStorage:', e)
    }
  }, [])

  // Save current form state to localStorage
  const saveDraft = useCallback((data: Omit<JobDraftState, 'savedAt'>) => {
    try {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const draftToSave: JobDraftState = {
        ...data,
        savedAt: now,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftToSave))
      setDraft(draftToSave)
      setLastSaved(now)
    } catch (e) {
      console.error('Failed to save job draft to localStorage:', e)
    }
  }, [])

  // Clear draft cache
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setDraft(null)
    setLastSaved(null)
  }, [])

  return { draft, lastSaved, saveDraft, clearDraft }
}
