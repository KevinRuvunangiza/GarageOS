import { useState, useEffect, useCallback } from 'react'
import { Search, User, Car, Calendar, Gauge, Plus, ChevronRight, X, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { Button } from './ui/Button'
import { supabase } from '@/lib/supabaseClient'
import type { Client, Vehicle, JobWithDetails } from '@/types/database'

interface ClientWithSummary extends Client {
  vehicles: Vehicle[]
  totalJobs: number
  totalRevenue: number
}

interface ClientsViewProps {
  onNewJobForVehicle?: (client: Client, vehicle: Vehicle) => void
}

export function ClientsView({ onNewJobForVehicle }: ClientsViewProps) {
  const [clients, setClients] = useState<ClientWithSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<ClientWithSummary | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [vehicleJobs, setVehicleJobs] = useState<JobWithDetails[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select(`
        *,
        vehicles (*)
      `)
      .order('name', { ascending: true })

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      setLoading(false)
      return
    }

    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        vehicle_id,
        status,
        grand_total,
        total_estimated_cost
      `)

    if (jobsError) {
      console.error('Error fetching jobs summary:', jobsError)
    }

    const allJobs = jobsData || []
    const vehicleToClientMap = new Map<string, string>()

    ;(clientsData || []).forEach((c: any) => {
      (c.vehicles || []).forEach((v: Vehicle) => {
        vehicleToClientMap.set(v.id, c.id)
      })
    })

    const clientStats = new Map<string, { jobs: number; revenue: number }>()

    allJobs.forEach((j: any) => {
      const clientId = vehicleToClientMap.get(j.vehicle_id)
      if (clientId) {
        const stats = clientStats.get(clientId) || { jobs: 0, revenue: 0 }
        stats.jobs += 1
        if (j.status === 'paid') {
          stats.revenue += Number(j.grand_total || j.total_estimated_cost || 0)
        }
        clientStats.set(clientId, stats)
      }
    })

    const formatted: ClientWithSummary[] = (clientsData || []).map((c: any) => {
      const stats = clientStats.get(c.id) || { jobs: 0, revenue: 0 }
      return {
        ...c,
        vehicles: c.vehicles || [],
        totalJobs: stats.jobs,
        totalRevenue: stats.revenue,
      }
    })

    setClients(formatted)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const fetchVehicleJobs = useCallback(async (vehicleId: string) => {
    setJobsLoading(true)
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
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vehicle jobs:', error)
    } else {
      setVehicleJobs((data as JobWithDetails[]) || [])
    }
    setJobsLoading(false)
  }, [])

  useEffect(() => {
    if (selectedVehicleId) {
      fetchVehicleJobs(selectedVehicleId)
    }
  }, [selectedVehicleId, fetchVehicleJobs])

  const handleOpenClient = (client: ClientWithSummary) => {
    setSelectedClient(client)
    if (client.vehicles.length > 0) {
      setSelectedVehicleId(client.vehicles[0].id)
    } else {
      setSelectedVehicleId(null)
      setVehicleJobs([])
    }
  }

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true

    const matchesName = c.name.toLowerCase().includes(q)
    const matchesPhone = c.phone_number.toLowerCase().includes(q)
    const matchesEmail = (c.email || '').toLowerCase().includes(q)
    const matchesPlate = c.vehicles.some((v) => v.license_plate.toLowerCase().includes(q) || `${v.make} ${v.model}`.toLowerCase().includes(q))

    return matchesName || matchesPhone || matchesEmail || matchesPlate
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Clients &amp; Vehicle CRM</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Complete client directory and vehicle service medical charts
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name, phone, email, or plate..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-zinc-400"
        />
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-sm bg-white rounded-xl border border-zinc-200">
          Loading client directory...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 text-sm bg-white rounded-xl border border-zinc-200 border-dashed">
          No clients found matching "{searchQuery}"
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Vehicles</th>
                  <th className="py-3.5 px-4 text-right">Total Jobs</th>
                  <th className="py-3.5 px-4 text-right">Total Revenue</th>
                  <th className="py-3.5 px-4 text-center">Medical Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => handleOpenClient(client)}
                    className="hover:bg-amber-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs shrink-0 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{client.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono text-xs">
                      <div>{client.phone_number}</div>
                      {client.email && <div className="text-zinc-400 text-[11px] font-sans">{client.email}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {client.vehicles.map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[11px] font-mono text-zinc-700"
                          >
                            <Car className="h-3 w-3 text-zinc-400" />
                            {v.make} {v.model} ({v.license_plate})
                          </span>
                        ))}
                        {client.vehicles.length === 0 && (
                          <span className="text-zinc-400 text-xs italic">No vehicles</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-700">
                      {client.totalJobs}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-zinc-900">
                      R {client.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-zinc-500 group-hover:text-amber-600">
                        View Chart <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Medical Chart Modal / Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedClient(null)}
          />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden z-10 border-l border-zinc-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-zinc-200 bg-zinc-900 text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-amber-400" />
                  <h2 className="text-xl font-bold">{selectedClient.name}</h2>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-zinc-300 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                    {selectedClient.phone_number}
                  </span>
                  {selectedClient.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      {selectedClient.email}
                    </span>
                  )}
                  {selectedClient.address && (
                    <span className="flex items-center gap-1 font-sans text-zinc-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedClient.address}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Vehicle Tabs Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Registered Vehicles ({selectedClient.vehicles.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.vehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-sm'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        <Car className="h-4 w-4" />
                        <span>{v.make} {v.model}</span>
                        <span className="opacity-75">({v.license_plate})</span>
                      </button>
                    )
                  })}
                  {selectedClient.vehicles.length === 0 && (
                    <p className="text-sm text-zinc-400 italic">No vehicles associated with this client.</p>
                  )}
                </div>
              </div>

              {/* Action Button for Selected Vehicle */}
              {selectedVehicleId && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
                  {selectedClient.vehicles.find((v) => v.id === selectedVehicleId) && (
                    <div className="text-xs font-mono text-zinc-600">
                      VIN: <span className="font-bold text-zinc-800">{selectedClient.vehicles.find((v) => v.id === selectedVehicleId)?.vin || 'N/A'}</span>
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      const veh = selectedClient.vehicles.find((v) => v.id === selectedVehicleId)
                      if (veh && onNewJobForVehicle) {
                        onNewJobForVehicle(selectedClient, veh)
                        setSelectedClient(null)
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold gap-1.5 min-h-[38px] text-xs shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    + New Job for this Vehicle
                  </Button>
                </div>
              )}

              {/* Service History Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  Service History Timeline
                </h3>

                {jobsLoading ? (
                  <div className="p-8 text-center text-zinc-400 text-sm">Loading vehicle service timeline...</div>
                ) : vehicleJobs.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-xl">
                    No repair history recorded for this vehicle.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                    {vehicleJobs.map((job) => {
                      const isPaid = job.status === 'paid'
                      return (
                        <div key={job.id} className="relative group">
                          {/* Timeline bullet */}
                          <div className={`absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-white ${
                            isPaid ? 'border-emerald-500 bg-emerald-500' : 'border-amber-500'
                          }`} />

                          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                              <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                                <span className="flex items-center gap-1 font-medium text-zinc-800">
                                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                  {new Date(job.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                {job.odometer_km ? (
                                  <span className="flex items-center gap-1 text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                                    <Gauge className="h-3.5 w-3.5" />
                                    {job.odometer_km.toLocaleString()} km
                                  </span>
                                ) : null}
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {job.status === 'paid' ? 'Paid & Closed' : job.status.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Issue description */}
                            <div>
                              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Issue / Service Notes</p>
                              <p className="text-sm text-zinc-800 mt-0.5 whitespace-pre-wrap">{job.issue_description}</p>
                            </div>

                            {/* Itemized Parts & Labor */}
                            {job.job_items && job.job_items.length > 0 && (
                              <div className="bg-zinc-50/70 rounded-lg p-2.5 border border-zinc-100 space-y-1">
                                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Itemized Services &amp; Parts</p>
                                {job.job_items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between text-xs font-mono">
                                    <span className="text-zinc-700 capitalize">[{item.type}] {item.description}</span>
                                    <span className="text-zinc-900 font-medium">R {item.cost.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Total Billed */}
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-sm">
                              <span className="text-xs text-zinc-500 font-medium">Total Billed</span>
                              <span className="font-mono font-bold text-zinc-900 text-base">
                                R {(job.grand_total || job.total_estimated_cost || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
