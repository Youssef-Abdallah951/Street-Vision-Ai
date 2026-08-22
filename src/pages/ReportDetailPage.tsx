import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  HandCoins,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Users,
  ImageIcon,
} from 'lucide-react'
import { PageContainer } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { DetectionOverlay } from '@/components/ai/DetectionOverlay'
import { SignedImage } from '@/components/ui/SignedImage'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  SeverityBadge,
  StatusBadge,
  CategoryBadge,
} from '@/components/ui/badges'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { CATEGORY_MAP, STATUS_FLOW, STATUS_META } from '@/lib/constants'
import { cn, formatDateTime } from '@/lib/utils'

function Timeline({
  status,
  history,
}: {
  status: string
  history: Array<{ status: string; created_at: string; note?: string | null }>
}) {
  const rejected = status === 'rejected'
  const currentIdx = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number])

  const getDate = (s: string) => {
    const entry = [...history].reverse().find((h) => h.status === s)
    return entry?.created_at ? formatDateTime(entry.created_at) : undefined
  }

  return (
    <ol className="relative space-y-0">
      {STATUS_FLOW.map((s, i) => {
        const done = !rejected && i <= currentIdx
        const isCurrent = !rejected && i === currentIdx
        const isResolved = s === 'resolved'
        const date = getDate(s)
        return (
          <li key={s} className="relative flex gap-4 pb-7 last:pb-0">
            {i < STATUS_FLOW.length - 1 && (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-16px)] w-0.5',
                  done ? 'bg-green-400' : 'bg-surface-200 dark:bg-surface-700',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                done
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-surface-300 bg-white text-surface-300 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-600',
                isResolved && done && 'bg-green-500',
              )}
            >
              {done && i === STATUS_FLOW.length - 1 ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : done ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent
                      ? 'text-surface-900 dark:text-white'
                      : done
                        ? 'text-surface-700 dark:text-surface-200'
                        : 'text-surface-400 dark:text-surface-500',
                  )}
                >
                  {STATUS_META[s as keyof typeof STATUS_META].label}
                </p>
                {isCurrent && <Badge tone="brand">Current</Badge>}
              </div>
              {date && <p className="mt-0.5 text-xs text-surface-400">{date}</p>}
            </div>
          </li>
        )
      })}
      {rejected && (
        <li className="relative flex gap-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-red-400 bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <span className="text-xs font-bold">!</span>
          </span>
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejected</p>
            <p className="mt-0.5 text-xs text-surface-400">
              {getDate('rejected') ?? 'Review date'}
            </p>
          </div>
        </li>
      )}
    </ol>
  )
}

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const db = useAppStore((s) => s.db)
  const currentUserId = useAppStore((s) => s.currentUserId)
  const confirmReport = useAppStore((s) => s.confirmReport)
  const toast = useAppStore((s) => s.toast)

  const report = useMemo(() => {
    if (!id) return null
    return db.reports.find((r) => r.id === id) ?? null
  }, [db, id])

  const [shared, setShared] = useState(false)

  const authUser = useAuthStore((s) => s.user)
  const isOwner = currentUserId === report?.user_id
  const isAdmin = authUser?.role === 'admin'

  if (!report) {
    return (
      <PageContainer className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Report not found</h1>
        <p className="mt-2 text-surface-500 dark:text-surface-400">
          This report may have been removed or the link is invalid.
        </p>
        <Link to="/reports" className="mt-6">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to reports
          </Button>
        </Link>
      </PageContainer>
    )
  }

  if (currentUserId && !isOwner && !isAdmin) {
    return (
      <PageContainer className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Access denied</h1>
        <p className="mt-2 text-surface-500 dark:text-surface-400">
          You do not have permission to view this report.
        </p>
        <Link to="/reports" className="mt-6">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to reports
          </Button>
        </Link>
      </PageContainer>
    )
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: 'StreetVision AI report', url })
        return
      }
    } catch {
      /* cancelled */
    }
    await navigator.clipboard.writeText(url)
    setShared(true)
    toast('Link copied', 'Report link copied to clipboard.')
  }

  return (
    <PageContainer className="max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Image with overlay */}
          <Card>
            <CardContent className="p-4">
              <DetectionOverlay imageUrl={report.image_url ?? undefined} detections={report.detections} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CategoryBadge category={report.category} />
                <SeverityBadge severity={report.severity} />
                <StatusBadge status={report.status} />
              </div>
            </CardContent>
          </Card>

          {/* Before/After */}
          {report.status === 'resolved' && report.resolved_image_url && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-brand-500" />
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Before / After</h3>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <Badge tone="amber" className="mb-2">Before</Badge>
                    {report.image_url && (
                      <SignedImage path={report.image_url} alt="Before" className="aspect-video w-full rounded-xl object-cover" />
                    )}
                  </div>
                  <div>
                    <Badge tone="green" className="mb-2">After</Badge>
                    {report.resolved_image_url && (
                      <SignedImage path={report.resolved_image_url} alt="After" className="aspect-video w-full rounded-xl object-cover" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {report.description && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Description</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                  {report.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reporter */}
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Avatar name={report.user?.name ?? 'Anonymous'} />
              <div>
                <p className="text-sm font-semibold text-surface-900 dark:text-white">
                  Reported by {report.user?.name ?? 'a neighbor'}
                </p>
                <p className="text-xs text-surface-400">{formatDateTime(report.created_at)}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
                <Users className="h-4 w-4" />
                {report.confirmations_count} confirmed
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Summary card */}
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <h1 className="text-center text-xl font-bold capitalize text-surface-900 dark:text-white">
                {CATEGORY_MAP[report.category]?.label ?? report.category}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-surface-400">
                <MapPin className="h-3.5 w-3.5" />
                 {report.address || 'Pinned location'}
              </p>

              <div className="mt-5 flex items-center gap-6">
                <ScoreRing score={report.priority_score} size={110} label="Priority" />
                <div className="flex flex-col gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                       {Math.round(report.confidence ?? 0)}%
                    </p>
                    <p className="text-xs text-surface-400">AI confidence</p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1 text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      <HandCoins className="h-5 w-5" />
                      {report.confirmations_count}
                    </p>
                    <p className="text-xs text-surface-400">Confirmations</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full">
                <div className="flex items-center justify-between text-xs text-surface-400">
                  <span>Priority band</span>
                  <span className="font-medium text-surface-600 dark:text-surface-300">
                    {report.priority_score <= 25 ? 'Low' : report.priority_score <= 50 ? 'Medium' : report.priority_score <= 75 ? 'High' : 'Critical'}
                  </span>
                </div>
                <ProgressBar
                  value={report.priority_score}
                  className="mt-2"
                  color={report.priority_score <= 25 ? 'var(--sv-priority-low)' : report.priority_score <= 50 ? 'var(--sv-priority-medium)' : report.priority_score <= 75 ? 'var(--sv-priority-high)' : 'var(--sv-priority-critical)'}
                />
              </div>

              <div className="mt-5 w-full space-y-2">
                {currentUserId && !report.current_user_confirmed ? (
                  <Button
                    className="w-full"
                    size="lg"
                    leftIcon={<HandCoins className="h-4 w-4" />}
                    onClick={() => {
                      confirmReport(report.id)
                      toast('Confirmed', 'Thanks! This raises the report priority.')
                    }}
                  >
                    Confirm this problem
                  </Button>
                ) : currentUserId ? (
                  <Button className="w-full" size="lg" variant="success" disabled leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                    You confirmed this
                  </Button>
                ) : (
                  <Link to="/login" className="block">
                    <Button className="w-full" size="lg" leftIcon={<HandCoins className="h-4 w-4" />}>
                      Confirm this problem
                    </Button>
                  </Link>
                )}
                <Button variant="outline" className="w-full" onClick={share} leftIcon={<Share2 className="h-4 w-4" />}>
                  {shared ? 'Link copied' : 'Share report'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card>
            <CardContent className="space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                  <Calendar className="h-4 w-4" /> Reported
                </span>
                <span className="font-medium text-surface-700 dark:text-surface-200">{formatDateTime(report.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                  <MapPin className="h-4 w-4" /> Location
                </span>
                <span className="font-mono text-xs text-surface-700 dark:text-surface-200">
                  {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                  <ShieldCheck className="h-4 w-4" /> AI provider
                </span>
                <span className="font-medium text-surface-700 dark:text-surface-200">StreetVision Vision</span>
              </div>
              {report.resolved_at && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                    <CheckCircle2 className="h-4 w-4" /> Resolved
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatDateTime(report.resolved_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-5 text-sm font-semibold text-surface-900 dark:text-white">Status timeline</h3>
              <Timeline status={report.status} history={report.history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
