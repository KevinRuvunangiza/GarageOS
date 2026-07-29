import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'pending' | 'inProgress' | 'done' | 'paid' | 'outline'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
          {
            'bg-zinc-100 text-zinc-800 border border-zinc-200': variant === 'default',
            'bg-zinc-100 text-zinc-600 border border-zinc-200': variant === 'pending',
            'bg-amber-50 text-amber-700 border border-amber-200': variant === 'inProgress',
            'bg-emerald-50 text-emerald-700 border border-emerald-200': variant === 'done',
            'bg-amber-50 text-amber-600 border border-amber-200': variant === 'paid',
            'border border-zinc-300 text-zinc-600 bg-transparent': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
