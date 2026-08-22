import { cn } from '@/lib/utils'
import { priorityColor, priorityBand, PRIORITY_BANDS } from '@/lib/constants'

export function ScoreRing({
  score,
  size = 84,
  strokeWidth = 8,
  label,
  className,
}: {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, score))
  const band = PRIORITY_BANDS[priorityBand(clamped)]

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Priority score ${clamped} out of 100 (${band.label})`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-surface-100 dark:text-surface-800"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={band.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color: band.color }}
        >
          {Math.round(clamped)}
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-surface-400 dark:text-surface-500">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
