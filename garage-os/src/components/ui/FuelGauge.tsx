import { cn } from '@/lib/utils'
import type { FuelLevel } from '@/types/database'

const LEVELS: { value: FuelLevel; label: string }[] = [
  { value: 'E',   label: 'E' },
  { value: '1/4', label: '¼' },
  { value: '1/2', label: '½' },
  { value: '3/4', label: '¾' },
  { value: 'F',   label: 'F' },
]

// Color ramp: E=red → 1/4=orange → 1/2=amber → 3/4=lime → F=emerald
const ACTIVE_CLASSES: Record<FuelLevel, string> = {
  'E':   'bg-red-500    text-white border-red-500',
  '1/4': 'bg-orange-400 text-white border-orange-400',
  '1/2': 'bg-amber-400  text-zinc-900 border-amber-400',
  '3/4': 'bg-lime-500   text-white border-lime-500',
  'F':   'bg-emerald-500 text-white border-emerald-500',
}

interface FuelGaugeProps {
  value: FuelLevel | null
  onChange: (level: FuelLevel) => void
  disabled?: boolean
}

export function FuelGauge({ value, onChange, disabled }: FuelGaugeProps) {
  return (
    <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-zinc-200 w-fit" role="group" aria-label="Fuel level">
      {LEVELS.map((level, i) => {
        const isActive = value === level.value
        return (
          <button
            key={level.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level.value)}
            aria-pressed={isActive}
            aria-label={`Fuel level ${level.label}`}
            className={cn(
              'relative min-h-[44px] min-w-[48px] px-3 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 select-none',
              i > 0 && 'border-l border-zinc-200',
              isActive
                ? ACTIVE_CLASSES[level.value]
                : 'bg-white text-zinc-500 hover:bg-zinc-50'
            )}
          >
            {level.label}
          </button>
        )
      })}
    </div>
  )
}
