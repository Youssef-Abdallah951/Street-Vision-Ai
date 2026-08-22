import { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import 'leaflet.heat'

export interface HeatPoint {
  lat: number
  lng: number
  intensity: number
}

function HeatLayerInner({ points }: { points: HeatPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || points.length === 0) return
    const layer = (L as unknown as { heatLayer: (p: number[][], o?: object) => L.Layer })
      .heatLayer(
        points.map((p) => [p.lat, p.lng, p.intensity]),
        { radius: 28, blur: 22, maxZoom: 17, minOpacity: 0.45, gradient: { 0.2: '#16a34a', 0.4: '#facc15', 0.65: '#ea580c', 1: '#dc2626' } },
      )
    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points.length])

  return null
}

export function HeatmapLayer({ points }: { points: HeatPoint[] }) {
  if (points.length === 0) return null
  return <HeatLayerInner points={points} />
}
