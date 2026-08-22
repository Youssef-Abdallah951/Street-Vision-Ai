import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  MapPin,
  CheckCircle2,
  Timer,
  Users,
  Activity,
  BarChart3,
} from 'lucide-react'
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
} from 'recharts'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { StreetMap } from '@/components/map/StreetMap'
import { useAppStore } from '@/store/app'
import { SEVERITY_META } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid rgb(226 232 240)',
  fontSize: 12,
  background: 'var(--sv-tooltip-bg, #fff)',
  color: 'var(--sv-tooltip-fg, #0f172a)',
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; payload?: Record<string, unknown> }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs shadow-lift dark:border-surface-700 dark:bg-surface-800">
      <p className="font-semibold text-surface-900 dark:text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-surface-500 dark:text-surface-400">
          {p.name}: <span className="font-medium text-surface-800 dark:text-surface-100">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function AnalyticsPage() {
  const db = useAppStore((s) => s.db)

  const analytics = useMemo(() => useAppStore.getState().computeAnalytics(), [db])
  const reports = useMemo(() => db.reports, [db])

  const severityColors = ['var(--sv-severity-critical)', 'var(--sv-severity-high)', 'var(--sv-severity-medium)', 'var(--sv-severity-low)']

  const topArea = analytics.byDistrict[0]
  const topCategory = analytics.byCategory[0]

  return (
    <PageContainer>
      <PageHeader
        title="Smart Analytics"
        description="Street intelligence from community-powered reports."
      />

      {/* Stat row */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          icon={MapPin}
          label="Most problematic area"
          value={topArea?.district ?? '—'}
          hint={`${topArea?.count ?? 0} reports`}
          tone="red"
        />
        <StatCard
          icon={Activity}
          label="Most common problem"
          value={topCategory ? topCategory.label : '—'}
          hint={`${topCategory?.count ?? 0} reports`}
          tone="brand"
        />
        <StatCard
          icon={Flame}
          label="Critical hotspots"
          value={analytics.severityDist[0]?.count ?? 0}
          hint="Critical severity reports"
          tone="red"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolution rate"
          value={`${analytics.resolutionRate}%`}
          tone="green"
        />
        <StatCard
          icon={Timer}
          label="Avg. resolution time"
          value={`${analytics.avgResolutionDays.toFixed(1)}d`}
          tone="violet"
        />
        <StatCard
          icon={Users}
          label="Active community"
          value={formatNumber(analytics.activeUsers)}
          hint={`${formatNumber(analytics.totalConfirmations)} confirmations`}
          tone="cyan"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Reports over time */}
        <Card>
          <CardHeader>
            <CardTitle>Reports over time</CardTitle>
            <CardDescription>Daily report volume, last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analytics.reportsOverTime} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3074f5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3074f5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-chart-grid, #e2e8f0)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" name="Reports" stroke="#3074f5" strokeWidth={2.5} fill="url(#reportsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Problems by category */}
        <Card>
          <CardHeader>
            <CardTitle>Problems by category</CardTitle>
            <CardDescription>What the city is dealing with</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.byCategory} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-chart-grid, #e2e8f0)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Reports" radius={[0, 6, 6, 0]} fill="#3074f5" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Severity distribution</CardTitle>
            <CardDescription>How urgent are current reports?</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={analytics.severityDist}
                  dataKey="count"
                  nameKey="severity"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
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

        {/* By location */}
        <Card>
          <CardHeader>
            <CardTitle>Problems by location</CardTitle>
            <CardDescription>Reports grouped by district</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.byDistrict} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-chart-grid, #e2e8f0)" vertical={false} />
                <XAxis dataKey="district" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Reports" radius={[6, 6, 0, 0]} fill="#7c3aed" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline health</CardTitle>
            <CardDescription>Reports by workflow stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.statusDist} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sv-chart-grid, #e2e8f0)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Reports" radius={[6, 6, 0, 0]} fill="#0891b2" barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Problem density heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Problem density heatmap</CardTitle>
            <CardDescription>Areas with the highest concentration of issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
              <StreetMap
                reports={reports}
                mode="heatmap"
                clustered={false}
                height={240}
                className="rounded-none border-0"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community participation strip */}
      <Card className="mt-6 border-brand-100 bg-gradient-to-r from-brand-50/80 to-white dark:border-brand-900 dark:from-brand-950/30 dark:to-surface-900">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                {formatNumber(analytics.totalConfirmations)} community confirmations power these insights
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Confirming problems you've seen keeps priority scores accurate and cities responsive.
              </p>
            </div>
          </div>
          <Link to="/map">
            <Button variant="outline">Explore the map</Button>
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
