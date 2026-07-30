import { useState } from 'react'
import { Wrench, Loader2, Building2, MapPin, Phone, User, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface GarageSetupModalProps {
  userId: string
  onComplete: () => void
}

interface SetupForm {
  garageName: string
  garageAddress: string
  personalPhone: string
  garagePhone: string
}

const initialForm: SetupForm = {
  garageName: '',
  garageAddress: '',
  personalPhone: '',
  garagePhone: '',
}

export function GarageSetupModal({ userId, onComplete }: GarageSetupModalProps) {
  const [form, setForm] = useState<SetupForm>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update<K extends keyof SetupForm>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.garageName.trim()) {
      setError('Garage name is required.')
      return
    }

    setLoading(true)

    try {
      const { error: upsertError } = await supabase
        .from('garages')
        .upsert(
          {
            id: userId,
            garage_name: form.garageName.trim(),
            garage_address: form.garageAddress.trim(),
            personal_phone: form.personalPhone.trim(),
            garage_phone: form.garagePhone.trim(),
            subscription_status: 'pending',
          },
          { onConflict: 'id' }
        )

      if (upsertError) {
        console.error('GarageSetupModal upsert error:', upsertError)
        setError('Could not create your garage profile. Please try again.')
        return
      }

      setSuccess(true)
      // Brief success flash, then proceed
      setTimeout(() => onComplete(), 1200)
    } catch (err) {
      console.error('GarageSetupModal unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-zinc-900/20 border border-zinc-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Complete Your Setup</h2>
              <p className="text-sm text-amber-100">Your garage profile needs a quick setup</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Garage profile created!</p>
                <p className="text-sm text-zinc-500 mt-0.5">Taking you to the app…</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500 mb-5">
                We couldn't find a garage profile linked to your account. Fill in the details below
                to get started — you can update everything later in your profile settings.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Garage Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                    Garage Name <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    required
                    value={form.garageName}
                    onChange={(e) => update('garageName', e.target.value)}
                    placeholder="e.g. Joe's Auto Repair"
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>

                {/* Garage Address */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    Garage Address
                    <span className="text-xs text-zinc-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    value={form.garageAddress}
                    onChange={(e) => update('garageAddress', e.target.value)}
                    placeholder="123 Mechanic Street"
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>

                {/* Phone Numbers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                      Personal Phone
                    </label>
                    <input
                      type="tel"
                      value={form.personalPhone}
                      onChange={(e) => update('personalPhone', e.target.value)}
                      placeholder="071 234 5678"
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" />
                      Garage Phone
                    </label>
                    <input
                      type="tel"
                      value={form.garagePhone}
                      onChange={(e) => update('garagePhone', e.target.value)}
                      placeholder="011 555 0199"
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => supabase.auth.signOut()}
                    className="flex-1 h-10 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Sign Out
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-10 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Create Garage'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
