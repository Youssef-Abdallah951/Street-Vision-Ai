import { Link } from 'react-router-dom'
import { MapPin, HandCoins, ImageOff } from 'lucide-react'
import type { ReportWithRelations } from '@/types'
import { categoryEmoji, CATEGORY_MAP } from '@/lib/constants'
import { SeverityBadge, StatusBadge } from '@/components/ui/badges'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { SignedImage } from '@/components/ui/SignedImage'
import { timeAgo } from '@/lib/utils'

export function ReportCard({ report }: { report: ReportWithRelations }) {
  return (
    <Link
      to={`/reports/${report.id}`}
      className="group overflow-hidden rounded-2xl border border-surface-200/70 bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift dark:border-surface-800 dark:bg-surface-800"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {report.image_url ? (
          <SignedImage
            path={report.image_url}
            alt={CATEGORY_MAP[report.category]?.label}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-100 dark:bg-surface-800">
            <ImageOff className="h-10 w-10 text-surface-400" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-surface-950/55 text-lg backdrop-blur">
          {categoryEmoji(report.category)}
        </div>
        <div className="absolute right-3 top-3">
          <ScoreRing score={report.priority_score} size={52} strokeWidth={5} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-surface-950/70 to-transparent px-3 pb-2.5 pt-8">
          <SeverityBadge severity={report.severity} className="shadow-soft" />
          <StatusBadge status={report.status} className="shadow-soft" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold capitalize text-surface-900 dark:text-white">
              {CATEGORY_MAP[report.category]?.label ?? report.category}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-surface-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{report.address || 'Pinned location'}</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3 text-xs text-surface-400 dark:border-surface-800">
          <span>{timeAgo(report.created_at)}</span>
          <span className="flex items-center gap-1">
            <HandCoins className="h-3.5 w-3.5 text-cyan-500" />
            {report.confirmations_count} confirmed
          </span>
        </div>
      </div>
    </Link>
  )
}
