import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileStack,
  Clock,
  Wrench,
  CheckCircle2,
  HandCoins,
  Camera,
  Map as MapIcon,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback'
import { ReportCard } from '@/components/reports/ReportCard'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'

export function DashboardPage() {
  const authLoading = useAuthStore((s) => s.loading)
  const loading = useAppStore((s) => s.loading)
  const dataLoaded = useAppStore((s) => s.dataLoaded)
  const dataError = useAppStore((s) => s.dataError)
  const refreshData = useAppStore((s) => s.refreshData)
  const db = useAppStore((s) => s.db)
  const currentUserId = useAppStore((s) => s.currentUserId)
  const computeAnalytics = useAppStore((s) => s.computeAnalytics)
  const authUser = useAuthStore((s) => s.user)

  const analytics = useMemo(() => computeAnalytics(), [computeAnalytics])
  const myReports = useMemo(
    () => db.reports.filter((r) => r.user_id === currentUserId),
    [db.reports, currentUserId],
  )
  const user = authUser

  const recent = myReports.slice(0, 6)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const isLoading = authLoading || (loading && !dataLoaded)
  const isError = !isLoading && dataError != null

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mt-8 flex items-center justify-center py-20">
          <Spinner />
        </div>
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer>
        <PageHeader title={`${greeting}, ${user?.name?.split(' ')[0] ?? 'there'}`} description="Here's what's happening across your streets and your reports." />
        <ErrorState
          title="Unable to load dashboard"
          description={dataError ?? 'An unexpected error occurred. Please try again.'}
          onRetry={() => refreshData()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Here's what's happening across your streets and your reports."
      >
        <Link to="/report">
          <Button leftIcon={<Camera className="h-4 w-4" />}>Report a Problem</Button>
        </Link>
        <Link to="/map">
          <Button variant="outline" leftIcon={<MapIcon className="h-4 w-4" />}>
            Open Street Map
          </Button>
        </Link>
      </PageHeader>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={FileStack} label="Total reports" value={analytics.total} tone="brand" />
        <StatCard icon={Clock} label="Pending review" value={analytics.pendingCount} tone="amber" />
        <StatCard icon={Wrench} label="In progress" value={analytics.inProgressCount} tone="violet" />
        <StatCard icon={CheckCircle2} label="Resolved" value={analytics.resolvedCount} tone="green" />
        <StatCard icon={HandCoins} label="Community confirmations" value={analytics.totalConfirmations} tone="cyan" />
        <StatCard icon={Activity} label="Resolution rate" value={`${analytics.resolutionRate}%`} tone="brand" />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">My reports</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            You've submitted {myReports.length} {myReports.length === 1 ? 'report' : 'reports'} to your city.
          </p>
        </div>
        {myReports.length > 6 && (
          <Link to="/reports" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {recent.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={Camera}
              title="No reports yet"
              description="Spot something broken? Take a photo and report it — AI will verify it in seconds."
              actionLabel="Report a problem"
              actionHref="/report"
            />
          </div>
        ) : (
          recent.map((r) => <ReportCard key={r.id} report={r} />)
        )}
      </div>

      <Card className="mt-10 border-brand-100 bg-gradient-to-r from-brand-50/80 to-white dark:border-brand-900 dark:from-brand-950/30 dark:to-surface-900">
        <CardContent className="flex flex-col items-center justify-between gap-6 p-6 sm:flex-row">
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Your community resolved {analytics.resolvedCount} street problems
            </h3>
            <p className="mt-1 max-w-xl text-sm text-surface-500 dark:text-surface-400">
              Confirmed reports get escalated automatically. Help neighbors by confirming issues you've
              seen too.
            </p>
          </div>
          <Link to="/map">
            <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Confirm on the map
            </Button>
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
