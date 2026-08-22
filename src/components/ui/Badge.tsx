import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'green'
  | 'red'
  | 'amber'
  | 'orange'
  | 'violet'
  | 'cyan'

const TONES: Record<BadgeTone, string> = {
  neutral:
    'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}
