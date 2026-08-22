import type {
  CategoryId,
  CategoryMeta,
  PriorityBand,
  ReportStatus,
  Severity,
} from '@/types'

export const APP_NAME = 'StreetVision AI'
export const APP_TAGLINE = 'See Problems. Report Smarter. Build Better Streets.'

// ============================================================
// Problem categories
// Add a new entry here to support a new detection category.
// ============================================================
export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'pothole',
    label: 'Pothole',
    shortLabel: 'Pothole',
    emoji: '🕳️',
    description: 'A hole or depression in the road surface.',
  },
  {
    id: 'road-crack',
    label: 'Road Crack',
    shortLabel: 'Crack',
    emoji: '〰️',
    description: 'Cracks in the asphalt or road surface.',
  },
  {
    id: 'garbage',
    label: 'Garbage Accumulation',
    shortLabel: 'Garbage',
    emoji: '🗑️',
    description: 'Litter, waste, or illegal dumping.',
  },
  {
    id: 'street-light',
    label: 'Broken Street Light',
    shortLabel: 'Street Light',
    emoji: '💡',
    description: 'A street light that is damaged or not working.',
  },
  {
    id: 'sidewalk',
    label: 'Damaged Sidewalk',
    shortLabel: 'Sidewalk',
    emoji: '🚶',
    description: 'Broken, uneven, or blocked pavement.',
  },
  {
    id: 'flooding',
    label: 'Flooded Street',
    shortLabel: 'Flooding',
    emoji: '🌊',
    description: 'Standing water or flooding on the street.',
  },
  {
    id: 'fallen-tree',
    label: 'Fallen Tree',
    shortLabel: 'Tree',
    emoji: '🌳',
    description: 'A fallen or dangerously leaning tree.',
  },
  {
    id: 'traffic-sign',
    label: 'Damaged Traffic Sign',
    shortLabel: 'Sign',
    emoji: '🚸',
    description: 'A traffic sign that is damaged, missing, or illegible.',
  },
  {
    id: 'road-obstacle',
    label: 'Road Obstacle',
    shortLabel: 'Obstacle',
    emoji: '🧱',
    description: 'An object blocking or narrowing the roadway.',
  },
  {
    id: 'other',
    label: 'Other Infrastructure',
    shortLabel: 'Other',
    emoji: '🏗️',
    description: 'Any other infrastructure problem not listed above.',
  },
]

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c
    return acc
  },
  {} as Record<CategoryId, CategoryMeta>,
)

export function categoryLabel(id: CategoryId): string {
  return CATEGORY_MAP[id]?.label ?? 'Other'
}

export function categoryEmoji(id: CategoryId): string {
  return CATEGORY_MAP[id]?.emoji ?? '🏗️'
}

// ============================================================
// Severity
// ============================================================
export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; soft: string; fg: string; index: number }
> = {
  critical: {
    label: 'Critical',
    color: 'var(--sv-severity-critical)',
    soft: 'var(--sv-severity-critical-soft)',
    fg: 'var(--sv-severity-critical-fg)',
    index: 0,
  },
  high: {
    label: 'High',
    color: 'var(--sv-severity-high)',
    soft: 'var(--sv-severity-high-soft)',
    fg: 'var(--sv-severity-high-fg)',
    index: 1,
  },
  medium: {
    label: 'Medium',
    color: 'var(--sv-severity-medium)',
    soft: 'var(--sv-severity-medium-soft)',
    fg: 'var(--sv-severity-medium-fg)',
    index: 2,
  },
  low: {
    label: 'Low',
    color: 'var(--sv-severity-low)',
    soft: 'var(--sv-severity-low-soft)',
    fg: 'var(--sv-severity-low-fg)',
    index: 3,
  },
}

export function severityColor(severity: Severity): string {
  return SEVERITY_META[severity]?.color ?? 'var(--sv-severity-medium)'
}

// ============================================================
// Report status
// ============================================================
export const STATUSES: ReportStatus[] = [
  'reported',
  'ai_verified',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
]

export const ALL_STATUSES: ReportStatus[] = [...STATUSES, 'rejected']

export const STATUS_FLOW: ReportStatus[] = [
  'reported',
  'ai_verified',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
]

export const STATUS_META: Record<
  ReportStatus,
  { label: string; color: string; soft: string; fg: string; index: number }
> = {
  reported: { label: 'Reported', color: 'var(--sv-status-reported)', soft: 'var(--sv-status-reported-soft)', fg: 'var(--sv-status-reported-fg)', index: 0 },
  'ai_verified': { label: 'AI Verified', color: 'var(--sv-status-ai-verified)', soft: 'var(--sv-status-ai-verified-soft)', fg: 'var(--sv-status-ai-verified-fg)', index: 1 },
  under_review: { label: 'Under Review', color: 'var(--sv-status-under-review)', soft: 'var(--sv-status-under-review-soft)', fg: 'var(--sv-status-under-review-fg)', index: 2 },
  assigned: { label: 'Assigned', color: 'var(--sv-status-assigned)', soft: 'var(--sv-status-assigned-soft)', fg: 'var(--sv-status-assigned-fg)', index: 3 },
  'in_progress': { label: 'In Progress', color: 'var(--sv-status-in-progress)', soft: 'var(--sv-status-in-progress-soft)', fg: 'var(--sv-status-in-progress-fg)', index: 4 },
  resolved: { label: 'Resolved', color: 'var(--sv-status-resolved)', soft: 'var(--sv-status-resolved-soft)', fg: 'var(--sv-status-resolved-fg)', index: 5 },
  rejected: { label: 'Rejected', color: 'var(--sv-status-rejected)', soft: 'var(--sv-status-rejected-soft)', fg: 'var(--sv-status-rejected-fg)', index: 6 },
}

export function statusLabel(status: ReportStatus): string {
  return STATUS_META[status]?.label ?? status
}

// ============================================================
// Priority bands
// ============================================================
export interface PriorityBandMeta {
  label: string
  min: number
  max: number
  color: string
  soft: string
  fg: string
}

export const PRIORITY_BANDS: Record<PriorityBand, PriorityBandMeta> = {
  low: { label: 'Low', min: 0, max: 25, color: 'var(--sv-priority-low)', soft: 'var(--sv-priority-low-soft)', fg: 'var(--sv-priority-low-fg)' },
  medium: { label: 'Medium', min: 26, max: 50, color: 'var(--sv-priority-medium)', soft: 'var(--sv-priority-medium-soft)', fg: 'var(--sv-priority-medium-fg)' },
  high: { label: 'High', min: 51, max: 75, color: 'var(--sv-priority-high)', soft: 'var(--sv-priority-high-soft)', fg: 'var(--sv-priority-high-fg)' },
  critical: { label: 'Critical', min: 76, max: 100, color: 'var(--sv-priority-critical)', soft: 'var(--sv-priority-critical-soft)', fg: 'var(--sv-priority-critical-fg)' },
}

export function priorityBand(score: number): PriorityBand {
  if (score <= 25) return 'low'
  if (score <= 50) return 'medium'
  if (score <= 75) return 'high'
  return 'critical'
}

export function priorityColor(score: number): string {
  return PRIORITY_BANDS[priorityBand(score)].color
}

// ============================================================
// Demo accounts
// ============================================================
export const DEMO_ACCOUNTS = {
  citizen: {
    email: 'citizen@streetvision.ai',
    password: 'demo1234',
    name: 'Alex Rivera',
  },
  admin: {
    email: 'admin@streetvision.ai',
    password: 'admin1234',
    name: 'Admin StreetVision',
  },
}
