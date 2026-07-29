import { useState, useEffect, useCallback } from 'react'
import { Clock, CheckCircle, DollarSign, Wrench, Loader2, Wrench as WrenchIcon, Car, Receipt } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { JobCard } from './JobCard'
import { Button } from './ui/Button'
import { EmptyState } from './ui/EmptyState'
import { JobWithDetails } from '@/types/database'
import { supabase } from '@/lib/supabaseClient'
import { JobDetailModal } from './JobDetailModal'
import { ConfirmDialog } from './ConfirmDialog'

interface DashboardProps {
  onPrintJob: (job: JobWithDetails) => void
  onEditJob: (jobId: string) => void
  /** Bubble active job count up so the sidebar stats widget can show it */
  onActiveJobCountChange?: (count: number) => void
}

export function Dashboard({ onPrintJob, onEditJob, onActiveJobCountChange }: DashboardProps) {
  const [jobs, setJobs] = useState<JobWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeColumn, setActiveColumn] = useState<string>('all')

  // Modal states
  const [detailJob, setDetailJob] = useState<JobWithDetails | null>(null)
  const [deleteJob, setDeleteJob] = useState<JobWithDetails | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
    } else {
      const fetched = (data as JobWithDetails[]) || []
      setJobs(fetched)
      const active = fetched.filter(j => j.status === 'pending' || j.status === 'in_progress').length
      onActiveJobCountChange?.(active)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  async function handleStatusChange(jobId: string, newStatus: 'pending' | 'in_progress' | 'done' | 'paid') {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId)

      if (error) throw error
      fetchJobs()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please check your connection.')
    }
  }

  async function handleDelete() {
    if (!deleteJob) return
    setDeleteLoading(true)

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', deleteJob.id)

      if (error) throw error
      
      setDeleteJob(null)
      fetchJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job ticket. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      job.vehicles.license_plate.toLowerCase().includes(query) ||
      job.vehicles.clients.name.toLowerCase().includes(query) ||
      job.vehicles.make.toLowerCase().includes(query) ||
      job.vehicles.model.toLowerCase().includes(query)

    if (activeColumn === 'all') return matchesSearch
    if (activeColumn === 'garage') return matchesSearch && (job.status === 'pending' || job.status === 'in_progress')
    if (activeColumn === 'ready') return matchesSearch && job.status === 'done'
    if (activeColumn === 'paid') return matchesSearch && job.status === 'paid'
    return matchesSearch
  })

  const garageJobs = filteredJobs.filter(j => j.status === 'pending' || j.status === 'in_progress')
  const readyJobs = filteredJobs.filter(j => j.status === 'done')
  const paidJobs = filteredJobs.filter(j => j.status === 'paid')

  const stats = {
    inGarage: jobs.filter(j => j.status === 'pending' || j.status === 'in_progress').length,
    ready: jobs.filter(j => j.status === 'done').length,
    paid: jobs.filter(j => j.status === 'paid').length,
    totalRevenue: jobs
      .filter(j => j.status === 'paid')
      .reduce((sum, j) => sum + (j.total_estimated_cost || 0), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-zinc-500">In Garage</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900">{stats.inGarage}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-zinc-500">Ready for Pickup</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900">{stats.ready}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-zinc-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-zinc-500">Revenue (Paid)</p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900">R {stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <div className="flex items-center gap-1 bg-white rounded-lg border border-zinc-200 p-1 shadow-sm w-full sm:w-auto overflow-x-auto">
          <Button
            variant={activeColumn === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveColumn('all')}
            className="min-h-[40px]"
          >
            All
          </Button>
          <Button
            variant={activeColumn === 'garage' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveColumn('garage')}
            className="min-h-[40px]"
          >
            In Garage
          </Button>
          <Button
            variant={activeColumn === 'ready' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveColumn('ready')}
            className="min-h-[40px]"
          >
            Ready
          </Button>
          <Button
            variant={activeColumn === 'paid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveColumn('paid')}
            className="min-h-[40px]"
          >
            Paid
          </Button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* In Garage Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="h-4 w-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-700 text-sm uppercase tracking-wider">
              In Garage
            </h3>
            <span className="ml-auto bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {garageJobs.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[100px]">
            {garageJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                onPrint={onPrintJob}
                onView={setDetailJob}
                onEdit={onEditJob}
                onDelete={setDeleteJob}
              />
            ))}
            {garageJobs.length === 0 && (
              <EmptyState
                icon={WrenchIcon}
                heading="The garage floor is clear!"
                subheading="Add a new job ticket to get started."
                className="py-10"
              />
            )}
          </div>
        </div>

        {/* Ready for Pickup Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h3 className="font-semibold text-zinc-700 text-sm uppercase tracking-wider">
              Ready for Pickup
            </h3>
            <span className="ml-auto bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {readyJobs.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[100px]">
            {readyJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                onPrint={onPrintJob}
                onView={setDetailJob}
                onEdit={onEditJob}
                onDelete={setDeleteJob}
              />
            ))}
            {readyJobs.length === 0 && (
              <EmptyState
                icon={Car}
                heading="Nothing ready yet"
                subheading="Jobs you complete will queue here for pickup."
                className="py-10"
              />
            )}
          </div>
        </div>

        {/* Paid & Closed Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <DollarSign className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-zinc-700 text-sm uppercase tracking-wider">
              Paid & Closed
            </h3>
            <span className="ml-auto bg-amber-50 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {paidJobs.length}
            </span>
          </div>
          <div className="space-y-3 min-h-[100px]">
            {paidJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                onPrint={onPrintJob}
                onView={setDetailJob}
                onEdit={onEditJob}
                onDelete={setDeleteJob}
              />
            ))}
            {paidJobs.length === 0 && (
              <EmptyState
                icon={Receipt}
                heading="No closed tickets yet"
                subheading="Paid & closed jobs will appear here."
                className="py-10"
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailJob && (
        <JobDetailModal
          job={detailJob}
          onClose={() => setDetailJob(null)}
          onEdit={(job) => {
            setDetailJob(null)
            onEditJob(job.id)
          }}
          onDelete={(job) => {
            setDetailJob(null)
            setDeleteJob(job)
          }}
          onPrint={(job) => {
            setDetailJob(null)
            onPrintJob(job)
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteJob}
        title="Delete Job Ticket?"
        message={`Are you sure you want to delete the job for ${deleteJob?.vehicles.make} ${deleteJob?.vehicles.model} (${deleteJob?.vehicles.license_plate})? This action cannot be undone.`}
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteJob(null)}
      />
    </div>
  )
}
