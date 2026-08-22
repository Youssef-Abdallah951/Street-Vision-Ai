import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/reports', label: 'Reports', icon: ClipboardList, end: false },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, end: false },
]

export function AdminNav() {
  return (
    <div className="inline-flex items-center gap-1 overflow-x-auto rounded-xl border border-surface-200 bg-surface-100 p-1 scrollbar-hide dark:border-surface-800 dark:bg-surface-800/70">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white text-surface-900 shadow-soft dark:bg-surface-900 dark:text-white'
                : 'text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-100',
            )
          }
        >
          <l.icon className="h-4 w-4" />
          {l.label}
        </NavLink>
      ))}
    </div>
  )
}
