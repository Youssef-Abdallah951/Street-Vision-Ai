import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterX, Search, ListFilter, Camera } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { ReportCard } from '@/components/reports/ReportCard'
import { useAppStore } from '@/store/app'
import { CATEGORIES, ALL_STATUSES, SEVERITIES, SEVERITY_META, statusLabel } from '@/lib/constants'

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

export function ReportsListPage() {
  const db = useAppStore((s) => s.db)
  const currentUserId = useAppStore((s) => s.currentUserId)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  const all = useMemo(() => db.reports, [db])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const cutoff =
      dateRange === 'all'
        ? 0
        : Date.now() - parseInt(dateRange, 10) * 86400000

    return all.filter((r) => {
      if (q && !`${r.category} ${r.address ?? ''}`.toLowerCase().includes(q)) return false
      if (category !== 'all' && r.category !== category) return false
      if (severity !== 'all' && r.severity !== severity) return false
      if (status !== 'all' && r.status !== status) return false
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false
      return true
    })
  }, [all, query, category, severity, status, dateRange])

  const hasFilters =
    query !== '' || category !== 'all' || severity !== 'all' || status !== 'all' || dateRange !== 'all'

  return (
    <PageContainer>
      <PageHeader
        title="Street Reports"
        description="Browse AI-verified infrastructure problems reported by the community."
      >
        <Link to="/report">
          <Button leftIcon={<Camera className="h-4 w-4" />}>Report a Problem</Button>
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-2xl border border-surface-200/70 bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-5 dark:border-surface-800 dark:bg-surface-900">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problem, street…"
            className="h-10 w-full rounded-xl border border-surface-200 bg-white pl-9 pr-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-surface-700 dark:bg-surface-800 dark:text-white"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </Select>
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity">
          <option value="all">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{SEVERITY_META[s].label}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </Select>
        <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} aria-label="Date range">
          {DATE_RANGES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery('')
              setCategory('all')
              setSeverity('all')
              setStatus('all')
              setDateRange('all')
            }}
            leftIcon={<FilterX className="h-4 w-4" />}
            className="sm:col-span-2 lg:col-span-5 lg:justify-self-end"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-surface-400">
        <ListFilter className="h-4 w-4" />
        {filtered.length} {filtered.length === 1 ? 'report' : 'reports'} found
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={ListFilter}
            title="No reports match your filters"
            description="Try adjusting the filters or be the first to report this problem."
            actionLabel="Report a problem"
            actionHref="/report"
          />
        </div>
      )}
    </PageContainer>
  )
}
