import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/Toaster'

export function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-surface-900 dark:bg-surface-900 dark:text-surface-100">
      <Navbar />
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
