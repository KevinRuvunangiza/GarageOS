import { useState, useEffect } from 'react'
import { User, Building, ShieldAlert, Save, LogOut, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { useGarage } from '@/hooks/useGarage'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { PresetServicesManager } from './PresetServicesManager'

export function ProfileView() {
  const { garage, loading, fetchGarage } = useGarage()
  const { user, signOut } = useAuth()

  const [garageName, setGarageName] = useState('')
  const [garageAddress, setGarageAddress] = useState('')
  const [personalPhone, setPersonalPhone] = useState('')
  const [garagePhone, setGaragePhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (garage) {
      setGarageName(garage.garage_name || '')
      setGarageAddress(garage.garage_address || '')
      setPersonalPhone(garage.personal_phone || '')
      setGaragePhone(garage.garage_phone || '')
    }
  }, [garage])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setSavedSuccess(false)

    const { error } = await supabase
      .from('garages')
      .update({
        garage_name: garageName,
        garage_address: garageAddress,
        personal_phone: personalPhone,
        garage_phone: garagePhone,
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      console.error('Error updating garage profile:', error)
      alert('Failed to update profile')
    } else {
      setSavedSuccess(true)
      fetchGarage()
      setTimeout(() => setSavedSuccess(false), 3000)
    }
  }

  async function handleDeleteAccount() {
    if (!garage || confirmName.trim() !== garage.garage_name.trim()) {
      setDeleteError('Garage name does not match exactly.')
      return
    }

    setDeleting(true)
    setDeleteError('')

    try {
      const { error } = await supabase.rpc('delete_garage_account')
      if (error) throw error

      await signOut()
    } catch (err: any) {
      console.error('Error deleting account:', err)
      setDeleteError(err.message || 'Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Profile &amp; Governance</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage garage business details, subscription tier, and POPIA/GDPR privacy settings
          </p>
        </div>

        {/* Subscription Tier Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Subscription: <span className="uppercase font-bold tracking-wider">{garage?.subscription_status.replace('_', ' ') || 'Active'}</span>
        </div>
      </div>

      {/* Garage Details Form */}
      <Card className="border-zinc-200">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900">
            <Building className="h-4 w-4 text-amber-500" />
            Garage Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Garage Name</label>
                <Input
                  required
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  placeholder="e.g. Marco's Auto Repair"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Account Email</label>
                <Input
                  disabled
                  value={user?.email || ''}
                  className="bg-zinc-100 cursor-not-allowed font-mono text-xs text-zinc-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Physical Address</label>
              <Input
                required
                value={garageAddress}
                onChange={(e) => setGarageAddress(e.target.value)}
                placeholder="e.g. 123 Industrial Road, Cape Town"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Garage Workshop Phone</label>
                <Input
                  required
                  value={garagePhone}
                  onChange={(e) => setGaragePhone(e.target.value)}
                  placeholder="e.g. (021) 555-0199"
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Owner Mobile / Personal Phone</label>
                <Input
                  required
                  value={personalPhone}
                  onChange={(e) => setPersonalPhone(e.target.value)}
                  placeholder="e.g. 071 234 5678"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Profile saved successfully!
                </p>
              ) : <div />}

              <Button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold gap-2 min-h-[42px] px-6"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Business Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Session Actions */}
      <Card className="border-zinc-200">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900">
            <User className="h-4 w-4 text-zinc-600" />
            Session &amp; Security
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Active Session</p>
            <p className="text-xs text-zinc-500">Logged in as {user?.email}</p>
          </div>
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="text-zinc-700 hover:bg-zinc-100 border-zinc-300 gap-2 min-h-[40px]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Canned Services Manager */}
      <PresetServicesManager />

      {/* Danger Zone: POPIA/GDPR Account Deletion */}
      <Card className="border-red-200 bg-red-50/20">
        <CardHeader className="pb-3 border-b border-red-100">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            Danger Zone — POPIA / GDPR Data Erasure
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Per POPIA and GDPR compliance rules, you can permanently delete your garage workspace and purge all associated client records, vehicle logs, repair tickets, and financial data. <strong>This action cannot be undone.</strong>
          </p>
          <Button
            onClick={() => {
              setConfirmName('')
              setDeleteError('')
              setShowDeleteModal(true)
            }}
            variant="danger"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold gap-2 min-h-[42px]"
          >
            <AlertTriangle className="h-4 w-4" />
            Delete Account &amp; All Garage Data
          </Button>
        </CardContent>
      </Card>

      {/* POPIA Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-lg">Confirm Account Deletion</h3>
                <p className="text-xs text-red-600 font-semibold">POPIA Permanent Data Erasure</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              This will permanently purge your garage profile <strong>"{garage?.garage_name}"</strong> along with all clients, vehicles, job tickets, and financial records.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700">
                To confirm, type "<span className="select-all font-mono font-bold text-zinc-900">{garage?.garage_name}</span>" below:
              </label>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Type exact garage name to confirm"
                className="border-red-300 focus:ring-red-500 font-mono text-sm"
              />
            </div>

            {deleteError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleting || confirmName.trim() !== garage?.garage_name.trim()}
                onClick={handleDeleteAccount}
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Purging Data...
                  </>
                ) : (
                  'Permanently Delete Account'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
