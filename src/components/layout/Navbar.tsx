import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  FilePlus2,
  List,
  BarChart3,
  Shield,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Camera,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { NotificationCenter } from '@/components/layout/NotificationCenter'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'
import { useAppStore } from '@/store/app'
import { cn } from '@/lib/utils'

function UserNavItems({ isAdmin }: { isAdmin: boolean }) {
  return (
    <>
      <NavItem to="/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} />
      <NavItem to="/map" label="Street Map" icon={<Map className="h-4 w-4" />} />
      <NavItem to="/reports" label="Reports" icon={<List className="h-4 w-4" />} />
      <NavItem to="/analytics" label="Analytics" icon={<BarChart3 className="h-4 w-4" />} />
      {isAdmin && (
        <NavItem to="/admin" label="Admin" icon={<Shield className="h-4 w-4" />} />
      )}
    </>
  )
}

function NavItem({
  to,
  label,
  icon,
}: {
  to: string
  label: string
  icon?: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)
  const toast = useAppStore((s) => s.toast)
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-40 glass border-b border-surface-200/60 dark:border-surface-800">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {user ? (
            <UserNavItems isAdmin={isAdmin} />
          ) : (
            <>
              <NavItem to="/" label="Home" />
              <NavItem to="/map" label="Street Map" />
              <a
                href="/#how-it-works"
                className="rounded-lg px-3 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white"
              >
                How it works
              </a>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationCenter />
              <Link to="/report">
                <Button size="sm" leftIcon={<Camera className="h-4 w-4" />} className="hidden sm:inline-flex">
                  Report
                </Button>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="rounded-full transition-transform hover:scale-105"
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} src={user.avatarUrl} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-surface-200 bg-white p-1 shadow-lift animate-scale-in dark:border-surface-700 dark:bg-surface-800">
                    <div className="border-b border-surface-100 px-3 py-2.5 dark:border-surface-700">
                      <p className="truncate text-sm font-semibold text-surface-900 dark:text-white">{user.name}</p>
                      <p className="truncate text-xs text-surface-400">{user.email}</p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        {isAdmin ? 'Administrator' : 'Citizen'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700"
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </button>
                    <button
                      onClick={() => {
                        logout()
                        toast('Signed out', 'You have been logged out safely.')
                        navigate('/')
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 lg:hidden dark:text-surface-300 dark:hover:bg-surface-800"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-surface-200/60 px-4 pb-4 pt-2 lg:hidden dark:border-surface-800">
          <div className="flex flex-col gap-1">
            {user ? (
              <>
                <UserNavItems isAdmin={isAdmin} />
                <Link to="/report">
                  <Button className="mt-2 w-full" leftIcon={<Camera className="h-4 w-4" />}>
                    Report a Problem
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <NavItem to="/" label="Home" />
                <NavItem to="/map" label="Street Map" />
                <a
                  href="/#how-it-works"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
                >
                  How it works
                </a>
                <Link to="/register">
                  <Button className="mt-2 w-full">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
