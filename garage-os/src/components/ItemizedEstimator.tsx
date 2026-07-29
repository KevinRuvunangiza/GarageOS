import { useState, useEffect } from 'react'
import { Plus, Trash2, Zap, ChevronRight, BookmarkPlus, Check } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { usePresetServices } from '@/hooks/usePresetServices'
import { cn } from '@/lib/utils'

export interface EstimatorItem {
  id: string
  type: 'part' | 'labor'
  description: string
  cost: number
}

interface ItemizedEstimatorProps {
  items: EstimatorItem[]
  onItemsChange: (items: EstimatorItem[]) => void
  onTotalChange: (total: number) => void
}

export function ItemizedEstimator({ items, onItemsChange, onTotalChange }: ItemizedEstimatorProps) {
  const { presets, loading: presetsLoading, createPreset } = usePresetServices()
  const [showAllPresets, setShowAllPresets] = useState(false)
  const [savedPresetIds, setSavedPresetIds] = useState<Set<string>>(new Set())

  const total = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)

  useEffect(() => {
    onTotalChange(total)
  }, [total, onTotalChange])

  function addItem() {
    const newItem: EstimatorItem = {
      id: crypto.randomUUID(),
      type: 'part',
      description: '',
      cost: 0,
    }
    onItemsChange([...items, newItem])
  }

  function addFromPreset(preset: { name?: string; title?: string; default_cost?: number; default_price?: number; type?: 'part' | 'labor'; category?: 'part' | 'labor' }) {
    const newItem: EstimatorItem = {
      id: crypto.randomUUID(),
      type: preset.type || preset.category || 'labor',
      description: preset.name || preset.title || '',
      cost: Number(preset.default_cost ?? preset.default_price ?? 0),
    }
    onItemsChange([...items, newItem])
  }

  async function handleSaveItemAsPreset(item: EstimatorItem) {
    if (!item.description.trim() || item.cost <= 0) return

    await createPreset({
      name: item.description.trim(),
      default_cost: item.cost,
      type: item.type,
    })

    setSavedPresetIds((prev) => new Set(prev).add(item.id))
    setTimeout(() => {
      setSavedPresetIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }, 2500)
  }

  function updateItem(id: string, updates: Partial<EstimatorItem>) {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  function removeItem(id: string) {
    onItemsChange(items.filter((item) => item.id !== id))
  }

  const COLLAPSED_COUNT = 8
  const visiblePresets = showAllPresets ? presets : presets.slice(0, COLLAPSED_COUNT)
  const hasMore = presets.length > COLLAPSED_COUNT

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Itemized Parts &amp; Labor
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 min-h-[38px] text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Item Row
        </Button>
      </div>

      {/* Quick Add — Preset Service Pills */}
      {!presetsLoading && presets.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-stone-50/70 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              1-Tap Canned Services
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">{presets.length} pre-saved</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {visiblePresets.map((preset) => {
              const name = preset.name || preset.title
              const cost = preset.default_cost ?? preset.default_price ?? 0
              const type = preset.type || preset.category || 'labor'

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => addFromPreset(preset)}
                  className={cn(
                    'inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 select-none shadow-2xs',
                    type === 'labor'
                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-400'
                      : 'bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800'
                  )}
                >
                  <span>{name}</span>
                  <span className="font-mono text-[11px] opacity-80">R{cost.toFixed(0)}</span>
                </button>
              )
            })}
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAllPresets(!showAllPresets)}
                className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium border border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {showAllPresets ? (
                  'Show less'
                ) : (
                  <>
                    +{presets.length - COLLAPSED_COUNT} more
                    <ChevronRight className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-6 text-zinc-400 text-xs border-2 border-dashed border-zinc-200 rounded-lg">
          No line items added yet. Tap a canned service above or click "Add Item Row".
        </div>
      )}

      {/* Line Items Rows */}
      <div className="space-y-2">
        {items.map((item) => {
          const isPresetSaved = savedPresetIds.has(item.id)
          const canSaveAsPreset = item.description.trim().length > 0 && item.cost > 0

          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white rounded-lg p-2.5 border border-zinc-200 shadow-2xs"
            >
              <div className="w-full sm:w-28 shrink-0">
                <Select
                  value={item.type}
                  onChange={(e) => updateItem(item.id, { type: e.target.value as 'part' | 'labor' })}
                  className="h-9 text-xs font-medium"
                >
                  <option value="part">Part</option>
                  <option value="labor">Labor</option>
                </Select>
              </div>

              <div className="flex-1 w-full">
                <Input
                  type="text"
                  placeholder="Item description (e.g. Front Brake Pads)"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="w-full sm:w-32 shrink-0">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">R</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={item.cost || ''}
                    onChange={(e) => updateItem(item.id, { cost: parseFloat(e.target.value) || 0 })}
                    className="h-9 pl-6 text-xs font-mono text-right tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                {/* Save as preset button */}
                <button
                  type="button"
                  disabled={!canSaveAsPreset || isPresetSaved}
                  onClick={() => handleSaveItemAsPreset(item)}
                  title="Save as New Preset for future 1-tap use"
                  className={cn(
                    'h-9 px-2 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 select-none',
                    isPresetSaved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : canSaveAsPreset
                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                      : 'bg-zinc-50 text-zinc-300 border-zinc-200 cursor-not-allowed'
                  )}
                >
                  {isPresetSaved ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Saved</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">+ Preset</span>
                    </>
                  )}
                </button>

                {/* Remove item button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="h-9 w-9 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-end pt-3 border-t border-zinc-200">
        <div className="text-right">
          <p className="text-xs text-zinc-500 font-medium">Grand Total Estimate</p>
          <p className="text-2xl font-bold text-zinc-900 font-mono tabular-nums">
            R {total.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
