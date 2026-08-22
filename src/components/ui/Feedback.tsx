import type { LucideIcon } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 px-6 py-14 text-center dark:border-surface-700">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-surface-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-surface-500 dark:text-surface-400">{description}</p>
      )}
      {actionLabel && (onAction || actionHref) && (
        actionHref ? (
          <Link to={actionHref}>
            <Button className="mt-5">{actionLabel}</Button>
          </Link>
        ) : (
          <Button className="mt-5" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-14 text-center dark:border-red-900/60 dark:bg-red-950/30">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-surface-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-surface-500 dark:text-surface-400">{description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div
        className={`h-8 w-8 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent ${className ?? ''}`}
      />
    </div>
  )
}
