import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L, { Control } from 'leaflet'
import { Locate, Loader2, MapPin } from 'lucide-react'
import { getTileConfig, getCurrentPosition, reverseGeocode } from '@/services/mapProvider'
import { useThemeStore } from '@/store/theme'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function DraggableMarker({
  position,
  onChange,
}: {
  position: [number, number]
  onChange: (pos: [number, number]) => void
}) {
  const marker = L.divIcon({
    className: 'sv-marker-wrapper',
    html: `
      <div class="sv-marker" style="background:var(--sv-brand)">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng])
    },
  })

  return (
    <Marker
      position={position}
      icon={marker}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const m = e.target as L.Marker
          const p = m.getLatLng()
          onChange([p.lat, p.lng])
        },
      }}
    />
  )
}

function FitToLocation({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(position, 16)
  }, [map, position[0], position[1]])
  return null
}

function LocateButton({ onLocate, busy }: { onLocate: () => void; busy: boolean }) {
  const map = useMap()

  useEffect(() => {
    const c = new Control({ position: 'bottomright' })
    let el: HTMLButtonElement | null = null
    c.onAdd = () => {
      el = document.createElement('button')
      el.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:8px;border:1px solid rgba(226,232,240,0.9);background:#fff;color:#334155;box-shadow:0 1px 2px rgba(0,0,0,0.08);cursor:pointer;'
      renderIcon(el, busy)
      el.onclick = onLocate
      return el
    }
    c.addTo(map)
    return () => {
      map.removeControl(c)
    }
  }, [map, onLocate, busy])

  return null
}

function renderIcon(el: HTMLButtonElement, busy: boolean) {
  el.innerHTML = busy
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" stroke-linecap="round"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
}

export function LocationPickerMap({
  position,
  onChange,
  showAddress = true,
  className,
}: {
  position: [number, number]
  onChange: (pos: [number, number]) => void
  showAddress?: boolean
  className?: string
}) {
  const theme = useThemeStore((s) => s.resolved)
  const tile = useMemo(() => getTileConfig(theme), [theme])
  const [address, setAddress] = useState<string>('')
  const [district, setDistrict] = useState<string>('')
  const [locating, setLocating] = useState(false)

  const updateAddress = async (lat: number, lng: number) => {
    const res = await reverseGeocode(lat, lng)
    setAddress(res.address ?? '')
    setDistrict(res.district ?? '')
  }

  useEffect(() => {
    updateAddress(position[0], position[1])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1]])

  const locate = async () => {
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      const next: [number, number] = [pos.coords.latitude, pos.coords.longitude]
      onChange(next)
    } catch {
      /* user denied or unavailable — keep current marker */
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700" style={{ height: 340 }}>
        <MapContainer center={position} zoom={16} className="h-full w-full" scrollWheelZoom>
          <TileLayer key={`${theme}-${tile.url}`} url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />
          <DraggableMarker position={position} onChange={onChange} />
          <FitToLocation position={position} />
          <LocateButton onLocate={locate} busy={locating} />
        </MapContainer>

        <div className="absolute left-3 top-3 z-[900] flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-surface-600 shadow-soft backdrop-blur dark:bg-surface-800/90 dark:text-surface-300">
          <MapPin className="h-3.5 w-3.5 text-brand-500" />
          {locating ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Locating…
            </span>
          ) : (
            'Drag the pin to adjust'
          )}
        </div>
      </div>

      {showAddress && (
        <div className="flex items-start gap-2.5 rounded-xl border border-surface-200 bg-surface-50/70 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/60">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-surface-900 dark:text-white">
              {address || district || 'Approximate location'}
            </p>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
              {district ? ` · ${district}` : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={locate} loading={locating}>
            <Locate className="h-3.5 w-3.5" />
            My location
          </Button>
        </div>
      )}
    </div>
  )
}
