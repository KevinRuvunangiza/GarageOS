import { useState, useEffect, useCallback } from 'react'
import { DollarSign, TrendingUp, AlertCircle, Receipt, PieChart, BarChart3, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { JobWithDetails } from '@/types/database'

type PeriodFilter = 'month' | 'last_month' | 'quarter' | 'ytd'

export function FinancesView() {
  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [jobs, setJobs] = useState<JobWithDetails[]>([])
  const [_loading, setLoading] = useState(true)

  const fetchFinancialJobs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        vehicles (
          *,
          clients (*)
        ),
        job_items (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching financial jobs:', error)
    } else {
      setJobs((data as JobWithDetails[]) || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFinancialJobs()
  }, [fetchFinancialJobs])

  // Filter jobs based on selected period
  const filteredJobs = jobs.filter((job) => {
    const jobDate = new Date(job.created_at)
    const now = new Date()

    if (period === 'month') {
      return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear()
    }
    if (period === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return jobDate.getMonth() === lastMonth.getMonth() && jobDate.getFullYear() === lastMonth.getFullYear()
    }
    if (period === 'quarter') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      return jobDate >= threeMonthsAgo
    }
    if (period === 'ytd') {
      return jobDate.getFullYear() === now.getFullYear()
    }
    return true
  })

  // Paid jobs in period
  const paidJobs = filteredJobs.filter((j) => j.status === 'paid')
  // Ready for pickup / Done jobs unpaid (across all time or in period)
  const uncollectedJobs = jobs.filter((j) => j.status === 'done')

  // Calculated Metrics
  const totalRevenue = paidJobs.reduce((sum, j) => sum + Number(j.grand_total || j.total_estimated_cost || 0), 0)

  // Calculate Parts vs Labor cost breakdown from itemized job_items
  let laborTotal = 0
  let partsTotal = 0

  paidJobs.forEach((j) => {
    if (j.job_items && j.job_items.length > 0) {
      j.job_items.forEach((item) => {
        if (item.type === 'labor') laborTotal += Number(item.cost || 0)
        else partsTotal += Number(item.cost || 0)
      })
    } else {
      // Fallback: estimate 60% labor, 40% parts if flat rate
      const total = Number(j.grand_total || j.total_estimated_cost || 0)
      laborTotal += total * 0.6
      partsTotal += total * 0.4
    }
  })

  const uncollectedTotal = uncollectedJobs.reduce((sum, j) => sum + Number(j.grand_total || j.total_estimated_cost || 0), 0)
  const avgTicketPrice = paidJobs.length > 0 ? totalRevenue / paidJobs.length : 0

  const totalPartsAndLabor = laborTotal + partsTotal || 1
  const laborPct = Math.round((laborTotal / totalPartsAndLabor) * 100)
  const partsPct = Math.round((partsTotal / totalPartsAndLabor) * 100)

  return (
    <div className="space-y-6">
      {/* Header & Period Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Financial Analytics</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Instant financial heartbeat: revenue, profit margins, and uncollected balances
          </p>
        </div>

        {/* Period Selector Toggle */}
        <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-1 shadow-2xs">
          {(['month', 'last_month', 'quarter', 'ytd'] as PeriodFilter[]).map((p) => {
            const labels: Record<PeriodFilter, string> = {
              month: 'This Month',
              last_month: 'Last Month',
              quarter: 'Quarter',
              ytd: 'Year to Date',
            }
            const isActive = period === p
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                {labels[p]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Top Metric Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 font-mono tabular-nums">
            R {totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <ArrowUpRight className="h-3 w-3" /> {paidJobs.length} paid ticket{paidJobs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Labor Profit vs Parts */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Labor Income / Parts</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono tabular-nums">
            R {laborTotal.toLocaleString('en-ZA', { maximumFractionDigits: 0 })} <span className="text-xs font-sans text-zinc-400 font-normal">Labor</span>
          </div>
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden flex">
            <div className="bg-amber-500 h-full" style={{ width: `${laborPct}%` }} title={`Labor: ${laborPct}%`} />
            <div className="bg-zinc-400 h-full" style={{ width: `${partsPct}%` }} title={`Parts: ${partsPct}%`} />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>Labor: {laborPct}%</span>
            <span>Parts: {partsPct}%</span>
          </div>
        </div>

        {/* Uncollected Balances */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Uncollected Balances</span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            R {uncollectedTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            {uncollectedJobs.length} job{uncollectedJobs.length !== 1 ? 's' : ''} ready for pickup (Unpaid)
          </p>
        </div>

        {/* Average Ticket Price */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Ticket Price</span>
            <div className="h-8 w-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 font-mono tabular-nums">
            R {avgTicketPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-zinc-500">Per closed job ticket</p>
        </div>
      </div>

      {/* Visual Revenue Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parts vs Labor Distribution Card */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="h-4 w-4 text-amber-500" />
              Revenue Composition
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                <span>Labor Fees (Services)</span>
                <span className="font-mono">R {laborTotal.toFixed(2)} ({laborPct}%)</span>
              </div>
              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${laborPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                <span>Parts &amp; Components</span>
                <span className="font-mono">R {partsTotal.toFixed(2)} ({partsPct}%)</span>
              </div>
              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                <div className="bg-zinc-700 h-full rounded-full transition-all duration-300" style={{ width: `${partsPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Summary Breakdown Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-zinc-700" />
              Completed Transactions ({paidJobs.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3 text-right">Parts</th>
                  <th className="py-2.5 px-3 text-right">Labor</th>
                  <th className="py-2.5 px-3 text-right">Total Billed</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                {filteredJobs.slice(0, 10).map((job) => {
                  const items = job.job_items || []
                  const pCost = items.filter(i => i.type === 'part').reduce((s, i) => s + (i.cost || 0), 0)
                  const lCost = items.filter(i => i.type === 'labor').reduce((s, i) => s + (i.cost || 0), 0)
                  const total = job.grand_total || job.total_estimated_cost || 0

                  return (
                    <tr key={job.id} className="hover:bg-zinc-50/70">
                      <td className="py-2.5 px-3 text-zinc-600 font-sans">
                        {new Date(job.created_at).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-zinc-900">
                        {job.vehicles?.clients?.name || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-600 font-sans">
                        {job.vehicles?.make} {job.vehicles?.model}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-zinc-600">
                        R {pCost.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-zinc-600">
                        R {lCost.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-zinc-900">
                        R {total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold ${
                          job.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400 font-sans italic">
                      No financial transactions recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
