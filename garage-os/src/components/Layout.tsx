import { ReactNode } from 'react'
import { Navbar, AppPage } from './Navbar'

interface LayoutProps {
  children: ReactNode
  onNavigate: (page: AppPage) => void
  currentPage: string
}

export function Layout({ children, onNavigate, currentPage }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="print:hidden">
        <Navbar onNavigate={onNavigate} currentPage={currentPage} />
      </div>
      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  )
}
