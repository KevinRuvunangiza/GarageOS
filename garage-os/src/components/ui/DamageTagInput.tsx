import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESET_TAGS = [
  'Clean Body',
  'Front Bumper Scratch',
  'Rear Bumper Scratch',
  'Cracked Windscreen',
  'Dent',
  'Side Mirror Damage',
  'Chipped Paint',
  'Worn Tyres',
]

interface DamageTagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}

export function DamageTagInput({ value, onChange, disabled }: DamageTagInputProps) {
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  function toggleTag(tag: string) {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  function addCustomTag() {
    const trimmed = customInput.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setCustomInput('')
    setShowCustomInput(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
    if (e.key === 'Escape') {
      setCustomInput('')
      setShowCustomInput(false)
    }
  }

  // Custom tags = tags in value that are NOT in the preset list
  const customTags = value.filter((t) => !PRESET_TAGS.includes(t))

  return (
    <div className="space-y-3">
      {/* Preset tag pills */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_TAGS.map((tag) => {
          const isSelected = value.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => toggleTag(tag)}
              className={cn(
                'min-h-[36px] px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-800'
              )}
            >
              {isSelected && <span className="mr-1 opacity-70">✓</span>}
              {tag}
            </button>
          )
        })}

        {/* Custom tags already added */}
        {customTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="ml-0.5 rounded-full hover:bg-amber-100 p-0.5 focus-visible:outline-none"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        {/* Add custom tag toggle */}
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1 rounded-full text-xs font-medium border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-500 hover:text-zinc-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Custom
          </button>
        )}
      </div>

      {/* Custom input field */}
      {showCustomInput && (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe damage…"
            className="flex-1 h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="h-9 px-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setCustomInput(''); setShowCustomInput(false) }}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selected count */}
      {value.length > 0 && (
        <p className="text-xs text-zinc-400 tabular-nums">
          {value.length} condition{value.length !== 1 ? 's' : ''} noted
        </p>
      )}
    </div>
  )
}
