import { Wrench, Plus, LayoutDashboard, LogOut, Bell, Users, TrendingUp, User } from 'lucide-react'
import { Button } from './ui/Button'
import { useAuth } from './AuthContext'
import { useGarage } from '@/hooks/useGarage'

export type AppPage = 'dashboard' | 'crm' | 'finances' | 'reminders' | 'profile' | 'new-job' | 'edit-job'

interface NavbarProps {
  onNavigate: (page: AppPage) => void
  currentPage: string
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { signOut } = useAuth()
  const { garage } = useGarage()

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo & Garage Name */}
          <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 shadow-2xs">
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <span className="text-lg font-bold tracking-tight text-zinc-900 hidden sm:inline font-sans">
                Garage<span className="text-amber-500">OS</span>
              </span>
              {garage && (
                <p className="text-xs text-zinc-500 truncate max-w-[130px] sm:max-w-[180px] font-medium">
                  {garage.garage_name}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
            <Button
              variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className="gap-1.5 min-h-[38px] text-xs font-semibold"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>

            <Button
              variant={currentPage === 'crm' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('crm')}
              className="gap-1.5 min-h-[38px] text-xs font-semibold"
            >
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">CRM &amp; Vehicles</span>
            </Button>

            <Button
              variant={currentPage === 'finances' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('finances')}
              className="gap-1.5 min-h-[38px] text-xs font-semibold"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Finances</span>
            </Button>

            <Button
              variant={currentPage === 'reminders' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('reminders')}
              className="gap-1.5 min-h-[38px] text-xs font-semibold relative"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Reminders</span>
            </Button>

            <Button
              variant={currentPage === 'profile' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onNavigate('profile')}
              className="gap-1.5 min-h-[38px] text-xs font-semibold"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Settings</span>
            </Button>

            <div className="h-5 w-px bg-zinc-200 mx-1" />

            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('new-job')}
              className="gap-1.5 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-600 min-h-[38px] px-3 shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">+ New Job</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-zinc-900 p-2 min-h-[38px]"
              onClick={signOut}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
