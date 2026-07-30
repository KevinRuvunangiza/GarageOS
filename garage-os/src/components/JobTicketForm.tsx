import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, Save, ClipboardList, Gauge, RotateCcw, CheckCircle2, Search, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { FuelGauge } from './ui/FuelGauge'
import { DamageTagInput } from './ui/DamageTagInput'
import { ItemizedEstimator, EstimatorItem } from './ItemizedEstimator'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from './AuthContext'
import { useGarage } from '@/hooks/useGarage'
import { useJobDraft } from '@/hooks/useJobDraft'
import type { FuelLevel, Client, Vehicle } from '@/types/database'

type ClientSearchResult = Client & { vehicles: Vehicle[] }

interface JobTicketFormProps {
  editJobId?: string | null
  initialClient?: Client | null
  initialVehicle?: Vehicle | null
  onSuccess: () => void
  onCancel: () => void
}

export function JobTicketForm({ editJobId, initialClient, initialVehicle, onSuccess, onCancel }: JobTicketFormProps) {
  const { user } = useAuth()
  const { garage } = useGarage()
  const { draft, lastSaved, saveDraft, clearDraft } = useJobDraft()

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(!!editJobId)

  // Client
  const [clientName, setClientName] = useState(initialClient?.name || '')
  const [phoneNumber, setPhoneNumber] = useState(initialClient?.phone_number || '')
  const [email, setEmail] = useState(initialClient?.email || '')
  const [address, setAddress] = useState(initialClient?.address || '')
  const [notes, setNotes] = useState(initialClient?.notes || '')
  const [clientId, setClientId] = useState<string | null>(initialClient?.id || null)

  // Smart Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'new'>('new')

  // Vehicle
  const [make, setMake] = useState(initialVehicle?.make || '')
  const [model, setModel] = useState(initialVehicle?.model || '')
  const [year, setYear] = useState(initialVehicle?.year ? String(initialVehicle.year) : '')
  const [licensePlate, setLicensePlate] = useState(initialVehicle?.license_plate || '')
  const [vin, setVin] = useState(initialVehicle?.vin || '')
  const [vehicleId, setVehicleId] = useState<string | null>(initialVehicle?.id || null)

  // Vehicle Intake Checklist
  const [fuelLevel, setFuelLevel] = useState<FuelLevel | null>(null)
  const [preExistingDamage, setPreExistingDamage] = useState<string[]>([])
  const [odometerKm, setOdometerKm] = useState('')

  // Job
  const [issueDescription, setIssueDescription] = useState('')
  const [items, setItems] = useState<EstimatorItem[]>([])
  const [totalCost, setTotalCost] = useState(0)

  const isEditing = !!editJobId

  // Debounced Search Effect
  useEffect(() => {
    if (isEditing || selectedClient || searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const handler = setTimeout(async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('garage_id', garage?.id || '')
        .or(`name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
        .limit(5)

      if (error) {
        console.error('Error searching clients:', error)
      } else {
        setSearchResults(data as ClientSearchResult[])
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery, isEditing, selectedClient, garage?.id])

  // Select existing client
  const handleSelectClient = (client: ClientSearchResult) => {
    setSelectedClient(client)
    setClientId(client.id)
    setClientName(client.name)
    setPhoneNumber(client.phone_number)
    setEmail(client.email || '')
    setAddress(client.address || '')
    setNotes(client.notes || '')
    
    // Auto-select their only vehicle if they just have 1
    if (client.vehicles.length === 1) {
      handleSelectVehicle(client.vehicles[0])
    } else {
      setSelectedVehicleId('new')
      clearVehicleFields()
    }
  }

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id)
    setVehicleId(vehicle.id)
    setMake(vehicle.make)
    setModel(vehicle.model)
    setYear(vehicle.year ? String(vehicle.year) : '')
    setLicensePlate(vehicle.license_plate)
    setVin(vehicle.vin || '')
  }

  const clearVehicleFields = () => {
    setVehicleId(null)
    setMake('')
    setModel('')
    setYear('')
    setLicensePlate('')
    setVin('')
  }

  const resetClientSelection = () => {
    setSelectedClient(null)
    setClientId(null)
    setSearchQuery('')
    setSelectedVehicleId('new')
    clearVehicleFields()
    setClientName('')
    setPhoneNumber('')
    setEmail('')
    setAddress('')
    setNotes('')
  }

  // Auto-restore draft for new jobs if draft exists
  useEffect(() => {
    if (!isEditing && !initialClient && draft) {
      if (draft.clientName) setClientName(draft.clientName)
      if (draft.phoneNumber) setPhoneNumber(draft.phoneNumber)
      if (draft.email) setEmail(draft.email)
      if (draft.address) setAddress(draft.address)
      if (draft.notes) setNotes(draft.notes)

      if (draft.make) setMake(draft.make)
      if (draft.model) setModel(draft.model)
      if (draft.year) setYear(draft.year)
      if (draft.licensePlate) setLicensePlate(draft.licensePlate)
      if (draft.vin) setVin(draft.vin)

      if (draft.fuelLevel) setFuelLevel(draft.fuelLevel)
      if (draft.preExistingDamage) setPreExistingDamage(draft.preExistingDamage)
      if (draft.odometerKm) setOdometerKm(draft.odometerKm)

      if (draft.issueDescription) setIssueDescription(draft.issueDescription)
      if (draft.items && draft.items.length > 0) setItems(draft.items)
    }
  }, [isEditing, initialClient])

  // Auto-save draft on input change for new jobs
  useEffect(() => {
    if (isEditing) return
    const hasData = clientName || phoneNumber || make || model || licensePlate || issueDescription || items.length > 0
    if (hasData) {
      saveDraft({
        clientName,
        phoneNumber,
        email,
        address,
        notes,
        make,
        model,
        year,
        licensePlate,
        vin,
        fuelLevel,
        preExistingDamage,
        issueDescription,
        odometerKm,
        items,
      })
    }
  }, [
    isEditing,
    clientName,
    phoneNumber,
    email,
    address,
    notes,
    make,
    model,
    year,
    licensePlate,
    vin,
    fuelLevel,
    preExistingDamage,
    issueDescription,
    odometerKm,
    items,
    saveDraft,
  ])

  // Fetch existing data if editing
  useEffect(() => {
    if (!editJobId) return

    async function fetchJobData() {
      setFetchLoading(true)
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
        .eq('id', editJobId!)
        .single()

      if (error || !data) {
        console.error('Error fetching job for edit:', error)
        alert('Failed to load job data')
        onCancel()
        return
      }

      const job = data as any
      const vehicle = job.vehicles
      const client = vehicle.clients

      setClientName(client.name || '')
      setPhoneNumber(client.phone_number || '')
      setEmail(client.email || '')
      setAddress(client.address || '')
      setNotes(client.notes || '')
      setClientId(client.id)

      setMake(vehicle.make || '')
      setModel(vehicle.model || '')
      setYear(vehicle.year ? String(vehicle.year) : '')
      setLicensePlate(vehicle.license_plate || '')
      setVin(vehicle.vin || '')
      setVehicleId(vehicle.id)

      setIssueDescription(job.issue_description || '')
      setTotalCost(job.grand_total || job.total_estimated_cost || 0)
      setOdometerKm(job.odometer_km ? String(job.odometer_km) : '')

      setFuelLevel(job.fuel_level ?? null)
      setPreExistingDamage(job.pre_existing_damage ?? [])

      if (job.job_items && job.job_items.length > 0) {
        setItems(
          job.job_items.map((item: any) => ({
            id: item.id,
            type: item.type,
            description: item.description,
            cost: item.cost,
          }))
        )
      }

      setFetchLoading(false)
    }

    fetchJobData()
  }, [editJobId, onCancel])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      alert('You must be signed in.')
      return
    }

    if (!garage) {
      alert('Garage profile not found. Please complete your account setup.')
      return
    }

    setLoading(true)

    // Calculate parts vs labor totals
    const partsCostTotal = items.filter(i => i.type === 'part').reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
    const laborCostTotal = items.filter(i => i.type === 'labor').reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
    const grandTotal = totalCost || (partsCostTotal + laborCostTotal)
    const parsedOdo = odometerKm ? parseInt(odometerKm, 10) : 0
    const parsedYear = year ? parseInt(year, 10) : null

    try {
      if (isEditing && clientId && vehicleId && editJobId) {
        // UPDATE MODE
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            name: clientName,
            phone_number: phoneNumber,
            email,
            address,
            notes,
          })
          .eq('id', clientId)

        if (clientError) throw clientError

        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({
            make,
            model,
            year: parsedYear,
            license_plate: licensePlate.toUpperCase(),
            vin,
          })
          .eq('id', vehicleId)

        if (vehicleError) throw vehicleError

        const { error: jobError } = await supabase
          .from('jobs')
          .update({
            issue_description: issueDescription,
            total_estimated_cost: grandTotal,
            grand_total: grandTotal,
            parts_cost_total: partsCostTotal,
            labor_cost_total: laborCostTotal,
            odometer_km: parsedOdo,
            fuel_level: fuelLevel,
            pre_existing_damage: preExistingDamage,
          })
          .eq('id', editJobId)

        if (jobError) throw jobError

        // Replace job items in background
        supabase
          .from('job_items')
          .delete()
          .eq('job_id', editJobId)
          .then(({ error: deleteItemsError }) => {
            if (deleteItemsError) {
              console.error('Error deleting old job items:', deleteItemsError)
              return
            }
            if (items.length > 0) {
              const jobItems = items.map((item) => ({
                job_id: editJobId,
                type: item.type,
                description: item.description,
                cost: item.cost,
                garage_id: garage.id,
              }))
              supabase.from('job_items').insert(jobItems).then(({ error: itemsError }) => {
                if (itemsError) console.error('Error saving job items:', itemsError)
              })
            }
          })
      } else {
        // CREATE MODE
        let targetClientId = clientId

        if (!targetClientId) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: clientName,
              phone_number: phoneNumber,
              email,
              address,
              notes,
              garage_id: garage.id,
            })
            .select()
            .single()

          if (clientError) throw clientError
          targetClientId = clientData.id
        }

        let targetVehicleId = vehicleId

        if (!targetVehicleId) {
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .insert({
              client_id: targetClientId,
              make,
              model,
              year: parsedYear,
              license_plate: licensePlate.toUpperCase(),
              vin,
              garage_id: garage.id,
            })
            .select()
            .single()

          if (vehicleError) throw vehicleError
          targetVehicleId = vehicleData.id
        }

        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .insert({
            vehicle_id: targetVehicleId,
            status: 'pending',
            issue_description: issueDescription,
            total_estimated_cost: grandTotal,
            grand_total: grandTotal,
            parts_cost_total: partsCostTotal,
            labor_cost_total: laborCostTotal,
            odometer_km: parsedOdo,
            fuel_level: fuelLevel,
            pre_existing_damage: preExistingDamage,
            garage_id: garage.id,
          })
          .select()
          .single()

        if (jobError) throw jobError

        if (items.length > 0) {
          const jobItems = items.map((item) => ({
            job_id: jobData.id,
            type: item.type,
            description: item.description,
            cost: item.cost,
            garage_id: garage.id,
          }))

          supabase.from('job_items').insert(jobItems).then(({ error: itemsError }) => {
            if (itemsError) console.error('Error saving job items in background:', itemsError)
          })
        }
      }

      // Clear draft on successful creation
      clearDraft()
      onSuccess()
    } catch (error) {
      console.error('Error saving job ticket:', error)
      alert('Failed to save job ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header & Draft Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1 min-h-[40px]">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
            {isEditing ? 'Edit Job Ticket' : 'New Job Ticket'}
          </h1>
        </div>

        {/* Auto-save draft status badge */}
        {!isEditing && lastSaved && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Draft Saved ({lastSaved})
            </span>
            <button
              type="button"
              onClick={() => {
                clearDraft()
                setClientName('')
                setPhoneNumber('')
                setEmail('')
                setAddress('')
                setNotes('')
                setMake('')
                setModel('')
                setYear('')
                setLicensePlate('')
                setVin('')
                setFuelLevel(null)
                setPreExistingDamage([])
                setOdometerKm('')
                setIssueDescription('')
                setItems([])
              }}
              className="text-zinc-400 hover:text-red-600 ml-1 p-0.5"
              title="Discard draft"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-zinc-900 flex items-center justify-between">
              Client Information
              {selectedClient && !isEditing && (
                <button
                  type="button"
                  onClick={resetClientSelection}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <X className="h-3 w-3" />
                  Change Client
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* ── EDITING MODE: plain fields ── */}
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Client Name *</label>
                    <Input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. John Smith" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Phone Number *</label>
                    <Input required type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 071 234 5678" className="font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Email Address</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. john@example.com" className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Physical Address</label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 45 Main Street, Rondebosch" />
                  </div>
                </div>
              </>
            ) : selectedClient ? (
              /* ── LOCKED: existing client selected ── */
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3.5">
                <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900">{selectedClient.name}</p>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">{selectedClient.phone_number}</p>
                  {selectedClient.email && <p className="text-xs text-zinc-400 truncate mt-0.5">{selectedClient.email}</p>}
                  <p className="text-xs text-amber-700 font-medium mt-1">
                    {selectedClient.vehicles.length} vehicle{selectedClient.vehicles.length !== 1 ? 's' : ''} on record
                  </p>
                </div>
              </div>
            ) : (
              /* ── SEARCH: new job, no client selected ── */
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="h-3 w-3" />
                    Search Client by Name or Phone
                  </label>
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Start typing a name or phone number…"
                      className="pr-8"
                      autoComplete="off"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />
                    )}
                    {searchQuery && !isSearching && (
                      <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Search dropdown */}
                    {searchQuery.length >= 2 && !isSearching && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg overflow-hidden">
                        {searchResults.length > 0 ? (
                          <>
                            {searchResults.map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => handleSelectClient(client)}
                                className="w-full flex items-center justify-between px-3 py-3 hover:bg-amber-50 active:bg-amber-100 transition-colors border-b border-stone-100 last:border-0 min-h-[48px] text-left"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-zinc-900 truncate">{client.name}</p>
                                  <p className="text-xs font-mono text-zinc-500">{client.phone_number}</p>
                                </div>
                                <span className="shrink-0 ml-3 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  {client.vehicles.length} vehicle{client.vehicles.length !== 1 ? 's' : ''}
                                </span>
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="px-3 py-3 text-xs text-zinc-500">
                            No existing clients found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Always show new client fields if no existing client is selected */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-stone-200" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">New Client Profile</span>
                    <div className="h-px flex-1 bg-stone-200" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Client Name *</label>
                      <Input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. John Smith" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Phone Number *</label>
                      <Input required type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 071 234 5678" className="font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Email Address</label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. john@example.com" className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Physical Address</label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 45 Main Street, Rondebosch" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-zinc-900">Vehicle Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* ── EXISTING CLIENT: show vehicle radio pills ── */}
            {selectedClient && !isEditing && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Select Vehicle</label>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.vehicles.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVehicle(v)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${
                        selectedVehicleId === v.id
                          ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                          : 'bg-white border-stone-200 text-zinc-700 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      <span>{v.make} {v.model}</span>
                      <span className={`font-mono text-xs font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        selectedVehicleId === v.id ? 'bg-amber-600 text-amber-100' : 'bg-stone-100 text-zinc-600'
                      }`}>
                        {v.license_plate}
                      </span>
                    </button>
                  ))}
                  {/* Add New Vehicle option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVehicleId('new')
                      clearVehicleFields()
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${
                      selectedVehicleId === 'new'
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm'
                        : 'bg-white border-stone-200 text-zinc-500 border-dashed hover:border-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    + Add New Vehicle
                  </button>
                </div>
              </div>
            )}

            {/* ── Vehicle input fields: always for new client, only for "new" selection for existing ── */}
            {(!selectedClient || selectedVehicleId === 'new') && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Make *</label>
                    <Input
                      required={!selectedClient || selectedVehicleId === 'new'}
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="e.g. Toyota"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Model *</label>
                    <Input
                      required={!selectedClient || selectedVehicleId === 'new'}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Hilux"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Year</label>
                    <Input
                      type="number"
                      placeholder="e.g. 2019"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">License Plate *</label>
                    <Input
                      required={!selectedClient || selectedVehicleId === 'new'}
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                      placeholder="e.g. CA 123-456"
                      className="uppercase font-mono font-bold tracking-wider"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5 text-zinc-500" />
                      Odometer Reading (km)
                    </label>
                    <Input
                      type="number"
                      value={odometerKm}
                      onChange={(e) => setOdometerKm(e.target.value)}
                      placeholder="e.g. 142500"
                      className="font-mono tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">VIN / Chassis Number</label>
                    <Input
                      value={vin}
                      onChange={(e) => setVin(e.target.value.toUpperCase())}
                      placeholder="e.g. AHTKB320490123"
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Odometer always visible when an existing vehicle is selected ── */}
            {selectedClient && selectedVehicleId !== 'new' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5 text-zinc-500" />
                  Odometer Reading (km)
                </label>
                <Input
                  type="number"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  placeholder="e.g. 142500"
                  className="font-mono tabular-nums"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Intake Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base font-bold text-zinc-900">Vehicle Intake Checklist</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Fuel Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Fuel Level at Intake
              </label>
              <FuelGauge value={fuelLevel} onChange={setFuelLevel} />
            </div>

            <div className="border-t border-zinc-100" />

            {/* Pre-existing Damage */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Pre-existing Damage / Body Condition
              </label>
              <DamageTagInput
                value={preExistingDamage}
                onChange={setPreExistingDamage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-zinc-900">Issue &amp; Repair Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Mechanic Issue / Diagnostic Description *</label>
              <textarea
                required
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issue reported by the client or required service..."
                rows={3}
                className="flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Itemized Estimator */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <ItemizedEstimator
              items={items}
              onItemsChange={setItems}
              onTotalChange={setTotalCost}
            />
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px]">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold gap-2 min-h-[44px] px-6">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Ticket...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? 'Update Job Ticket' : 'Save & Create Job'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
