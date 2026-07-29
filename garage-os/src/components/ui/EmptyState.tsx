import { type LucideIcon, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Lucide icon component to display — defaults to ClipboardList */
  icon?: LucideIcon
  /** Bold heading text */
  heading: string
  /** Muted supporting subtitle */
  subheading?: string
  /** Primary CTA button label */
  actionLabel?: string
  /** Primary CTA handler */
  onAction?: () => void
  /** Extra classes on the root wrapper */
  className?: string
}

/**
 * Reusable empty-state panel with a large muted icon, friendly heading,
 * subtitle, and an optional primary call-to-action button.
 *
 * Usage:
 *   <EmptyState
 *     icon={Car}
 *     heading="The garage floor is clear!"
 *     subheading="Add a new job ticket to get started."
 *     actionLabel="+ New Job"
 *     onAction={() => onNavigate('new-job')}
 *   />
 */
export function EmptyState({
  icon: Icon = ClipboardList,
  heading,
  subheading,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-20 px-6 gap-5',
        className
      )}
    >
      {/* Icon bubble */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-stone-100 border border-stone-200 shadow-inner">
        <Icon className="h-9 w-9 text-stone-400" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-base font-semibold text-zinc-800 tracking-tight">
          {heading}
        </h3>
        {subheading && (
          <p className="text-sm text-zinc-500 leading-relaxed">
            {subheading}
          </p>
        )}
      </div>

      {/* CTA */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1 h-11 px-5 rounded-xl bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-600 transition-all duration-150 active:scale-[0.97] shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
