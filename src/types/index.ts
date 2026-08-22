// ============================================================
// StreetVision AI — Domain model
// Mirrors the Supabase schema exactly.
// ============================================================

export type Role = 'citizen' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: Role
  created_at: string
  updated_at: string
}

// Alias for backward compatibility with existing components
export type User = {
  id: string
  email: string
  name: string // mapped from full_name
  role: Role
  avatarUrl?: string // mapped from avatar_url
  createdAt: string // mapped from created_at
}

export type CategoryId =
  | 'pothole'
  | 'road-crack'
  | 'garbage'
  | 'street-light'
  | 'sidewalk'
  | 'flooding'
  | 'fallen-tree'
  | 'traffic-sign'
  | 'road-obstacle'
  | 'other'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type PriorityBand = 'low' | 'medium' | 'high' | 'critical'

export type ReportStatus =
  | 'reported'
  | 'ai_verified'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Detection {
  label: string
  confidence: number
  boundingBox?: BoundingBox
}

export interface Report {
  id: string
  user_id: string
  title: string | null
  description: string | null
  category: CategoryId
  severity: Severity
  priority_score: number
  confidence: number | null
  latitude: number | null
  longitude: number | null
  address: string | null
  image_url: string | null
  status: ReportStatus
  ai_classified: boolean
  assigned_to: string | null
  resolved_image_url: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface Confirmation {
  id: string
  report_id: string
  user_id: string
  created_at: string
}

export interface StatusHistoryEntry {
  id: string
  report_id: string
  status: ReportStatus
  changed_by: string | null
  note: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  report_id: string | null
  title: string
  message: string
  type: 'report_submitted' | 'ai_verified' | 'status_change' | 'resolved' | 'confirmed' | 'system'
  is_read: boolean
  created_at: string
}

export interface DetectionRow {
  id: string
  report_id: string
  category: string
  confidence: number | null
  severity: string | null
  bounding_box: BoundingBox | null
  estimated_size: string | null
  created_at: string
}

export interface DetectionResult {
  category: CategoryId
  label: string
  confidence: number
  severity: Severity
  detections: Detection[]
  estimatedSize?: string
  description: string
  analyzedAt: string
  isAI: boolean // true = real AI, false = manual classification
}

export interface PriorityFactors {
  severity: Severity
  confidence: number
  confirmations: number
  sizeFactor: number
  roadImportance: number
  ageDays: number
}

export interface ReportWithRelations extends Report {
  user?: User
  confirmations_count: number
  current_user_confirmed: boolean
  history: StatusHistoryEntry[]
  detections: Detection[]
  // Backward compat aliases
  userId: string
  imageUrl: string | null
  priorityScore: number
  lat: number | null
  lng: number | null
  confirmationsCount: number
  currentUserConfirmed: boolean
}

export interface AdminStats {
  total: number
  critical: number
  pending: number
  resolved: number
  resolutionRate: number
  avgResolutionDays: number
  totalConfirmations: number
}

export interface CategoryMeta {
  id: CategoryId
  label: string
  shortLabel: string
  emoji: string
  description: string
}

export interface AnalyticsData {
  total: number
  totalConfirmations: number
  openCount: number
  pendingCount: number
  inProgressCount: number
  resolvedCount: number
  rejectedCount: number
  resolutionRate: number
  avgResolutionDays: number
  activeUsers: number
  reportsOverTime: Array<{ date: string; count: number }>
  byCategory: Array<{ category: string; count: number; label: string }>
  byDistrict: Array<{ district: string; count: number }>
  severityDist: Array<{ severity: string; count: number }>
  statusDist: Array<{ status: string; label: string; count: number }>
  weeklyTrend: Array<{ date: string; count: number; label: string }>
}
