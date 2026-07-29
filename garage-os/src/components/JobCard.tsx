import { Car, User, Phone, FileText, ChevronRight, Printer, Pencil, Trash2 } from 'lucide-react'
import { CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { JobWithDetails } from '@/types/database'
import { WhatsAppButton } from './WhatsAppButton'
import { cn } from '@/lib/utils'

interface JobCardProps {
  job: JobWithDetails
  onStatusChange: (jobId: string, newStatus: 'pending' | 'in_progress' | 'done' | 'paid') => void
  onPrint: (job: JobWithDetails) => void
  onView: (job: JobWithDetails) => void
  onEdit: (jobId: string) => void
  onDelete: (job: JobWithDetails) => void
}

/**
 * Status-specific left accent border colours so mechanics can
 * scan the board column at a glance without reading the badge.
 */
const STATUS_BORDER: Record<string, string> = {
  pending:     'border-l-stone-300',
  in_progress: 'border-l-amber-500',
  done:        'border-l-emerald-500',
  paid:        'border-l-emerald-600',
}

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     variant: 'pending'    as const },
  in_progress: { label: 'In Progress', variant: 'inProgress' as const },
  done:        { label: 'Ready',       variant: 'done'       as const },
  paid:        { label: 'Paid',        variant: 'paid'       as const },
}

const NEXT_STATUS: Record<string, 'pending' | 'in_progress' | 'done' | 'paid'> = {
  pending:     'in_progress',
  in_progress: 'done',
  done:        'paid',
}

export function JobCard({ job, onStatusChange, onPrint, onView, onEdit, onDelete }: JobCardProps) {
  const vehicle = job.vehicles
  const client  = vehicle.clients
  const total   = job.total_estimated_cost || job.job_items.reduce((sum, item) => sum + (item.cost || 0), 0)
  const status  = STATUS_CONFIG[job.status]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(job)}
      onKeyDown={(e) => e.key === 'Enter' && onView(job)}
      className={cn(
        // Layout & shape
        'group relative rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm',
        // Thick status accent on the left edge
        'border-l-4',
        STATUS_BORDER[job.status],
        // Micro-interactions: lift on hover, press on active
        'cursor-pointer select-none',
        'transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-md',
        'active:scale-[0.97] active:shadow-sm active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
      )}
    >
      <CardContent className="p-3 sm:p-4">
        {/* ── Header row: vehicle + badge ──────────────────────── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <Car className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-zinc-900 text-sm truncate">
                {vehicle.make} {vehicle.model}
              </h4>
              <p className="text-xs text-zinc-500 font-mono tracking-wide">
                {vehicle.license_plate}
              </p>
            </div>
          </div>
          <Badge variant={status.variant} className="shrink-0 ml-2">{status.label}</Badge>
        </div>

        {/* ── Client info + issue ──────────────────────────────── */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{client.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="font-mono">{client.phone_number}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-zinc-600">
            <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{job.issue_description}</span>
          </div>
        </div>

        {/* ── Footer: total + actions ──────────────────────────── */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div className="text-sm">
            <span className="text-zinc-500">Total:</span>{' '}
            <span className="font-bold text-zinc-900 font-mono tabular-nums">
              R {total.toFixed(2)}
            </span>
          </div>
          {/* Stop card click propagating to action buttons */}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {job.status === 'done' && (
              <WhatsAppButton
                phoneNumber={client.phone_number}
                vehicleMake={vehicle.make}
                vehicleModel={vehicle.model}
                licensePlate={vehicle.license_plate}
                totalAmount={total}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPrint(job)}
              className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
              title="Print Invoice"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(job.id)}
              className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(job)}
              className="h-8 w-8 p-0 min-h-[44px] min-w-[44px] text-zinc-400 hover:text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {job.status !== 'paid' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(job.id, NEXT_STATUS[job.status])}
                className="h-8 px-2 text-xs gap-1 min-h-[44px] hover:bg-amber-50 hover:text-amber-600"
              >
                {job.status === 'pending'     && 'Start'}
                {job.status === 'in_progress' && 'Complete'}
                {job.status === 'done'        && 'Mark Paid'}
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  )
}
