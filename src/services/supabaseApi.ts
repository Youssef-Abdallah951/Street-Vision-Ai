import { supabase } from '@/lib/supabase'
import { calculatePriorityScore } from '@/lib/scoring'
import type {
  AnalyticsData,
  CategoryId,
  Detection,
  DetectionResult,
  Notification,
  Profile,
  Report,
  ReportStatus,
  ReportWithRelations,
  Severity,
  StatusHistoryEntry,
  User,
} from '@/types'
import { STATUS_FLOW, statusLabel, CATEGORY_MAP } from '@/lib/constants'

// ============================================================
// Helper: map Profile row to the User shape used by components
// ============================================================
export function profileToUser(p: Profile): User {
  return {
    id: p.id,
    email: p.email,
    name: p.full_name ?? p.email.split('@')[0],
    role: p.role,
    avatarUrl: p.avatar_url ?? undefined,
    createdAt: p.created_at,
  }
}

// ============================================================
// Helper: map Report + related data to ReportWithRelations
// ============================================================
function buildReportWithRelations(
  report: Report,
  user: User | undefined,
  confirmationsCount: number,
  currentUserConfirmed: boolean,
  history: StatusHistoryEntry[],
  detections: Detection[],
): ReportWithRelations {
  return {
    ...report,
    user,
    confirmations_count: confirmationsCount,
    current_user_confirmed: currentUserConfirmed,
    history,
    detections,
    // backward-compat aliases
    userId: report.user_id,
    imageUrl: report.image_url,
    priorityScore: report.priority_score,
    lat: report.latitude,
    lng: report.longitude,
    confirmationsCount: confirmationsCount,
    currentUserConfirmed: currentUserConfirmed,
  }
}

// ============================================================
// PROFILE API
// ============================================================

export async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return profileToUser(data as Profile)
}

export async function updateProfile(
  userId: string,
  patch: { full_name?: string; avatar_url?: string },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

// ============================================================
// REPORTS API
// ============================================================

export interface FetchReportsOptions {
  category?: string
  severity?: string
  status?: string
  userId?: string
  dateRange?: '7' | '30' | 'all'
  limit?: number
}

export async function fetchReports(
  currentUserId: string | null,
  opts: FetchReportsOptions = {},
): Promise<ReportWithRelations[]> {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (opts.category && opts.category !== 'all') query = query.eq('category', opts.category)
  if (opts.severity && opts.severity !== 'all') query = query.eq('severity', opts.severity)
  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status)
  if (opts.userId) query = query.eq('user_id', opts.userId)
  if (opts.dateRange && opts.dateRange !== 'all') {
    const days = parseInt(opts.dateRange, 10)
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()
    query = query.gte('created_at', cutoff)
  }
  if (opts.limit) query = query.limit(opts.limit)

  const { data: reports, error } = await query
  if (error) throw new Error(error.message)
  if (!reports || reports.length === 0) return []

  const reportIds = (reports as Report[]).map((r) => r.id)
  const userIds = [...new Set((reports as Report[]).map((r) => r.user_id))]

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)
  const profileMap = new Map((profiles ?? []).map((p: Profile) => [p.id, profileToUser(p)]))

  // Fetch confirmation counts
  const { data: confRows } = await supabase
    .from('confirmations')
    .select('report_id, user_id')
    .in('report_id', reportIds)
  const confMap = new Map<string, number>()
  const userConfirmedSet = new Set<string>()
  for (const c of confRows ?? []) {
    confMap.set(c.report_id, (confMap.get(c.report_id) ?? 0) + 1)
    if (currentUserId && c.user_id === currentUserId) {
      userConfirmedSet.add(c.report_id)
    }
  }

  return (reports as Report[]).map((r) =>
    buildReportWithRelations(
      r,
      profileMap.get(r.user_id),
      confMap.get(r.id) ?? 0,
      userConfirmedSet.has(r.id),
      [],
      [],
    ),
  )
}

export async function fetchReportById(
  reportId: string,
  currentUserId: string | null,
): Promise<ReportWithRelations | null> {
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (error || !report) return null

  const r = report as Report

  const [profileRes, confRes, historyRes, detectionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', r.user_id).single(),
    supabase.from('confirmations').select('*').eq('report_id', reportId),
    supabase.from('status_history').select('*').eq('report_id', reportId).order('created_at', { ascending: true }),
    supabase.from('detections').select('*').eq('report_id', reportId),
  ])

  const user = profileRes.data ? profileToUser(profileRes.data as Profile) : undefined
  const confs = confRes.data ?? []
  const history = (historyRes.data ?? []) as StatusHistoryEntry[]
  const detectRows = detectionsRes.data ?? []

  const detections: Detection[] = detectRows.map((d: any) => ({
    label: d.category,
    confidence: d.confidence ?? 0,
    boundingBox: d.bounding_box ?? undefined,
  }))

  const confirmationsCount = confs.length
  const currentUserConfirmed = currentUserId
    ? confs.some((c: any) => c.user_id === currentUserId)
    : false

  return buildReportWithRelations(r, user, confirmationsCount, currentUserConfirmed, history, detections)
}

// ============================================================
// SUBMIT REPORT
// ============================================================

export interface SubmitReportInput {
  userId: string
  imagePath: string | null
  category: CategoryId
  description?: string
  severity: Severity
  confidence: number
  lat: number
  lng: number
  address?: string
  aiClassified: boolean
  detection: DetectionResult | null
}

export async function insertReport(input: SubmitReportInput): Promise<string> {
  const priorityScore = calculatePriorityScore({
    severity: input.severity,
    confidence: input.confidence,
    confirmations: 0,
    sizeFactor: 0.5,
    roadImportance: 0.5,
    ageDays: 0,
  })

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      user_id: input.userId,
      category: input.category,
      description: input.description?.trim() || null,
      severity: input.severity,
      confidence: input.confidence,
      priority_score: priorityScore,
      latitude: input.lat,
      longitude: input.lng,
      address: input.address || null,
      image_url: input.imagePath,
      status: 'reported',
      ai_classified: input.aiClassified,
    })
    .select()
    .single()

  if (error || !report) throw new Error(error?.message ?? 'Failed to insert report')

  const reportId = (report as Report).id

  // Insert detection record if AI result provided
  if (input.detection) {
    const det = input.detection
    await supabase.from('detections').insert({
      report_id: reportId,
      category: det.category,
      confidence: det.confidence,
      severity: det.severity,
      bounding_box: det.detections[0]?.boundingBox ?? null,
      estimated_size: det.estimatedSize ?? null,
    })
  }

  // Status history: reported
  await supabase.from('status_history').insert({
    report_id: reportId,
    status: 'reported',
    changed_by: input.userId,
    note: input.aiClassified ? null : 'Manually classified by citizen',
  })

  // Notification to user
  await supabase.from('notifications').insert({
    user_id: input.userId,
    report_id: reportId,
    title: 'Report submitted',
    message: `Your ${CATEGORY_MAP[input.category]?.label ?? input.category} report has been received and is under review.`,
    type: 'report_submitted',
    is_read: false,
  })

  return reportId
}

// ============================================================
// CONFIRM REPORT
// ============================================================

export async function confirmReport(reportId: string, userId: string): Promise<void> {
  // Check if already confirmed
  const { data: existing } = await supabase
    .from('confirmations')
    .select('id')
    .eq('report_id', reportId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) throw new Error('You have already confirmed this report.')

  const { error } = await supabase
    .from('confirmations')
    .insert({ report_id: reportId, user_id: userId })

  if (error) throw new Error(error.message)

  // Get confirmation count
  const { count } = await supabase
    .from('confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId)

  // Recalculate priority
  await supabase.rpc('recalculate_priority', { p_report_id: reportId })

  // Notify reporter (if someone else confirmed)
  const { data: reportData } = await supabase
    .from('reports')
    .select('user_id')
    .eq('id', reportId)
    .single()

  if (reportData && reportData.user_id !== userId) {
    await supabase.from('notifications').insert({
      user_id: reportData.user_id,
      report_id: reportId,
      title: 'A neighbor confirmed your report',
      message: `Your report now has ${count ?? 1} confirmation${(count ?? 1) === 1 ? '' : 's'}.`,
      type: 'confirmed',
      is_read: false,
    })
  }
}

// ============================================================
// STATUS MANAGEMENT (admin only)
// ============================================================

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  note: string | undefined,
  changedBy: string,
): Promise<void> {
  const updateData: Partial<Report> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'resolved') {
    (updateData as any).resolved_at = new Date().toISOString()
  }

  const { error } = await supabase.from('reports').update(updateData).eq('id', reportId)
  if (error) throw new Error(error.message)

  // Status history
  await supabase.from('status_history').insert({
    report_id: reportId,
    status,
    changed_by: changedBy,
    note: note ?? null,
  })

  // Notify reporter
  const { data: reportData } = await supabase
    .from('reports')
    .select('user_id, category')
    .eq('id', reportId)
    .single()

  if (reportData) {
    const categoryLabel = CATEGORY_MAP[reportData.category as CategoryId]?.label ?? reportData.category
    const title =
      status === 'resolved'
        ? 'Your report was resolved'
        : `Status updated: ${statusLabel(status)}`
    const message =
      status === 'resolved'
        ? `The ${categoryLabel} issue you reported has been fixed. Thank you for helping your community.`
        : note ?? `Your report is now ${statusLabel(status)}.`

    await supabase.from('notifications').insert({
      user_id: reportData.user_id,
      report_id: reportId,
      title,
      message,
      type: status === 'resolved' ? 'resolved' : 'status_change',
      is_read: false,
    })
  }
}

export async function updateReportSeverity(
  reportId: string,
  severity: Severity,
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({ severity, updated_at: new Date().toISOString() })
    .eq('id', reportId)

  if (error) throw new Error(error.message)
  await supabase.rpc('recalculate_priority', { p_report_id: reportId })
}

export async function assignReport(reportId: string, assigneeId: string, changedBy: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      assigned_to: assigneeId,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) throw new Error(error.message)

  await supabase.from('status_history').insert({
    report_id: reportId,
    status: 'assigned',
    changed_by: changedBy,
    note: 'Assigned to maintenance team',
  })

  const { data: reportData } = await supabase
    .from('reports')
    .select('user_id')
    .eq('id', reportId)
    .single()

  if (reportData) {
    await supabase.from('notifications').insert({
      user_id: reportData.user_id,
      report_id: reportId,
      title: 'Your report was assigned',
      message: 'A maintenance unit has been assigned to your report.',
      type: 'status_change',
      is_read: false,
    })
  }
}

export async function addResolvedImage(
  reportId: string,
  imageUrl: string,
  changedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      resolved_image_url: imageUrl,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) throw new Error(error.message)

  await supabase.from('status_history').insert({
    report_id: reportId,
    status: 'resolved',
    changed_by: changedBy,
    note: 'Resolution photo uploaded',
  })

  const { data: reportData } = await supabase
    .from('reports')
    .select('user_id')
    .eq('id', reportId)
    .single()

  if (reportData) {
    await supabase.from('notifications').insert({
      user_id: reportData.user_id,
      report_id: reportId,
      title: 'Your report was resolved',
      message: 'The issue you reported has been fixed. Thank you for helping your community.',
      type: 'resolved',
      is_read: false,
    })
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Notification[]
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}

// ============================================================
// IMAGE UPLOAD
// ============================================================

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const BUCKET = 'street-reports'

function sanitizeFilename(name: string): string {
  return name
    .split('/')
    .pop()
    ?.replace(/[^a-zA-Z0-9_\-.]/g, '_')
    ?.replace(/_{2,}/g, '_')
    ?.replace(/^_|_$/g, '') ?? 'file'
}

export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported file type: ${file.type}. Allowed types: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
    )
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large: ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum size is 10 MB.`,
    )
  }
}

export async function uploadReportImage(file: File, userId: string): Promise<string> {
  validateImageFile(file)

  const sanitized = sanitizeFilename(file.name)
  const timestamp = Date.now()
  const path = `reports/${userId}/${timestamp}-${sanitized}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    console.error('Storage upload error:', {
      message: error.message,
      statusCode: (error as any).statusCode,
      error: (error as any).error,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    throw new Error(`Image upload failed: ${error.message}`)
  }

  return path
}

export async function uploadAdminImage(file: File, label: string): Promise<string> {
  validateImageFile(file)

  const sanitized = sanitizeFilename(file.name)
  const timestamp = Date.now()
  const path = `admin/${label}/${timestamp}-${sanitized}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    console.error('Storage upload error:', {
      message: error.message,
      statusCode: (error as any).statusCode,
      error: (error as any).error,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    throw new Error(`Image upload failed: ${error.message}`)
  }

  return path
}

export async function deleteStorageObject(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.error('Storage delete error:', {
      message: error.message,
      statusCode: (error as any).statusCode,
      error: (error as any).error,
      details: (error as any).details,
      hint: (error as any).hint,
    })
  }
}

export async function getSignedImageUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error || !data?.signedUrl) {
    console.error('Signed URL error:', {
      message: error?.message,
      statusCode: (error as any).statusCode,
      error: (error as any).error,
      details: (error as any).details,
      hint: (error as any).hint,
    })
    throw new Error(error?.message ?? 'Failed to create signed URL')
  }
  return data.signedUrl
}

// ============================================================
// COMMUNITY REPORTS (public map view)
// ============================================================

export async function fetchCommunityReports(): Promise<Report[]> {
  const { data, error } = await supabase.rpc('get_community_reports')
  if (error) throw new Error(error.message)
  return (data ?? []) as Report[]
}

// ============================================================
// ANALYTICS
// ============================================================

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const [reportsRes, confsRes, profilesRes] = await Promise.all([
    supabase.from('reports').select('*').order('created_at', { ascending: false }),
    supabase.from('confirmations').select('report_id'),
    supabase.from('profiles').select('id, role'),
  ])

  const reports = (reportsRes.data ?? []) as Report[]
  const confs = confsRes.data ?? []
  const profiles = profilesRes.data ?? []

  const resolved = reports.filter((r) => r.status === 'resolved')
  const totalConfirmations = confs.length

  const avgResolutionDays =
    resolved.length > 0
      ? resolved.reduce((acc, r) => {
          if (!r.resolved_at) return acc
          const days =
            (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 86400000
          return acc + Math.max(0, days)
        }, 0) / resolved.length
      : 0

  // Reports over time (last 14 days)
  const days = 14
  const now = Date.now()
  const reportsOverTime: AnalyticsData['reportsOverTime'] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    reportsOverTime.push({
      date: label,
      count: reports.filter((r) => r.created_at.slice(0, 10) === key).length,
    })
  }

  // By category
  const byCategoryMap = new Map<string, number>()
  reports.forEach((r) => byCategoryMap.set(r.category, (byCategoryMap.get(r.category) ?? 0) + 1))
  const byCategory = [...byCategoryMap.entries()]
    .map(([category, count]) => ({
      category,
      count,
      label: (CATEGORY_MAP[category as CategoryId]?.label ?? category).replace('-', ' '),
    }))
    .sort((a, b) => b.count - a.count)

  // By address/area (use address prefix as district approximation)
  const byDistrictMap = new Map<string, number>()
  reports.forEach((r) => {
    const d = r.address ? r.address.split(',').pop()?.trim() ?? 'Unknown' : 'Unknown'
    byDistrictMap.set(d, (byDistrictMap.get(d) ?? 0) + 1)
  })
  const byDistrict = [...byDistrictMap.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Severity distribution
  const severityDist = (['critical', 'high', 'medium', 'low'] as const).map((s) => ({
    severity: s,
    count: reports.filter((r) => r.severity === s).length,
  }))

  // Status distribution
  const statusDist = STATUS_FLOW.map((s) => ({
    status: s,
    label: statusLabel(s),
    count: reports.filter((r) => r.status === s).length,
  })).concat({
    status: 'rejected',
    label: 'Rejected',
    count: reports.filter((r) => r.status === 'rejected').length,
  })

  // Weekly trend
  const weeklyTrend: AnalyticsData['weeklyTrend'] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    weeklyTrend.push({
      date: key,
      count: reports.filter((r) => r.created_at.slice(0, 10) === key).length,
      label,
    })
  }

  const activeUsers = profiles.filter((p: any) => p.role === 'citizen').length

  return {
    total: reports.length,
    totalConfirmations,
    openCount: reports.filter((r) => !['resolved', 'rejected'].includes(r.status)).length,
    pendingCount: reports.filter((r) =>
      ['reported', 'ai_verified', 'under_review'].includes(r.status),
    ).length,
    inProgressCount: reports.filter((r) => ['assigned', 'in_progress'].includes(r.status)).length,
    resolvedCount: resolved.length,
    rejectedCount: reports.filter((r) => r.status === 'rejected').length,
    resolutionRate: reports.length ? Math.round((resolved.length / reports.length) * 100) : 0,
    avgResolutionDays,
    activeUsers,
    reportsOverTime,
    byCategory,
    byDistrict,
    severityDist,
    statusDist,
    weeklyTrend,
  }
}

// ============================================================
// ADMIN: fetch all profiles
// ============================================================

export async function fetchAdminUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw new Error(error.message)
  return ((data ?? []) as Profile[]).map(profileToUser)
}
