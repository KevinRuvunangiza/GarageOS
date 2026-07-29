import { useEffect, useState } from 'react'
import { X, Printer, Wrench, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { JobWithDetails } from '@/types/database'
import { useGarage } from '@/hooks/useGarage'

interface InvoiceViewProps {
  job: JobWithDetails | null
  onClose: () => void
}

export function InvoiceView({ job, onClose }: InvoiceViewProps) {
  const { garage, loading: garageLoading } = useGarage()
  const [printTriggered, setPrintTriggered] = useState(false)

  useEffect(() => {
    if (job && garage && !printTriggered) {
      const timer = setTimeout(() => {
        window.print()
        setPrintTriggered(true)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [job, garage, printTriggered])

  if (!job) return null

  const vehicle = job.vehicles
  const client = vehicle.clients
  const items = job.job_items || []
  const total = job.total_estimated_cost || items.reduce((sum, item) => sum + (item.cost || 0), 0)
  const isPaid = job.status === 'paid'

  const invoiceDate = new Date(job.created_at).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop - hidden when printing */}
      <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm print:hidden" onClick={onClose} />

      {/* Invoice Modal - hidden when printing */}
      <div className="fixed inset-2 sm:inset-4 md:inset-10 bg-white rounded-xl shadow-2xl overflow-auto print:hidden flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-zinc-900">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 min-h-[44px]">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          {garageLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : (
            <InvoiceContent 
              job={job}
              vehicle={vehicle} 
              client={client} 
              items={items} 
              total={total} 
              isPaid={isPaid} 
              invoiceDate={invoiceDate}
              garage={garage}
            />
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-invoice, #print-invoice * {
            visibility: visible;
          }
          #print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Print-only invoice */}
      <div id="print-invoice" className="hidden print:block print:absolute print:left-0 print:top-0 print:w-full print:bg-white print:z-[9999]">
        <div className="print:p-8 print:max-w-[210mm] print:mx-auto">
          <InvoiceContent 
            job={job}
            vehicle={vehicle} 
            client={client} 
            items={items} 
            total={total} 
            isPaid={isPaid} 
            invoiceDate={invoiceDate}
            garage={garage}
          />
        </div>
      </div>
    </div>
  )
}

const FUEL_LABEL_MAP: Record<string, string> = {
  'E':   'Empty (E)',
  '1/4': '¼ Tank',
  '1/2': '½ Tank',
  '3/4': '¾ Tank',
  'F':   'Full (F)',
}

const FUEL_COLOR_MAP: Record<string, string> = {
  'E':   'bg-red-100 text-red-700 border-red-200',
  '1/4': 'bg-orange-100 text-orange-700 border-orange-200',
  '1/2': 'bg-amber-100 text-amber-700 border-amber-200',
  '3/4': 'bg-lime-100 text-lime-700 border-lime-200',
  'F':   'bg-emerald-100 text-emerald-700 border-emerald-200',
}

interface InvoiceContentProps {
  job: JobWithDetails
  vehicle: JobWithDetails['vehicles']
  client: JobWithDetails['vehicles']['clients']
  items: JobWithDetails['job_items']
  total: number
  isPaid: boolean
  invoiceDate: string
  garage: { garage_name: string; garage_address: string; garage_phone: string } | null
}

function InvoiceContent({ job, vehicle, client, items, total, isPaid, invoiceDate, garage }: InvoiceContentProps) {
  const garageName = garage?.garage_name || 'GarageOS'
  const garageAddress = garage?.garage_address || '123 Mechanic Street, Industrial Area'
  const garagePhone = garage?.garage_phone || '(011) 555-0199'

  return (
    <div className="max-w-[210mm] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-8 pb-6 border-b-2 border-zinc-900 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-zinc-900">{garageName}</h1>
          </div>
          <p className="text-sm text-zinc-500">Professional Auto Repair & Service</p>
          <p className="text-sm text-zinc-500">{garageAddress}</p>
          <p className="text-sm text-zinc-500">Phone: {garagePhone}</p>
        </div>
        <div className="text-left sm:text-right">
          <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-wider">Invoice</h2>
          <p className="text-sm text-zinc-500 mt-1">Date: {invoiceDate}</p>
          <p className="text-sm text-zinc-500">Invoice #: {vehicle.license_plate}-{new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Client & Vehicle Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
        <div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Bill To</h3>
          <p className="font-semibold text-zinc-900">{client.name}</p>
          <p className="text-sm text-zinc-600">{client.phone_number}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Vehicle</h3>
          <p className="font-semibold text-zinc-900">{vehicle.make} {vehicle.model}</p>
          <p className="text-sm text-zinc-600">License: {vehicle.license_plate}</p>
        </div>
      </div>

      {/* Vehicle Condition at Intake */}
      {(job.fuel_level || (job.pre_existing_damage && job.pre_existing_damage.length > 0)) && (
        <div className="mb-6 p-4 border border-zinc-200 rounded-lg">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Vehicle Condition at Intake
          </h3>
          <div className="space-y-2">
            {job.fuel_level && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-24 shrink-0">Fuel Level</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    FUEL_COLOR_MAP[job.fuel_level] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  {FUEL_LABEL_MAP[job.fuel_level] ?? job.fuel_level}
                </span>
              </div>
            )}
            {job.pre_existing_damage && job.pre_existing_damage.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xs text-zinc-500 w-24 shrink-0 pt-0.5">Damage Noted</span>
                <div className="flex flex-wrap gap-1.5">
                  {job.pre_existing_damage.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue Description */}
      <div className="mb-8 p-4 bg-zinc-50 rounded-lg border border-zinc-100">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Issue / Service Description</h3>
        <p className="text-sm text-zinc-700 whitespace-pre-wrap">{job.issue_description}</p>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-zinc-200">
            <th className="text-left py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</th>
            <th className="text-left py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</th>
            <th className="text-right py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cost</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className={index !== items.length - 1 ? 'border-b border-zinc-100' : ''}>
              <td className="py-3 text-sm text-zinc-600 capitalize">{item.type}</td>
              <td className="py-3 text-sm text-zinc-800">{item.description}</td>
              <td className="py-3 text-sm text-zinc-800 text-right font-mono">
                R {item.cost.toFixed(2)}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-sm text-zinc-400 italic">
                No itemized entries — flat rate service
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t-2 border-zinc-200 pt-4">
        <div className="flex justify-end">
          <div className="w-full sm:w-64">
            <div className="flex justify-between py-2">
              <span className="text-sm text-zinc-600">Subtotal</span>
              <span className="text-sm font-mono text-zinc-800">R {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-zinc-600">Tax (0%)</span>
              <span className="text-sm font-mono text-zinc-800">R 0.00</span>
            </div>
            <div className="flex justify-between py-3 border-t border-zinc-200">
              <span className="font-bold text-zinc-900">Total Due</span>
              <span className="font-bold text-xl text-zinc-900 font-mono">
                R {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Paid Watermark */}
      {isPaid && (
        <div className="mt-12 flex justify-center">
          <div className="border-4 border-emerald-500 text-emerald-500 px-8 py-3 rounded-lg transform -rotate-12 opacity-80">
            <span className="text-3xl font-black uppercase tracking-widest">Paid</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-zinc-200 text-center">
        <p className="text-xs text-zinc-400">
          Thank you for your business. All work guaranteed for 30 days.
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          {garageName} — {garagePhone}
        </p>
      </div>
    </div>
  )
}
