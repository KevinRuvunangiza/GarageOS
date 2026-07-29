import { X, Car, User, Phone, FileText, Calendar, Wrench, Package } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { JobWithDetails } from '@/types/database'

interface JobDetailModalProps {
  job: JobWithDetails | null
  onClose: () => void
  onEdit: (job: JobWithDetails) => void
  onDelete: (job: JobWithDetails) => void
  onPrint: (job: JobWithDetails) => void
}

export function JobDetailModal({ job, onClose, onEdit, onDelete, onPrint }: JobDetailModalProps) {
  if (!job) return null

  const vehicle = job.vehicles
  const client = vehicle.clients
  const items = job.job_items || []
  const total = job.total_estimated_cost || items.reduce((sum, item) => sum + (item.cost || 0), 0)

  const statusConfig = {
    pending: { label: 'Pending', variant: 'pending' as const },
    in_progress: { label: 'In Progress', variant: 'inProgress' as const },
    done: { label: 'Ready for Pickup', variant: 'done' as const },
    paid: { label: 'Paid & Closed', variant: 'paid' as const },
  }

  const status = statusConfig[job.status]
  const createdDate = new Date(job.created_at).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-[150] flex items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-8">
      <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-xl sm:shadow-2xl sm:border sm:border-zinc-200 h-full sm:h-auto overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <Car className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-xs text-zinc-500 font-mono">{vehicle.license_plate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Client
              </h3>
              <p className="font-semibold text-zinc-900">{client.name}</p>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-600">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                {client.phone_number}
              </div>
            </div>
            <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Job Info
              </h3>
              <p className="text-sm text-zinc-600">Created: {createdDate}</p>
              <p className="text-sm text-zinc-600 mt-1">Job ID: {job.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Issue / Service Description
            </h3>
            <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{job.issue_description}</p>
            </div>
          </div>

          {/* Itemized Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Itemized Breakdown
            </h3>
            {items.length > 0 ? (
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-zinc-500">Type</th>
                      <th className="text-left px-4 py-2 font-medium text-zinc-500">Description</th>
                      <th className="text-right px-4 py-2 font-medium text-zinc-500">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5 capitalize">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${item.type === 'part' ? 'text-amber-600' : 'text-amber-700'}`}>
                            {item.type === 'part' ? <Package className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700">{item.description}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-700">
                          R {item.cost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-lg">
                No itemized entries for this job
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
            <span className="text-sm text-zinc-500">Total Estimated Cost</span>
            <span className="text-2xl font-bold text-zinc-900 font-mono">
              R {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onPrint(job)} className="gap-2 min-h-[44px]">
            Print Invoice
          </Button>
          <Button variant="outline" onClick={() => onEdit(job)} className="gap-2 min-h-[44px]">
            Edit Job
          </Button>
          <Button variant="danger" onClick={() => onDelete(job)} className="gap-2 min-h-[44px]">
            Delete Ticket
          </Button>
        </div>
      </div>
    </div>
  )
}
