import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left form side */}
      <div className="flex flex-col px-6 py-10 sm:px-12 lg:px-16">
        <Link to="/" className="inline-flex w-fit">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        {footer && <div className="mt-auto text-center text-sm">{footer}</div>}
      </div>

      {/* Right visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-cyan-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-surface-950/20 to-transparent" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <h2 className="max-w-md text-balance text-3xl font-bold text-white">
            Every photo makes your street smarter.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
            AI-verified infrastructure reporting, backed by the community and routed straight to the
            crews who fix it.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {['Pothole detected · 94%', 'Flooding detected · 91%', 'Tree detected · 88%'].map((t) => (
              <span key={t} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
