import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'brand',
  className,
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  hint?: string
  tone?: 'brand' | 'green' | 'red' | 'amber' | 'violet' | 'cyan'
  className?: string
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border border-surface-200/70 bg-white p-5 shadow-soft dark:border-surface-800 dark:bg-surface-900',
        className,
      )}
    >
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold tracking-tight text-surface-900 dark:text-white">{value}</p>
        <p className="truncate text-sm text-surface-500 dark:text-surface-400">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">{hint}</p>}
      </div>
    </div>
  )
}
