import { useState, useEffect } from 'react'
import {
  Wrench,
  Plus,
  LayoutDashboard,
  LogOut,
  Bell,
  Users,
  TrendingUp,
  User,
  ChevronRight,
} from 'lucide-react'
import type { AppPage } from './Navbar'
import { useAuth } from './AuthContext'
import { useGarage } from '@/hooks/useGarage'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  currentPage: string
  onNavigate: (page: AppPage) => void
  /** Count of active (pending + in_progress) jobs to show in the sidebar stats widget */
  activeJobCount?: number
}

const NAV_ITEMS: {
  id: AppPage
  label: string
  shortcut?: string
  icon: React.ElementType
}[] = [
    { id: 'dashboard', label: 'Dashboard', shortcut: 'D', icon: LayoutDashboard },
    { id: 'crm', label: 'CRM & Clients', shortcut: 'C', icon: Users },
    { id: 'finances', label: 'Finances', shortcut: 'F', icon: TrendingUp },
    { id: 'reminders', label: 'Reminders', shortcut: 'R', icon: Bell },
    { id: 'profile', label: 'Settings', shortcut: 'S', icon: User },
  ]

export function SidebarNav({ currentPage, onNavigate, activeJobCount = 0 }: SidebarNavProps) {
  const { signOut } = useAuth()
  const { garage } = useGarage()

  // Treat sub-pages as their parent for active highlighting
  const activePage =
    currentPage === 'new-job' || currentPage === 'edit-job' ? 'dashboard' : currentPage

  // Tablet: icon-only collapsed. Desktop: full expanded.
  // We render a single sidebar and let Tailwind handle width via responsive classes.
  // md = 768-1023px → slim icon sidebar (w-[72px])
  // lg = 1024px+   → full sidebar (w-64)
  const [tooltipId, setTooltipId] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable element
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      // Check if pressed key matches any of our shortcuts (case-insensitive)
      const key = e.key.toUpperCase()
      const navItem = NAV_ITEMS.find((item) => item.shortcut === key)

      if (navItem) {
        onNavigate(navItem.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNavigate])

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 shrink-0 bg-[#fafaf9] border-r border-stone-200 print:hidden z-30',
        'w-[72px] lg:w-64 transition-[width] duration-200'
      )}
    >
      {/* ── Brand header ───────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 h-16 px-3 lg:px-4 border-b border-stone-200 cursor-pointer shrink-0"
        onClick={() => onNavigate('dashboard')}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 shadow-sm">
          <Wrench className="h-5 w-5 text-amber-500" />
        </div>
        {/* Only visible at lg+ */}
        <div className="hidden lg:block min-w-0">
          <p className="text-base font-bold tracking-tight text-zinc-900 leading-none">
            Garage<span className="text-amber-500">OS</span>
          </p>
          {garage && (
            <p className="text-xs text-zinc-500 truncate mt-1">{garage.garage_name}</p>
          )}
        </div>
      </div>

      {/* ── Subscription badge — desktop only ─────────────────── */}
      {garage && (() => {
        const status = garage.subscription_status

        if (status === 'active_lifetime') {
          return (
            <div className="hidden lg:flex items-center gap-2 mx-4 mt-4 mb-2 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50">
              <span className="text-amber-500 shrink-0">★</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Pro Garage Account
              </span>
            </div>
          )
        }

        if (status === 'active_trial' && garage.trial_ends_at) {
          const daysLeft = Math.max(
            0,
            Math.ceil((new Date(garage.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          )
          return (
            <div className="hidden lg:flex items-center gap-2 mx-4 mt-4 mb-2 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 truncate">
                Trial — {daysLeft}d left
              </span>
            </div>
          )
        }

        if (status === 'expired') {
          return (
            <div className="hidden lg:flex items-center gap-2 mx-4 mt-4 mb-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-700">
                Access Expired
              </span>
            </div>
          )
        }

        return null
      })()}

      {/* ── + New Job button ───────────────────────────────────── */}
      <div className="px-2 lg:px-4 mt-2 mb-1">
        <button
          onClick={() => onNavigate('new-job')}
          className={cn(
            'w-full flex items-center justify-center lg:justify-start gap-2 rounded-lg h-11 lg:px-4',
            'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-sm transition-colors shadow-sm'
          )}
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={3} />
          <span className="hidden lg:inline">New Job</span>
        </button>
      </div>

      {/* ── Nav items ─────────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 lg:px-3 py-2 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, shortcut, icon: Icon }) => {
          const isActive = activePage === id
          return (
            <div
              key={id}
              className="relative"
              onMouseEnter={() => setTooltipId(id)}
              onMouseLeave={() => setTooltipId(null)}
            >
              <button
                onClick={() => onNavigate(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg h-11 px-2.5 transition-colors group',
                  isActive
                    ? 'bg-amber-500/10 text-amber-700 font-semibold'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                {/* Active left indicator */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r h-5 bg-amber-500 transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Icon
                  className={cn('h-5 w-5 shrink-0', isActive ? 'text-amber-600' : 'text-zinc-400 group-hover:text-zinc-600')}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="hidden lg:block text-sm flex-1 text-left">{label}</span>
                {/* Keyboard shortcut badge — desktop only */}
                {shortcut && (
                  <kbd className="hidden lg:inline-flex h-5 w-5 items-center justify-center rounded border border-zinc-200 text-[10px] font-mono text-zinc-400 ml-auto">
                    {shortcut}
                  </kbd>
                )}
              </button>

              {/* Tooltip for tablet (icon-only) mode */}
              {tooltipId === id && (
                <div className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none">
                  <div className="relative">
                    <ChevronRight className="absolute -left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-800" />
                    <span className="block bg-zinc-900 text-white text-xs font-medium rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                      {label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Quick Stats Widget — desktop only ─────────────────── */}
      <div className="hidden lg:block mx-4 mb-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Live Status</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600">Active Jobs</span>
          <span className="text-sm font-bold font-mono text-amber-600 tabular-nums">
            {activeJobCount}
          </span>
        </div>
      </div>

      {/* ── Garage avatar + sign-out ───────────────────────────── */}
      <div className="flex items-center gap-3 h-16 px-2 lg:px-4 border-t border-stone-200 shrink-0">
        {/* Avatar / initial */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 text-sm font-bold cursor-pointer hover:bg-amber-100 hover:text-amber-700 transition-colors"
          onClick={() => onNavigate('profile')}
          title={garage?.garage_name ?? 'Profile'}
        >
          {garage?.garage_name?.charAt(0).toUpperCase() ?? 'G'}
        </div>
        {/* Name + sign-out — desktop only */}
        <div className="hidden lg:flex flex-1 min-w-0 items-center justify-between gap-2">
          <p className="text-xs font-semibold text-zinc-800 truncate">
            {garage?.garage_name ?? 'My Garage'}
          </p>
          <button
            onClick={signOut}
            title="Sign Out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        {/* Tablet: just sign-out icon */}
        <button
          onClick={signOut}
          title="Sign Out"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
