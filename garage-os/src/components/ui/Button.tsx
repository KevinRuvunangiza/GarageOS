import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base: all buttons get smooth transition + press-down feel
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
          {
            'bg-amber-500 text-zinc-950 hover:bg-amber-600 font-semibold shadow-sm active:scale-[0.97]': variant === 'primary',
            'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm active:scale-[0.97]': variant === 'secondary',
            'border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.97]': variant === 'outline',
            'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:opacity-75': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.97]': variant === 'danger',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
