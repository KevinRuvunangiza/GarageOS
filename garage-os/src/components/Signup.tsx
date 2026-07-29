import { useState, useEffect } from 'react'
import { Wrench, Loader2, Eye, EyeOff, MapPin, Phone, User, Building2, Mail, Lock, MailCheck } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { useAuth } from './AuthContext'
import { useLocalStorage } from '@/hooks/useLocalStorage'

interface SignupProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

interface SignupFormData {
  garageName: string
  garageAddress: string
  personalPhone: string
  garagePhone: string
  email: string
  password: string
}

const STORAGE_KEY = 'garageos_signup_draft'

const initialForm: SignupFormData = {
  garageName: '',
  garageAddress: '',
  personalPhone: '',
  garagePhone: '',
  email: '',
  password: '',
}

export function Signup({ onSuccess: _onSuccess, onSwitchToLogin }: SignupProps) {
  const [form, setForm, clearForm] = useLocalStorage<SignupFormData>(STORAGE_KEY, initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { signUp } = useAuth()

  // Debounced auto-save is handled by useLocalStorage directly
  // But we show a subtle indicator
  const [savedIndicator, setSavedIndicator] = useState(false)

  useEffect(() => {
    setSavedIndicator(true)
    const timer = setTimeout(() => setSavedIndicator(false), 1000)
    return () => clearTimeout(timer)
  }, [form])

  function updateField<K extends keyof SignupFormData>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Pass all garage metadata here. The DB trigger on auth.users
      // reads raw_user_meta_data and creates the garage row atomically —
      // no separate .insert() needed, no RLS race condition.
      const { data: authData, error: authError } = await signUp(
        form.email,
        form.password,
        {
          garage_name:    form.garageName,
          garage_address: form.garageAddress,
          personal_phone: form.personalPhone,
          garage_phone:   form.garagePhone,
        }
      )

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData?.user) {
        setError('Account created but user data unavailable. Please sign in.')
        return
      }

      // Clear localStorage draft and show verification UI
      clearForm()
      setIsSubmitted(true)
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 shadow-lg shadow-amber-500/20">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-zinc-900">
              Garage<span className="text-amber-500">OS</span>
            </span>
          </div>
          <Card className="shadow-lg border-zinc-200 text-center py-10 px-6">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <MailCheck className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-3">Check Your Email</h2>
            <p className="text-[15px] leading-relaxed text-zinc-600 mb-8 max-w-[300px] mx-auto">
              We’ve sent a confirmation link to your email. Please check your inbox and click the link to confirm your email and access your account.
            </p>
            <Button onClick={onSwitchToLogin} className="w-full h-11 text-base font-medium">
              Return to Login
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 shadow-lg shadow-amber-500/20">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-zinc-900">
            Garage<span className="text-amber-500">OS</span>
          </span>
        </div>

        <Card className="shadow-lg border-zinc-200">
          <CardHeader className="text-center pb-2">
            <CardTitle>Create Your Garage Account</CardTitle>
            <CardDescription>
              Set up your garage profile to start managing jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Garage Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  Garage Name
                </label>
                <Input
                  required
                  value={form.garageName}
                  onChange={(e) => updateField('garageName', e.target.value)}
                  placeholder="e.g. Joe's Auto Repair"
                />
              </div>

              {/* Garage Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  Garage Address
                </label>
                <Input
                  required
                  value={form.garageAddress}
                  onChange={(e) => updateField('garageAddress', e.target.value)}
                  placeholder="e.g. 123 Mechanic Street, Industrial Area"
                />
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                    Personal Phone
                  </label>
                  <Input
                    required
                    type="tel"
                    value={form.personalPhone}
                    onChange={(e) => updateField('personalPhone', e.target.value)}
                    placeholder="071 234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                    Garage Phone
                  </label>
                  <Input
                    required
                    type="tel"
                    value={form.garagePhone}
                    onChange={(e) => updateField('garagePhone', e.target.value)}
                    placeholder="011 555 0199"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  Email
                </label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@garage.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-400">Minimum 6 characters</p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className={`text-xs transition-opacity ${savedIndicator ? 'opacity-100 text-emerald-600' : 'opacity-0'}`}>
                  Draft saved
                </span>
              </div>

              <Button type="submit" className="w-full gap-2 min-h-[44px]" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm text-amber-500 hover:text-amber-600 font-medium"
              >
                Already have an account? Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
