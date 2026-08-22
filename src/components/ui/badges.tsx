import { cn } from '@/lib/utils'
import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { SEVERITY_META, STATUS_META, priorityBand, PRIORITY_BANDS } from '@/lib/constants'
import type { CategoryId, ReportStatus, Severity } from '@/types'

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity
  className?: string
}) {
  const meta = SEVERITY_META[severity]
  return (
    <Badge
      className={className}
      style={{
        color: 'var(--sv-severity-' + severity + '-fg)',
        background: 'var(--sv-severity-' + severity + '-soft)',
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </Badge>
  )
}

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  return (
    <Badge
      className={className}
      style={{
        color: 'var(--sv-status-' + status + '-fg)',
        background: 'var(--sv-status-' + status + '-soft)',
      }}
    >
      {meta.label}
    </Badge>
  )
}

export function PriorityBadge({
  score,
  showScore = false,
  className,
}: {
  score: number
  showScore?: boolean
  className?: string
}) {
  const band = PRIORITY_BANDS[priorityBand(score)]
  return (
    <Badge
      className={className}
      style={{
        color: 'var(--sv-priority-' + priorityBand(score) + '-fg)',
        background: 'var(--sv-priority-' + priorityBand(score) + '-soft)',
      }}
    >
      {showScore ? `Priority ${score}/100` : `Priority: ${band.label}`}
    </Badge>
  )
}

export function CategoryBadge({
  category,
  className,
}: {
  category: CategoryId
  className?: string
}) {
  return (
    <Badge tone="brand" className={cn('capitalize', className)}>
      {category.replace('-', ' ')}
    </Badge>
  )
}

export function ScoreBadge({
  score,
  max = 100,
  color,
  className,
}: {
  score: number
  max?: number
  color?: string
  className?: string
}) {
  return (
    <span
      className={cn('text-sm font-semibold tabular-nums', className)}
      style={{ color }}
    >
      {Math.round(score)}
      <span className="font-normal opacity-60">/{max}</span>
    </span>
  )
}

export type { BadgeProps }
