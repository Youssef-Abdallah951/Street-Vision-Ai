import { useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileStack,
  Flame,
  Clock,
  CheckCircle2,
  TrendingUp,
  ClipboardList,
  ArrowRight,
} from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { StreetMap } from '@/components/map/StreetMap'
import { SeverityBadge, StatusBadge, CategoryBadge } from '@/components/ui/badges'
import { SignedImage } from '@/components/ui/SignedImage'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { AdminNav } from '@/pages/admin/AdminNav'
import { timeAgo, formatNumber } from '@/lib/utils'

export function AdminPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const db = useAppStore((s) => s.db)
  const currentUserId = useAppStore((s) => s.currentUserId)
  const computeAnalytics = useAppStore((s) => s.computeAnalytics)

  const analytics = useMemo(() => computeAnalytics(), [computeAnalytics])
  const reports = db.reports
  const recent = reports.slice(0, 6)

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Admin Dashboard" description="Operate reports, assignments and resolutions." />
      <div className="mt-5">
        <AdminNav />
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={FileStack} label="Total reports" value={analytics.total} tone="brand" />
        <StatCard icon={Flame} label="Critical reports" value={analytics.severityDist[0]?.count ?? 0} tone="red" />
        <StatCard icon={Clock} label="Pending review" value={analytics.pendingCount} tone="amber" />
        <StatCard icon={CheckCircle2} label="Resolved" value={analytics.resolvedCount} tone="green" />
        <StatCard icon={TrendingUp} label="Resolution rate" value={`${analytics.resolutionRate}%`} tone="violet" />
        <StatCard icon={Clock} label="Avg. resolution" value={`${analytics.avgResolutionDays.toFixed(1)}d`} tone="cyan" />
      </div>

      {/* Live map */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">Live map — all reports</h3>
            <Link to="/admin/reports" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
              Manage reports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
            <StreetMap reports={reports} height={340} className="rounded-none border-0" />
          </div>
        </CardContent>
      </Card>

      {/* Recent reports */}
      <Card className="mt-6">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">Recent reports</h3>
            <Link to="/admin/reports" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-left text-xs uppercase tracking-wide text-surface-400 dark:border-surface-800">
                  <th className="pb-2.5 pr-4 font-medium">Report</th>
                  <th className="pb-2.5 pr-4 font-medium">Category</th>
                  <th className="pb-2.5 pr-4 font-medium">Severity</th>
                  <th className="pb-2.5 pr-4 font-medium">Status</th>
                  <th className="pb-2.5 pr-4 font-medium">Priority</th>
                  <th className="pb-2.5 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-surface-50 last:border-0 dark:border-surface-800/60">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {r.image_url ? (
                          <SignedImage path={r.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-surface-100 dark:bg-surface-800" />
                        )}
                        <Link to={`/reports/${r.id}`} className="font-medium text-surface-800 hover:text-brand-600 dark:text-surface-200 dark:hover:text-brand-400">
                          #{r.id.slice(-4)}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 pr-4"><CategoryBadge category={r.category} /></td>
                    <td className="py-3 pr-4"><SeverityBadge severity={r.severity} /></td>
                    <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 pr-4 font-semibold text-surface-800 dark:text-surface-200">{r.priority_score}</td>
                    <td className="py-3 text-surface-400">{timeAgo(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
