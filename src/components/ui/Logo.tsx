import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <defs>
        <linearGradient id="sv-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3074f5" />
          <stop offset="1" stopColor="#1a57ea" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#sv-logo-g)" />
      <path
        d="M8 12.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-7z"
        fill="#fff"
        opacity="0.95"
      />
      <path
        d="M12 10.5l2.2 3h3.6l2.2-3"
        fill="none"
        stroke="#3074f5"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="15.2" r="1.6" fill="#3074f5" />
      <path
        d="M16 12.6v.6M16 17.2v.6M13.4 15.2h.6M18 15.2h.6"
        stroke="#3074f5"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo({
  className,
  dark = false,
}: {
  className?: string
  dark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span
        className={cn(
          'text-lg font-bold tracking-tight',
          dark ? 'text-white' : 'text-surface-900 dark:text-white',
        )}
      >
        StreetVision <span className="text-brand-600 dark:text-brand-400">AI</span>
      </span>
    </span>
  )
}
