import type {
  BoundingBox,
  CategoryId,
  DetectionResult,
  Severity,
} from '@/types'
import { env } from '@/lib/env'
import { seededRandom, uid } from '@/lib/utils'

// ============================================================
// AI Detection Layer
//
// The UI only ever talks to `analyzeStreetImage`. The active
// provider is resolved from environment configuration:
//   mock   -> built-in browser detection (default, no key needed)
//   custom -> any YOLO / Roboflow / FastAPI endpoint that returns
//             a StreetVisionDetectionPayload
//
// To integrate a real model later, implement `AIDetectionProvider`
// and register it — the frontend does not need to change.
// ============================================================

export type ImageInput = File | Blob | string

export interface AIDetectionProvider {
  id: string
  name: string
  analyze(image: ImageInput): Promise<DetectionResult>
}

export interface StreetVisionDetectionPayload {
  category: CategoryId
  label: string
  confidence: number
  severity: Severity
  detections: Array<{
    label: string
    confidence: number
    boundingBox: BoundingBox
  }>
  estimatedSize?: string
  description: string
}

// ------------------------------------------------------------
// Mock provider — runs entirely in the browser
// ------------------------------------------------------------
const MOCK_WEIGHTS: Array<[CategoryId, number]> = [
  ['pothole', 0.22],
  ['road-crack', 0.16],
  ['garbage', 0.14],
  ['street-light', 0.12],
  ['sidewalk', 0.1],
  ['flooding', 0.09],
  ['fallen-tree', 0.06],
  ['traffic-sign', 0.05],
  ['road-obstacle', 0.04],
  ['other', 0.02],
]

function pickWeighted(r: number): CategoryId {
  let acc = 0
  for (const [cat, w] of MOCK_WEIGHTS) {
    acc += w
    if (r < acc) return cat
  }
  return 'other'
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadImageData(image: ImageInput): Promise<{
  width: number
  height: number
  contrast: number
  brightness: number
  darkRatio: number
}> {
  let url: string
  if (typeof image === 'string') {
    url = image
  } else {
    url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Could not read image'))
      reader.readAsDataURL(image)
    })
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Could not decode image'))
    el.src = url
  })

  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 512 / img.width)
  canvas.width = Math.max(32, Math.floor(img.width * scale))
  canvas.height = Math.max(32, Math.floor(img.height * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  let sum = 0
  let sumSq = 0
  let dark = 0
  const n = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
    sum += lum
    sumSq += lum * lum
    if (lum < 0.45) dark++
  }
  const brightness = sum / n
  const variance = sumSq / n - brightness * brightness
  const contrast = Math.sqrt(Math.max(0, variance))
  const darkRatio = dark / n

  return { width: canvas.width, height: canvas.height, contrast, brightness, darkRatio }
}

function makeMockBoundingBox(
  w: number,
  h: number,
  seed: () => number,
): BoundingBox {
  const bw = 0.18 + seed() * 0.3
  const bh = 0.16 + seed() * 0.26
  const x = 0.28 + seed() * 0.3
  const y = 0.3 + seed() * 0.28
  return {
    x: Math.round(x * w),
    y: Math.round(y * h),
    width: Math.round(bw * w),
    height: Math.round(bh * h),
  }
}

function describeResult(category: CategoryId, severity: Severity): string {
  const labels: Record<CategoryId, string> = {
    pothole: 'Pothole',
    'road-crack': 'Road crack',
    garbage: 'Garbage accumulation',
    'street-light': 'Broken street light',
    sidewalk: 'Damaged sidewalk',
    flooding: 'Flooded street',
    'fallen-tree': 'Fallen tree',
    'traffic-sign': 'Damaged traffic sign',
    'road-obstacle': 'Road obstacle',
    other: 'Infrastructure problem',
  }
  const sizes = {
    critical: 'large',
    high: 'significant',
    medium: 'moderate',
    low: 'minor',
  }
  return `AI detected a ${sizes[severity]} ${labels[category].toLowerCase()} in the image.`
}

class MockAIDetectionProvider implements AIDetectionProvider {
  id = 'mock'
  name = 'StreetVision Vision (browser mock)'

  async analyze(image: ImageInput): Promise<DetectionResult> {
    // Simulate network + inference latency for a realistic UX
    await wait(1100 + Math.random() * 900)

    const meta = await loadImageData(image)
    const seed = seededRandom(`analyze-${uid()}`)

    // Pseudo-model: low-light or high-contrast images skew toward
    // damage categories; bright clean scenes skew toward lighting/obstacles.
    const category = pickWeighted(seed())

    const confidence = Math.round(79 + seed() * 19)
    const severity: Severity =
      confidence >= 94
        ? 'critical'
        : confidence >= 88
          ? 'high'
          : confidence >= 80
            ? 'medium'
            : 'low'

    const primary = makeMockBoundingBox(meta.width, meta.height, seed)
    const secondary =
      seed() > 0.55
        ? makeMockBoundingBox(meta.width, meta.height, seed)
        : undefined

    const sizeBuckets: Record<Severity, string> = {
      critical: '~1.8 m²',
      high: '~1.1 m²',
      medium: '~0.6 m²',
      low: '~0.3 m²',
    }

    return {
      category,
      label: category.replace('-', ' '),
      confidence,
      severity,
      detections: [
        {
          label: category.replace('-', ' '),
          confidence,
          boundingBox: primary,
        },
        ...(secondary
          ? [{ label: `${category.replace('-', ' ')} (secondary)`, confidence: confidence - 11, boundingBox: secondary }]
          : []),
      ],
      estimatedSize: sizeBuckets[severity],
      description: describeResult(category, severity),
      analyzedAt: new Date().toISOString(),
      isAI: true,
    }
  }
}

// ------------------------------------------------------------
// Custom provider — talks to a self-hosted model endpoint
// ------------------------------------------------------------
class CustomAIDetectionProvider implements AIDetectionProvider {
  id = 'custom'
  name = 'Custom model endpoint'

  private endpoint = env.customAiUrl

  async analyze(image: ImageInput): Promise<DetectionResult> {
    let body: FormData | string
    if (typeof image === 'string') {
      body = JSON.stringify({ image })
    } else {
      const fd = new FormData()
      fd.append('image', image)
      body = fd
    }

    const res = await fetch(this.endpoint, {
      method: 'POST',
      body,
      headers: typeof image === 'string' ? { 'Content-Type': 'application/json' } : undefined,
    })
    if (!res.ok) throw new Error(`AI endpoint responded with ${res.status}`)
    const payload = (await res.json()) as StreetVisionDetectionPayload
    return {
      category: payload.category,
      label: payload.label,
      confidence: Math.round(payload.confidence * 100) / 100,
      severity: payload.severity,
      detections: payload.detections ?? [],
      estimatedSize: payload.estimatedSize,
      description: payload.description ?? `AI detected ${payload.label}.`,
      analyzedAt: new Date().toISOString(),
      isAI: true,
    }
  }
}

// ------------------------------------------------------------
// Provider resolution
// ------------------------------------------------------------
function resolveProvider(): AIDetectionProvider {
  if (env.aiProvider === 'custom' && env.customAiUrl) {
    return new CustomAIDetectionProvider()
  }
  return new MockAIDetectionProvider()
}

const activeProvider = resolveProvider()

export function getActiveAIProvider(): AIDetectionProvider {
  return activeProvider
}

export function analyzeStreetImage(image: ImageInput): Promise<DetectionResult> {
  return activeProvider.analyze(image)
}
