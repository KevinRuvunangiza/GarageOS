import { useState, useEffect } from 'react'
import { Wrench, Sparkles, Zap, Shield, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { useGarage } from '@/hooks/useGarage'
import { Loader2 } from 'lucide-react'

interface SubscriptionGateProps {
  onContinue: () => void
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export function SubscriptionGate({ onContinue }: SubscriptionGateProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const { garage, applyPromoCode } = useGarage()

  // Auto-dismiss toast after 3.5s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleApplyCode() {
    const trimmed = code.trim()
    if (!trimmed) {
      setToast({ type: 'error', message: 'Please enter an access code.' })
      return
    }

    setLoading(true)
    const result = await applyPromoCode(trimmed)
    setLoading(false)

    if (!result.success) {
      setToast({ type: 'error', message: result.message || 'Invalid or expired promo code.' })
      return
    }

    const isLifetime = result.type === 'lifetime'
    setToast({
      type: 'success',
      message: isLifetime
        ? '🎉 Welcome to GarageOS! Lifetime access unlocked.'
        : '🎉 Welcome to GarageOS! Your 14-day trial has started.',
    })

    setTimeout(() => onContinue(), 1400)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex flex-col items-center justify-center px-4 py-8">

      {/* ── Amber Toast ─────────────────────────────────────────── */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-500 ${
          toast
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        } ${
          toast?.type === 'success'
            ? 'bg-amber-500 border-amber-400 text-white'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}
      >
        {toast?.type === 'success' ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0" />
        )}
        {toast?.message}
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 shadow-lg">
            <Wrench className="h-6 w-6 text-amber-500" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-zinc-900">
            Garage<span className="text-amber-500">OS</span>
          </span>
        </div>

        {/* Main Gate Card */}
        <Card className="shadow-xl border-stone-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl">Unlock Your Garage</CardTitle>
            <CardDescription className="mt-1">
              {garage?.subscription_status === 'expired'
                ? 'Your access has expired. Enter a new access code to continue.'
                : 'Enter your access code to activate GarageOS for your garage.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">

            {/* Code Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Access Code / Promo Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="uppercase font-mono font-semibold tracking-widest"
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleApplyCode()}
                  autoFocus
                />
                <Button
                  onClick={handleApplyCode}
                  disabled={loading}
                  className="gap-1.5 min-w-[100px] min-h-[44px] shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { icon: Shield, label: 'Lifetime Access', sub: 'One-time code' },
                { icon: Clock, label: '14-Day Trial', sub: 'Trial code' },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5"
                >
                  <Icon className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">{label}</p>
                    <p className="text-[10px] text-zinc-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-400">Don't have a code?</span>
              </div>
            </div>

            <p className="text-xs text-center text-zinc-500 leading-relaxed">
              Contact us at{' '}
              <span className="font-semibold text-amber-600">hello@garageos.app</span>
              {' '}to get your access code.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
