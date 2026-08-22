import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  color,
  className,
}: {
  value: number
  color?: string
  className?: string
}) {
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color ?? 'var(--sv-brand)',
        }}
      />
    </div>
  )
}
