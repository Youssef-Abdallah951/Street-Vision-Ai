import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Step {
  id: string
  label: string
}

export function StepIndicator({
  steps,
  current,
}: {
  steps: Step[]
  current: number
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto scrollbar-hide sm:gap-2">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={step.id} className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  done
                    ? 'bg-green-500 text-white'
                    : active
                      ? 'bg-brand-600 text-white ring-4 ring-brand-600/20'
                      : 'bg-surface-200 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-sm font-medium',
                  active
                    ? 'text-surface-900 dark:text-white'
                    : done
                      ? 'text-surface-600 dark:text-surface-300'
                      : 'text-surface-400 dark:text-surface-500',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="h-px w-4 bg-surface-200 sm:w-8 dark:bg-surface-700" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
