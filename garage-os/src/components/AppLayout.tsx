import { ReactNode } from 'react'
import { Wrench, Plus } from 'lucide-react'
import type { AppPage } from './Navbar'
import { BottomNav } from './BottomNav'
import { SidebarNav } from './SidebarNav'
import { useGarage } from '@/hooks/useGarage'

interface AppLayoutProps {
  children: ReactNode
  onNavigate: (page: AppPage) => void
  currentPage: string
  activeJobCount?: number
}

/**
 * Subtle dot-matrix canvas pattern applied to the root background.
 * A 1px stone-300 dot every 20px gives a "workshop pegboard / blueprint"
 * feel without overwhelming the content.
 */
const CANVAS_STYLE: React.CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, #d6d3d1 1px, transparent 1px)',
  backgroundSize: '20px 20px',
}

export function AppLayout({ children, onNavigate, currentPage, activeJobCount = 0 }: AppLayoutProps) {
  const { garage } = useGarage()

  return (
    <div
      className="min-h-screen bg-stone-50 flex print:block"
      style={CANVAS_STYLE}
    >

      {/* ─────────────────────────────────────────────────────────
          SIDEBAR — visible md+ (tablet & desktop)
          SidebarNav itself carries hidden md:flex so it self-hides on mobile.
      ───────────────────────────────────────────────────────── */}
      <SidebarNav
        currentPage={currentPage}
        onNavigate={onNavigate}
        activeJobCount={activeJobCount}
      />

      {/* ─────────────────────────────────────────────────────────
          MAIN CONTENT WRAPPER
      ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Mobile-only fixed top header (< md) ────────────── */}
        <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 flex items-center justify-between md:hidden print:hidden">
          {/* Logo + garage name */}
          <button
            className="flex items-center gap-2.5 min-w-0 transition-opacity active:opacity-70"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
              <Wrench className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-zinc-900 leading-none">
                Garage<span className="text-amber-500">OS</span>
              </p>
              {garage && (
                <p className="text-xs text-zinc-500 truncate mt-0.5">{garage.garage_name}</p>
              )}
            </div>
          </button>

          {/* CTA — single icon, no duplicate "+" text */}
          <button
            onClick={() => onNavigate('new-job')}
            className="h-10 pl-2.5 pr-3 text-xs font-semibold rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-600 transition-all duration-150 active:scale-[0.97] shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            New Job
          </button>
        </header>

        {/* ── Scrollable page content ─────────────────────────── */}
        <main
          className={[
            'flex-1 w-full mx-auto',
            // Mobile: padded under fixed top header + above bottom nav
            'pt-16 pb-24 px-3',
            // md+: sidebar handles nav — no fixed chrome overhead
            'md:pt-6 md:pb-8 md:px-5',
            // lg+: more breathing room
            'lg:px-8 lg:py-8',
            // cap content width
            'max-w-7xl',
          ].join(' ')}
        >
          {children}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────
          BOTTOM NAV — mobile only (< md), self-hides at md via flex md:hidden
      ───────────────────────────────────────────────────────── */}
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  )
}
