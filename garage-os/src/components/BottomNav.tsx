import { LayoutDashboard, Users, TrendingUp, User } from 'lucide-react'
import type { AppPage } from './Navbar'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  currentPage: string
  onNavigate: (page: AppPage) => void
}

const NAV_ITEMS: {
  id: AppPage
  label: string
  icon: React.ElementType
}[] = [
  { id: 'dashboard', label: 'Board',    icon: LayoutDashboard },
  { id: 'crm',       label: 'Clients',  icon: Users },
  { id: 'finances',  label: 'Finances', icon: TrendingUp },
  { id: 'profile',   label: 'Profile',  icon: User },
]

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  // Treat sub-pages as their parent so the active tab stays highlighted
  const activePage =
    currentPage === 'new-job' || currentPage === 'edit-job'
      ? 'dashboard'
      : currentPage

  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 items-center justify-around print:hidden"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activePage === id
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              // Minimum 44px touch target per iOS HIG
              'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] py-2 rounded-none transition-all duration-150 active:scale-95',
              isActive ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
            )}
          >
            {/* Amber top-edge pill indicator on active */}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber-500"
              />
            )}
            <Icon
              className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span
              className={cn(
                'text-[10px] leading-none tracking-wide',
                isActive ? 'font-semibold' : 'font-medium'
              )}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
