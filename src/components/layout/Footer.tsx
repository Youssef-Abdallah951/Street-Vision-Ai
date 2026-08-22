import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { MapPin, Shield, Sparkles } from 'lucide-react'

const PRODUCT_LINKS = [
  { label: 'Report a problem', to: '/report' },
  { label: 'Street map', to: '/map' },
  { label: 'Public reports', to: '/reports' },
  { label: 'Analytics', to: '/analytics' },
]

const COMPANY_LINKS = [
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Supported problems', to: '/#problems' },
  { label: 'Community impact', to: '/#impact' },
  { label: 'Sign in', to: '/login' },
]

export function Footer() {
  return (
    <footer className="border-t border-surface-200/70 bg-white/60 dark:border-surface-800 dark:bg-surface-900/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
              AI-powered civic technology that turns street photos into actionable infrastructure
              reports. See problems. Report smarter. Build better streets.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
              <Shield className="h-4 w-4" />
              Privacy-first civic reporting
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 dark:text-white">Product</h4>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-surface-500 transition-colors hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 dark:text-white">Community</h4>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-surface-500 transition-colors hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-surface-900 dark:text-white">Powered by</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-surface-500 dark:text-surface-400">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" /> Computer-vision detection
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" /> Geospatial reporting
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-brand-500" /> Community verification
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-surface-200/70 pt-6 sm:flex-row dark:border-surface-800">
          <p className="text-xs text-surface-400 dark:text-surface-500">
            © {new Date().getFullYear()} StreetVision AI. Built for better cities.
          </p>
        </div>
      </div>
    </footer>
  )
}
