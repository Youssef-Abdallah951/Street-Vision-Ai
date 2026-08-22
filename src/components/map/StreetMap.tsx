import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { Locate, Search } from 'lucide-react'
import type { ReportWithRelations } from '@/types'
import { severityMarkerIcon, getTileConfig, fallbackCenter, searchLocation } from '@/services/mapProvider'
import { useThemeStore } from '@/store/theme'
import { HeatmapLayer, type HeatPoint } from '@/components/map/HeatmapLayer'
import { SeverityBadge, CategoryBadge } from '@/components/ui/badges'
import { Link } from 'react-router-dom'
import { SignedImage } from '@/components/ui/SignedImage'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ------------------------------------------------------------
// Small internal controls
// ------------------------------------------------------------
function LocateControl({ onLocated }: { onLocated: (lat: number, lng: number) => void }) {
  const map = useMap()
  return (
    <div className="leaflet-top leaflet-left z-[800] flex flex-col gap-2 p-3">
      <button
        onClick={() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              map.flyTo([pos.coords.latitude, pos.coords.longitude], 15)
              onLocated(pos.coords.latitude, pos.coords.longitude)
            },
            () => undefined,
            { enableHighAccuracy: true, timeout: 12000 },
          )
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-700 shadow-soft transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
        aria-label="Locate me"
        title="Go to my location"
      >
        <Locate className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}

function SearchControl({
  onResult,
}: {
  onResult: (lat: number, lng: number) => void
}) {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ lat: number; lng: number; label: string }>>([])
  const [open, setOpen] = useState(false)

  const run = async (q: string) => {
    setQuery(q)
    if (q.trim().length < 3) {
      setResults([])
      return
    }
    const res = await searchLocation(q)
    setResults(res)
    setOpen(true)
  }

  return (
    <div className="leaflet-top leaflet-right z-[800] flex flex-col items-end p-3">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => run(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search location…"
          className="h-9 w-56 rounded-lg border border-surface-200 bg-white pl-8 pr-2 text-sm text-surface-800 shadow-soft placeholder:text-surface-400 focus:border-brand-500 focus:outline-none dark:border-surface-700 dark:bg-surface-800 dark:text-white"
        />
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        {open && results.length > 0 && (
          <div className="absolute right-0 top-10 w-72 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-lift dark:border-surface-700 dark:bg-surface-800">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  map.flyTo([r.lat, r.lng], 15)
                  onResult(r.lat, r.lng)
                  setOpen(false)
                  setQuery(r.label.split(',')[0] ?? '')
                }}
                className="block w-full truncate px-3 py-2.5 text-left text-xs text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AutoFit({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [map, points])
  return null
}

function OnClick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ------------------------------------------------------------
// Main map
// ------------------------------------------------------------
export type MapMode = 'markers' | 'heatmap'

export interface StreetMapProps {
  reports: ReportWithRelations[]
  mode?: MapMode
  clustered?: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
  onPick?: (lat: number, lng: number) => void
  center?: [number, number]
  zoom?: number
  className?: string
  searchable?: boolean
  showLocate?: boolean
  onLocated?: (lat: number, lng: number) => void
  height?: string | number
}

export function StreetMap({
  reports,
  mode = 'markers',
  clustered = true,
  selectedId = null,
  onSelect,
  onPick,
  center,
  zoom = 12,
  className,
  searchable = false,
  showLocate = false,
  onLocated,
  height = '100%',
}: StreetMapProps) {
  const theme = useThemeStore((s) => s.resolved)
  const tile = useMemo(() => getTileConfig(theme), [theme])

  const centerArr: [number, number] = center ?? [fallbackCenter.lat, fallbackCenter.lng]
  const points: Array<[number, number]> = reports
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => [r.lat as number, r.lng as number])

  const heatPoints: HeatPoint[] = reports
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      lat: r.lat as number,
      lng: r.lng as number,
      intensity: r.priorityScore / 100,
    }))

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-surface-200/70 dark:border-surface-800', className)} style={{ height }}>
      <MapContainer
        center={centerArr}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer key={`${theme}-${tile.url}`} url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />
        {points.length > 0 && <AutoFit points={points} />}

        {mode === 'markers' && (
          <MarkerClusterGroup
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            disableClusteringAtZoom={17}
          >
            {reports
              .filter((r) => r.lat != null && r.lng != null)
              .map((r) => (
                <Marker
                  key={r.id}
                  position={[r.lat as number, r.lng as number]}
                  icon={severityMarkerIcon(r.severity, r.id === selectedId)}
                  eventHandlers={{
                    click: () => onSelect?.(r.id),
                  }}
                >
                  <Popup className="sv-popup">
                    <div className="w-60">
                      {r.image_url && (
                        <SignedImage
                          path={r.image_url}
                          alt={r.category}
                          className="h-28 w-full rounded-lg object-cover"
                        />
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <CategoryBadge category={r.category} />
                        <SeverityBadge severity={r.severity} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-surface-500 dark:text-surface-400">
                        {r.address || 'Location pinned'}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-surface-900 dark:text-white">
                          Priority {r.priority_score}/100
                        </span>
                        <span className="text-surface-400">{timeAgo(r.created_at)}</span>
                      </div>
                      <Link
                        to={`/reports/${r.id}`}
                        className="mt-3 block rounded-lg bg-brand-600 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                      >
                        View report
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MarkerClusterGroup>
        )}

        {mode === 'heatmap' && <HeatmapLayer points={heatPoints} />}

        {onPick && <OnClick onPick={onPick} />}
        {searchable && <SearchControl onResult={() => undefined} />}
        {showLocate && <LocateControl onLocated={(lat, lng) => onLocated?.(lat, lng)} />}
      </MapContainer>
    </div>
  )
}
