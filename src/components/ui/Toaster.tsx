import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { cn } from '@/lib/utils'

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-brand-500" />,
}

export function Toaster() {
  const toasts = useAppStore((s) => s.toasts)
  const dismiss = useAppStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lift animate-fade-up',
            t.type === 'error'
              ? 'border-red-200 dark:border-red-900'
              : 'border-surface-200 dark:border-surface-700 dark:bg-surface-800',
          )}
          role="status"
        >
          <div className="mt-0.5 shrink-0">{ICONS[t.type]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-surface-900 dark:text-white">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                {t.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
