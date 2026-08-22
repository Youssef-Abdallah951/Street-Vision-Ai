import L from 'leaflet'
import { env } from '@/lib/env'
import { severityColor } from '@/lib/constants'
import type { Severity } from '@/types'
import { uid } from '@/lib/utils'

// ============================================================
// Map provider abstraction
// Default: OpenStreetMap raster tiles (no key required).
// Optional: Mapbox vector tiles when VITE_MAPBOX_ACCESS_TOKEN is set.
// ============================================================

export interface TileConfig {
  url: string
  attribution: string
  maxZoom: number
  options?: Record<string, unknown>
}

export function getTileConfig(theme: 'light' | 'dark'): TileConfig {
  if (env.mapboxToken) {
    const styleId = theme === 'dark' ? 'dark-v11' : 'streets-v12'
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/{z}/{x}/{y}?access_token=${env.mapboxToken}`,
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }
  }

  if (theme === 'dark') {
    return {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }
  }

  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }
}

// ------------------------------------------------------------
// Severity marker
// ------------------------------------------------------------
const ICONS = new Map<string, L.DivIcon>()

export function severityMarkerIcon(severity: Severity, selected = false): L.DivIcon {
  const key = `${severity}-${selected}`
  const cached = ICONS.get(key)
  if (cached) return cached

  const color = severityColor(severity)
  const icon = L.divIcon({
    className: 'sv-marker-wrapper',
    html: `
      <div class="sv-marker${selected ? ' sv-marker--selected' : ''}" style="background:${color}">
        <svg xmlns="http://www.w3.org/2000/svg" width="${selected ? 18 : 15}" height="${selected ? 18 : 15}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
    iconSize: [selected ? 40 : 32, selected ? 40 : 32],
    iconAnchor: [selected ? 20 : 16, selected ? 20 : 16],
    popupAnchor: [0, selected ? -20 : -16],
  })
  ICONS.set(key, icon)
  return icon
}

// ------------------------------------------------------------
// Geolocation
// ------------------------------------------------------------
export function getCurrentPosition(timeoutMs = 12000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: timeoutMs,
    })
  })
}

// ------------------------------------------------------------
// Reverse geocoding (Nominatim, free, no key)
// ------------------------------------------------------------
export interface ReverseGeocodeResult {
  address?: string
  district?: string
  city?: string
  display: string
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=16&addressdetails=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error('geocoding failed')
    const data = await res.json()
    const a = data.address ?? {}
    const district =
      a.suburb || a.neighbourhood || a.quarter || a.city_district || a.town || a.city
    const road = a.road || data.name || ''
    const address = road
      ? `${data.display_name?.split(',')[0] ?? ''}`.trim()
      : district
    return {
      address: road ? road : undefined,
      district: district ? String(district) : undefined,
      display: String(data.display_name ?? ''),
    }
  } catch {
    return { display: '' }
  }
}

export async function searchLocation(
  query: string,
): Promise<Array<{ lat: number; lng: number; label: string }>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return []
    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>
    return data.map((d) => ({
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      label: d.display_name,
    }))
  } catch {
    return []
  }
}

export const fallbackCenter = { lat: 30.2672, lng: -97.7431 }
export { uid as randomMarkerId }
