import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilterX,
  Flame,
  MapPin,
  HandCoins,
  Layers,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { StreetMap } from '@/components/map/StreetMap'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { SeverityBadge, StatusBadge, PriorityBadge } from '@/components/ui/badges'
import { SignedImage } from '@/components/ui/SignedImage'
import { useAppStore } from '@/store/app'
import { CATEGORIES, SEVERITIES, SEVERITY_META } from '@/lib/constants'
import { cn, timeAgo } from '@/lib/utils'
import { getCurrentPosition } from '@/services/mapProvider'
import { fallbackCenter } from '@/services/mapProvider'
import { fetchCommunityReports } from '@/services/supabaseApi'
import type { Report } from '@/types'

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]

export function MapPage() {
  const currentUserId = useAppStore((s) => s.currentUserId)
  const confirmReport = useAppStore((s) => s.confirmReport)
  const toast = useAppStore((s) => s.toast)
  const navigate = useNavigate()

  const [communityReports, setCommunityReports] = useState<Report[]>([])
  const [communityLoading, setCommunityLoading] = useState(true)
  const [communityError, setCommunityError] = useState<string | null>(null)

  const [mode, setMode] = useState<'markers' | 'heatmap'>('markers')
  const [clustered, setClustered] = useState(true)
  const [category, setCategory] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileFilters, setMobileFilters] = useState(false)
  const [center, setCenter] = useState<[number, number]>([fallbackCenter.lat, fallbackCenter.lng])

  useEffect(() => {
    let cancelled = false
    setCommunityLoading(true)
    setCommunityError(null)
    fetchCommunityReports()
      .then((reports) => {
        if (!cancelled) setCommunityReports(reports)
      })
      .catch((e: any) => {
        if (!cancelled) setCommunityError(e?.message ?? 'Failed to load community reports.')
      })
      .finally(() => {
        if (!cancelled) setCommunityLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const all = communityError ? [] : communityReports

  const filtered = useMemo(() => {
    const cutoff =
      dateRange === 'all' ? 0 : Date.now() - parseInt(dateRange, 10) * 86400000
    return all.filter((r) => {
      if (category !== 'all' && r.category !== category) return false
      if (severity !== 'all' && r.severity !== severity) return false
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false
      return true
    })
  }, [all, category, severity, dateRange])

  const selected = selectedId ? filtered.find((r) => r.id === selectedId) ?? null : null

  const locate = async () => {
    try {
      const pos = await getCurrentPosition()
      setCenter([pos.coords.latitude, pos.coords.longitude])
    } catch {
      toast('Location unavailable', 'Could not get your location.', 'info')
    }
  }

  const hasFilters = category !== 'all' || severity !== 'all' || dateRange !== 'all'

  const FilterControls = (
    <div className="flex flex-col gap-4">
      {communityLoading && (
        <div className="flex items-center justify-center py-4 text-sm text-surface-400">
          Loading community reports…
        </div>
      )}
      {communityError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {communityError}
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => {
            setCommunityError(null)
            setCommunityLoading(true)
            fetchCommunityReports()
              .then(setCommunityReports)
              .catch((e: any) => setCommunityError(e?.message ?? 'Failed to load.'))
              .finally(() => setCommunityLoading(false))
          }}>
            Retry
          </Button>
        </div>
      )}
      {!communityLoading && !communityError && (
        <>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-400">Category</p>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category filter">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-400">Severity</p>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity filter">
              <option value="all">All severities</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{SEVERITY_META[s].label}</option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-400">Reported</p>
            <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} aria-label="Date filter">
              {DATE_RANGES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-surface-200 px-3 py-2.5 dark:border-surface-700">
            <span className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
              <Layers className="h-4 w-4 text-brand-500" /> Cluster markers
            </span>
            <Toggle checked={clustered} onChange={setClustered} size="sm" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-surface-200 px-3 py-2.5 dark:border-surface-700">
            <span className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
              <Flame className="h-4 w-4 text-orange-500" /> Heatmap mode
            </span>
            <Toggle checked={mode === 'heatmap'} onChange={(v) => setMode(v ? 'heatmap' : 'markers')} size="sm" />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setCategory('all')
                setSeverity('all')
                setDateRange('all')
              }}
              leftIcon={<FilterX className="h-4 w-4" />}
              className="justify-self-start"
            >
              Clear filters
            </Button>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Sidebar */}
      <aside
        className={cn(
          'z-20 w-full shrink-0 border-b border-surface-200 bg-white/95 backdrop-blur lg:w-[340px] lg:border-b-0 lg:border-r lg:bg-white dark:border-surface-800 dark:bg-surface-900/95 dark:lg:bg-surface-900',
          mobileFilters ? 'max-h-[calc(100vh-4rem)] overflow-y-auto p-4' : 'hidden p-0 lg:block lg:p-5',
        )}
      >
        <div className="hidden lg:block">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white">Street Map</h1>
              <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
                {communityLoading ? 'Loading…' : `${filtered.length} visible ${filtered.length === 1 ? 'report' : 'reports'}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={locate} leftIcon={<MapPin className="h-4 w-4" />}>
              Locate
            </Button>
          </div>
          <div className="mt-5">{FilterControls}</div>

          {/* Selected report */}
          {selected && (
            <Card className="mt-5 overflow-hidden animate-fade-up">
              <div className="relative">
                {selected.image_url && (
                  <SignedImage path={selected.image_url} alt={selected.category} className="h-36 w-full object-cover" />
                )}
                <button
                  onClick={() => setSelectedId(null)}
                  className="absolute right-2 top-2 rounded-full bg-surface-950/60 p-1 text-white backdrop-blur"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize text-surface-900 dark:text-white">
                    {selected.category.replace('-', ' ')}
                  </h3>
                  <SeverityBadge severity={selected.severity} />
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-surface-400">
                  <MapPin className="h-3 w-3" /> {selected.address || 'Pinned location'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <PriorityBadge score={selected.priority_score} />
                  <Badge tone="cyan">
                    <HandCoins className="h-3 w-3" /> {(selected as any).confirmations_count ?? 0}
                  </Badge>
                </div>
                {currentUserId && !(selected as any).current_user_confirmed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      confirmReport(selected.id)
                      toast('Confirmed', 'Thanks — this raises the report priority.')
                    }}
                  >
                    Confirm this problem
                  </Button>
                )}
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigate(`/reports/${selected.id}`)}
                >
                  View details
                </Button>
              </div>
            </Card>
          )}

          {/* Compact list */}
          {!communityLoading && !communityError && (
            <div className="mt-5 space-y-2">
              {filtered.length > 0
                ? filtered.slice(0, 8).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedId(r.id)
                        if (r.latitude != null && r.longitude != null) setCenter([r.latitude, r.longitude])
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors',
                        selectedId === r.id
                          ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-950/40'
                          : 'border-surface-200 bg-white hover:border-brand-200 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-700',
                      )}
                    >
                      <SignedImage path={r.image_url ?? ''} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium capitalize text-surface-900 dark:text-white">
                          {r.category.replace('-', ' ')}
                        </p>
                        <p className="truncate text-xs text-surface-400">
                          {r.address || 'Pinned'} · {timeAgo(r.created_at)}
                        </p>
                      </div>
                      <SeverityBadge severity={r.severity} />
                    </button>
                  ))
                : !communityLoading && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-200 px-4 py-8 text-center dark:border-surface-700">
                      <p className="text-sm font-medium text-surface-600 dark:text-surface-300">No community reports yet</p>
                      <p className="mt-1 text-xs text-surface-400">
                        Be the first to report a problem in your area.
                      </p>
                    </div>
                  )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile filter trigger */}
      <div className="flex items-center gap-2 border-b border-surface-200 bg-white px-4 py-2.5 lg:hidden dark:border-surface-800 dark:bg-surface-900">
        <button
          onClick={() => setMobileFilters((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:text-surface-300"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {mobileFilters ? 'Hide filters' : 'Filters'}
        </button>
        <span className="text-xs text-surface-400">{filtered.length} reports visible</span>
        <Button size="sm" variant="outline" className="ml-auto" onClick={locate} leftIcon={<MapPin className="h-4 w-4" />}>
          Locate
        </Button>
      </div>

      {/* Mobile filter panel */}
      {mobileFilters && (
         <div className="overflow-y-auto border-b border-surface-200 bg-white p-4 lg:hidden dark:border-surface-800 dark:bg-surface-900">
          {FilterControls}
        </div>
      )}

      {/* Map */}
      <div className="relative min-h-[55vh] flex-1 lg:min-h-0">
        {communityLoading && (
          <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/80 dark:bg-surface-900/80">
            <div className="flex flex-col items-center gap-2 text-surface-400">
              <Flame className="h-8 w-8 animate-pulse" />
              <p className="text-sm">Loading community reports…</p>
            </div>
          </div>
        )}
        {communityError && (
          <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/80 p-4 dark:bg-surface-900/80">
            <div className="max-w-sm text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{communityError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                setCommunityError(null)
                setCommunityLoading(true)
                fetchCommunityReports()
                  .then(setCommunityReports)
                  .catch((e: any) => setCommunityError(e?.message ?? 'Failed to load.'))
                  .finally(() => setCommunityLoading(false))
              }}>
                Retry
              </Button>
            </div>
          </div>
        )}
        <StreetMap
          reports={filtered.map((r) => ({
            ...r,
            confirmations_count: 0,
            current_user_confirmed: false,
            history: [],
            detections: [],
            user: undefined,
            userId: r.user_id ?? '',
            imageUrl: r.image_url,
            priorityScore: r.priority_score,
            lat: r.latitude,
            lng: r.longitude,
            confirmationsCount: 0,
            currentUserConfirmed: false,
          } as any))}
          mode={mode}
          clustered={clustered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          center={center}
          zoom={13}
          searchable
          showLocate
          onLocated={(lat, lng) => setCenter([lat, lng])}
          height="100%"
          className="h-full rounded-none border-0"
        />
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[700] -translate-x-1/2 rounded-full bg-surface-950/75 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
          {mode === 'heatmap' ? 'Heatmap · problem density' : 'Markers colored by severity'}
        </div>
      </div>
    </div>
  )
}
