import { useState } from 'react'
import { Plus, Trash2, Loader2, Zap } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { usePresetServices } from '@/hooks/usePresetServices'

export function PresetServicesManager() {
  const { presets, loading, createPreset, deletePreset } = usePresetServices()
  const [newName, setNewName] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newType, setNewType] = useState<'part' | 'labor'>('labor')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newCost) return
    setSaving(true)
    await createPreset({
      name: newName.trim(),
      default_cost: parseFloat(newCost),
      type: newType,
    })
    setNewName('')
    setNewCost('')
    setNewType('labor')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deletePreset(id)
    setDeletingId(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">Canned Services Library</CardTitle>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Pre-saved services appear as Quick Add pills in the Job Estimator.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new preset form */}
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
          <Input
            required
            placeholder="Service name (e.g. Brake Pad Change)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 h-10"
          />
          <Select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'part' | 'labor')}
            className="h-10 w-full sm:w-28"
          >
            <option value="labor">Labor</option>
            <option value="part">Part</option>
          </Select>
          <div className="relative w-full sm:w-32">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">R</span>
            <Input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              className="h-10 pl-6 font-mono"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="h-10 gap-1 min-w-[110px] shrink-0"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Preset
          </Button>
        </form>

        {/* Preset list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-lg">
            No presets yet — add one above
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Default Cost
                  </th>
                  <th className="py-2 px-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {presets.map((preset, idx) => (
                  <tr
                    key={preset.id}
                    className={idx !== presets.length - 1 ? 'border-b border-zinc-100' : ''}
                  >
                    <td className="py-2.5 px-3 font-medium text-zinc-800">{preset.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          preset.type === 'labor'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {preset.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-700">
                      R {preset.default_cost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === preset.id}
                        onClick={() => handleDelete(preset.id)}
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                      >
                        {deletingId === preset.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
