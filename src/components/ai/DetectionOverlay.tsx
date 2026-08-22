import { useState } from 'react'
import type { BoundingBox } from '@/types'
import { useSignedImageUrl } from '@/hooks/useSignedImageUrl'

// ============================================================
// AI detection overlay — draws bounding boxes + labels on top
// of the street photo.
// ============================================================

function BoxOverlay({
  box,
  label,
  confidence,
  color,
}: {
  box: BoundingBox
  label: string
  confidence: number
  color: string
}) {
  return (
    <div
      className="pointer-events-none absolute rounded border-2"
      style={{
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        borderColor: color,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.15)`,
      }}
    >
      <span
        className="absolute -top-6 left-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white"
        style={{ background: color }}
      >
        {label} {Math.round(confidence)}%
      </span>
    </div>
  )
}

export function DetectionOverlay({
  imageUrl,
  detections,
  showLabels = true,
  className,
}: {
  imageUrl?: string
  detections: Array<{ label: string; confidence: number; boundingBox?: BoundingBox }>
  showLabels?: boolean
  className?: string
}) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [scale, setScale] = useState(1)
  const signedUrl = useSignedImageUrl(imageUrl)

  const color = 'rgba(26, 214, 130, 1)'

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-xl">
        {signedUrl && (
          <img
            src={signedUrl}
            alt="Street report"
            className="h-auto w-full"
            onLoad={(e) => {
              const img = e.currentTarget
              setNatural({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height })
              setScale(img.width > 0 && img.naturalWidth ? img.width / img.naturalWidth : 1)
            }}
          />
        )}
        {natural && (
          <div className="pointer-events-none absolute inset-0">
            {detections.map((d, i) =>
              d.boundingBox ? (
                <BoxOverlay
                  key={i}
                  box={{
                    x: d.boundingBox.x * scale,
                    y: d.boundingBox.y * scale,
                    width: d.boundingBox.width * scale,
                    height: d.boundingBox.height * scale,
                  }}
                  label={d.label}
                  confidence={d.confidence}
                  color={color}
                />
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  )
}
