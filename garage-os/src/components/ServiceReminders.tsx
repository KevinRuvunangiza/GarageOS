import { useState, useEffect, useCallback } from 'react'
import { Bell, MessageCircle, Loader2, RefreshCw, Clock, Car, Phone } from 'lucide-react'
import { Button } from './ui/Button'
import { supabase } from '@/lib/supabaseClient'
import { useGarage } from '@/hooks/useGarage'
import type { JobWithDetails } from '@/types/database'

interface ReminderClient {
  clientId: string
  clientName: string
  phone: string
  lastJobDate: string
  vehicleMake: string
  vehicleModel: string
  licensePlate: string
  monthsAgo: number
}

/**
 * Strips a SA phone number to the international wa.me format.
 * e.g. "071 234 5678" → "27712345678"
 *      "+27 71 234 5678" → "27712345678"
 */
function toWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('27')) return digits
  if (digits.startsWith('0')) return '27' + digits.slice(1)
  return '27' + digits
}

function buildWhatsAppUrl(phone: string, clientName: string, vehicleMake: string, vehicleModel: string, garageName: string): string {
  const waNumber = toWaNumber(phone)
  const msg = `Hi ${clientName} 👋 This is ${garageName}.\n\nIt's been about 6 months since your ${vehicleMake} ${vehicleModel} was last serviced with us. We'd recommend booking a routine check-up to keep it running smoothly.\n\nReply to this message or give us a call to schedule a time that works for you. We look forward to seeing you! 🔧`
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`
}

export function ServiceReminders() {
  const { garage } = useGarage()
  const [reminders, setReminders] = useState<ReminderClient[]>([])
  const [loading, setLoading] = useState(true)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const fetchReminders = useCallback(async () => {
    setLoading(true)

    // Query paid jobs where updated_at is between 5 and 7 months ago (±30-day window around 6 months)
    const now = new Date()
    const fiveMonthsAgo = new Date(now)
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 7)
    const sevenMonthsAgo = new Date(now)
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 5)

    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        vehicles (
          *,
          clients (*)
        ),
        job_items (*)
      `)
      .eq('status', 'paid')
      .gte('updated_at', fiveMonthsAgo.toISOString())
      .lte('updated_at', sevenMonthsAgo.toISOString())
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching service reminders:', error)
      setLoading(false)
      return
    }

    // Deduplicate by client — keep only the most recent job per client
    const jobs = (data as JobWithDetails[]) || []
    const seen = new Map<string, ReminderClient>()

    for (const job of jobs) {
      const clientId = job.vehicles.clients.id
      if (seen.has(clientId)) continue

      const jobDate = new Date(job.updated_at)
      const diffMs = now.getTime() - jobDate.getTime()
      const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30))

      seen.set(clientId, {
        clientId,
        clientName: job.vehicles.clients.name,
        phone: job.vehicles.clients.phone_number,
        lastJobDate: jobDate.toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        vehicleMake: job.vehicles.make,
        vehicleModel: job.vehicles.model,
        licensePlate: job.vehicles.license_plate,
        monthsAgo: diffMonths,
      })
    }

    setReminders(Array.from(seen.values()))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  function handleSendReminder(reminder: ReminderClient) {
    const url = buildWhatsAppUrl(
      reminder.phone,
      reminder.clientName,
      reminder.vehicleMake,
      reminder.vehicleModel,
      garage?.garage_name ?? 'Your Garage'
    )
    window.open(url, '_blank', 'noopener,noreferrer')
    setSentIds((prev) => new Set(prev).add(reminder.clientId))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-5 w-5 text-amber-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Service Reminders</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Clients whose last service was ~6 months ago — a great time to reconnect.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReminders}
          className="gap-2 min-h-[44px] shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats bar */}
      {!loading && reminders.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Bell className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-600">
            <span className="font-bold tabular-nums">{reminders.length}</span>{' '}
            {reminders.length === 1 ? 'client' : 'clients'} due for a 6-month follow-up.
            {sentIds.size > 0 && (
              <span className="ml-1 text-emerald-700 font-medium">
                · {sentIds.size} reminder{sentIds.size > 1 ? 's' : ''} sent this session.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-zinc-700">All clear for now</p>
          <p className="text-sm text-zinc-400 mt-1 max-w-xs">
            No clients are due for a 6-month follow-up in the current window (5–7 months ago).
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => {
            const sent = sentIds.has(reminder.clientId)
            return (
              <div
                key={reminder.clientId}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${
                  sent
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* Client info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-zinc-900 truncate">{reminder.clientName}</p>
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 tabular-nums">
                      {reminder.monthsAgo}mo ago
                    </span>
                    {sent && (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        ✓ Sent
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {reminder.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {reminder.vehicleMake} {reminder.vehicleModel} · {reminder.licensePlate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last service: {reminder.lastJobDate}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <Button
                  type="button"
                  variant={sent ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleSendReminder(reminder)}
                  className="gap-2 min-h-[44px] shrink-0 w-full sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  {sent ? 'Send Again' : 'Send 6-Month Reminder'}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-zinc-400 pt-2">
        Tip: The reminder button opens WhatsApp Web/App with a pre-filled message. Send it with one tap.
      </p>
    </div>
  )
}
