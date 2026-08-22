import { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { CheckCircle2, Timer, TrendingUp, Users } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AdminNav } from '@/pages/admin/AdminNav'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { SEVERITY_META } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid rgb(226 232 240)',
  fontSize: 12,
  background: '#fff',
  color: '#0f172a',
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs shadow-lift dark:border-surface-700 dark:bg-surface-800">
      <p className="font-semibold text-surface-900 dark:text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-surface-500 dark:text-surface-400">
          {p.name}: <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const db = useAppStore((s) => s.db)
  const analytics = useMemo(() => useAppStore.getState().computeAnalytics(), [db])

  const severityColors = ['var(--sv-severity-critical)', 'var(--sv-severity-high)', 'var(--sv-severity-medium)', 'var(--sv-severity-low)']

  // Simulated resolution performance curve (per status stage)
  const resolutionPerformance = analytics.statusDist
    .filter((s) => s.status !== 'rejected')
    .map((s) => ({ label: s.label, reports: s.count }))

  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Admin Analytics" description="Operational metrics across the full reporting pipeline." />
      <div className="mt-5">
        <AdminNav />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Resolution rate" value={`${analytics.resolutionRate}%`} tone="green" />
        <StatCard icon={Timer} label="Avg. resolution time" value={`${analytics.avgResolutionDays.toFixed(1)} days`} tone="violet" />
        <StatCard icon={CheckCircle2} label="Resolved reports" value={analytics.resolvedCount} tone="brand" />
        <StatCard icon={Users} label="Active citizens" value={formatNumber(analytics.activeUsers)} tone="cyan" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reports over time</CardTitle>
            <CardDescription>Daily submission volume, last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analytics.reportsOverTime} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" name="Reports" stroke="#7c3aed" strokeWidth={2.5} fill="url(#adminGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Problems by category</CardTitle>
            <CardDescription>Workload by problem type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.byCategory} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Reports" radius={[0, 6, 6, 0]} fill="#0891b2" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity distribution</CardTitle>
            <CardDescription>Where attention is needed most</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={analytics.severityDist} dataKey="count" nameKey="severity" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {analytics.severityDist.map((entry, i) => (
                    <Cell key={entry.severity} fill={severityColors[i]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => SEVERITY_META[value as keyof typeof SEVERITY_META]?.label ?? value}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline performance</CardTitle>
            <CardDescription>Reports at each workflow stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={resolutionPerformance} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="reports" name="Reports" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* KPI panel */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Resolution rate</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <ProgressBar value={analytics.resolutionRate} color="var(--sv-priority-low)" />
              </div>
              <span className="text-2xl font-bold text-surface-900 dark:text-white">{analytics.resolutionRate}%</span>
            </div>
            <p className="mt-2 text-xs text-surface-400">
              {analytics.resolvedCount} of {analytics.total} reports resolved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Backlog to clear</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <ProgressBar
                  value={(analytics.openCount / Math.max(1, analytics.total)) * 100}
                  color="var(--sv-severity-high)"
                />
              </div>
              <span className="text-2xl font-bold text-surface-900 dark:text-white">{analytics.openCount}</span>
            </div>
            <p className="mt-2 text-xs text-surface-400">Reports currently open or in progress</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
